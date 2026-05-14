'use strict';

function formatUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function formatCategory(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    isDefault: row.is_default,
    createdAt: row.created_at,
  };
}

function formatTodo(row) {
  let dueDate = null;
  if (row.due_date) {
    const d = row.due_date instanceof Date ? row.due_date : new Date(row.due_date);
    dueDate = d.toISOString().split('T')[0];
  }
  return {
    id: row.id,
    userId: row.user_id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description ?? null,
    dueDate,
    isCompleted: row.is_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = { formatUser, formatCategory, formatTodo };
