'use strict';

/**
 * tests/config/env.test.js
 *
 * env.js 는 모듈 로드 시점에 process.exit()을 호출할 수 있으므로
 * "누락 키" / "JWT_SECRET 길이 부족" 시나리오는 child_process.spawnSync 로
 * 별도 Node 프로세스에서 실행하여 테스트합니다.
 *
 * 정상 로드 시나리오는 테스트 프로세스 자체에 환경 변수를 세팅한 뒤
 * jest.resetModules() 로 모듈 캐시를 비워 재로드합니다.
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ---------------------------------------------------------------------------
// 헬퍼: 최소 유효 환경 변수 세트
// ---------------------------------------------------------------------------
const VALID_ENV = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_NAME: 'testdb',
  DB_USER: 'testuser',
  DB_PASSWORD: 'testpass',
  JWT_SECRET: 'a_32_char_minimum_secret_string!',  // 정확히 32자
  JWT_EXPIRES_IN: '1h',
  BCRYPT_SALT_ROUNDS: '10',
  NODE_ENV: 'test',
  PORT: '4000',
  CORS_ORIGIN: 'http://localhost:3000',
};

/**
 * process.env 에 VALID_ENV 를 적용한 뒤 env.js 를 새로 로드합니다.
 * dotenv 는 mock 처리하여 .env 파일이 변수를 덮어쓰지 않게 합니다.
 */
function loadEnvFresh(overrides = {}) {
  const merged = { ...VALID_ENV, ...overrides };

  // 기존 값 백업
  const allKeys = [...new Set([...Object.keys(VALID_ENV), ...Object.keys(overrides)])];
  const backup = {};
  allKeys.forEach((k) => { backup[k] = process.env[k]; });

  // 주입 또는 제거
  Object.entries(merged).forEach(([k, v]) => {
    if (v === undefined) { delete process.env[k]; }
    else { process.env[k] = v; }
  });

  // 모듈 캐시 제거
  jest.resetModules();
  // dotenv 가 .env 파일을 읽어 기존 변수를 덮어쓰지 못하도록 mock
  jest.mock('dotenv', () => ({ config: jest.fn() }));
  const env = require('../../src/config/env');

  // 환경 변수 복원
  allKeys.forEach((k) => {
    if (backup[k] === undefined) { delete process.env[k]; }
    else { process.env[k] = backup[k]; }
  });

  return env;
}

// ---------------------------------------------------------------------------
// 1. 정상 로드
// ---------------------------------------------------------------------------
describe('env - 정상 로드', () => {
  let env;

  beforeAll(() => {
    env = loadEnvFresh();
  });

  afterAll(() => {
    jest.unmock('dotenv');
    jest.resetModules();
  });

  test('모듈이 객체를 export 한다', () => {
    expect(env).toBeDefined();
    expect(typeof env).toBe('object');
  });

  test('nodeEnv 는 문자열이다', () => {
    expect(typeof env.nodeEnv).toBe('string');
    expect(env.nodeEnv).toBe('test');
  });

  test('port 는 정수(number)이다', () => {
    expect(typeof env.port).toBe('number');
    expect(Number.isInteger(env.port)).toBe(true);
    expect(env.port).toBe(4000);
  });

  test('port 는 양수이다', () => {
    expect(env.port).toBeGreaterThan(0);
  });

  test('bcryptSaltRounds 는 정수(number)이다', () => {
    expect(typeof env.bcryptSaltRounds).toBe('number');
    expect(Number.isInteger(env.bcryptSaltRounds)).toBe(true);
    expect(env.bcryptSaltRounds).toBe(10);
  });

  // db 객체 검증
  describe('db 객체', () => {
    test('host 필드가 존재하고 문자열이다', () => {
      expect(env.db).toBeDefined();
      expect(typeof env.db.host).toBe('string');
      expect(env.db.host).toBe('localhost');
    });

    test('port 필드가 정수이다', () => {
      expect(typeof env.db.port).toBe('number');
      expect(Number.isInteger(env.db.port)).toBe(true);
      expect(env.db.port).toBe(5432);
    });

    test('name 필드가 존재한다', () => {
      expect(typeof env.db.name).toBe('string');
      expect(env.db.name).toBe('testdb');
    });

    test('user 필드가 존재한다', () => {
      expect(typeof env.db.user).toBe('string');
      expect(env.db.user).toBe('testuser');
    });

    test('password 필드가 존재한다', () => {
      expect(typeof env.db.password).toBe('string');
      expect(env.db.password).toBe('testpass');
    });
  });

  // jwt 객체 검증
  describe('jwt 객체', () => {
    test('secret 이 존재한다', () => {
      expect(env.jwt).toBeDefined();
      expect(typeof env.jwt.secret).toBe('string');
    });

    test('secret 길이가 32자 이상이다', () => {
      expect(env.jwt.secret.length).toBeGreaterThanOrEqual(32);
    });

    test('expiresIn 이 존재한다', () => {
      expect(typeof env.jwt.expiresIn).toBe('string');
      expect(env.jwt.expiresIn).toBe('1h');
    });
  });

  // corsOrigin
  test('corsOrigin 이 문자열이다', () => {
    expect(typeof env.corsOrigin).toBe('string');
    expect(env.corsOrigin).toBe('http://localhost:3000');
  });
});

// ---------------------------------------------------------------------------
// 2. PORT / CORS_ORIGIN / NODE_ENV 기본값 폴백
// ---------------------------------------------------------------------------
describe('env - 기본값 폴백', () => {
  afterEach(() => {
    jest.unmock('dotenv');
    jest.resetModules();
  });

  test('PORT 미설정이면 port 는 3000이다', () => {
    const env = loadEnvFresh({ PORT: undefined });
    expect(env.port).toBe(3000);
  });

  test('CORS_ORIGIN 미설정이면 corsOrigin 은 http://localhost:5173이다', () => {
    const env = loadEnvFresh({ CORS_ORIGIN: undefined });
    expect(env.corsOrigin).toBe('http://localhost:5173');
  });

  test('NODE_ENV 미설정이면 nodeEnv 는 development이다', () => {
    const env = loadEnvFresh({ NODE_ENV: undefined });
    expect(env.nodeEnv).toBe('development');
  });
});

// ---------------------------------------------------------------------------
// 3. 필수 환경 변수 누락 / JWT_SECRET 길이 부족 → process.exit(1)
//    별도 node 프로세스에서 검증합니다.
//
//    Windows 경로의 백슬래시 이스케이프 문제를 피하기 위해
//    임시 .js 파일을 작성하여 node 로 실행합니다.
// ---------------------------------------------------------------------------
describe('env - 필수 환경 변수 누락 시 종료', () => {
  const envJsPath = path.resolve(__dirname, '../../src/config/env.js');

  /**
   * 지정한 envVars 만 있는 격리 환경으로 env.js 를 require 하는
   * 임시 스크립트를 실행합니다.
   * dotenv 도 no-op 으로 대체하여 .env 파일이 변수를 채우지 못하게 합니다.
   */
  function runInIsolatedProcess(envVars) {
    // 임시 스크립트를 tests/ 디렉토리 안에 작성합니다.
    // (os.tmpdir() 에 두면 node_modules 를 찾지 못하므로 프로젝트 내부 사용)
    const tmpScript = path.join(
      __dirname,
      `_tmp_env_${Date.now()}_${Math.random().toString(36).slice(2)}.js`,
    );
    const scriptContent = [
      "'use strict';",
      // dotenv.config 를 no-op 으로 덮어씌워 .env 파일이 변수를 채우지 못하게 함
      "const dotenv = require('dotenv'); dotenv.config = function(){ return {}; };",
      `require(${JSON.stringify(envJsPath)});`,
    ].join('\n');

    fs.writeFileSync(tmpScript, scriptContent, 'utf8');

    // 최소 환경 (PATH 만 상속, 나머지는 envVars 에서 제공)
    const minimalEnv = {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      COMSPEC: process.env.COMSPEC,
    };

    try {
      const result = spawnSync(process.execPath, [tmpScript], {
        timeout: 8000,
        env: { ...minimalEnv, ...envVars },
      });
      return { exitCode: result.status ?? 1, stderr: result.stderr?.toString() };
    } finally {
      try { fs.unlinkSync(tmpScript); } catch (_) { /* 무시 */ }
    }
  }

  test('DB_HOST 누락 시 exitCode 1 로 종료한다', () => {
    const { DB_HOST: _r, ...envVars } = VALID_ENV;
    expect(runInIsolatedProcess(envVars).exitCode).toBe(1);
  });

  test('JWT_SECRET 누락 시 exitCode 1 로 종료한다', () => {
    const { JWT_SECRET: _r, ...envVars } = VALID_ENV;
    expect(runInIsolatedProcess(envVars).exitCode).toBe(1);
  });

  test('BCRYPT_SALT_ROUNDS 누락 시 exitCode 1 로 종료한다', () => {
    const { BCRYPT_SALT_ROUNDS: _r, ...envVars } = VALID_ENV;
    expect(runInIsolatedProcess(envVars).exitCode).toBe(1);
  });

  test('DB_USER 누락 시 exitCode 1 로 종료한다', () => {
    const { DB_USER: _r, ...envVars } = VALID_ENV;
    expect(runInIsolatedProcess(envVars).exitCode).toBe(1);
  });

  test('DB_PASSWORD 누락 시 exitCode 1 로 종료한다', () => {
    const { DB_PASSWORD: _r, ...envVars } = VALID_ENV;
    expect(runInIsolatedProcess(envVars).exitCode).toBe(1);
  });

  test('JWT_SECRET 이 32자 미만이면 exitCode 1 로 종료한다', () => {
    const result = runInIsolatedProcess({
      ...VALID_ENV,
      JWT_SECRET: 'short_secret',   // 12자 — 32자 미만
    });
    expect(result.exitCode).toBe(1);
  });

  test('모든 필수 변수가 있고 JWT_SECRET 이 32자 이상이면 exitCode 0 이다', () => {
    expect(runInIsolatedProcess(VALID_ENV).exitCode).toBe(0);
  });
});
