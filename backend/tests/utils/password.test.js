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

const { hashPassword, comparePassword } = require('../../src/utils/password');

describe('hashPassword', () => {
  test('해시된 문자열을 반환한다', async () => {
    const hash = await hashPassword('mypassword');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
  });

  test('bcrypt 해시 형식($2...)이다', async () => {
    const hash = await hashPassword('mypassword');
    expect(hash).toMatch(/^\$2[ab]\$/);
  });

  test('평문과 다른 값을 반환한다', async () => {
    const plain = 'mypassword';
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
  });

  test('같은 평문도 매번 다른 해시를 생성한다 (salt)', async () => {
    const hash1 = await hashPassword('mypassword');
    const hash2 = await hashPassword('mypassword');
    expect(hash1).not.toBe(hash2);
  });
});

describe('comparePassword', () => {
  test('올바른 비밀번호는 true를 반환한다', async () => {
    const plain = 'correct_password';
    const hash = await hashPassword(plain);
    const result = await comparePassword(plain, hash);
    expect(result).toBe(true);
  });

  test('틀린 비밀번호는 false를 반환한다', async () => {
    const hash = await hashPassword('correct_password');
    const result = await comparePassword('wrong_password', hash);
    expect(result).toBe(false);
  });

  test('빈 문자열 비밀번호도 처리한다', async () => {
    const hash = await hashPassword('some_password');
    const result = await comparePassword('', hash);
    expect(result).toBe(false);
  });

  test('bcrypt 형식이 아닌 해시는 false를 반환한다', async () => {
    const result = await comparePassword('password', 'not_a_valid_bcrypt_hash');
    expect(result).toBe(false);
  });
});
