'use strict';

const { BadRequestError } = require('../types/errors');

function validateBody(requiredFields) {
  return (req, _res, next) => {
    const missing = requiredFields.filter(
      (field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === ''
    );
    if (missing.length > 0) {
      return next(new BadRequestError(`필수 필드가 누락되었습니다: ${missing.join(', ')}`));
    }
    next();
  };
}

module.exports = { validateBody };
