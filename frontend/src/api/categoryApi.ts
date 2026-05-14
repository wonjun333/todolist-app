import httpClient from './httpClient';
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../types/category.types';

export const categoryApi = {
  getCategories: () =>
    httpClient.get<Category[]>('/api/v1/categories').then((r) => r.data),
  createCategory: (data: CreateCategoryRequest) =>
    httpClient.post<Category>('/api/v1/categories', data).then((r) => r.data),
  updateCategory: (id: string, data: UpdateCategoryRequest) =>
    httpClient.patch<Category>(`/api/v1/categories/${id}`, data).then((r) => r.data),
  deleteCategory: (id: string) =>
    httpClient.delete(`/api/v1/categories/${id}`),
};
