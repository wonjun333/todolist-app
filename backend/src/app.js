'use strict';

const env = require('./config/env');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../../swagger/swagger.json');
const errorHandler = require('./middlewares/error-handler');

const app = express();

app.use(cors({
  origin: env.corsOrigin,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[http] ${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const todoRoutes = require('./routes/todo.routes');
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/todos', todoRoutes);

// 404 핸들러
app.use((_req, _res, next) => {
  const { NotFoundError } = require('./types/errors');
  next(new NotFoundError('요청한 리소스를 찾을 수 없습니다.'));
});

// 전역 에러 핸들러
app.use(errorHandler);

if (require.main === module) {
  app.listen(env.port, () => {
    console.log(`Listening on port ${env.port}`);
  });
}

module.exports = app;
