export interface Todo {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoRequest {
  title: string;
  categoryId: string;
  description?: string | null;
  dueDate?: string | null;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  categoryId?: string;
}

export interface TodoFilter {
  categoryId?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  isCompleted?: boolean;
}
