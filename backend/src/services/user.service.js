'use strict';

const userRepo = require('../repositories/user.repository');
const { hashPassword } = require('../utils/password');
const { formatUser } = require('../utils/format');
const { NotFoundError } = require('../types/errors');

async function getProfile(userId) {
  console.log(`[user.service] 프로필 조회 userId=${userId}`);
  const user = await userRepo.findById(userId);
  if (!user) throw new NotFoundError('사용자를 찾을 수 없습니다.');
  return formatUser(user);
}

async function updateProfile(userId, { name, newPassword }) {
  console.log(`[user.service] 프로필 수정 userId=${userId} fields=${[name !== undefined && 'name', newPassword !== undefined && 'password'].filter(Boolean).join(',')}`);
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (newPassword !== undefined) updates.passwordHash = await hashPassword(newPassword);
  const user = await userRepo.update(userId, updates);
  if (!user) throw new NotFoundError('사용자를 찾을 수 없습니다.');
  console.log(`[user.service] 프로필 수정 완료 userId=${userId}`);
  return formatUser(user);
}

module.exports = { getProfile, updateProfile };
