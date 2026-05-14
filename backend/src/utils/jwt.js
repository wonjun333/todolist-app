'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

function createToken(payload) {
  return jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret);
}

module.exports = { createToken, verifyToken };
