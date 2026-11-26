/**
 * Gateway authentication: the end-user identity comes only from a verified access token.
 * A service credential (X-Service-Auth) plus a chosen X-User-Id must never authenticate a user.
 * Run: node --import tsx --test src/middleware/auth.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

const TEST_ACCESS_SECRET = 'test-access-secret-0123456789-abcdefghijklmnop';
const TEST_SERVICE_TOKEN = 'test-service-token-not-a-real-secret';
const ISSUER = 'extrahand-user-service';
const AUDIENCE = 'extrahand-clients';

// Test-only config, set before the gateway modules load (dotenv never overrides set values).
Object.assign(process.env, {
  NODE_ENV: 'test',
  LOG_LEVEL: 'error',
  USER_SERVICE_URL: 'http://127.0.0.1:9',
  TASK_SERVICE_URL: 'http://127.0.0.1:9',
  CHAT_SERVICE_URL: 'http://127.0.0.1:9',
  VERIFICATION_SERVICE_URL: 'http://127.0.0.1:9',
  PAYMENT_SERVICE_URL: 'http://127.0.0.1:9',
  NOTIFICATION_SERVICE_URL: 'http://127.0.0.1:9',
  SERVICE_AUTH_TOKEN: TEST_SERVICE_TOKEN,
  ACCESS_TOKEN_SECRET: TEST_ACCESS_SECRET,
  TOKEN_ISSUER: ISSUER,
  TOKEN_AUDIENCE: AUDIENCE,
  CORS_ORIGIN: 'http://localhost',
  FIREBASE_PROJECT_ID: 'test-project',
  FIREBASE_PRIVATE_KEY: 'not-a-key',
  FIREBASE_CLIENT_EMAIL: 'test@example.com',
});

type Res = { statusCode: number; body: any; status(code: number): Res; json(payload: any): Res };

function fakeRes(): Res {
  return {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
  };
}

function accessToken(uid: string, secret = TEST_ACCESS_SECRET): string {
  return jwt.sign({ sub: uid, sid: 'session-1', pid: `profile-${uid}` }, secret, {
    issuer: ISSUER,
    audience: AUDIENCE,
    expiresIn: '5m',
  });
}

async function run(headers: Record<string, string>) {
  const { authMiddleware } = await import('./auth.js');
  const req: any = { headers, path: '/api/v1/payment/refund', method: 'POST' };
  const res = fakeRes();
  let nextCalled = false;
  await authMiddleware(req, res as any, () => {
    nextCalled = true;
  });
  return { req, res, nextCalled };
}

test('a normal user cannot choose another user via X-User-Id', async () => {
  const { req, nextCalled } = await run({
    authorization: `Bearer ${accessToken('alice')}`,
    'x-user-id': 'victim',
  });
  assert.equal(nextCalled, true);
  assert.equal(req.user.uid, 'alice', 'identity comes from the verified token');
  assert.equal(req.user.profileId, 'profile-alice');
});

test('the configured service token cannot establish an arbitrary user identity', async () => {
  const { req, res, nextCalled } = await run({
    'x-service-auth': TEST_SERVICE_TOKEN,
    'x-user-id': 'victim',
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(req.user, undefined);
});

test('a service token other than the configured one is not accepted either', async () => {
  const { req, res, nextCalled } = await run({ 'x-service-auth': 'some-other-service-token', 'x-user-id': 'victim' });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(req.user, undefined);
});

test('a browser cannot use a service token as an end-user bearer credential', async () => {
  const { req, res, nextCalled } = await run({
    authorization: `Bearer ${TEST_SERVICE_TOKEN}`,
    'x-user-id': 'victim',
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(req.user, undefined);
});

test('a token signed with another secret is rejected even with a valid service token', async () => {
  const { res, nextCalled } = await run({
    authorization: `Bearer ${accessToken('mallory', 'some-other-secret-0123456789-abcdefghijk')}`,
    'x-service-auth': TEST_SERVICE_TOKEN,
    'x-user-id': 'victim',
  });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test('a server caller that forwards a real user token is authenticated as that user', async () => {
  const { req, nextCalled } = await run({
    authorization: `Bearer ${accessToken('seller-1')}`,
    'x-service-auth': TEST_SERVICE_TOKEN,
  });
  assert.equal(nextCalled, true);
  assert.equal(req.user.uid, 'seller-1');
});

test('downstream calls carry the verified uid and the gateway service credential', async () => {
  const { req } = await run({
    authorization: `Bearer ${accessToken('alice')}`,
    'x-user-id': 'victim',
  });
  const { BaseService } = await import('../services/baseService.js');
  class Probe extends BaseService {
    constructor() {
      super({ serviceName: 'Probe', baseURL: 'http://127.0.0.1:9' });
    }
    headersFor(user: any) {
      return this.addServiceAuth(this.forwardUserAuth(user)).headers as Record<string, string>;
    }
  }
  const headers = new Probe().headersFor(req.user);
  assert.equal(headers['X-User-Id'], 'alice');
  assert.equal(headers['X-Service-Name'], 'api-gateway');
  assert.equal(headers['X-Service-Auth'] === TEST_SERVICE_TOKEN, true);
});
