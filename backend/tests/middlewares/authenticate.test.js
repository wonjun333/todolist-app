'use strict';

// 환경 변수 주입
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'testdb';
process.env.DB_USER = 'testuser';
process.env.DB_PASSWORD = 'testpass';
process.env.JWT_SECRET = 'a_32_char_minimum_secret_string!!';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_SALT_ROUNDS = '10';

jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({ on: jest.fn() })),
}));

const jwt = require('jsonwebtoken');
const authenticate = require('../../src/middlewares/authenticate');
const { UnauthorizedError } = require('../../src/types/errors');
const env = require('../../src/config/env');

function makeReq(authHeader) {
  return { headers: { authorization: authHeader } };
}

function runMiddleware(req) {
  return new Promise((resolve) => {
    const next = (arg) => resolve(arg);
    authenticate(req, {}, next);
  });
}

describe('authenticate 미들웨어', () => {
  describe('Authorization 헤더 없음', () => {
    test('헤더 없을 때 UnauthorizedError를 next에 전달한다', async () => {
      const result = await runMiddleware(makeReq(undefined));
      expect(result).toBeInstanceOf(UnauthorizedError);
    });

    test('헤더가 빈 문자열일 때 UnauthorizedError를 전달한다', async () => {
      const result = await runMiddleware(makeReq(''));
      expect(result).toBeInstanceOf(UnauthorizedError);
    });

    test('Bearer 접두사 없을 때 UnauthorizedError를 전달한다', async () => {
      const result = await runMiddleware(makeReq('Token abc'));
      expect(result).toBeInstanceOf(UnauthorizedError);
    });

    test('에러 상태 코드가 401이다', async () => {
      const result = await runMiddleware(makeReq(undefined));
      expect(result.status).toBe(401);
    });
  });

  describe('만료된 토큰', () => {
    test('TokenExpiredError → UnauthorizedError(만료 메시지) 전달', async () => {
      const expiredToken = jwt.sign({ userId: 'u1' }, env.jwt.secret, { expiresIn: -1 });
      const result = await runMiddleware(makeReq(`Bearer ${expiredToken}`));
      expect(result).toBeInstanceOf(UnauthorizedError);
      expect(result.message).toContain('만료');
    });
  });

  describe('유효하지 않은 토큰', () => {
    test('서명이 다른 토큰 → UnauthorizedError 전달', async () => {
      const forged = jwt.sign({ userId: 'u1' }, 'wrong_secret');
      const result = await runMiddleware(makeReq(`Bearer ${forged}`));
      expect(result).toBeInstanceOf(UnauthorizedError);
    });

    test('토큰 형식이 잘못됨 → UnauthorizedError 전달', async () => {
      const result = await runMiddleware(makeReq('Bearer not.valid.jwt'));
      expect(result).toBeInstanceOf(UnauthorizedError);
    });

    test('유효하지 않은 토큰 에러 메시지 확인', async () => {
      const forged = jwt.sign({ userId: 'u1' }, 'wrong_secret');
      const result = await runMiddleware(makeReq(`Bearer ${forged}`));
      expect(result.message).toContain('유효하지 않은');
    });
  });

  describe('유효한 토큰', () => {
    test('req.userId에 payload.userId가 설정된다', async () => {
      const token = jwt.sign({ userId: 'user-123', email: 'a@b.com' }, env.jwt.secret, { expiresIn: '1h' });
      const req = makeReq(`Bearer ${token}`);
      await runMiddleware(req);
      expect(req.userId).toBe('user-123');
    });

    test('req.userEmail에 payload.email이 설정된다', async () => {
      const token = jwt.sign({ userId: 'user-123', email: 'a@b.com' }, env.jwt.secret, { expiresIn: '1h' });
      const req = makeReq(`Bearer ${token}`);
      await runMiddleware(req);
      expect(req.userEmail).toBe('a@b.com');
    });

    test('유효한 토큰이면 next()를 에러 없이 호출한다', async () => {
      const token = jwt.sign({ userId: 'user-123', email: 'a@b.com' }, env.jwt.secret, { expiresIn: '1h' });
      const result = await runMiddleware(makeReq(`Bearer ${token}`));
      expect(result).toBeUndefined();
    });
  });
});
