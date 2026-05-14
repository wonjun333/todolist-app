'use strict';

const todoRepo = require('../repositories/todo.repository');
const categoryRepo = require('../repositories/category.repository');
const { formatTodo } = require('../utils/format');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../types/errors');

function validateDate(value, fieldName) {
  if (value === undefined || value === null || value === '') return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestError(`${fieldName}는 YYYY-MM-DD 형식이어야 합니다.`);
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new BadRequestError(`${fieldName}는 유효한 날짜여야 합니다.`);
  }
}

function validateTitle(title) {
  if (title !== undefined && String(title).trim() === '') {
    throw new BadRequestError('제목은 필수 항목입니다.');
  }
}

async function getTodos(userId, filters) {
  console.log(`[todo.service] 할일 목록 조회 userId=${userId} filters=${JSON.stringify(filters)}`);
  validateDate(filters?.dueDateFrom, 'dueDateFrom');
  validateDate(filters?.dueDateTo, 'dueDateTo');
  if (filters?.dueDateFrom && filters?.dueDateTo && filters.dueDateFrom > filters.dueDateTo) {
    throw new BadRequestError('시작일은 종료일보다 늦을 수 없습니다.');
  }
  const rows = await todoRepo.findByUserIdWithFilters(userId, filters);
  return rows.map(formatTodo);
}

async function createTodo(userId, { title, categoryId, description, dueDate }) {
  console.log(`[todo.service] 할일 생성 시도 userId=${userId} categoryId=${categoryId}`);
  validateTitle(title);
  validateDate(dueDate, 'dueDate');
  const category = await categoryRepo.findById(categoryId);
  if (!category) throw new NotFoundError('카테고리를 찾을 수 없습니다.');
  if (category.user_id !== userId) throw new ForbiddenError('접근 권한이 없습니다.');
  const result = await todoRepo.create({ userId, categoryId, title, description, dueDate });
  console.log(`[todo.service] 할일 생성 완료 todoId=${result.id}`);
  return formatTodo(result);
}

async function getTodoById(todoId, userId) {
  console.log(`[todo.service] 할일 단건 조회 todoId=${todoId} userId=${userId}`);
  const todo = await todoRepo.findById(todoId);
  if (!todo) throw new NotFoundError('할일을 찾을 수 없습니다.');
  if (todo.user_id !== userId) throw new ForbiddenError('접근 권한이 없습니다.');
  return formatTodo(todo);
}

async function updateTodo(todoId, userId, updates) {
  console.log(`[todo.service] 할일 수정 시도 todoId=${todoId} userId=${userId}`);
  validateTitle(updates.title);
  validateDate(updates.dueDate, 'dueDate');
  const todo = await todoRepo.findById(todoId);
  if (!todo) throw new NotFoundError('할일을 찾을 수 없습니다.');
  if (todo.user_id !== userId) throw new ForbiddenError('접근 권한이 없습니다.');

  if (updates.categoryId !== undefined) {
    const category = await categoryRepo.findById(updates.categoryId);
    if (!category) throw new NotFoundError('카테고리를 찾을 수 없습니다.');
    if (category.user_id !== userId) throw new ForbiddenError('접근 권한이 없습니다.');
  }

  const result = await todoRepo.update(todoId, updates);
  console.log(`[todo.service] 할일 수정 완료 todoId=${todoId}`);
  return formatTodo(result);
}

async function deleteTodo(todoId, userId) {
  console.log(`[todo.service] 할일 삭제 시도 todoId=${todoId} userId=${userId}`);
  const todo = await todoRepo.findById(todoId);
  if (!todo) throw new NotFoundError('할일을 찾을 수 없습니다.');
  if (todo.user_id !== userId) throw new ForbiddenError('접근 권한이 없습니다.');
  await todoRepo.deleteById(todoId);
  console.log(`[todo.service] 할일 삭제 완료 todoId=${todoId}`);
}

async function completeTodo(todoId, userId) {
  console.log(`[todo.service] 할일 완료 처리 시도 todoId=${todoId} userId=${userId}`);
  const todo = await todoRepo.findById(todoId);
  if (!todo) throw new NotFoundError('할일을 찾을 수 없습니다.');
  if (todo.user_id !== userId) throw new ForbiddenError('접근 권한이 없습니다.');
  const result = await todoRepo.complete(todoId);
  console.log(`[todo.service] 할일 완료 처리 완료 todoId=${todoId}`);
  return formatTodo(result);
}

module.exports = { getTodos, createTodo, getTodoById, updateTodo, deleteTodo, completeTodo };
