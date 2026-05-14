'use strict';

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
  Pool: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    connect: jest.fn(),
  })),
}));

const pool = require('../../src/db/pool');
const categoryRepo = require('../../src/repositories/category.repository');

const USER_ID = 'user-uuid-001';
const CAT_ID = 'cat-uuid-001';

afterEach(() => jest.clearAllMocks());

describe('createDefaultCategories', () => {
  test('pool.query를 3번 호출한다', async () => {
    pool.query = jest.fn()
      .mockResolvedValueOnce({ rows: [{ id: '1', name: '일반' }] })
      .mockResolvedValueOnce({ rows: [{ id: '2', name: '업무' }] })
      .mockResolvedValueOnce({ rows: [{ id: '3', name: '개인' }] });
    const result = await categoryRepo.createDefaultCategories(USER_ID);
    expect(pool.query).toHaveBeenCalledTimes(3);
    expect(result).toHaveLength(3);
  });

  test('일반/업무/개인 순서로 INSERT', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [{}] });
    await categoryRepo.createDefaultCategories(USER_ID);
    const names = pool.query.mock.calls.map((c) => c[1][0]);
    expect(names).toEqual(['일반', '업무', '개인']);
  });
});

describe('findAll', () => {
  test('userId로 쿼리하고 rows를 반환', async () => {
    const rows = [{ id: CAT_ID, name: '일반' }];
    pool.query = jest.fn().mockResolvedValue({ rows });
    const result = await categoryRepo.findAll(USER_ID);
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [USER_ID]);
    expect(result).toEqual(rows);
  });
});

describe('findById', () => {
  test('존재하면 행 반환', async () => {
    const row = { id: CAT_ID, name: '테스트' };
    pool.query = jest.fn().mockResolvedValue({ rows: [row] });
    const result = await categoryRepo.findById(CAT_ID);
    expect(result).toEqual(row);
  });

  test('없으면 null 반환', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    expect(await categoryRepo.findById('nonexistent')).toBeNull();
  });
});

describe('findByNameAndUserId', () => {
  test('name과 userId로 쿼리', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    const result = await categoryRepo.findByNameAndUserId('일반', USER_ID);
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['일반', USER_ID]);
    expect(result).toBeNull();
  });

  test('존재하면 행 반환', async () => {
    const row = { id: CAT_ID, name: '일반' };
    pool.query = jest.fn().mockResolvedValue({ rows: [row] });
    expect(await categoryRepo.findByNameAndUserId('일반', USER_ID)).toEqual(row);
  });
});

describe('create', () => {
  test('name과 userId로 INSERT하고 반환', async () => {
    const row = { id: CAT_ID, name: '테스트', user_id: USER_ID, is_default: false };
    pool.query = jest.fn().mockResolvedValue({ rows: [row] });
    const result = await categoryRepo.create({ name: '테스트', userId: USER_ID });
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), ['테스트', USER_ID]);
    expect(result).toEqual(row);
  });
});

describe('update', () => {
  test('name으로 UPDATE하고 반환', async () => {
    const row = { id: CAT_ID, name: '새이름' };
    pool.query = jest.fn().mockResolvedValue({ rows: [row] });
    expect(await categoryRepo.update(CAT_ID, { name: '새이름' })).toEqual(row);
  });

  test('없는 ID → null 반환', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    expect(await categoryRepo.update('nonexistent', { name: '새이름' })).toBeNull();
  });
});

describe('deleteById', () => {
  test('id로 DELETE 쿼리 실행', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    await categoryRepo.deleteById(CAT_ID);
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [CAT_ID]);
  });
});

describe('countTodosByCategory', () => {
  test('COUNT 결과를 숫자로 반환', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [{ count: '5' }] });
    expect(await categoryRepo.countTodosByCategory(CAT_ID)).toBe(5);
  });

  test('0건이면 0 반환', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [{ count: '0' }] });
    expect(await categoryRepo.countTodosByCategory(CAT_ID)).toBe(0);
  });
});
