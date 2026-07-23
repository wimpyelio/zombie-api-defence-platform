import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const authPlugin: FastifyPluginAsync = fp(async (app) => {
  app.decorateRequest('user', null);
  
  app.addHook('preHandler', async (request) => {
    try {
      await request.jwtVerify();
      request.user = request.user as { id: string; email: string; name: string; role: string };
    } catch {
      // JWT verification failed - user remains undefined
    }
  });
});

export { authPlugin };