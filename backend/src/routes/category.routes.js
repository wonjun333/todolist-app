'use strict';

const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const { validateBody } = require('../middlewares/validate');
const categoryController = require('../controllers/category.controller');

router.get('/', authenticate, categoryController.getCategories);
router.post('/', authenticate, validateBody(['name']), categoryController.createCategory);
router.patch('/:id', authenticate, categoryController.updateCategory);
router.delete('/:id', authenticate, categoryController.deleteCategory);

module.exports = router;
