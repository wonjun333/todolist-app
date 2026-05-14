'use strict';

process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'testdb';
process.env.DB_USER = 'testuser';
process.env.DB_PASSWORD = 'testpass';
process.env.JWT_SECRET = 'a_32_char_minimum_secret_string!!';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_SALT_ROUNDS = '10';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';

jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({ on: jest.fn(), query: jest.fn() })),
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$hash'),
  compare: jest.fn().mockResolvedValue(true),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../src/app');
const pool = require('../../src/db/pool');

const SECRET = 'a_32_char_minimum_secret_string!!';
const USER_ID = 'user-uuid-001';
const OTHER_USER_ID = 'user-uuid-002';
const CAT_ID = 'cat-uuid-001';

function makeToken(userId = USER_ID) {
  return jwt.sign({ userId, email: 'test@example.com' }, SECRET, { expiresIn: '1h' });
}

const mockCategory = {
  id: CAT_ID,
  name: '테스트',
  user_id: USER_ID,
  is_default: false,
  created_at: new Date().toISOString(),
};

const mockDefaultCategory = {
  id: 'cat-default-001',
  name: '일반',
  user_id: USER_ID,
  is_default: true,
  created_at: new Date().toISOString(),
};

afterEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// GET /api/v1/categories
// ---------------------------------------------------------------------------
describe('GET /api/v1/categories', () => {
  test('토큰 없음 → 401', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(401);
  });

  test('유효한 토큰 → 200, 배열 반환', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [mockDefaultCategory, mockCategory] });
    const res = await request(app)
      .get('/api/v1/categories')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/categories
// ---------------------------------------------------------------------------
describe('POST /api/v1/categories', () => {
  test('토큰 없음 → 401', async () => {
    const res = await request(app).post('/api/v1/categories').send({ name: '새카테고리' });
    expect(res.status).toBe(401);
  });

  test('name 누락 → 400', async () => {
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('정상 생성 → 201, isDefault=false, userId=현재사용자', async () => {
    // findByNameAndUserId → null (no duplicate), create → mockCategory
    pool.query = jest.fn()
      .mockResolvedValueOnce({ rows: [] })         // findByNameAndUserId
      .mockResolvedValueOnce({ rows: [mockCategory] }); // create
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: '테스트' });
    expect(res.status).toBe(201);
    expect(res.body.isDefault).toBe(false);
    expect(res.body.userId).toBe(USER_ID);
  });

  test('중복 이름 → 409 CATEGORY_NAME_DUPLICATE', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [mockCategory] }); // duplicate found
    const res = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: '테스트' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_NAME_DUPLICATE');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/categories/:id
// ---------------------------------------------------------------------------
describe('PATCH /api/v1/categories/:id', () => {
  test('토큰 없음 → 401', async () => {
    const res = await request(app).patch(`/api/v1/categories/${CAT_ID}`).send({ name: '새이름' });
    expect(res.status).toBe(401);
  });

  test('정상 수정 → 200', async () => {
    const updated = { ...mockCategory, name: '새이름' };
    pool.query = jest.fn()
      .mockResolvedValueOnce({ rows: [mockCategory] })  // findById
      .mockResolvedValueOnce({ rows: [] })               // findByNameAndUserId (no dup)
      .mockResolvedValueOnce({ rows: [updated] });       // update
    const res = await request(app)
      .patch(`/api/v1/categories/${CAT_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: '새이름' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('새이름');
  });

  test('기본 카테고리 수정 시도 → 403', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [mockDefaultCategory] }); // findById
    const res = await request(app)
      .patch(`/api/v1/categories/cat-default-001`)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: '새이름' });
    expect(res.status).toBe(403);
  });

  test('타인 카테고리 수정 시도 → 403', async () => {
    const otherCat = { ...mockCategory, user_id: OTHER_USER_ID };
    pool.query = jest.fn().mockResolvedValue({ rows: [otherCat] });
    const res = await request(app)
      .patch(`/api/v1/categories/${CAT_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: '새이름' });
    expect(res.status).toBe(403);
  });

  test('존재하지 않는 카테고리 → 404', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    const res = await request(app)
      .patch('/api/v1/categories/nonexistent')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ name: '새이름' });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/categories/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/v1/categories/:id', () => {
  test('토큰 없음 → 401', async () => {
    const res = await request(app).delete(`/api/v1/categories/${CAT_ID}`);
    expect(res.status).toBe(401);
  });

  test('정상 삭제 → 204', async () => {
    pool.query = jest.fn()
      .mockResolvedValueOnce({ rows: [mockCategory] })    // findById
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })  // countTodosByCategory
      .mockResolvedValueOnce({ rows: [] });                // deleteById
    const res = await request(app)
      .delete(`/api/v1/categories/${CAT_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(204);
  });

  test('기본 카테고리 삭제 시도 → 403', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [mockDefaultCategory] });
    const res = await request(app)
      .delete('/api/v1/categories/cat-default-001')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(403);
  });

  test('타인 카테고리 삭제 시도 → 403', async () => {
    const otherCat = { ...mockCategory, user_id: OTHER_USER_ID };
    pool.query = jest.fn().mockResolvedValue({ rows: [otherCat] });
    const res = await request(app)
      .delete(`/api/v1/categories/${CAT_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(403);
  });

  test('연결된 할일 존재 → 409 CATEGORY_HAS_TODOS', async () => {
    pool.query = jest.fn()
      .mockResolvedValueOnce({ rows: [mockCategory] })    // findById
      .mockResolvedValueOnce({ rows: [{ count: '3' }] }); // countTodosByCategory
    const res = await request(app)
      .delete(`/api/v1/categories/${CAT_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CATEGORY_HAS_TODOS');
  });

  test('존재하지 않는 카테고리 → 404', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    const res = await request(app)
      .delete('/api/v1/categories/nonexistent')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });
});
