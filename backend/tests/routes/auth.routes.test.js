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
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$hashedpassword'),
  compare: jest.fn(),
}));

const request = require('supertest');
const jwt = require('jsonwebtoken');

// pool.query를 모든 테스트에서 공유할 mock으로 노출
const pool = require('../../src/db/pool');
pool.query = jest.fn();

const app = require('../../src/app');
const bcrypt = require('bcryptjs');

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // bcrypt.hash 기본값 복원
    bcrypt.hash.mockResolvedValue('$2a$10$hashedpassword');
  });

  it('필수 필드 누락 시 400을 반환한다 (email 없음)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Test User', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('필수 필드 누락 시 400을 반환한다 (name 없음)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('필수 필드 누락 시 400을 반환한다 (password 없음)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', name: 'Test User' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('이메일 중복 시 409 EMAIL_DUPLICATE를 반환한다', async () => {
    // findByEmail → 기존 유저 존재
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, email: 'duplicate@example.com', name: 'Existing User' }],
    });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'duplicate@example.com', name: 'New User', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_DUPLICATE');
  });

  it('정상 요청 시 201과 { id, email, name }을 반환한다', async () => {
    // findByEmail → 없음
    pool.query.mockResolvedValueOnce({ rows: [] });
    // create user
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 5, email: 'new@example.com', name: 'New User', password_hash: '$2a$10$hashedpassword' }],
    });
    // createDefaultCategories x3
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, name: '일반' }] });
    pool.query.mockResolvedValueOnce({ rows: [{ id: 2, name: '업무' }] });
    pool.query.mockResolvedValueOnce({ rows: [{ id: 3, name: '개인' }] });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'new@example.com', name: 'New User', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 5, email: 'new@example.com', name: 'New User' });
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.compare.mockReset();
  });

  it('필수 필드 누락 시 400을 반환한다 (email 없음)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('필수 필드 누락 시 400을 반환한다 (password 없음)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('존재하지 않는 이메일로 로그인 시 401을 반환한다', async () => {
    // findByEmail → 없음
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'notfound@example.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('비밀번호 불일치 시 401을 반환한다', async () => {
    // findByEmail → 유저 있음
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 1, email: 'test@example.com', name: 'Test', password_hash: '$2a$10$hashedpassword' }],
    });
    // comparePassword → false
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('정상 로그인 시 200과 { accessToken }을 반환한다', async () => {
    // findByEmail → 유저 있음
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 7, email: 'test@example.com', name: 'Test User', password_hash: '$2a$10$hashedpassword' }],
    });
    // comparePassword → true
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'correctpassword' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(typeof res.body.accessToken).toBe('string');
  });

  it('정상 로그인 응답의 accessToken이 유효한 JWT이다', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [{ id: 7, email: 'test@example.com', name: 'Test User', password_hash: '$2a$10$hashedpassword' }],
    });
    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'correctpassword' });

    expect(res.status).toBe(200);

    const { accessToken } = res.body;
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

    expect(decoded).toHaveProperty('userId', 7);
    expect(decoded).toHaveProperty('email', 'test@example.com');
  });
});
