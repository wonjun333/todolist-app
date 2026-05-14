'use strict';

/**
 * tests/app.test.js
 *
 * Express 앱(src/app.js) 에 대한 통합 테스트입니다.
 * supertest 를 사용하여 HTTP 레벨에서 엔드포인트를 검증합니다.
 *
 * app.js 는 로드 시점에 app.listen() 을 호출하므로,
 * supertest 는 app 객체를 직접 사용합니다 (별도 listen 없음).
 *
 * pg 는 실제 DB 가 없으므로 mock 합니다.
 */

// ---------------------------------------------------------------------------
// 환경 변수 주입 — jest.mock 보다 먼저 실행되도록 최상단에 배치
// ---------------------------------------------------------------------------
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'testdb';
process.env.DB_USER = 'testuser';
process.env.DB_PASSWORD = 'testpass';
process.env.JWT_SECRET = 'a_32_char_minimum_secret_string!';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_SALT_ROUNDS = '10';
process.env.NODE_ENV = 'test';
process.env.PORT = '0';        // OS 가 임의 포트 배정 — listen 충돌 방지
process.env.CORS_ORIGIN = 'http://localhost:5173';

// ---------------------------------------------------------------------------
// 필수 모듈 mock
// ---------------------------------------------------------------------------

// pg mock — pool.js 가 실제 DB 연결을 시도하지 않도록
jest.mock('pg', () => {
  const MockPool = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    connect: jest.fn(),
  }));
  return { Pool: MockPool };
});

// dotenv mock — .env 파일 의존성 제거
jest.mock('dotenv', () => ({ config: jest.fn() }));

// ---------------------------------------------------------------------------
// supertest + app 로드
// ---------------------------------------------------------------------------
const request = require('supertest');
const app = require('../src/app');

// ---------------------------------------------------------------------------
// GET /health
// ---------------------------------------------------------------------------
describe('GET /health', () => {
  test('200 상태 코드를 반환한다', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  test('{ status: "ok" } 를 반환한다', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('Content-Type 이 application/json 이다', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

// ---------------------------------------------------------------------------
// 404 핸들러
// ---------------------------------------------------------------------------
describe('존재하지 않는 경로 → 404', () => {
  test('GET /nonexistent → 404', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
  });

  test('GET /nonexistent 응답 body 에 error.code = NOT_FOUND 가 있다', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  test('GET /nonexistent 응답 body 에 error.message 가 있다', async () => {
    const res = await request(app).get('/nonexistent');
    expect(typeof res.body.error.message).toBe('string');
    expect(res.body.error.message.length).toBeGreaterThan(0);
  });

  test('POST /nonexistent → 404', async () => {
    const res = await request(app).post('/nonexistent').send({});
    expect(res.status).toBe(404);
  });

  test('DELETE /nonexistent → 404', async () => {
    const res = await request(app).delete('/nonexistent');
    expect(res.status).toBe(404);
  });

  test('404 응답 Content-Type 이 application/json 이다', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});

// ---------------------------------------------------------------------------
// 전역 에러 핸들러 (error-handler.js) — 단위 테스트
// ---------------------------------------------------------------------------
describe('전역 에러 핸들러', () => {
  const {
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
  } = require('../src/types/errors');

  const errorHandler = require('../src/middlewares/error-handler');
  const env = require('../src/config/env');

  /**
   * errorHandler(err, req, res, next) 를 mock req/res 와 함께 호출하고
   * mock res 객체를 반환합니다.
   */
  function invokeErrorHandler(err, nodeEnvOverride) {
    const savedNodeEnv = env.nodeEnv;
    if (nodeEnvOverride !== undefined) {
      env.nodeEnv = nodeEnvOverride;
    }

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    errorHandler(err, {}, res, jest.fn());

    env.nodeEnv = savedNodeEnv;
    return res;
  }

  test('AppError → err.status 로 응답한다', () => {
    const err = new AppError('테스트 오류', 422, 'VALIDATION_ERROR');
    const res = invokeErrorHandler(err);
    expect(res.status).toHaveBeenCalledWith(422);
  });

  test('AppError → body 에 error.code 가 있다', () => {
    const err = new AppError('테스트 오류', 422, 'VALIDATION_ERROR');
    const res = invokeErrorHandler(err);
    const [body] = res.json.mock.calls[0];
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('AppError → body 에 error.message 가 있다', () => {
    const err = new AppError('테스트 오류', 422, 'VALIDATION_ERROR');
    const res = invokeErrorHandler(err);
    const [body] = res.json.mock.calls[0];
    expect(body.error.message).toBe('테스트 오류');
  });

  test('BadRequestError → 400 / BAD_REQUEST', () => {
    const err = new BadRequestError('잘못된 요청');
    const res = invokeErrorHandler(err);
    expect(res.status).toHaveBeenCalledWith(400);
    const [body] = res.json.mock.calls[0];
    expect(body.error.code).toBe('BAD_REQUEST');
  });

  test('UnauthorizedError → 401 / UNAUTHORIZED', () => {
    const err = new UnauthorizedError();
    const res = invokeErrorHandler(err);
    expect(res.status).toHaveBeenCalledWith(401);
    const [body] = res.json.mock.calls[0];
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  test('ForbiddenError → 403 / FORBIDDEN', () => {
    const err = new ForbiddenError();
    const res = invokeErrorHandler(err);
    expect(res.status).toHaveBeenCalledWith(403);
    const [body] = res.json.mock.calls[0];
    expect(body.error.code).toBe('FORBIDDEN');
  });

  test('ConflictError → 409 / CONFLICT', () => {
    const err = new ConflictError();
    const res = invokeErrorHandler(err);
    expect(res.status).toHaveBeenCalledWith(409);
    const [body] = res.json.mock.calls[0];
    expect(body.error.code).toBe('CONFLICT');
  });

  test('일반 Error (non-AppError) → 500 INTERNAL_SERVER_ERROR', () => {
    const err = new Error('알 수 없는 오류');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = invokeErrorHandler(err);
    consoleSpy.mockRestore();
    expect(res.status).toHaveBeenCalledWith(500);
    const [body] = res.json.mock.calls[0];
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  test('production 환경의 일반 Error → 메시지가 고정 문자열이다', () => {
    const err = new Error('DB connection failed');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = invokeErrorHandler(err, 'production');
    consoleSpy.mockRestore();
    const [body] = res.json.mock.calls[0];
    expect(body.error.message).toBe('서버 오류가 발생했습니다.');
  });

  test('non-production 환경의 일반 Error → 실제 메시지가 노출된다', () => {
    const err = new Error('DB connection failed');
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = invokeErrorHandler(err, 'development');
    consoleSpy.mockRestore();
    const [body] = res.json.mock.calls[0];
    expect(body.error.message).toBe('DB connection failed');
  });
});

// ---------------------------------------------------------------------------
// HTTP 요청을 통한 에러 핸들러 통합 검증
// ---------------------------------------------------------------------------
describe('에러 핸들러 통합 (supertest)', () => {
  test('GET /unknown → error 객체 구조가 올바르다', async () => {
    const res = await request(app).get('/unknown-route-xyz');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      error: {
        code: 'NOT_FOUND',
        message: expect.any(String),
      },
    });
  });
});
