import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { STAGES } from '@zad/core';
import { toDecomStateList, toDecomStateFull } from '../serializers/index.js';

const decommissionRoutes: FastifyPluginAsyncZod = async (app) => {
  // Get decommission state for all endpoints
  app.get('/', {
    preHandler: [app.authenticate],
    schema: {
      query: z.object({
        state: z.array(z.enum(['ACTIVE', 'DEPRECATED', 'ORPHANED', 'ZOMBIE'])).optional(),
      }),
      response: {
        200: z.object({
          endpoints: z.array(z.object({
            id: z.string(),
            method: z.string(),
            path: z.string(),
            service: z.string(),
            ri: z.number(),
            state: z.string(),
            riBand: z.string(),
            decommissionState: z.object({
              stage: z.number(),
              stageName: z.string(),
              initiatedAt: z.string().nullable(),
              history: z.array(z.object({
                offset: z.number(),
                action: z.string(),
                stage: z.number(),
              })),
            }).nullable(),
          })),
        }),
      },
    },
  }, async (request, reply) => {
    const { state } = request.query as { state?: string[] };
    
    const where: any = {};
    if (state && state.length > 0) {
      where.lifecycleState = { in: state };
    }
    
    const endpoints = await app.prisma.endpoint.findMany({
      where,
      include: { decomState: true },
      orderBy: { ri: 'desc' },
    });
    
    return {
      endpoints: endpoints.map(ep => ({
        id: ep.id,
        method: ep.method,
        path: ep.path,
        service: ep.service,
        ri: ep.ri,
        state: ep.lifecycleState,
        riBand: ep.riBand,
        decommissionState: toDecomStateList(ep.decomState),
      })),
    };
  });
  
  // Get decommission state for single endpoint
  app.get('/:id', {
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({
          endpoint: z.object({
            id: z.string(),
            method: z.string(),
            path: z.string(),
            service: z.string(),
            ri: z.number(),
            state: z.string(),
            riBand: z.string(),
            pci: z.boolean(),
            decommissionState: z.object({
              stage: z.number(),
              stageName: z.string(),
              icon: z.string(),
              signoff: z.string(),
              desc: z.string(),
              rollback: z.string(),
              initiatedAt: z.string().nullable(),
              history: z.array(z.object({
                offset: z.number(),
                action: z.string(),
                stage: z.number(),
              })),
              canAdvance: z.boolean(),
              canRollback: z.boolean(),
              nextStage: z.number().nullable(),
            }).nullable(),
          }),
        }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    
    const ep = await app.prisma.endpoint.findUnique({
      where: { id },
      include: { decomState: true },
    });
    
    if (!ep) {
      return reply.code(404).send({ error: 'Not Found', message: 'Endpoint not found' });
    }
    
    const user = request.user as { id: string; email: string; name: string; role: string };
    
    let decomInfo = null;
    if (ep.decomState) {
      const stage = ep.decomState.stage;
      const stageConfig = STAGES[stage];
      const canAdvance = stage < 4 && user.role !== 'VIEWER';
      const canRollback = stage > 0 && user.role !== 'VIEWER';
      
      decomInfo = toDecomStateFull(ep.decomState);
    }
    
    return {
      endpoint: {
        id: ep.id,
        method: ep.method,
        path: ep.path,
        service: ep.service,
        ri: ep.ri,
        state: ep.lifecycleState,
        riBand: ep.riBand,
        pci: ep.pci,
        decommissionState: decomInfo,
      },
    };
  });
  
  // Advance decommission stage
  app.post('/:id/advance', {
    preHandler: [app.authenticate, app.requireRole(['ANALYST', 'OPS_LEAD', 'CISO'])],
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({
        signoffBy: z.string().optional(),
      }),
      response: {
        200: z.object({
          success: z.boolean(),
          newState: z.object({
            stage: z.number(),
            stageName: z.string(),
            initiatedAt: z.string().nullable(),
            history: z.array(z.any()),
          }),
        }),
        400: z.object({ error: z.string(), message: z.string() }),
        403: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { signoffBy } = request.body;
    const user = request.user as { id: string; email: string; name: string; role: string };
    
    const ep = await app.prisma.endpoint.findUnique({
      where: { id },
      include: { decomState: true },
    });
    
    if (!ep) {
      return reply.code(404).send({ error: 'Not Found', message: 'Endpoint not found' });
    }
    
    if (!ep.decomState) {
      // Initialize decommission state for zombie endpoints
      if (ep.lifecycleState !== 'ZOMBIE') {
        return reply.code(400).send({ 
          error: 'Bad Request', 
          message: 'Only ZOMBIE endpoints can enter decommission pipeline' 
        });
      }
      
      const newState = await app.prisma.decomState.create({
        data: {
          endpointId: id,
          stage: 0,
          initiatedAt: new Date(),
          history: JSON.stringify([{ offset: 0, action: 'Pipeline initiated', stage: 0 }]),
        },
      });
      
      await app.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'DECOMMISSION_INITIATED',
          resource: 'ENDPOINT',
          resourceId: id,
          details: JSON.stringify({ stage: 0, signoffBy }),
        },
      });
      
      return {
        success: true,
        newState: {
          stage: newState.stage,
          stageName: STAGES[0].name,
          initiatedAt: newState.initiatedAt.toISOString(),
          history: JSON.parse(newState.history),
        },
      };
    }
    
    const currentStage = ep.decomState.stage;
    
    if (currentStage >= 4) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'Already at final stage (Deregister)' 
      });
    }
    
    // Check role permissions for stage advancement
    const requiredRoles: Record<number, string[]> = {
      0: ['ANALYST', 'OPS_LEAD', 'CISO'], // Alert -> Shadow (Security Architect)
      1: ['OPS_LEAD', 'CISO'], // Shadow -> Brownout (Ops Lead + CISO)
      2: ['CISO'], // Brownout -> Tombstone (CISO)
      3: ['CISO'], // Tombstone -> Deregister (CISO + VP Eng)
    };
    
    const allowedRoles = requiredRoles[currentStage];
    if (!allowedRoles?.includes(user.role)) {
      return reply.code(403).send({ 
        error: 'Forbidden', 
        message: `Role ${user.role} cannot advance from stage ${currentStage}. Required: ${allowedRoles.join(', ')}` 
      });
    }
    
    const newStage = currentStage + 1;
    const now = new Date();
    const history = [...JSON.parse(ep.decomState.history || '[]'), {
      offset: now.getTime() - (ep.decomState.initiatedAt?.getTime() || now.getTime()),
      action: `Advanced to ${STAGES[newStage].name}`,
      stage: newStage,
    }];
    
    const updatedState = await app.prisma.decomState.update({
      where: { endpointId: id },
      data: {
        stage: newStage,
        history: JSON.stringify(history),
        ...(currentStage === 0 ? { initiatedAt: now } : {}),
      },
    });
    
    // Update endpoint lifecycle state
    const lifecycleMap = ['DEPRECATED', 'ORPHANED', 'ZOMBIE', 'ZOMBIE', 'DECOMMISSIONED'];
    await app.prisma.endpoint.update({
      where: { id },
      data: { lifecycleState: lifecycleMap[newStage] },
    });
    
    await app.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DECOMMISSION_ADVANCED',
        resource: 'ENDPOINT',
        resourceId: id,
        details: JSON.stringify({ fromStage: currentStage, toStage: newStage, signoffBy }),
      },
    });
    
    return {
      success: true,
      newState: {
        stage: updatedState.stage,
        stageName: STAGES[newStage].name,
        initiatedAt: updatedState.initiatedAt?.toISOString() || null,
        history: JSON.parse(updatedState.history),
      },
    };
  });
  
  // Rollback decommission stage
  app.post('/:id/rollback', {
    preHandler: [app.authenticate, app.requireRole(['OPS_LEAD', 'CISO'])],
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({
          success: z.boolean(),
          newState: z.object({
            stage: z.number(),
            stageName: z.string(),
            initiatedAt: z.string().nullable(),
            history: z.array(z.any()),
          }),
        }),
        400: z.object({ error: z.string(), message: z.string() }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const user = request.user as { id: string; email: string; name: string; role: string };
    
    const ep = await app.prisma.endpoint.findUnique({
      where: { id },
      include: { decomState: true },
    });
    
    if (!ep || !ep.decomState) {
      return reply.code(404).send({ error: 'Not Found', message: 'Decommission state not found' });
    }
    
    const currentStage = ep.decomState.stage;
    
    if (currentStage === 0) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'Cannot rollback from initial stage (Alert)' 
      });
    }
    
    if (currentStage === 4) {
      return reply.code(400).send({ 
        error: 'Bad Request', 
        message: 'Deregister stage is irreversible' 
      });
    }
    
    const newStage = currentStage - 1;
    const history = [...JSON.parse(ep.decomState.history || '[]'), {
      offset: new Date().getTime() - (ep.decomState.initiatedAt?.getTime() || 0),
      action: `Rolled back from ${STAGES[currentStage].name} to ${STAGES[newStage].name}`,
      stage: newStage,
    }];
    
    const updatedState = await app.prisma.decomState.update({
      where: { endpointId: id },
      data: { stage: newStage, history: JSON.stringify(history) },
    });
    
    const lifecycleMap = ['DEPRECATED', 'ORPHANED', 'ZOMBIE', 'ZOMBIE'];
    await app.prisma.endpoint.update({
      where: { id },
      data: { lifecycleState: lifecycleMap[newStage] },
    });
    
    await app.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DECOMMISSION_ROLLBACK',
        resource: 'ENDPOINT',
        resourceId: id,
        details: JSON.stringify({ fromStage: currentStage, toStage: newStage }),
      },
    });
    
    return {
      success: true,
      newState: {
        stage: updatedState.stage,
        stageName: STAGES[newStage].name,
        initiatedAt: updatedState.initiatedAt?.toISOString() || null,
        history: JSON.parse(updatedState.history),
      },
    };
  });
};

export { decommissionRoutes };