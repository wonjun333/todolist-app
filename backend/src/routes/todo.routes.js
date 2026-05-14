'use strict';

const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const { validateBody } = require('../middlewares/validate');
const todoController = require('../controllers/todo.controller');

router.get('/', authenticate, todoController.getTodos);
router.post('/', authenticate, validateBody(['title', 'categoryId']), todoController.createTodo);
router.get('/:id', authenticate, todoController.getTodoById);
router.patch('/:id/complete', authenticate, todoController.completeTodo);
router.patch('/:id', authenticate, todoController.updateTodo);
router.delete('/:id', authenticate, todoController.deleteTodo);

module.exports = router;
