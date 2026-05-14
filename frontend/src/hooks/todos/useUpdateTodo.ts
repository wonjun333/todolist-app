import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { todoApi } from '../../api/todoApi';
import { QUERY_KEYS } from '../../utils/queryKeys';
import type { UpdateTodoRequest } from '../../types/todo.types';

export function useUpdateTodo(id: string) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: UpdateTodoRequest) => todoApi.updateTodo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todos });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todo(id) });
      navigate('/todos');
    },
  });
}
