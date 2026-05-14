import { useQuery } from '@tanstack/react-query';
import { todoApi } from '../../api/todoApi';
import { QUERY_KEYS } from '../../utils/queryKeys';

export function useTodo(id: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.todo(id ?? ''),
    queryFn: () => todoApi.getTodo(id!),
    enabled: !!id,
  });
}
