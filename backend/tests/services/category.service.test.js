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
jest.mock('../../src/repositories/category.repository');

const categoryRepo = require('../../src/repositories/category.repository');
const categoryService = require('../../src/services/category.service');
const { formatCategory } = require('../../src/utils/format');
const { NotFoundError, ForbiddenError, ConflictError } = require('../../src/types/errors');

const USER_ID = 'user-uuid-001';
const OTHER_USER_ID = 'user-uuid-002';
const CAT_ID = 'cat-uuid-001';

const mockCategory = {
  id: CAT_ID,
  name: '테스트',
  user_id: USER_ID,
  is_default: false,
  created_at: new Date(),
};

const mockDefaultCategory = {
  id: 'cat-default-001',
  name: '일반',
  user_id: USER_ID,
  is_default: true,
  created_at: new Date(),
};

afterEach(() => jest.clearAllMocks());

// ---------------------------------------------------------------------------
// getCategories
// ---------------------------------------------------------------------------
describe('getCategories', () => {
  test('userId로 findAll 호출하고 결과 반환', async () => {
    categoryRepo.findAll.mockResolvedValue([mockDefaultCategory, mockCategory]);
    const result = await categoryService.getCategories(USER_ID);
    expect(categoryRepo.findAll).toHaveBeenCalledWith(USER_ID);
    expect(result).toHaveLength(2);
  });

  test('빈 결과도 반환', async () => {
    categoryRepo.findAll.mockResolvedValue([]);
    const result = await categoryService.getCategories(USER_ID);
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// createCategory
// ---------------------------------------------------------------------------
describe('createCategory', () => {
  test('중복 없음 → create 호출 후 반환', async () => {
    categoryRepo.findByNameAndUserId.mockResolvedValue(null);
    categoryRepo.create.mockResolvedValue(mockCategory);
    const result = await categoryService.createCategory(USER_ID, { name: '테스트' });
    expect(categoryRepo.create).toHaveBeenCalledWith({ name: '테스트', userId: USER_ID });
    expect(result).toEqual(formatCategory(mockCategory));
  });

  test('중복 이름 → ConflictError(CATEGORY_NAME_DUPLICATE)', async () => {
    categoryRepo.findByNameAndUserId.mockResolvedValue(mockCategory);
    await expect(categoryService.createCategory(USER_ID, { name: '테스트' }))
      .rejects.toBeInstanceOf(ConflictError);
  });

  test('중복 에러 코드가 CATEGORY_NAME_DUPLICATE', async () => {
    categoryRepo.findByNameAndUserId.mockResolvedValue(mockCategory);
    let err;
    try { await categoryService.createCategory(USER_ID, { name: '테스트' }); } catch (e) { err = e; }
    expect(err.code).toBe('CATEGORY_NAME_DUPLICATE');
  });
});

// ---------------------------------------------------------------------------
// updateCategory
// ---------------------------------------------------------------------------
describe('updateCategory', () => {
  test('정상 수정 → update 호출 후 반환', async () => {
    const updated = { ...mockCategory, name: '새이름' };
    categoryRepo.findById.mockResolvedValue(mockCategory);
    categoryRepo.findByNameAndUserId.mockResolvedValue(null);
    categoryRepo.update.mockResolvedValue(updated);
    const result = await categoryService.updateCategory(CAT_ID, USER_ID, { name: '새이름' });
    expect(result).toEqual(formatCategory(updated));
  });

  test('존재하지 않는 카테고리 → NotFoundError', async () => {
    categoryRepo.findById.mockResolvedValue(null);
    await expect(categoryService.updateCategory('nonexistent', USER_ID, { name: '새' }))
      .rejects.toBeInstanceOf(NotFoundError);
  });

  test('기본 카테고리 수정 시도 → ForbiddenError', async () => {
    categoryRepo.findById.mockResolvedValue(mockDefaultCategory);
    await expect(categoryService.updateCategory('cat-default-001', USER_ID, { name: '새' }))
      .rejects.toBeInstanceOf(ForbiddenError);
  });

  test('타인 카테고리 수정 시도 → ForbiddenError', async () => {
    categoryRepo.findById.mockResolvedValue({ ...mockCategory, user_id: OTHER_USER_ID });
    await expect(categoryService.updateCategory(CAT_ID, USER_ID, { name: '새' }))
      .rejects.toBeInstanceOf(ForbiddenError);
  });

  test('수정 시 같은 이름 중복 → ConflictError', async () => {
    const anotherCat = { ...mockCategory, id: 'cat-uuid-999', name: '새이름' };
    categoryRepo.findById.mockResolvedValue(mockCategory);
    categoryRepo.findByNameAndUserId.mockResolvedValue(anotherCat);
    await expect(categoryService.updateCategory(CAT_ID, USER_ID, { name: '새이름' }))
      .rejects.toBeInstanceOf(ConflictError);
  });

  test('수정 시 자기 자신과 같은 이름 → 중복 아님 (update 호출됨)', async () => {
    const sameCat = { ...mockCategory, name: '테스트' };
    categoryRepo.findById.mockResolvedValue(mockCategory);
    categoryRepo.findByNameAndUserId.mockResolvedValue(sameCat); // 자기 자신
    categoryRepo.update.mockResolvedValue(sameCat);
    const result = await categoryService.updateCategory(CAT_ID, USER_ID, { name: '테스트' });
    expect(categoryRepo.update).toHaveBeenCalled();
    expect(result).toEqual(formatCategory(sameCat));
  });
});

// ---------------------------------------------------------------------------
// deleteCategory
// ---------------------------------------------------------------------------
describe('deleteCategory', () => {
  test('정상 삭제 → deleteById 호출', async () => {
    categoryRepo.findById.mockResolvedValue(mockCategory);
    categoryRepo.countTodosByCategory.mockResolvedValue(0);
    categoryRepo.deleteById.mockResolvedValue();
    await categoryService.deleteCategory(CAT_ID, USER_ID);
    expect(categoryRepo.deleteById).toHaveBeenCalledWith(CAT_ID);
  });

  test('존재하지 않는 카테고리 → NotFoundError', async () => {
    categoryRepo.findById.mockResolvedValue(null);
    await expect(categoryService.deleteCategory('nonexistent', USER_ID))
      .rejects.toBeInstanceOf(NotFoundError);
  });

  test('기본 카테고리 삭제 시도 → ForbiddenError', async () => {
    categoryRepo.findById.mockResolvedValue(mockDefaultCategory);
    await expect(categoryService.deleteCategory('cat-default-001', USER_ID))
      .rejects.toBeInstanceOf(ForbiddenError);
  });

  test('타인 카테고리 삭제 시도 → ForbiddenError', async () => {
    categoryRepo.findById.mockResolvedValue({ ...mockCategory, user_id: OTHER_USER_ID });
    await expect(categoryService.deleteCategory(CAT_ID, USER_ID))
      .rejects.toBeInstanceOf(ForbiddenError);
  });

  test('연결된 할일 존재 → ConflictError(CATEGORY_HAS_TODOS)', async () => {
    categoryRepo.findById.mockResolvedValue(mockCategory);
    categoryRepo.countTodosByCategory.mockResolvedValue(3);
    let err;
    try { await categoryService.deleteCategory(CAT_ID, USER_ID); } catch (e) { err = e; }
    expect(err).toBeInstanceOf(ConflictError);
    expect(err.code).toBe('CATEGORY_HAS_TODOS');
  });
});
