'use strict';

const pool = require('../db/pool');

async function findByUserIdWithFilters(userId, { categoryId, dueDateFrom, dueDateTo, isCompleted } = {}) {
  const conditions = ['user_id = $1'];
  const values = [userId];
  let idx = 2;

  if (categoryId !== undefined) {
    conditions.push(`category_id = $${idx++}`);
    values.push(categoryId);
  }
  if (dueDateFrom !== undefined) {
    conditions.push(`due_date >= $${idx++}`);
    values.push(dueDateFrom);
  }
  if (dueDateTo !== undefined) {
    conditions.push(`due_date <= $${idx++}`);
    values.push(dueDateTo);
  }
  if (isCompleted !== undefined) {
    conditions.push(`is_completed = $${idx++}`);
    values.push(isCompleted);
  }

  const sql = `SELECT * FROM todos WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`;
  const { rows } = await pool.query(sql, values);
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
  return rows[0] || null;
}

async function create({ userId, categoryId, title, description, dueDate }) {
  const { rows } = await pool.query(
    `INSERT INTO todos (user_id, category_id, title, description, due_date, is_completed)
     VALUES ($1, $2, $3, $4, $5, FALSE) RETURNING *`,
    [userId, categoryId, title, description || null, dueDate || null]
  );
  return rows[0];
}

async function update(id, { title, description, categoryId, dueDate }) {
  const sets = [];
  const values = [];
  let idx = 1;
  if (title !== undefined) { sets.push(`title = $${idx++}`); values.push(title); }
  if (description !== undefined) { sets.push(`description = $${idx++}`); values.push(description); }
  if (categoryId !== undefined) { sets.push(`category_id = $${idx++}`); values.push(categoryId); }
  if (dueDate !== undefined) { sets.push(`due_date = $${idx++}`); values.push(dueDate); }
  if (sets.length === 0) return findById(id);
  sets.push(`updated_at = NOW()`);
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE todos SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
}

async function complete(id) {
  const { rows } = await pool.query(
    'UPDATE todos SET is_completed = NOT is_completed, updated_at = NOW() WHERE id = $1 RETURNING *',
    [id]
  );
  return rows[0] || null;
}

async function deleteById(id) {
  await pool.query('DELETE FROM todos WHERE id = $1', [id]);
}

module.exports = { findByUserIdWithFilters, findById, create, update, complete, deleteById };
