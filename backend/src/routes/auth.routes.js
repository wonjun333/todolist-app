'use strict';

const express = require('express');
const router = express.Router();
const { validateBody } = require('../middlewares/validate');
const authController = require('../controllers/auth.controller');

router.post('/register', validateBody(['email', 'name', 'password']), authController.register);
router.post('/login', validateBody(['email', 'password']), authController.login);

module.exports = router;
