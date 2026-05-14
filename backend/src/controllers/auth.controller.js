'use strict';

const authService = require('../services/auth.service');

async function register(req, res, next) {
  try {
    const { email, name, password } = req.body;
    const result = await authService.register({ email, name, password });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
