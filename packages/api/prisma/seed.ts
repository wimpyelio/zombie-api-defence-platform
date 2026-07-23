import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { computeRI, computeState, computeV, getRIBand } from '@zad/core';

const prisma = new PrismaClient();

const demoEndpoints = [
  {
    method: 'POST',
    path: '/api/v1/payments',
    service: 'payments-service',
    sensitivity: 0.95,
    exposure: 1.0,
    ageMonths: 18,
    pci: true,
    authMechanism: 'api_key',
    tlsVersion: '1.2',
    rateLimited: false,
    wafCoverage: false,
    mtls: false,
    apiKeyExposed: true,
    egressValidated: false,
    owner: 'payments-team',
    ownerActive: false,
    sunsetHeader: '',
    trafficTrend: 'declining',
    trafficP90: 45,
    lastTraffic: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    lastCommit: new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000),
    decayProb: 0.85,
    gateway: 'apigee',
    deployedOn: new Date(Date.now() - 18 * 30 * 24 * 60 * 60 * 1000),
    calledBy: [],
    calls: [],
  },
  {
    method: 'GET',
    path: '/api/v1/accounts/{id}',
    service: 'accounts-service',
    sensitivity: 0.8,
    exposure: 0.6,
    ageMonths: 6,
    pci: true,
    authMechanism: 'jwt',
    tlsVersion: '1.3',
    rateLimited: true,
    wafCoverage: true,
    mtls: true,
    apiKeyExposed: false,
    egressValidated: true,
    owner: 'accounts-team',
    ownerActive: true,
    sunsetHeader: '',
    trafficTrend: 'stable',
    trafficP90: 120,
    lastTraffic: new Date(Date.now() - 2 * 60 * 60 * 1000),
    lastCommit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    decayProb: 0.1,
    gateway: 'kong',
    deployedOn: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
    calledBy: [],
    calls: [],
  },
  {
    method: 'POST',
    path: '/api/v1/transfers',
    service: 'transfers-service',
    sensitivity: 0.9,
    exposure: 1.0,
    ageMonths: 24,
    pci: true,
    authMechanism: 'oauth2',
    tlsVersion: '1.2',
    rateLimited: true,
    wafCoverage: true,
    mtls: false,
    apiKeyExposed: false,
    egressValidated: false,
    owner: 'transfers-team',
    ownerActive: true,
    sunsetHeader: '',
    trafficTrend: 'growing',
    trafficP90: 200,
    lastTraffic: new Date(Date.now() - 10 * 60 * 1000),
    lastCommit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    decayProb: 0.25,
    gateway: 'aws_apigw',
    deployedOn: new Date(Date.now() - 24 * 30 * 24 * 60 * 60 * 1000),
    calledBy: [],
    calls: [],
  },
  {
    method: 'GET',
    path: '/api/v1/customers',
    service: 'customers-service',
    sensitivity: 0.6,
    exposure: 0.2,
    ageMonths: 3,
    pci: false,
    authMechanism: 'mtls',
    tlsVersion: '1.3',
    rateLimited: true,
    wafCoverage: true,
    mtls: true,
    apiKeyExposed: false,
    egressValidated: true,
    owner: 'customers-team',
    ownerActive: true,
    sunsetHeader: '',
    trafficTrend: 'stable',
    trafficP90: 80,
    lastTraffic: new Date(Date.now() - 30 * 60 * 1000),
    lastCommit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    decayProb: 0.05,
    gateway: 'internal',
    deployedOn: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000),
    calledBy: [],
    calls: [],
  },
  {
    method: 'DELETE',
    path: '/api/v1/legacy/cleanup',
    service: 'legacy-cleanup',
    sensitivity: 0.3,
    exposure: 0.6,
    ageMonths: 36,
    pci: false,
    authMechanism: 'basic',
    tlsVersion: '1.1',
    rateLimited: false,
    wafCoverage: false,
    mtls: false,
    apiKeyExposed: false,
    egressValidated: false,
    owner: 'platform-team',
    ownerActive: false,
    sunsetHeader: '2023-12-01',
    trafficTrend: 'dead',
    trafficP90: 0,
    lastTraffic: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    lastCommit: new Date(Date.now() - 36 * 30 * 24 * 60 * 60 * 1000),
    decayProb: 0.95,
    gateway: 'apigee',
    deployedOn: new Date(Date.now() - 36 * 30 * 24 * 60 * 60 * 1000),
    calledBy: [],
    calls: [],
  },
  {
    method: 'POST',
    path: '/api/v1/webhooks/payment-callback',
    service: 'webhooks-service',
    sensitivity: 0.85,
    exposure: 1.0,
    ageMonths: 12,
    pci: true,
    authMechanism: 'api_key',
    tlsVersion: '1.2',
    rateLimited: false,
    wafCoverage: false,
    mtls: false,
    apiKeyExposed: true,
    egressValidated: false,
    owner: 'integrations-team',
    ownerActive: true,
    sunsetHeader: '',
    trafficTrend: 'declining',
    trafficP90: 15,
    lastTraffic: new Date(Date.now() - 4 * 60 * 60 * 1000),
    lastCommit: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    decayProb: 0.7,
    gateway: 'kong',
    deployedOn: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000),
    calledBy: [],
    calls: [],
  },
  {
    method: 'GET',
    path: '/api/v1/reports/compliance',
    service: 'reporting-service',
    sensitivity: 0.7,
    exposure: 0.2,
    ageMonths: 9,
    pci: false,
    authMechanism: 'jwt',
    tlsVersion: '1.3',
    rateLimited: true,
    wafCoverage: true,
    mtls: true,
    apiKeyExposed: false,
    egressValidated: true,
    owner: 'compliance-team',
    ownerActive: true,
    sunsetHeader: '',
    trafficTrend: 'stable',
    trafficP90: 25,
    lastTraffic: new Date(Date.now() - 1 * 60 * 60 * 1000),
    lastCommit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    decayProb: 0.15,
    gateway: 'internal',
    deployedOn: new Date(Date.now() - 9 * 30 * 24 * 60 * 60 * 1000),
    calledBy: [],
    calls: [],
  },
  {
    method: 'POST',
    path: '/api/v1/cards/tokenize',
    service: 'tokenization-service',
    sensitivity: 1.0,
    exposure: 1.0,
    ageMonths: 4,
    pci: true,
    authMechanism: 'mtls',
    tlsVersion: '1.3',
    rateLimited: true,
    wafCoverage: true,
    mtls: true,
    apiKeyExposed: false,
    egressValidated: true,
    owner: 'security-team',
    ownerActive: true,
    sunsetHeader: '',
    trafficTrend: 'growing',
    trafficP90: 300,
    lastTraffic: new Date(Date.now() - 5 * 60 * 1000),
    lastCommit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    decayProb: 0.02,
    gateway: 'apigee',
    deployedOn: new Date(Date.now() - 4 * 30 * 24 * 60 * 60 * 1000),
    calledBy: [],
    calls: [],
  },
  {
    method: 'GET',
    path: '/api/v1/audit/logs',
    service: 'audit-service',
    sensitivity: 0.4,
    exposure: 0.2,
    ageMonths: 15,
    pci: false,
    authMechanism: 'oauth2',
    tlsVersion: '1.2',
    rateLimited: true,
    wafCoverage: true,
    mtls: false,
    apiKeyExposed: false,
    egressValidated: false,
    owner: 'security-team',
    ownerActive: true,
    sunsetHeader: '',
    trafficTrend: 'stable',
    trafficP90: 10,
    lastTraffic: new Date(Date.now() - 6 * 60 * 60 * 1000),
    lastCommit: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    decayProb: 0.3,
    gateway: 'internal',
    deployedOn: new Date(Date.now() - 15 * 30 * 24 * 60 * 60 * 1000),
    calledBy: [],
    calls: [],
  },
];

async function main() {
  console.log('🌱 Seeding database...');
  
  // Create demo users
  const passwordHash = await bcrypt.hash('demo123', 12);
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'viewer@zad.demo' },
      update: {},
      create: { email: 'viewer@zad.demo', passwordHash, name: 'Demo Viewer', role: 'VIEWER' },
    }),
    prisma.user.upsert({
      where: { email: 'analyst@zad.demo' },
      update: {},
      create: { email: 'analyst@zad.demo', passwordHash, name: 'Demo Analyst', role: 'ANALYST' },
    }),
    prisma.user.upsert({
      where: { email: 'opslead@zad.demo' },
      update: {},
      create: { email: 'opslead@zad.demo', passwordHash, name: 'Demo Ops Lead', role: 'OPS_LEAD' },
    }),
    prisma.user.upsert({
      where: { email: 'ciso@zad.demo' },
      update: {},
      create: { email: 'ciso@zad.demo', passwordHash, name: 'Demo CISO', role: 'CISO' },
    }),
  ]);
  
  console.log(`✅ Created ${users.length} demo users`);
  
  // Create endpoints with computed RI
  for (const ep of demoEndpoints) {
    const v = computeV({
      authMechanism: ep.authMechanism as any,
      tlsVersion: ep.tlsVersion as any,
      rateLimited: ep.rateLimited,
      wafCoverage: ep.wafCoverage,
      mtls: ep.mtls,
      apiKeyExposed: ep.apiKeyExposed,
      egressValidated: ep.egressValidated,
    });
    
    const ri = computeRI({ s: ep.sensitivity, e: ep.exposure, v, a: ep.ageMonths });
    const riBand = getRIBand(ri);
    const state = computeState({ ...ep, v, ri, pci: ep.pci });
    
    await prisma.endpoint.upsert({
      where: { id: ep.path },
      update: {},
      create: {
        ...ep,
        id: ep.path,
        v,
        ri,
        riBand,
        lifecycleState: state as LifecycleState,
        calledBy: JSON.stringify(ep.calledBy),
        calls: JSON.stringify(ep.calls),
        lastTraffic: ep.lastTraffic,
        lastCommit: ep.lastCommit,
        deployedOn: ep.deployedOn,
      },
    });
  }
  
  console.log(`✅ Created ${demoEndpoints.length} demo endpoints`);
  
  // Create decommission states for zombie endpoints
  const endpoints = await prisma.endpoint.findMany();
  
  for (const ep of endpoints) {
    if (ep.lifecycleState === 'ZOMBIE') {
      const existing = await prisma.decomState.findUnique({ where: { endpointId: ep.id } });
      if (!existing) {
        await prisma.decomState.create({
          data: {
            endpointId: ep.id,
            stage: 0,
            initiatedAt: new Date(),
            history: [{ offset: 0, action: 'Pipeline initiated for ZOMBIE endpoint', stage: 0 }],
          },
        });
      }
    }
  }
  
  console.log('✅ Created decommission states for ZOMBIE endpoints');
  
  // Create audit logs
  for (const user of users) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SEED_DATA',
        resource: 'DATABASE',
        resourceId: 'seed',
        details: JSON.stringify({ seededAt: new Date().toISOString() }),
      },
    });
  }
  
  console.log('✅ Created audit log entries');
  console.log('🎉 Seeding complete!');
  
  // Print login credentials
  console.log('\n📋 Demo credentials (password: demo123):');
  console.log('   viewer@zad.demo   - VIEWER (read-only)');
  console.log('   analyst@zad.demo  - ANALYST (can advance decommission)');
  console.log('   opslead@zad.demo  - OPS_LEAD (can advance + rollback)');
  console.log('   ciso@zad.demo     - CISO (full access)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });