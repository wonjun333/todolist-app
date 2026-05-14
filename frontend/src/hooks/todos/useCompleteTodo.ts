import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '../../api/todoApi';
import { QUERY_KEYS } from '../../utils/queryKeys';
import type { Todo, TodoFilter } from '../../types/todo.types';

export function useCompleteTodo(filter?: TodoFilter) {
  const queryClient = useQueryClient();
  const queryKey = [...QUERY_KEYS.todos, filter];

  return useMutation({
    mutationFn: (id: string) => todoApi.completeTodo(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Todo[]>(queryKey);
      queryClient.setQueryData<Todo[]>(queryKey, (old) =>
        old?.map((t) => t.id === id ? { ...t, isCompleted: !t.isCompleted } : t)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todos });
    },
  });
}
