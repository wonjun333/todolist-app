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
const TODO_ID = 'todo-uuid-001';
const CAT_ID = 'cat-uuid-001';

function makeToken(userId = USER_ID) {
  return jwt.sign({ userId, email: 'test@example.com' }, SECRET, { expiresIn: '1h' });
}

const mockCategory = {
  id: CAT_ID,
  name: '일반',
  user_id: USER_ID,
  is_default: true,
};

const mockTodo = {
  id: TODO_ID,
  user_id: USER_ID,
  category_id: CAT_ID,
  title: '테스트 할일',
  description: '설명',
  due_date: null,
  is_completed: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

afterEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// GET /api/v1/todos
// ---------------------------------------------------------------------------
describe('GET /api/v1/todos', () => {
  test('토큰 없음 → 401', async () => {
    const res = await request(app).get('/api/v1/todos');
    expect(res.status).toBe(401);
  });

  test('유효한 토큰 → 200, 배열 반환', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [mockTodo] });
    const res = await request(app)
      .get('/api/v1/todos')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('isCompleted=true 필터 쿼리 → 200', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    const res = await request(app)
      .get('/api/v1/todos?isCompleted=true')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
  });

  test('categoryId + dueDateFrom + dueDateTo 복합 필터 → 200', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    const res = await request(app)
      .get(`/api/v1/todos?categoryId=${CAT_ID}&dueDateFrom=2026-01-01&dueDateTo=2026-12-31`)
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
  });

  test('isCompleted가 boolean 문자열이 아니면 400', async () => {
    const res = await request(app)
      .get('/api/v1/todos?isCompleted=yes')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/todos
// ---------------------------------------------------------------------------
describe('POST /api/v1/todos', () => {
  test('토큰 없음 → 401', async () => {
    const res = await request(app).post('/api/v1/todos').send({ title: '할일', categoryId: CAT_ID });
    expect(res.status).toBe(401);
  });

  test('title 누락 → 400', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ categoryId: CAT_ID });
    expect(res.status).toBe(400);
  });

  test('categoryId 누락 → 400', async () => {
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '할일' });
    expect(res.status).toBe(400);
  });

  test('정상 생성 → 201, isCompleted=false', async () => {
    pool.query = jest.fn()
      .mockResolvedValueOnce({ rows: [mockCategory] })  // findById (category)
      .mockResolvedValueOnce({ rows: [mockTodo] });      // create todo
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '테스트 할일', categoryId: CAT_ID });
    expect(res.status).toBe(201);
    expect(res.body.isCompleted).toBe(false);
  });

  test('카테고리 없음 → 404', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] }); // category not found
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '할일', categoryId: 'nonexistent' });
    expect(res.status).toBe(404);
  });

  test('타인 카테고리 → 403', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [{ ...mockCategory, user_id: OTHER_USER_ID }] });
    const res = await request(app)
      .post('/api/v1/todos')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '할일', categoryId: CAT_ID });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/todos/:id
// ---------------------------------------------------------------------------
describe('GET /api/v1/todos/:id', () => {
  test('토큰 없음 → 401', async () => {
    const res = await request(app).get(`/api/v1/todos/${TODO_ID}`);
    expect(res.status).toBe(401);
  });

  test('자신의 할일 → 200', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [mockTodo] });
    const res = await request(app)
      .get(`/api/v1/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(TODO_ID);
  });

  test('타인 할일 → 403', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [{ ...mockTodo, user_id: OTHER_USER_ID }] });
    const res = await request(app)
      .get(`/api/v1/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(403);
  });

  test('없는 ID → 404', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    const res = await request(app)
      .get('/api/v1/todos/nonexistent')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/todos/:id
// ---------------------------------------------------------------------------
describe('PATCH /api/v1/todos/:id', () => {
  test('토큰 없음 → 401', async () => {
    const res = await request(app).patch(`/api/v1/todos/${TODO_ID}`).send({ title: '새 제목' });
    expect(res.status).toBe(401);
  });

  test('정상 수정 → 200, updated_at 갱신', async () => {
    const updated = { ...mockTodo, title: '새 제목', updated_at: new Date().toISOString() };
    pool.query = jest.fn()
      .mockResolvedValueOnce({ rows: [mockTodo] })   // findById
      .mockResolvedValueOnce({ rows: [updated] });    // update
    const res = await request(app)
      .patch(`/api/v1/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '새 제목' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('새 제목');
  });

  test('타인 할일 수정 → 403', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [{ ...mockTodo, user_id: OTHER_USER_ID }] });
    const res = await request(app)
      .patch(`/api/v1/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '새 제목' });
    expect(res.status).toBe(403);
  });

  test('없는 ID → 404', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    const res = await request(app)
      .patch('/api/v1/todos/nonexistent')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ title: '새 제목' });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/todos/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/v1/todos/:id', () => {
  test('토큰 없음 → 401', async () => {
    const res = await request(app).delete(`/api/v1/todos/${TODO_ID}`);
    expect(res.status).toBe(401);
  });

  test('정상 삭제 → 204', async () => {
    pool.query = jest.fn()
      .mockResolvedValueOnce({ rows: [mockTodo] })  // findById
      .mockResolvedValueOnce({ rows: [] });           // deleteById
    const res = await request(app)
      .delete(`/api/v1/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(204);
  });

  test('타인 할일 삭제 → 403', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [{ ...mockTodo, user_id: OTHER_USER_ID }] });
    const res = await request(app)
      .delete(`/api/v1/todos/${TODO_ID}`)
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(403);
  });

  test('없는 ID → 404', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    const res = await request(app)
      .delete('/api/v1/todos/nonexistent')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/todos/:id/complete
// ---------------------------------------------------------------------------
describe('PATCH /api/v1/todos/:id/complete', () => {
  test('토큰 없음 → 401', async () => {
    const res = await request(app).patch(`/api/v1/todos/${TODO_ID}/complete`);
    expect(res.status).toBe(401);
  });

  test('정상 완료 처리 → 200, isCompleted=true', async () => {
    const completed = { ...mockTodo, is_completed: true };
    pool.query = jest.fn()
      .mockResolvedValueOnce({ rows: [mockTodo] })      // findById
      .mockResolvedValueOnce({ rows: [completed] });     // complete
    const res = await request(app)
      .patch(`/api/v1/todos/${TODO_ID}/complete`)
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.isCompleted).toBe(true);
  });

  test('타인 할일 완료 처리 → 403', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [{ ...mockTodo, user_id: OTHER_USER_ID }] });
    const res = await request(app)
      .patch(`/api/v1/todos/${TODO_ID}/complete`)
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(403);
  });

  test('없는 ID → 404', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    const res = await request(app)
      .patch('/api/v1/todos/nonexistent/complete')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });
});
