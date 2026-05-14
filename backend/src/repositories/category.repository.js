'use strict';

const pool = require('../db/pool');

async function createDefaultCategories(userId) {
  const defaults = ['일반', '업무', '개인'];
  const results = [];
  for (const name of defaults) {
    const { rows } = await pool.query(
      'INSERT INTO categories (name, user_id, is_default) VALUES ($1, $2, TRUE) RETURNING *',
      [name, userId]
    );
    results.push(rows[0]);
  }
  return results;
}

async function findAll(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM categories WHERE user_id = $1 ORDER BY is_default DESC, created_at ASC',
    [userId]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
  return rows[0] || null;
}

async function findByNameAndUserId(name, userId) {
  const { rows } = await pool.query(
    'SELECT * FROM categories WHERE name = $1 AND user_id = $2',
    [name, userId]
  );
  return rows[0] || null;
}

async function create({ name, userId }) {
  const { rows } = await pool.query(
    'INSERT INTO categories (name, user_id, is_default) VALUES ($1, $2, FALSE) RETURNING *',
    [name, userId]
  );
  return rows[0];
}

async function update(id, { name }) {
  const { rows } = await pool.query(
    'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
    [name, id]
  );
  return rows[0] || null;
}

async function deleteById(id) {
  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
}

async function countTodosByCategory(categoryId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) AS count FROM todos WHERE category_id = $1',
    [categoryId]
  );
  return parseInt(rows[0].count, 10);
}

module.exports = {
  createDefaultCategories,
  findAll,
  findById,
  findByNameAndUserId,
  create,
  update,
  deleteById,
  countTodosByCategory,
};
