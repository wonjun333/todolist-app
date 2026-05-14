'use strict';

const pool = require('../db/pool');

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function create({ email, passwordHash, name }) {
  const { rows } = await pool.query(
    'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *',
    [email, passwordHash, name]
  );
  return rows[0];
}

async function update(id, { name, passwordHash }) {
  const sets = [];
  const values = [];
  let idx = 1;
  if (name !== undefined) { sets.push(`name = $${idx++}`); values.push(name); }
  if (passwordHash !== undefined) { sets.push(`password = $${idx++}`); values.push(passwordHash); }
  if (sets.length === 0) return findById(id);
  sets.push(`updated_at = NOW()`);
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] || null;
}

module.exports = { findByEmail, findById, create, update };
