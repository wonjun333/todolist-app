import httpClient from './httpClient';
import type { Todo, CreateTodoRequest, UpdateTodoRequest, TodoFilter } from '../types/todo.types';

export const todoApi = {
  getTodos: (filter?: TodoFilter) => {
    const params: Record<string, unknown> = {};
    if (filter?.categoryId) params.categoryId = filter.categoryId;
    if (filter?.dueDateFrom) params.dueDateFrom = filter.dueDateFrom;
    if (filter?.dueDateTo) params.dueDateTo = filter.dueDateTo;
    if (filter?.isCompleted !== undefined) params.isCompleted = filter.isCompleted;
    return httpClient.get<Todo[]>('/api/v1/todos', { params }).then((r) => r.data);
  },
  getTodo: (id: string) =>
    httpClient.get<Todo>(`/api/v1/todos/${id}`).then((r) => r.data),
  createTodo: (data: CreateTodoRequest) =>
    httpClient.post<Todo>('/api/v1/todos', data).then((r) => r.data),
  updateTodo: (id: string, data: UpdateTodoRequest) =>
    httpClient.patch<Todo>(`/api/v1/todos/${id}`, data).then((r) => r.data),
  deleteTodo: (id: string) =>
    httpClient.delete(`/api/v1/todos/${id}`),
  completeTodo: (id: string) =>
    httpClient.patch<Todo>(`/api/v1/todos/${id}/complete`).then((r) => r.data),
};
