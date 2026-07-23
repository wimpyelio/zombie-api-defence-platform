import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const auditPlugin: FastifyPluginAsync = fp(async (app) => {
  const auditLog = async (userId: string, action: string, resource: string, resourceId: string, details?: object, ip?: string, userAgent?: string) => {
    try {
      await app.prisma.auditLog.create({
        data: {
          userId,
          action,
          resource,
          resourceId,
          details: JSON.stringify(details || {}),
          ip,
          userAgent,
        },
      });
    } catch (error) {
      app.log.error({ err: error, userId, action, resource, resourceId }, 'Failed to write audit log');
    }
  };
  
  app.decorate('auditLog', auditLog);
});

export { auditPlugin };