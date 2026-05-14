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
const { createToken, verifyToken } = require('../../src/utils/jwt');
const env = require('../../src/config/env');

describe('createToken', () => {
  test('문자열을 반환한다', () => {
    const token = createToken({ userId: 'u1', email: 'a@b.com' });
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  test('payload의 userId와 email이 포함된다', () => {
    const token = createToken({ userId: 'u1', email: 'a@b.com' });
    const decoded = jwt.decode(token);
    expect(decoded.userId).toBe('u1');
    expect(decoded.email).toBe('a@b.com');
  });

  test('JWT 헤더에 HS256 알고리즘이 사용된다', () => {
    const token = createToken({ userId: 'u1' });
    const [headerB64] = token.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString());
    expect(header.alg).toBe('HS256');
  });

  test('서로 다른 payload는 서로 다른 토큰을 생성한다', () => {
    const t1 = createToken({ userId: 'u1' });
    const t2 = createToken({ userId: 'u2' });
    expect(t1).not.toBe(t2);
  });
});

describe('verifyToken', () => {
  test('유효한 토큰을 검증하고 payload를 반환한다', () => {
    const token = createToken({ userId: 'u1', email: 'a@b.com' });
    const payload = verifyToken(token);
    expect(payload.userId).toBe('u1');
    expect(payload.email).toBe('a@b.com');
  });

  test('잘못된 토큰은 JsonWebTokenError를 던진다', () => {
    expect(() => verifyToken('invalid.token.here')).toThrow();
  });

  test('서명이 다른 토큰은 JsonWebTokenError를 던진다', () => {
    const forgedToken = jwt.sign({ userId: 'u1' }, 'wrong_secret');
    expect(() => verifyToken(forgedToken)).toThrow();
  });

  test('만료된 토큰은 TokenExpiredError를 던진다', () => {
    const expiredToken = jwt.sign(
      { userId: 'u1' },
      env.jwt.secret,
      { expiresIn: -1 }
    );
    let caughtError;
    try {
      verifyToken(expiredToken);
    } catch (e) {
      caughtError = e;
    }
    expect(caughtError).toBeDefined();
    expect(caughtError.name).toBe('TokenExpiredError');
  });

  test('빈 문자열 토큰은 에러를 던진다', () => {
    expect(() => verifyToken('')).toThrow();
  });
});
