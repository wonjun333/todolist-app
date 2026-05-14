'use strict';

const userRepo = require('../repositories/user.repository');
const categoryRepo = require('../repositories/category.repository');
const { hashPassword, comparePassword } = require('../utils/password');
const { createToken } = require('../utils/jwt');
const { formatUser } = require('../utils/format');
const { ConflictError, UnauthorizedError } = require('../types/errors');

async function register({ email, name, password }) {
  console.log(`[auth.service] 회원가입 시도 email=${email}`);
  const existing = await userRepo.findByEmail(email);
  if (existing) {
    console.warn(`[auth.service] 이메일 중복 email=${email}`);
    throw new ConflictError('이미 사용 중인 이메일입니다.', 'EMAIL_DUPLICATE');
  }
  const passwordHash = await hashPassword(password);
  const user = await userRepo.create({ email, name, passwordHash });
  await categoryRepo.createDefaultCategories(user.id);
  console.log(`[auth.service] 회원가입 완료 userId=${user.id}`);
  return formatUser(user);
}

async function login({ email, password }) {
  console.log(`[auth.service] 로그인 시도 email=${email}`);
  const user = await userRepo.findByEmail(email);
  if (!user) {
    console.warn(`[auth.service] 로그인 실패 - 사용자 없음 email=${email}`);
    throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.');
  }
  const valid = await comparePassword(password, user.password);
  if (!valid) {
    console.warn(`[auth.service] 로그인 실패 - 비밀번호 불일치 email=${email}`);
    throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.');
  }
  const token = createToken({ userId: user.id, email: user.email });
  console.log(`[auth.service] 로그인 성공 userId=${user.id}`);
  return { accessToken: token };
}

module.exports = { register, login };
