import { useQuery } from '@tanstack/react-query';
import { categoryApi } from '../../api/categoryApi';
import { QUERY_KEYS } from '../../utils/queryKeys';

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.categories,
    queryFn: categoryApi.getCategories,
  });
}
