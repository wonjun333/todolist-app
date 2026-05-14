import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { todoApi } from '../../api/todoApi';
import { QUERY_KEYS } from '../../utils/queryKeys';
import type { CreateTodoRequest } from '../../types/todo.types';

export function useCreateTodo() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: CreateTodoRequest) => todoApi.createTodo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todos });
      navigate('/todos');
    },
  });
}
