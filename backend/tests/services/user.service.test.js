'use strict';

process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'testdb';
process.env.DB_USER = 'testuser';
process.env.DB_PASSWORD = 'testpass';
process.env.JWT_SECRET = 'a_32_char_minimum_secret_string!!';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_SALT_ROUNDS = '10';

jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({ on: jest.fn(), query: jest.fn() })),
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$newhash'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/repositories/user.repository');

const userRepo = require('../../src/repositories/user.repository');
const userService = require('../../src/services/user.service');
const { NotFoundError } = require('../../src/types/errors');

const mockUser = {
  id: 'user-uuid-001',
  email: 'test@example.com',
  name: '홍길동',
  password_hash: '$2a$10$hashedpassword',
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-01'),
};

afterEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// getProfile
// ---------------------------------------------------------------------------
describe('getProfile', () => {
  test('사용자 존재 → password_hash 제외한 프로필 반환', async () => {
    userRepo.findById.mockResolvedValue(mockUser);
    const profile = await userService.getProfile('user-uuid-001');
    expect(profile).not.toHaveProperty('password_hash');
    expect(profile.id).toBe('user-uuid-001');
    expect(profile.email).toBe('test@example.com');
    expect(profile.name).toBe('홍길동');
  });

  test('사용자 없음 → NotFoundError 던짐', async () => {
    userRepo.findById.mockResolvedValue(null);
    await expect(userService.getProfile('nonexistent')).rejects.toBeInstanceOf(NotFoundError);
  });

  test('findById에 올바른 userId 전달', async () => {
    userRepo.findById.mockResolvedValue(mockUser);
    await userService.getProfile('user-uuid-001');
    expect(userRepo.findById).toHaveBeenCalledWith('user-uuid-001');
  });
});

// ---------------------------------------------------------------------------
// updateProfile
// ---------------------------------------------------------------------------
describe('updateProfile', () => {
  test('이름만 변경 → password_hash 제외한 업데이트 결과 반환', async () => {
    const updated = { ...mockUser, name: '새이름' };
    userRepo.update.mockResolvedValue(updated);
    const profile = await userService.updateProfile('user-uuid-001', { name: '새이름' });
    expect(profile.name).toBe('새이름');
    expect(profile).not.toHaveProperty('password_hash');
  });

  test('비밀번호 변경 → hashPassword 호출 후 update에 passwordHash 전달', async () => {
    const updated = { ...mockUser, password_hash: '$2a$10$newhash' };
    userRepo.update.mockResolvedValue(updated);
    const profile = await userService.updateProfile('user-uuid-001', { newPassword: 'newpass123' });
    expect(userRepo.update).toHaveBeenCalledWith(
      'user-uuid-001',
      expect.objectContaining({ passwordHash: '$2a$10$newhash' })
    );
    expect(profile).not.toHaveProperty('password_hash');
  });

  test('이름 + 비밀번호 동시 변경', async () => {
    const updated = { ...mockUser, name: '동시변경', password_hash: '$2a$10$newhash' };
    userRepo.update.mockResolvedValue(updated);
    const profile = await userService.updateProfile('user-uuid-001', {
      name: '동시변경',
      newPassword: 'newpass123',
    });
    expect(profile.name).toBe('동시변경');
    expect(userRepo.update).toHaveBeenCalledWith(
      'user-uuid-001',
      expect.objectContaining({ name: '동시변경', passwordHash: '$2a$10$newhash' })
    );
  });

  test('변경 항목 없음 → update 호출 (빈 updates)', async () => {
    userRepo.update.mockResolvedValue(mockUser);
    const profile = await userService.updateProfile('user-uuid-001', {});
    expect(profile).not.toHaveProperty('password_hash');
  });

  test('사용자 없음(update null 반환) → NotFoundError 던짐', async () => {
    userRepo.update.mockResolvedValue(null);
    await expect(
      userService.updateProfile('nonexistent', { name: '없음' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
