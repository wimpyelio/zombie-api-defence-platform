import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { computeRI, computeRIBreakdown, computeState, computeV, getRIBand, getRIColor } from '@zad/core';
import { toEndpoint, type PrismaEndpoint } from '../serializers/index.js';

const riRoutes: FastifyPluginAsyncZod = async (app) => {
  // Get RI breakdown for single endpoint
  app.get('/:id', {
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({
          breakdown: z.object({
            endpointId: z.string(),
            seProduct: z.number(),
            v: z.number(),
            a: z.number(),
            vOverA: z.number(),
            ri: z.number(),
            band: z.string(),
            color: z.string(),
            autoResponse: z.boolean(),
            p0Escalation: z.boolean(),
            details: z.object({
              s: z.number(),
              e: z.number(),
              v: z.number(),
              a: z.number(),
            }),
          }),
        }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    
    const ep = await app.prisma.endpoint.findUnique({ where: { id } });
    if (!ep) {
      return reply.code(404).send({ error: 'Not Found', message: 'Endpoint not found' });
    }
    
    // Use serializer - toEndpoint returns EndpointRaw for computeV
    const endpoint = toEndpoint(ep as unknown as PrismaEndpoint);
        const v = computeV(endpoint);
        const ri = computeRI(endpoint);
        const band = getRIBand(ri);
        const color = getRIColor(ri);
        const state = computeState(endpoint);

        const breakdown = computeRIBreakdown(endpoint);
    
    return {
      breakdown: {
        endpointId: ep.id,
        seProduct: endpoint.s * endpoint.e,
        v,
        a: endpoint.a,
        vOverA: v / Math.max(endpoint.a, 0.1),
        ri,
        band,
        color,
        autoResponse: endpoint.pci && state === 'zombie' && ri > 0.8,
        p0Escalation: ri > 2.5,
        details: { s: endpoint.s, e: endpoint.e, v, a: endpoint.a },
      },
    };
  });
  
  // Get RI stats summary
  app.get('/stats/summary', {
    preHandler: [app.authenticate],
    schema: {
      response: {
        200: z.object({
          totalEndpoints: z.number(),
          byBand: z.object({
            CRITICAL: z.number(),
            HIGH: z.number(),
            MEDIUM: z.number(),
            LOW: z.number(),
          }),
          byState: z.object({
            ACTIVE: z.number(),
            DEPRECATED: z.number(),
            ORPHANED: z.number(),
            ZOMBIE: z.number(),
          }),
          avgRI: z.number(),
          maxRI: z.number(),
          pciEndpoints: z.number(),
          zombiePciCount: z.number(),
        }),
      },
    },
  }, async (request, reply) => {
    const endpoints = await app.prisma.endpoint.findMany();
    const totalEndpoints = endpoints.length;
    const byBand = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    const byState = { ACTIVE: 0, DEPRECATED: 0, ORPHANED: 0, ZOMBIE: 0 };
    let sumRI = 0;
    let maxRI = 0;
    let pciEndpoints = 0;
    let zombiePciCount = 0;
    
    for (const ep of endpoints) {
      // Use serializer - toEndpoint returns EndpointRaw for computeV
      const endpoint = toEndpoint(ep as unknown as PrismaEndpoint);
      const v = computeV(endpoint);
      const ri = computeRI(endpoint);
      const band = getRIBand(ri);
      const state = computeState(endpoint);

            sumRI += ri;
            maxRI = Math.max(maxRI, ri);

            byBand[band.toUpperCase() as keyof typeof byBand] = (byBand[band.toUpperCase() as keyof typeof byBand] || 0) + 1;
            byState[state.toUpperCase() as keyof typeof byState] = (byState[state.toUpperCase() as keyof typeof byState] || 0) + 1;

            if (endpoint.pci) {
              pciEndpoints++;
              if (state === 'zombie') zombiePciCount++;
            }
    }
    
    return {
      totalEndpoints,
      byBand,
      byState,
      avgRI: totalEndpoints > 0 ? sumRI / totalEndpoints : 0,
      maxRI,
      pciEndpoints,
      zombiePciCount,
    };
  });
  
  // Batch compute RI for multiple endpoints
  app.post('/batch', {
    preHandler: [app.authenticate],
    schema: {
      body: z.object({
        endpointIds: z.array(z.string()),
      }),
      response: {
        200: z.object({
          results: z.array(z.object({
            id: z.string(),
            ri: z.number(),
            band: z.string(),
            state: z.string(),
            v: z.number(),
          })),
        }),
      },
    },
  }, async (request, reply) => {
    const { endpointIds } = request.body;
    
    const endpoints = await app.prisma.endpoint.findMany({
          where: { id: { in: endpointIds } },
        });

        const results = endpoints.map((ep: PrismaEndpoint) => {
              const endpoint = toEndpoint(ep as unknown as PrismaEndpoint);
          const v = computeV(endpoint);
          const ri = computeRI(endpoint);
          const band = getRIBand(ri);
          const state = computeState(endpoint);

          return { id: ep.id, ri, band, state, v };
        });
    
    return { results };
  });
};

export { riRoutes };