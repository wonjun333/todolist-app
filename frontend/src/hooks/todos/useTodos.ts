import { useQuery } from '@tanstack/react-query';
import { todoApi } from '../../api/todoApi';
import { QUERY_KEYS } from '../../utils/queryKeys';
import { validateDateRange } from '../../utils/validators';
import type { TodoFilter } from '../../types/todo.types';

export function useTodos(filter?: TodoFilter) {
  const hasInvalidDateRange = !!(
    filter?.dueDateFrom &&
    filter?.dueDateTo &&
    validateDateRange(filter.dueDateFrom, filter.dueDateTo)
  );

  return useQuery({
    queryKey: [...QUERY_KEYS.todos, filter],
    queryFn: () => todoApi.getTodos(filter),
    enabled: !hasInvalidDateRange,
  });
}
