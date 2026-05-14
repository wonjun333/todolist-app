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

const { validateBody } = require('../../src/middlewares/validate');
const { BadRequestError } = require('../../src/types/errors');

function runValidate(requiredFields, body) {
  return new Promise((resolve) => {
    const middleware = validateBody(requiredFields);
    const req = { body };
    middleware(req, {}, (arg) => resolve(arg));
  });
}

describe('validateBody 미들웨어', () => {
  describe('필수 필드 누락', () => {
    test('필드가 undefined이면 BadRequestError를 next에 전달한다', async () => {
      const result = await runValidate(['email', 'password'], { email: 'a@b.com' });
      expect(result).toBeInstanceOf(BadRequestError);
    });

    test('필드가 null이면 BadRequestError를 전달한다', async () => {
      const result = await runValidate(['name'], { name: null });
      expect(result).toBeInstanceOf(BadRequestError);
    });

    test('필드가 빈 문자열이면 BadRequestError를 전달한다', async () => {
      const result = await runValidate(['title'], { title: '' });
      expect(result).toBeInstanceOf(BadRequestError);
    });

    test('에러 상태 코드가 400이다', async () => {
      const result = await runValidate(['email'], {});
      expect(result.status).toBe(400);
    });

    test('누락된 필드명이 에러 메시지에 포함된다', async () => {
      const result = await runValidate(['email', 'password'], {});
      expect(result.message).toContain('email');
      expect(result.message).toContain('password');
    });

    test('body 자체가 비어있으면 모든 필드가 누락 처리된다', async () => {
      const result = await runValidate(['a', 'b', 'c'], {});
      expect(result.message).toContain('a');
      expect(result.message).toContain('b');
      expect(result.message).toContain('c');
    });
  });

  describe('모든 필수 필드 제공됨', () => {
    test('모든 필드가 있으면 next()를 에러 없이 호출한다', async () => {
      const result = await runValidate(['email', 'password'], {
        email: 'a@b.com',
        password: 'secret',
      });
      expect(result).toBeUndefined();
    });

    test('숫자 0도 유효한 값으로 처리한다 (누락 아님)', async () => {
      const result = await runValidate(['count'], { count: 0 });
      expect(result).toBeUndefined();
    });

    test('false 값도 존재하는 필드로 인식한다', async () => {
      const result = await runValidate(['isActive'], { isActive: false });
      expect(result).toBeUndefined();
    });

    test('요구 필드가 없는 경우 항상 통과한다', async () => {
      const result = await runValidate([], {});
      expect(result).toBeUndefined();
    });
  });
});
