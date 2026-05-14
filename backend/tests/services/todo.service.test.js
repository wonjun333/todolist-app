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
jest.mock('../../src/repositories/todo.repository');
jest.mock('../../src/repositories/category.repository');

const todoRepo = require('../../src/repositories/todo.repository');
const categoryRepo = require('../../src/repositories/category.repository');
const todoService = require('../../src/services/todo.service');
const { formatTodo } = require('../../src/utils/format');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../src/types/errors');

const USER_ID = 'user-uuid-001';
const OTHER_USER_ID = 'user-uuid-002';
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

const mockCategory = {
  id: CAT_ID,
  name: '일반',
  user_id: USER_ID,
  is_default: true,
};

afterEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// getTodos
// ---------------------------------------------------------------------------
describe('getTodos', () => {
  test('userId와 filters로 findByUserIdWithFilters 호출', async () => {
    todoRepo.findByUserIdWithFilters.mockResolvedValue([mockTodo]);
    const result = await todoService.getTodos(USER_ID, { isCompleted: false });
    expect(todoRepo.findByUserIdWithFilters).toHaveBeenCalledWith(USER_ID, { isCompleted: false });
    expect(result).toEqual([formatTodo(mockTodo)]);
  });

  test('빈 배열도 반환', async () => {
    todoRepo.findByUserIdWithFilters.mockResolvedValue([]);
    expect(await todoService.getTodos(USER_ID, {})).toEqual([]);
  });

  test('잘못된 날짜 범위 → BadRequestError', async () => {
    await expect(todoService.getTodos(USER_ID, {
      dueDateFrom: '2026-12-31',
      dueDateTo: '2026-01-01',
    })).rejects.toBeInstanceOf(BadRequestError);
  });

  test('잘못된 날짜 형식 → BadRequestError', async () => {
    await expect(todoService.getTodos(USER_ID, { dueDateFrom: '2026-99-01' }))
      .rejects.toBeInstanceOf(BadRequestError);
  });
});

// ---------------------------------------------------------------------------
// createTodo
// ---------------------------------------------------------------------------
describe('createTodo', () => {
  test('카테고리 존재 + 소유권 확인 → create 호출', async () => {
    categoryRepo.findById.mockResolvedValue(mockCategory);
    todoRepo.create.mockResolvedValue(mockTodo);
    const result = await todoService.createTodo(USER_ID, {
      title: '테스트', categoryId: CAT_ID,
    });
    expect(todoRepo.create).toHaveBeenCalled();
    expect(result).toEqual(formatTodo(mockTodo));
  });

  test('카테고리 없음 → NotFoundError', async () => {
    categoryRepo.findById.mockResolvedValue(null);
    await expect(todoService.createTodo(USER_ID, { title: '테스트', categoryId: CAT_ID }))
      .rejects.toBeInstanceOf(NotFoundError);
  });

  test('빈 제목 → BadRequestError', async () => {
    await expect(todoService.createTodo(USER_ID, { title: '   ', categoryId: CAT_ID }))
      .rejects.toBeInstanceOf(BadRequestError);
  });

  test('잘못된 dueDate → BadRequestError', async () => {
    await expect(todoService.createTodo(USER_ID, {
      title: '테스트',
      categoryId: CAT_ID,
      dueDate: '2026-13-01',
    })).rejects.toBeInstanceOf(BadRequestError);
  });

  test('타인 카테고리 사용 시도 → ForbiddenError', async () => {
    categoryRepo.findById.mockResolvedValue({ ...mockCategory, user_id: OTHER_USER_ID });
    await expect(todoService.createTodo(USER_ID, { title: '테스트', categoryId: CAT_ID }))
      .rejects.toBeInstanceOf(ForbiddenError);
  });
});

// ---------------------------------------------------------------------------
// getTodoById
// ---------------------------------------------------------------------------
describe('getTodoById', () => {
  test('자신의 할일 → 반환', async () => {
    todoRepo.findById.mockResolvedValue(mockTodo);
    expect(await todoService.getTodoById(TODO_ID, USER_ID)).toEqual(formatTodo(mockTodo));
  });

  test('없는 ID → NotFoundError', async () => {
    todoRepo.findById.mockResolvedValue(null);
    await expect(todoService.getTodoById('nonexistent', USER_ID))
      .rejects.toBeInstanceOf(NotFoundError);
  });

  test('타인 할일 → ForbiddenError', async () => {
    todoRepo.findById.mockResolvedValue({ ...mockTodo, user_id: OTHER_USER_ID });
    await expect(todoService.getTodoById(TODO_ID, USER_ID))
      .rejects.toBeInstanceOf(ForbiddenError);
  });
});

// ---------------------------------------------------------------------------
// updateTodo
// ---------------------------------------------------------------------------
describe('updateTodo', () => {
  test('소유권 확인 후 update 호출', async () => {
    const updated = { ...mockTodo, title: '새 제목' };
    todoRepo.findById.mockResolvedValue(mockTodo);
    todoRepo.update.mockResolvedValue(updated);
    const result = await todoService.updateTodo(TODO_ID, USER_ID, { title: '새 제목' });
    expect(todoRepo.update).toHaveBeenCalledWith(TODO_ID, { title: '새 제목' });
    expect(result).toEqual(formatTodo(updated));
  });

  test('없는 ID → NotFoundError', async () => {
    todoRepo.findById.mockResolvedValue(null);
    await expect(todoService.updateTodo('nonexistent', USER_ID, {}))
      .rejects.toBeInstanceOf(NotFoundError);
  });

  test('타인 할일 수정 시도 → ForbiddenError', async () => {
    todoRepo.findById.mockResolvedValue({ ...mockTodo, user_id: OTHER_USER_ID });
    await expect(todoService.updateTodo(TODO_ID, USER_ID, { title: '새' }))
      .rejects.toBeInstanceOf(ForbiddenError);
  });

  test('수정 제목이 빈 문자열이면 BadRequestError', async () => {
    await expect(todoService.updateTodo(TODO_ID, USER_ID, { title: '  ' }))
      .rejects.toBeInstanceOf(BadRequestError);
  });

  test('카테고리 변경 시 새 카테고리 소유권 확인 후 update 호출', async () => {
    const updated = { ...mockTodo, category_id: CAT_ID };
    todoRepo.findById.mockResolvedValue(mockTodo);
    categoryRepo.findById.mockResolvedValue(mockCategory);
    todoRepo.update.mockResolvedValue(updated);

    await todoService.updateTodo(TODO_ID, USER_ID, { categoryId: CAT_ID });

    expect(categoryRepo.findById).toHaveBeenCalledWith(CAT_ID);
    expect(todoRepo.update).toHaveBeenCalledWith(TODO_ID, { categoryId: CAT_ID });
  });

  test('카테고리 변경 시 없는 카테고리면 NotFoundError', async () => {
    todoRepo.findById.mockResolvedValue(mockTodo);
    categoryRepo.findById.mockResolvedValue(null);

    await expect(todoService.updateTodo(TODO_ID, USER_ID, { categoryId: CAT_ID }))
      .rejects.toBeInstanceOf(NotFoundError);
  });

  test('카테고리 변경 시 타인 카테고리면 ForbiddenError', async () => {
    todoRepo.findById.mockResolvedValue(mockTodo);
    categoryRepo.findById.mockResolvedValue({ ...mockCategory, user_id: OTHER_USER_ID });

    await expect(todoService.updateTodo(TODO_ID, USER_ID, { categoryId: CAT_ID }))
      .rejects.toBeInstanceOf(ForbiddenError);
  });
});

// ---------------------------------------------------------------------------
// deleteTodo
// ---------------------------------------------------------------------------
describe('deleteTodo', () => {
  test('소유권 확인 후 deleteById 호출', async () => {
    todoRepo.findById.mockResolvedValue(mockTodo);
    todoRepo.deleteById.mockResolvedValue();
    await todoService.deleteTodo(TODO_ID, USER_ID);
    expect(todoRepo.deleteById).toHaveBeenCalledWith(TODO_ID);
  });

  test('없는 ID → NotFoundError', async () => {
    todoRepo.findById.mockResolvedValue(null);
    await expect(todoService.deleteTodo('nonexistent', USER_ID))
      .rejects.toBeInstanceOf(NotFoundError);
  });

  test('타인 할일 삭제 시도 → ForbiddenError', async () => {
    todoRepo.findById.mockResolvedValue({ ...mockTodo, user_id: OTHER_USER_ID });
    await expect(todoService.deleteTodo(TODO_ID, USER_ID))
      .rejects.toBeInstanceOf(ForbiddenError);
  });
});

// ---------------------------------------------------------------------------
// completeTodo
// ---------------------------------------------------------------------------
describe('completeTodo', () => {
  test('소유권 확인 후 complete 호출, 토글된 값을 반환', async () => {
    const completed = { ...mockTodo, is_completed: true };
    todoRepo.findById.mockResolvedValue(mockTodo);
    todoRepo.complete.mockResolvedValue(completed);
    const result = await todoService.completeTodo(TODO_ID, USER_ID);
    expect(todoRepo.complete).toHaveBeenCalledWith(TODO_ID);
    expect(result.isCompleted).toBe(true);
  });

  test('없는 ID → NotFoundError', async () => {
    todoRepo.findById.mockResolvedValue(null);
    await expect(todoService.completeTodo('nonexistent', USER_ID))
      .rejects.toBeInstanceOf(NotFoundError);
  });

  test('타인 할일 완료 시도 → ForbiddenError', async () => {
    todoRepo.findById.mockResolvedValue({ ...mockTodo, user_id: OTHER_USER_ID });
    await expect(todoService.completeTodo(TODO_ID, USER_ID))
      .rejects.toBeInstanceOf(ForbiddenError);
  });
});
