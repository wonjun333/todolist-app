'use strict';

const todoService = require('../services/todo.service');
const { BadRequestError } = require('../types/errors');

async function getTodos(req, res, next) {
  try {
    const { categoryId, dueDateFrom, dueDateTo, isCompleted } = req.query;
    const filters = {};
    if (categoryId !== undefined) filters.categoryId = categoryId;
    if (dueDateFrom !== undefined) filters.dueDateFrom = dueDateFrom;
    if (dueDateTo !== undefined) filters.dueDateTo = dueDateTo;
    if (isCompleted !== undefined) {
      if (isCompleted !== 'true' && isCompleted !== 'false') {
        throw new BadRequestError('isCompleted는 true 또는 false여야 합니다.');
      }
      filters.isCompleted = isCompleted === 'true';
    }
    const todos = await todoService.getTodos(req.userId, filters);
    res.status(200).json(todos);
  } catch (err) {
    next(err);
  }
}

async function createTodo(req, res, next) {
  try {
    const { title, description, dueDate, categoryId } = req.body;
    const todo = await todoService.createTodo(req.userId, { title, categoryId, description, dueDate });
    res.status(201).json(todo);
  } catch (err) {
    next(err);
  }
}

async function getTodoById(req, res, next) {
  try {
    const todo = await todoService.getTodoById(req.params.id, req.userId);
    res.status(200).json(todo);
  } catch (err) {
    next(err);
  }
}

async function updateTodo(req, res, next) {
  try {
    const { title, description, dueDate, categoryId } = req.body;
    const todo = await todoService.updateTodo(req.params.id, req.userId, {
      title, description, dueDate, categoryId,
    });
    res.status(200).json(todo);
  } catch (err) {
    next(err);
  }
}

async function deleteTodo(req, res, next) {
  try {
    await todoService.deleteTodo(req.params.id, req.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function completeTodo(req, res, next) {
  try {
    const todo = await todoService.completeTodo(req.params.id, req.userId);
    res.status(200).json(todo);
  } catch (err) {
    next(err);
  }
}

module.exports = { getTodos, createTodo, getTodoById, updateTodo, deleteTodo, completeTodo };
