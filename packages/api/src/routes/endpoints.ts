import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { toEndpointFull, toApiEndpointFull, type PrismaEndpoint } from '../serializers/index.js';

const endpointsRoutes: FastifyPluginAsyncZod = async (app) => {
  // List endpoints with filters
  app.get('/', {
    preHandler: [app.authenticate],
    schema: {
      querystring: z.object({
        state: z.array(z.enum(['ACTIVE', 'DEPRECATED', 'ORPHANED', 'ZOMBIE'])).optional(),
        search: z.string().optional(),
        minRI: z.coerce.number().optional(),
        maxRI: z.coerce.number().optional(),
        pciOnly: z.coerce.boolean().optional(),
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(20),
      }),
      response: {
        200: z.object({
          endpoints: z.array(z.object({
            id: z.number(),
            method: z.string(),
            path: z.string(),
            service: z.string(),
            s: z.number(),
            e: z.number(),
            a: z.number(),
            pci: z.boolean(),
            auth: z.string(),
            tls: z.string(),
            rateLimited: z.boolean(),
            wafCoverage: z.boolean(),
            mtls: z.boolean(),
            apiKeyExposed: z.boolean(),
            egressVal: z.boolean(),
            owner: z.string(),
            ownerActive: z.boolean(),
            sunsetHeader: z.string(),
            trafficTrend: z.string(),
            trafficP90: z.number(),
            lastTraffic: z.string(),
            lastCommit: z.string(),
            decayProb: z.number(),
            gateway: z.string(),
            deployedOn: z.string(),
            v: z.number(),
            ri: z.number(),
            state: z.string(),
            predictedZombieDate: z.string().nullable(),
            riBand: z.string(),
          })),
          total: z.number(),
          page: z.number(),
          limit: z.number(),
        }),
      },
    },
  }, async (request, reply) => {
    const { state, search, minRI, maxRI, pciOnly, page = 1, limit = 20 } = request.query;

    const where: any = {};

    if (state && state.length > 0) {
      where.lifecycleState = { in: state };
    }
    if (search) {
      where.OR = [
        { path: { contains: search, mode: 'insensitive' } },
        { service: { contains: search, mode: 'insensitive' } },
        { owner: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (pciOnly) where.pci = true;
    if (minRI !== undefined || maxRI !== undefined) {
      where.ri = {};
      if (minRI !== undefined) where.ri.gte = minRI;
      if (maxRI !== undefined) where.ri.lte = maxRI;
    }

    const [endpoints, total] = await Promise.all([
      app.prisma.endpoint.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { ri: 'desc' },
      }),
      app.prisma.endpoint.count({ where }),
    ]);

    // Use serializer to convert Prisma types to domain types
        const enriched = endpoints.map((ep: PrismaEndpoint) => toEndpointFull(ep as unknown as PrismaEndpoint));

    return { endpoints: enriched, total, page, limit };
  });

  // Get single endpoint with full breakdown
  app.get('/:id', {
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({
          endpoint: z.object({
            id: z.number(),
            method: z.string(),
            path: z.string(),
            service: z.string(),
            s: z.number(),
            e: z.number(),
            a: z.number(),
            pci: z.boolean(),
            auth: z.string(),
            tls: z.string(),
            rateLimited: z.boolean(),
            wafCoverage: z.boolean(),
            mtls: z.boolean(),
            apiKeyExposed: z.boolean(),
            egressVal: z.boolean(),
            owner: z.string(),
            ownerActive: z.boolean(),
            sunsetHeader: z.string(),
            trafficTrend: z.string(),
            trafficP90: z.number(),
            lastTraffic: z.string(),
            lastCommit: z.string(),
            decayProb: z.number(),
            gateway: z.string(),
            deployedOn: z.string(),
            v: z.number(),
            ri: z.number(),
            state: z.string(),
            predictedZombieDate: z.string().nullable(),
            riBand: z.string(),
            vulnerabilityBreakdown: z.object({
              noAuth: z.number(),
              noMTLS: z.number(),
              noRate: z.number(),
              weakTLS: z.number(),
              expKey: z.number(),
              noWAF: z.number(),
              noEgress: z.number(),
              total: z.number(),
            }),
            riBreakdown: z.object({
              seProduct: z.number(),
              v: z.number(),
              a: z.number(),
              vOverA: z.number(),
              ri: z.number(),
              band: z.string(),
              autoResponse: z.boolean(),
              p0Escalation: z.boolean(),
            }),
            calls: z.array(z.object({
              id: z.string(),
              method: z.string(),
              path: z.string(),
              service: z.string(),
            })),
            calledBy: z.array(z.object({
              id: z.string(),
              method: z.string(),
              path: z.string(),
              service: z.string(),
            })),
          }),
        }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    const ep = await app.prisma.endpoint.findUnique({
      where: { id },
    });

    if (!ep) {
      return reply.code(404).send({ error: 'Not Found', message: 'Endpoint not found' });
    }

    // Use serializers
    const endpoint = toApiEndpointFull(ep as unknown as PrismaEndpoint);

    return {
      endpoint,
    };
  });
};

export { endpointsRoutes };