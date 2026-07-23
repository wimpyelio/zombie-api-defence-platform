import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const authRoutes: FastifyPluginAsyncZod = async (app) => {
  // Register
  app.post('/register', {
    schema: {
      body: z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().min(1),
        role: z.enum(['VIEWER', 'ANALYST', 'OPS_LEAD', 'CISO']).optional(),
      }),
      response: {
        201: z.object({ id: z.string(), email: z.string(), name: z.string(), role: z.string() }),
        400: z.object({ error: z.string(), message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { email, password, name, role = 'VIEWER' } = request.body;
    
    const existing = await app.prisma.user.findUnique({ where: { email } });
    if (existing) {
      return reply.code(400).send({ error: 'Bad Request', message: 'Email already registered' });
    }
    
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await app.prisma.user.create({
      data: { email, passwordHash, name, role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    
    await app.auditLog(user.id, 'user.register', 'USER', user.id, { email, role }, request.ip, request.headers['user-agent']);
    
    return reply.code(201).send(user);
  });
  
  // Login
  app.post('/login', {
    schema: {
      body: z.object({
        email: z.string().email(),
        password: z.string(),
      }),
      response: {
        200: z.object({
          accessToken: z.string(),
          user: z.object({ id: z.string(), email: z.string(), name: z.string(), role: z.string() }),
        }),
        401: z.object({ error: z.string(), message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body;
    
    const user = await app.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid credentials' });
    }
    
    const accessToken = app.jwt.sign({ sub: user.id, role: user.role, email: user.email });
    
    await app.auditLog(user.id, 'user.login', 'USER', user.id, { email }, request.ip, request.headers['user-agent']);
    
    return { accessToken, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  });
  
  // Get current user
  app.get('/me', {
    preHandler: [app.authenticate],
    schema: {
      response: {
        200: z.object({ id: z.string(), email: z.string(), name: z.string(), role: z.string() }),
        401: z.object({ error: z.string(), message: z.string() }),
      },
    },
  }, async (request, reply) => {
    const userId = (request.user as { id: string }).id;
    const user = await app.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    return user!;
  });
};

export { authRoutes };