'use strict';

const { verifyToken } = require('../utils/jwt');
const { UnauthorizedError } = require('../types/errors');

function authenticate(req, _res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('인증 토큰이 필요합니다.'));
  }

  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    req.userEmail = payload.email;
    console.log(`[auth] 인증 성공 userId=${payload.userId}`);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      console.warn('[auth] 토큰 만료');
      return next(new UnauthorizedError('토큰이 만료되었습니다.'));
    }
    console.warn('[auth] 유효하지 않은 토큰');
    return next(new UnauthorizedError('유효하지 않은 토큰입니다.'));
  }
}

module.exports = authenticate;
