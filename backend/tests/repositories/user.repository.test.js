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
  Pool: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
    connect: jest.fn(),
  })),
}));

const pool = require('../../src/db/pool');
const userRepo = require('../../src/repositories/user.repository');

describe('user.repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('이메일로 유저를 찾으면 해당 row를 반환한다', async () => {
      const fakeUser = { id: 1, email: 'test@example.com', name: 'Test' };
      pool.query.mockResolvedValueOnce({ rows: [fakeUser] });

      const result = await userRepo.findByEmail('test@example.com');

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com']
      );
      expect(result).toEqual(fakeUser);
    });

    it('이메일로 유저를 찾지 못하면 null을 반환한다', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await userRepo.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('id로 유저를 찾으면 해당 row를 반환한다', async () => {
      const fakeUser = { id: 42, email: 'user@example.com', name: 'User' };
      pool.query.mockResolvedValueOnce({ rows: [fakeUser] });

      const result = await userRepo.findById(42);

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        [42]
      );
      expect(result).toEqual(fakeUser);
    });

    it('id로 유저를 찾지 못하면 null을 반환한다', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await userRepo.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('유저를 생성하고 생성된 row를 반환한다', async () => {
      const createdUser = { id: 10, email: 'new@example.com', name: 'New User', password: 'hashed' };
      pool.query.mockResolvedValueOnce({ rows: [createdUser] });

      const result = await userRepo.create({
        email: 'new@example.com',
        name: 'New User',
        passwordHash: 'hashed',
      });

      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *',
        ['new@example.com', 'hashed', 'New User']
      );
      expect(result).toEqual(createdUser);
    });
  });

  describe('update', () => {
    it('name만 업데이트한다', async () => {
      const updatedUser = { id: 1, name: 'Updated Name', email: 'test@example.com' };
      pool.query.mockResolvedValueOnce({ rows: [updatedUser] });

      const result = await userRepo.update(1, { name: 'Updated Name' });

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        ['Updated Name', 1]
      );
      expect(result).toEqual(updatedUser);
    });

    it('passwordHash만 업데이트한다', async () => {
      const updatedUser = { id: 1, password: 'newhash', email: 'test@example.com' };
      pool.query.mockResolvedValueOnce({ rows: [updatedUser] });

      const result = await userRepo.update(1, { passwordHash: 'newhash' });

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        ['newhash', 1]
      );
      expect(result).toEqual(updatedUser);
    });

    it('name과 passwordHash를 모두 업데이트한다', async () => {
      const updatedUser = { id: 1, name: 'New Name', password: 'newhash' };
      pool.query.mockResolvedValueOnce({ rows: [updatedUser] });

      const result = await userRepo.update(1, { name: 'New Name', passwordHash: 'newhash' });

      expect(pool.query).toHaveBeenCalledWith(
        'UPDATE users SET name = $1, password = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
        ['New Name', 'newhash', 1]
      );
      expect(result).toEqual(updatedUser);
    });

    it('업데이트할 필드가 없으면 findById를 호출한다', async () => {
      const existingUser = { id: 1, name: 'Existing', email: 'test@example.com' };
      pool.query.mockResolvedValueOnce({ rows: [existingUser] });

      const result = await userRepo.update(1, {});

      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE id = $1',
        [1]
      );
      expect(result).toEqual(existingUser);
    });

    it('업데이트 결과가 없으면 null을 반환한다', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const result = await userRepo.update(999, { name: 'Ghost' });

      expect(result).toBeNull();
    });
  });
});
