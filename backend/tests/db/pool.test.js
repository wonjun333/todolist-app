'use strict';

/**
 * tests/db/pool.test.js
 *
 * pool.js 는 로드 시점에 pg.Pool 을 생성하고 실제 DB 연결을 시도합니다.
 * 테스트 환경에서 실제 DB 가 없으므로 pg 모듈 전체를 mock 합니다.
 *
 * 검증 포인트:
 *  1. pool 이 pg.Pool 인스턴스인지 (mock 을 통해 확인)
 *  2. Pool 생성자에 올바른 설정값(max, idleTimeoutMillis 등)이 전달됐는지
 *  3. pool 이 query / end 메서드를 가지는지
 *  4. pool.on('error', ...) 핸들러가 등록됐는지
 */

// ---------------------------------------------------------------------------
// pg mock — jest.mock 은 호이스팅되므로 require 보다 먼저 실행됩니다.
// ---------------------------------------------------------------------------
let capturedPoolConfig = null;
let mockPoolInstance = null;

jest.mock('pg', () => {
  // mock Pool 클래스
  const MockPool = jest.fn().mockImplementation((config) => {
    capturedPoolConfig = config;
    mockPoolInstance = {
      // EventEmitter 스텁
      on: jest.fn(),
      // pg.Pool 공개 메서드
      query: jest.fn(),
      end: jest.fn(),
      connect: jest.fn(),
    };
    return mockPoolInstance;
  });

  return { Pool: MockPool };
});

// ---------------------------------------------------------------------------
// 환경 변수 설정 (env.js 가 로드될 때 필요)
// ---------------------------------------------------------------------------
beforeAll(() => {
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_NAME = 'testdb';
  process.env.DB_USER = 'testuser';
  process.env.DB_PASSWORD = 'testpass';
  process.env.JWT_SECRET = 'a_32_char_minimum_secret_string!';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.BCRYPT_SALT_ROUNDS = '10';
  process.env.NODE_ENV = 'test';

  // dotenv 는 .env 파일을 읽지 않도록 mock
  jest.mock('dotenv', () => ({ config: jest.fn() }));

  // 모듈 캐시 초기화 후 로드
  jest.resetModules();
});

afterAll(() => {
  jest.unmock('pg');
  jest.unmock('dotenv');
  jest.resetModules();
});

// ---------------------------------------------------------------------------
// pool 모듈 로드 (beforeAll 이후에 실행)
// ---------------------------------------------------------------------------
let pool;

beforeAll(() => {
  pool = require('../../src/db/pool');
});

// ---------------------------------------------------------------------------
// 테스트
// ---------------------------------------------------------------------------
describe('db/pool - Pool 생성', () => {
  test('pg.Pool 생성자가 호출된다', () => {
    const { Pool } = require('pg');
    expect(Pool).toHaveBeenCalledTimes(1);
  });

  test('Pool 생성자에 host 가 전달된다', () => {
    expect(capturedPoolConfig).not.toBeNull();
    expect(capturedPoolConfig.host).toBe('localhost');
  });

  test('Pool 생성자에 port 가 숫자로 전달된다', () => {
    expect(typeof capturedPoolConfig.port).toBe('number');
    expect(capturedPoolConfig.port).toBe(5432);
  });

  test('Pool 생성자에 database 가 전달된다', () => {
    expect(capturedPoolConfig.database).toBe('testdb');
  });

  test('Pool 생성자에 user 가 전달된다', () => {
    expect(capturedPoolConfig.user).toBe('testuser');
  });

  test('Pool 생성자에 password 가 전달된다', () => {
    expect(capturedPoolConfig.password).toBe('testpass');
  });

  test('max connections 는 10이다', () => {
    expect(capturedPoolConfig.max).toBe(10);
  });

  test('idleTimeoutMillis 는 30000이다', () => {
    expect(capturedPoolConfig.idleTimeoutMillis).toBe(30000);
  });

  test('connectionTimeoutMillis 는 2000이다', () => {
    expect(capturedPoolConfig.connectionTimeoutMillis).toBe(2000);
  });
});

describe('db/pool - pool 인스턴스 인터페이스', () => {
  test('pool 이 export 된다', () => {
    expect(pool).toBeDefined();
    expect(pool).not.toBeNull();
  });

  test('pool 이 query 메서드를 가진다', () => {
    expect(typeof pool.query).toBe('function');
  });

  test('pool 이 end 메서드를 가진다', () => {
    expect(typeof pool.end).toBe('function');
  });

  test('pool 이 connect 메서드를 가진다', () => {
    expect(typeof pool.connect).toBe('function');
  });
});

describe('db/pool - error 이벤트 핸들러', () => {
  test('pool.on 이 호출됐다', () => {
    expect(mockPoolInstance.on).toHaveBeenCalled();
  });

  test("pool.on 첫 번째 인수가 'error' 이다", () => {
    const firstCall = mockPoolInstance.on.mock.calls[0];
    expect(firstCall[0]).toBe('error');
  });

  test("pool.on 두 번째 인수가 함수이다", () => {
    const firstCall = mockPoolInstance.on.mock.calls[0];
    expect(typeof firstCall[1]).toBe('function');
  });

  test('error 핸들러가 err.message 를 console.error 로 출력한다', () => {
    const errorHandler = mockPoolInstance.on.mock.calls[0][1];
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const fakeError = new Error('connection refused');
    errorHandler(fakeError);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[db]'),
      expect.stringContaining('connection refused'),
    );
    consoleSpy.mockRestore();
  });
});
