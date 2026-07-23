import Fastify from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { fastifyCors } from '@fastify/cors';
import { fastifyJwt } from '@fastify/jwt';
import { fastifySwagger } from '@fastify/swagger';
import { fastifySwaggerUi } from '@fastify/swagger-ui';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import pino from 'pino';

import { endpointsRoutes } from './routes/endpoints.js';
import { riRoutes } from './routes/ri.js';
import { decommissionRoutes } from './routes/decommission.js';
import { graphRoutes } from './routes/graph.js';
import { complianceRoutes } from './routes/compliance.js';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

async function buildApp() {
  const app = Fastify({
    logger,
    ajv: { customOptions: { removeAdditional: 'all' } },
  }).withTypeProvider<ZodTypeProvider>();
  
  // Prisma client
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  
  app.decorate('prisma', prisma);
  
  // Graceful shutdown
  const close = async () => {
    await prisma.$disconnect();
    await app.close();
  };
  
  process.on('SIGINT', close);
  process.on('SIGTERM', close);
  
  // CORS
  await app.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  
  // JWT
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    sign: { expiresIn: '8h' },
  });
  
  // Swagger/OpenAPI
  await app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'ZAD Platform API',
        description: 'Zombie API Defence Platform - API for discovering, classifying, and decommissioning zombie APIs',
        version: '0.1.0',
        contact: { name: 'ZAD Team', email: 'security@example.com' },
        license: { name: 'MIT' },
      },
      servers: [
        { url: 'http://localhost:4000', description: 'Development server' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Endpoints', description: 'API endpoint catalog and discovery' },
        { name: 'Risk Index', description: 'RI computation and breakdown' },
        { name: 'Decommission', description: '5-stage Deep Freeze pipeline' },
        { name: 'Knowledge Graph', description: 'API relationship visualization' },
        { name: 'Compliance', description: 'RBI/PCI/GDPR compliance mappings' },
      ],
    },
  });
  
  await app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
    staticCSP: true,
  });
  
  // Auth decorators
  app.decorate('authenticate', async (request: any, reply: any) => {
    try {
      const token = request.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return reply.code(401).send({ error: 'Unauthorized', message: 'Missing authentication token' });
      }
      const decoded = await app.jwt.verify(token);
      request.user = decoded;
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
  });
  
  app.decorate('requireRole', (allowedRoles: string[]) => {
    return async (request: any, reply: any) => {
      await app.authenticate(request, reply);
      if (reply.sent) return;
      if (!allowedRoles.includes(request.user?.role)) {
        return reply.code(403).send({ 
          error: 'Forbidden', 
          message: `Required role: ${allowedRoles.join(' or ')}, got: ${request.user?.role}` 
        });
      }
    };
  });
  
  app.decorate('auditLog', async (userId: string, action: string, resource: string, resourceId: string, details?: object) => {
    await prisma.auditLog.create({
      data: { userId, action, resource, resourceId, details: JSON.stringify(details || {}) },
    });
  });
  
  // Health check
  app.get('/health', {
    schema: {
      response: {
        200: { type: 'object', properties: { status: { type: 'string' }, timestamp: { type: 'string' } } },
      },
    },
  }, async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
  
  // Auth routes
  app.post('/auth/login', {
    schema: {
      body: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string' } } },
      response: {
        200: { type: 'object', properties: { token: { type: 'string' }, user: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' }, name: { type: 'string' }, role: { type: 'string' } } } } },
        401: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
    }
    
    const token = app.jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    
    await prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN', resource: 'AUTH', resourceId: user.id },
    });
    
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  });
  
  app.post('/auth/register', {
    schema: {
      body: { type: 'object', required: ['email', 'password', 'name'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 8 }, name: { type: 'string' }, role: { type: 'string', enum: ['VIEWER', 'ANALYST', 'OPS_LEAD', 'CISO'] } } },
      response: {
        201: { type: 'object', properties: { user: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' }, name: { type: 'string' }, role: { type: 'string' } } } } },
        409: { type: 'object', properties: { error: { type: 'string' }, message: { type: 'string' } } },
      },
    },
  }, async (request, reply) => {
    const { email, password, name, role = 'VIEWER' } = request.body as { email: string; password: string; name: string; role?: string };
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.code(409).send({ error: 'Conflict', message: 'Email already registered' });
    }
    
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, role: role as any },
    });
    
    await prisma.auditLog.create({
      data: { userId: user.id, action: 'REGISTER', resource: 'AUTH', resourceId: user.id },
    });
    
    return reply.code(201).send({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  });
  
  app.get('/auth/me', {
    preHandler: [app.authenticate],
    schema: {
      response: { 200: { type: 'object', properties: { user: { type: 'object', properties: { id: { type: 'string' }, email: { type: 'string' }, name: { type: 'string' }, role: { type: 'string' } } } } } },
    },
  }, async (request) => ({ user: request.user }));
  
  // Register API routes
  await app.register(endpointsRoutes, { prefix: '/api/v1/endpoints' });
  await app.register(riRoutes, { prefix: '/api/v1/ri' });
  await app.register(decommissionRoutes, { prefix: '/api/v1/decommission' });
  await app.register(graphRoutes, { prefix: '/api/v1/graph' });
  await app.register(complianceRoutes, { prefix: '/api/v1/compliance' });
  
  return app;
}

async function start() {
  try {
    const app = await buildApp();
    const port = parseInt(process.env.PORT || '4000', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    logger.info(`🚀 ZAD API running at http://${host}:${port}`);
    logger.info(`📚 Swagger UI: http://${host}:${port}/docs`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

start();