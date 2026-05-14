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
  Pool: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    query: jest.fn(),
  })),
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$newhash'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt'),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const app = require('../../src/app');

const SECRET = 'a_32_char_minimum_secret_string!!';

function makeToken(userId = 'user-uuid-001', email = 'test@example.com') {
  return jwt.sign({ userId, email }, SECRET, { expiresIn: '1h' });
}

const mockUser = {
  id: 'user-uuid-001',
  email: 'test@example.com',
  name: '홍길동',
  password_hash: '$2a$10$hashedpassword',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

let poolInstance;

beforeEach(() => {
  poolInstance = Pool.mock.instances[Pool.mock.instances.length - 1];
  if (!poolInstance) {
    poolInstance = { query: jest.fn() };
  }
});

afterEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/v1/users/me
// ---------------------------------------------------------------------------
describe('GET /api/v1/users/me', () => {
  test('토큰 없음 → 401', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });

  test('만료된 토큰 → 401', async () => {
    const expiredToken = jwt.sign({ userId: 'u1', email: 'a@b.com' }, SECRET, { expiresIn: -1 });
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  test('유효한 토큰 + 사용자 존재 → 200, password_hash 미포함', async () => {
    const pool = require('../../src/db/pool');
    pool.query = jest.fn().mockResolvedValue({ rows: [mockUser] });

    const token = makeToken();
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('password_hash');
    expect(res.body.id).toBe('user-uuid-001');
    expect(res.body.email).toBe('test@example.com');
    expect(res.body.name).toBe('홍길동');
  });

  test('유효한 토큰 + 사용자 없음 → 404', async () => {
    const pool = require('../../src/db/pool');
    pool.query = jest.fn().mockResolvedValue({ rows: [] });

    const token = makeToken();
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('응답 body 구조: id, email, name 포함', async () => {
    const pool = require('../../src/db/pool');
    pool.query = jest.fn().mockResolvedValue({ rows: [mockUser] });

    const token = makeToken();
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('name');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/users/me
// ---------------------------------------------------------------------------
describe('PATCH /api/v1/users/me', () => {
  test('토큰 없음 → 401', async () => {
    const res = await request(app)
      .patch('/api/v1/users/me')
      .send({ name: '새이름' });
    expect(res.status).toBe(401);
  });

  test('이름 수정 → 200, password_hash 미포함', async () => {
    const updatedUser = { ...mockUser, name: '새이름', updated_at: new Date() };
    const pool = require('../../src/db/pool');
    pool.query = jest.fn().mockResolvedValue({ rows: [updatedUser] });

    const token = makeToken();
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '새이름' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('새이름');
    expect(res.body).not.toHaveProperty('password_hash');
  });

  test('비밀번호 변경 → 200', async () => {
    const updatedUser = { ...mockUser, password_hash: '$2a$10$newhash' };
    const pool = require('../../src/db/pool');
    pool.query = jest.fn().mockResolvedValue({ rows: [updatedUser] });

    const token = makeToken();
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: 'newpassword123' });

    expect(res.status).toBe(200);
    expect(res.body).not.toHaveProperty('password_hash');
  });

  test('이름 + 비밀번호 동시 변경 → 200', async () => {
    const updatedUser = { ...mockUser, name: '동시수정', password_hash: '$2a$10$newhash' };
    const pool = require('../../src/db/pool');
    pool.query = jest.fn().mockResolvedValue({ rows: [updatedUser] });

    const token = makeToken();
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '동시수정', newPassword: 'newpassword123' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('동시수정');
  });

  test('변경 항목 없이 요청 → 200 (기존 정보 반환)', async () => {
    const pool = require('../../src/db/pool');
    pool.query = jest.fn().mockResolvedValue({ rows: [mockUser] });

    const token = makeToken();
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
  });

  test('사용자 없음 → 404', async () => {
    const pool = require('../../src/db/pool');
    // update returns null, findById also returns null
    pool.query = jest.fn().mockResolvedValue({ rows: [] });

    const token = makeToken();
    const res = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '없는유저' });

    expect(res.status).toBe(404);
  });
});
