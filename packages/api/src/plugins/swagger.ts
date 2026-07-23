import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';

const swaggerPlugin: FastifyPluginAsync = fp(async (app) => {
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'ZAD Platform API',
        description: 'Zombie API Defence Platform - API for discovering, classifying, and decommissioning zombie APIs',
        version: '0.1.0',
        contact: { name: 'ZAD Team', email: 'security@zad.platform' },
        license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
      },
      servers: [{ url: 'http://localhost:3001/api/v1', description: 'Development server' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
        schemas: {
          Error: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
        },
      },
      security: [{ bearerAuth: [] }],
    },
  });
  
  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });
});

export { swaggerPlugin };