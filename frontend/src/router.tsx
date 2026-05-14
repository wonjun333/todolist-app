import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RegisterPage } from './pages/auth/RegisterPage';
import { LoginPage } from './pages/auth/LoginPage';
import { TodoListPage } from './pages/todos/TodoListPage';
import { TodoFormPage } from './pages/todos/TodoFormPage';
import { CategoryPage } from './pages/categories/CategoryPage';
import { ProfilePage } from './pages/users/ProfilePage';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { PublicOnlyRoute } from './components/common/PublicOnlyRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/todos" replace />,
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/auth/register', element: <RegisterPage /> },
      { path: '/auth/login', element: <LoginPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/todos', element: <TodoListPage /> },
      { path: '/todos/new', element: <TodoFormPage /> },
      { path: '/todos/:id', element: <TodoFormPage /> },
      { path: '/categories', element: <CategoryPage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
]);
