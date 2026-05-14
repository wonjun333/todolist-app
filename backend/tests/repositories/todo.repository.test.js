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

const pool = require('../../src/db/pool');
const todoRepo = require('../../src/repositories/todo.repository');

const USER_ID = 'user-uuid-001';
const TODO_ID = 'todo-uuid-001';
const CAT_ID = 'cat-uuid-001';

const mockTodo = {
  id: TODO_ID,
  user_id: USER_ID,
  category_id: CAT_ID,
  title: '테스트 할일',
  description: '설명',
  due_date: null,
  is_completed: false,
  created_at: new Date(),
  updated_at: new Date(),
};

afterEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// findByUserIdWithFilters
// ---------------------------------------------------------------------------
describe('findByUserIdWithFilters', () => {
  test('기본 조건(userId만) → ORDER BY created_at DESC 쿼리', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [mockTodo] });
    const result = await todoRepo.findByUserIdWithFilters(USER_ID);
    expect(pool.query).toHaveBeenCalledTimes(1);
    const [sql, values] = pool.query.mock.calls[0];
    expect(sql).toContain('user_id = $1');
    expect(sql).toContain('ORDER BY created_at DESC');
    expect(values[0]).toBe(USER_ID);
    expect(result).toEqual([mockTodo]);
  });

  test('categoryId 필터 포함 → SQL에 category_id 조건 추가', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    await todoRepo.findByUserIdWithFilters(USER_ID, { categoryId: CAT_ID });
    const [sql, values] = pool.query.mock.calls[0];
    expect(sql).toContain('category_id = $2');
    expect(values).toContain(CAT_ID);
  });

  test('dueDateFrom/dueDateTo 필터', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    await todoRepo.findByUserIdWithFilters(USER_ID, { dueDateFrom: '2026-01-01', dueDateTo: '2026-12-31' });
    const [sql, values] = pool.query.mock.calls[0];
    expect(sql).toContain('due_date >= $');
    expect(sql).toContain('due_date <= $');
    expect(values).toContain('2026-01-01');
    expect(values).toContain('2026-12-31');
  });

  test('isCompleted 필터', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    await todoRepo.findByUserIdWithFilters(USER_ID, { isCompleted: true });
    const [sql, values] = pool.query.mock.calls[0];
    expect(sql).toContain('is_completed = $');
    expect(values).toContain(true);
  });

  test('복합 필터 - 모든 조건 포함', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    await todoRepo.findByUserIdWithFilters(USER_ID, {
      categoryId: CAT_ID,
      dueDateFrom: '2026-01-01',
      dueDateTo: '2026-12-31',
      isCompleted: false,
    });
    const [sql, values] = pool.query.mock.calls[0];
    expect(values).toHaveLength(5); // userId + 4 filters
  });
});

// ---------------------------------------------------------------------------
// findById
// ---------------------------------------------------------------------------
describe('findById', () => {
  test('존재하면 행 반환', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [mockTodo] });
    expect(await todoRepo.findById(TODO_ID)).toEqual(mockTodo);
  });

  test('없으면 null 반환', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    expect(await todoRepo.findById('nonexistent')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// create
// ---------------------------------------------------------------------------
describe('create', () => {
  test('모든 필드로 INSERT하고 반환', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [mockTodo] });
    const result = await todoRepo.create({
      userId: USER_ID,
      categoryId: CAT_ID,
      title: '테스트 할일',
      description: '설명',
      dueDate: '2026-12-31',
    });
    const values = pool.query.mock.calls[0][1];
    expect(values[0]).toBe(USER_ID);
    expect(values[1]).toBe(CAT_ID);
    expect(values[2]).toBe('테스트 할일');
    expect(result).toEqual(mockTodo);
  });

  test('description/dueDate 없으면 null로 INSERT', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [mockTodo] });
    await todoRepo.create({ userId: USER_ID, categoryId: CAT_ID, title: '제목' });
    const values = pool.query.mock.calls[0][1];
    expect(values[3]).toBeNull(); // description
    expect(values[4]).toBeNull(); // dueDate
  });
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------
describe('update', () => {
  test('title만 UPDATE', async () => {
    const updated = { ...mockTodo, title: '새 제목' };
    pool.query = jest.fn().mockResolvedValue({ rows: [updated] });
    const result = await todoRepo.update(TODO_ID, { title: '새 제목' });
    const [sql] = pool.query.mock.calls[0];
    expect(sql).toContain('title = $1');
    expect(result).toEqual(updated);
  });

  test('변경 항목 없으면 findById 위임', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [mockTodo] });
    const result = await todoRepo.update(TODO_ID, {});
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [TODO_ID]);
    expect(result).toEqual(mockTodo);
  });

  test('없는 ID → null 반환', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    expect(await todoRepo.update('nonexistent', { title: '제목' })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// complete
// ---------------------------------------------------------------------------
describe('complete', () => {
  test('is_completed 값을 토글하고 반환', async () => {
    const completed = { ...mockTodo, is_completed: true };
    pool.query = jest.fn().mockResolvedValue({ rows: [completed] });
    const result = await todoRepo.complete(TODO_ID);
    const [sql, values] = pool.query.mock.calls[0];
    expect(sql).toContain('is_completed = NOT is_completed');
    expect(values[0]).toBe(TODO_ID);
    expect(result.is_completed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// deleteById
// ---------------------------------------------------------------------------
describe('deleteById', () => {
  test('id로 DELETE 쿼리 실행', async () => {
    pool.query = jest.fn().mockResolvedValue({ rows: [] });
    await todoRepo.deleteById(TODO_ID);
    expect(pool.query).toHaveBeenCalledWith(expect.any(String), [TODO_ID]);
  });
});
