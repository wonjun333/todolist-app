'use strict';

const { AppError } = require('../types/errors');
const env = require('../config/env');

function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    console.warn(`[error] ${err.status} ${err.code} - ${err.message}`);
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }

  // PostgreSQL: invalid UUID format (22P02)
  if (err.code === '22P02') {
    console.warn('[error] 400 BAD_REQUEST - 유효하지 않은 ID 형식');
    return res.status(400).json({
      error: { code: 'BAD_REQUEST', message: '유효하지 않은 ID 형식입니다.' },
    });
  }

  const isProduction = env.nodeEnv === 'production';
  console.error('[error]', err);

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction ? '서버 오류가 발생했습니다.' : err.message,
    },
  });
}

module.exports = errorHandler;
