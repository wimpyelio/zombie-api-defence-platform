import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { buildKnowledgeGraph, getNodeColor, toEndpointFull } from '@zad/core';
import { PrismaEndpoint } from '../serializers/index.js';

const graphRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/', {
    preHandler: [app.authenticate],
    schema: {
      query: z.object({
        focus: z.string().optional(),
        depth: z.coerce.number().int().min(1).max(3).default(2),
      }),
      response: {
        200: z.object({
          nodes: z.array(z.object({
            id: z.union([z.string(), z.number()]),
            type: z.enum(['api', 'team', 'pci']),
            x: z.number(),
            y: z.number(),
            state: z.string().optional(),
            label: z.string(),
            r: z.number().optional(),
            critical: z.boolean().optional(),
            color: z.string(),
          })),
          edges: z.array(z.object({
            s: z.union([z.string(), z.number()]),
            t: z.union([z.string(), z.number()]),
            type: z.enum(['calls', 'pci', 'owns']),
          })),
        }),
      },
    },
  }, async (request, reply) => {
    const { focus, depth } = request.query as { focus?: string; depth?: number };
    
    const endpoints = await app.prisma.endpoint.findMany({
      include: { decomState: true },
    });
    
    // Convert to core format using serializer
    const coreEndpoints = endpoints.map(ep => toEndpointFull(ep as unknown as PrismaEndpoint));
    
    const graph = buildKnowledgeGraph(coreEndpoints);
    
    return {
      nodes: graph.nodes.map(n => ({ ...n, color: getNodeColor(n) })),
      edges: graph.edges,
    };
  });
  
  // Get subgraph for specific endpoint
  app.get('/:id', {
    preHandler: [app.authenticate],
    schema: {
      params: z.object({ id: z.string() }),
      query: z.object({ depth: z.coerce.number().int().min(1).max(3).default(2) }),
      response: {
        200: z.object({
          nodes: z.array(z.any()),
          edges: z.array(z.any()),
        }),
        404: z.object({ error: z.string(), message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { depth } = request.query as { depth?: number };
    
    const ep = await app.prisma.endpoint.findUnique({ where: { id } });
    if (!ep) {
      return reply.code(404).send({ error: 'Not Found', message: 'Endpoint not found' });
    }
    
    const endpoints = await app.prisma.endpoint.findMany();
    
    const coreEndpoints = endpoints.map(e => toEndpointFull(e as unknown as PrismaEndpoint));
    
    const graph = buildKnowledgeGraph(coreEndpoints);
    
    return {
      nodes: graph.nodes.map(n => ({ ...n, color: getNodeColor(n) })),
      edges: graph.edges,
    };
  });
};

export { graphRoutes };