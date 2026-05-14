'use strict';

const {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
} = require('../../src/types/errors');

describe('AppError', () => {
  test('message, status, code를 올바르게 저장한다', () => {
    const err = new AppError('테스트', 422, 'TEST_CODE');
    expect(err.message).toBe('테스트');
    expect(err.status).toBe(422);
    expect(err.code).toBe('TEST_CODE');
  });

  test('instanceof Error이다', () => {
    expect(new AppError('msg', 500, 'CODE')).toBeInstanceOf(Error);
  });

  test('name이 클래스명과 같다', () => {
    expect(new AppError('msg', 500, 'CODE').name).toBe('AppError');
  });
});

describe('BadRequestError', () => {
  test('status가 400이다', () => {
    expect(new BadRequestError().status).toBe(400);
  });

  test('code가 BAD_REQUEST이다', () => {
    expect(new BadRequestError().code).toBe('BAD_REQUEST');
  });

  test('기본 메시지가 있다', () => {
    expect(new BadRequestError().message).toBeTruthy();
  });

  test('커스텀 메시지를 지원한다', () => {
    expect(new BadRequestError('커스텀').message).toBe('커스텀');
  });

  test('instanceof AppError이다', () => {
    expect(new BadRequestError()).toBeInstanceOf(AppError);
  });
});

describe('UnauthorizedError', () => {
  test('status가 401이다', () => {
    expect(new UnauthorizedError().status).toBe(401);
  });

  test('code가 UNAUTHORIZED이다', () => {
    expect(new UnauthorizedError().code).toBe('UNAUTHORIZED');
  });

  test('커스텀 메시지를 지원한다', () => {
    expect(new UnauthorizedError('토큰 없음').message).toBe('토큰 없음');
  });
});

describe('ForbiddenError', () => {
  test('status가 403이다', () => {
    expect(new ForbiddenError().status).toBe(403);
  });

  test('code가 FORBIDDEN이다', () => {
    expect(new ForbiddenError().code).toBe('FORBIDDEN');
  });
});

describe('NotFoundError', () => {
  test('status가 404이다', () => {
    expect(new NotFoundError().status).toBe(404);
  });

  test('code가 NOT_FOUND이다', () => {
    expect(new NotFoundError().code).toBe('NOT_FOUND');
  });

  test('커스텀 메시지를 지원한다', () => {
    expect(new NotFoundError('없음').message).toBe('없음');
  });
});

describe('ConflictError', () => {
  test('status가 409이다', () => {
    expect(new ConflictError().status).toBe(409);
  });

  test('기본 code가 CONFLICT이다', () => {
    expect(new ConflictError().code).toBe('CONFLICT');
  });

  test('커스텀 code를 지원한다', () => {
    expect(new ConflictError('중복', 'EMAIL_DUPLICATE').code).toBe('EMAIL_DUPLICATE');
  });
});
