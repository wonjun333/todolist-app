'use strict';

const userService = require('../services/user.service');

async function getProfile(req, res, next) {
  try {
    const profile = await userService.getProfile(req.userId);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, newPassword } = req.body;
    const profile = await userService.updateProfile(req.userId, { name, newPassword });
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile };
