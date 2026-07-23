import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { COMPLIANCE_MAPPINGS, getComplianceByRegulation, getComplianceStats, generateComplianceReport } from '@zad/core';

const complianceRoutes: FastifyPluginAsyncZod = async (app) => {
  // Get all compliance mappings
  app.get('/', {
    preHandler: [app.authenticate],
    schema: {
      response: {
        200: z.object({
          mappings: z.array(z.object({
            regulation: z.string(),
            control: z.string(),
            capability: z.string(),
            artefact: z.string(),
            status: z.string(),
          })),
        }),
      },
    },
  }, async () => ({
    mappings: COMPLIANCE_MAPPINGS.map(m => ({
      regulation: m.regulation,
      control: m.control,
      capability: m.capability,
      artefact: m.artefact,
      status: m.status,
    })),
  }));

  // Get compliance by regulation
  app.get('/regulation/:regulation', {
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ regulation: z.string() }),
      response: {
        200: z.object({
          regulation: z.string(),
          mappings: z.array(z.any()),
        }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { regulation } = request.params;
    const mappings = getComplianceByRegulation(regulation);
    
    if (mappings.length === 0) {
      return reply.code(404).send({ error: 'Not Found', message: `No compliance mappings for regulation: ${regulation}` });
    }
    
    return { regulation, mappings };
  });

  // Get compliance stats
  app.get('/stats', {
    preHandler: [app.authenticate],
    schema: {
      response: {
        200: z.object({
          byRegulation: z.object({
            RBI: z.object({ auto: z.number(), partial: z.number(), manual: z.number(), total: z.number() }),
            PCI: z.object({ auto: z.number(), partial: z.number(), manual: z.number(), total: z.number() }),
            GDPR: z.object({ auto: z.number(), partial: z.number(), manual: z.number(), total: z.number() }),
          }),
        }),
      },
    },
  }, async () => {
    const stats = getComplianceStats();
    
    return {
      byRegulation: {
        RBI: stats['RBI CSF'] || { auto: 0, partial: 0, manual: 0, total: 0 },
        PCI: stats['PCI-DSS v4'] || { auto: 0, partial: 0, manual: 0, total: 0 },
        GDPR: stats['GDPR Art.32'] || { auto: 0, partial: 0, manual: 0, total: 0 },
      },
    };
  });

  // Generate compliance report for specific endpoint
  app.get('/report/:id', {
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({
          report: z.string(),
          endpoint: z.object({
            id: z.string(),
            path: z.string(),
            method: z.string(),
            service: z.string(),
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
    
    const report = generateComplianceReport();
    
    return {
      report,
      endpoint: { id: ep.id, path: ep.path, method: ep.method, service: ep.service },
    };
  });
};

export { complianceRoutes };