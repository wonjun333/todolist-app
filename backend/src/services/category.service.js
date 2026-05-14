'use strict';

const categoryRepo = require('../repositories/category.repository');
const { formatCategory } = require('../utils/format');
const { NotFoundError, ForbiddenError, ConflictError } = require('../types/errors');

async function getCategories(userId) {
  console.log(`[category.service] 카테고리 목록 조회 userId=${userId}`);
  const rows = await categoryRepo.findAll(userId);
  return rows.map(formatCategory);
}

async function createCategory(userId, { name }) {
  console.log(`[category.service] 카테고리 생성 시도 userId=${userId} name=${name}`);
  const existing = await categoryRepo.findByNameAndUserId(name, userId);
  if (existing) {
    console.warn(`[category.service] 카테고리명 중복 userId=${userId} name=${name}`);
    throw new ConflictError('이미 사용 중인 카테고리명입니다.', 'CATEGORY_NAME_DUPLICATE');
  }
  const result = await categoryRepo.create({ name, userId });
  console.log(`[category.service] 카테고리 생성 완료 categoryId=${result.id}`);
  return formatCategory(result);
}

async function updateCategory(categoryId, userId, { name }) {
  console.log(`[category.service] 카테고리 수정 시도 categoryId=${categoryId} userId=${userId}`);
  const category = await categoryRepo.findById(categoryId);
  if (!category) throw new NotFoundError('카테고리를 찾을 수 없습니다.');
  if (category.is_default) throw new ForbiddenError('기본 카테고리는 수정할 수 없습니다.');
  if (category.user_id !== userId) throw new ForbiddenError('접근 권한이 없습니다.');
  const existing = await categoryRepo.findByNameAndUserId(name, userId);
  if (existing && existing.id !== categoryId) {
    throw new ConflictError('이미 사용 중인 카테고리명입니다.', 'CATEGORY_NAME_DUPLICATE');
  }
  const result = await categoryRepo.update(categoryId, { name });
  console.log(`[category.service] 카테고리 수정 완료 categoryId=${categoryId}`);
  return formatCategory(result);
}

async function deleteCategory(categoryId, userId) {
  console.log(`[category.service] 카테고리 삭제 시도 categoryId=${categoryId} userId=${userId}`);
  const category = await categoryRepo.findById(categoryId);
  if (!category) throw new NotFoundError('카테고리를 찾을 수 없습니다.');
  if (category.is_default) throw new ForbiddenError('기본 카테고리는 삭제할 수 없습니다.');
  if (category.user_id !== userId) throw new ForbiddenError('접근 권한이 없습니다.');
  const count = await categoryRepo.countTodosByCategory(categoryId);
  if (count > 0) {
    console.warn(`[category.service] 카테고리 삭제 불가 - 연결된 할일 존재 categoryId=${categoryId} count=${count}`);
    throw new ConflictError(
      '연결된 할일이 있어 삭제할 수 없습니다. 할일을 다른 카테고리로 이동하거나 먼저 삭제하세요.',
      'CATEGORY_HAS_TODOS'
    );
  }
  await categoryRepo.deleteById(categoryId);
  console.log(`[category.service] 카테고리 삭제 완료 categoryId=${categoryId}`);
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
