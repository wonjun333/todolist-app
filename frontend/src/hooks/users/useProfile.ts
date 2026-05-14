import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../api/userApi';
import { QUERY_KEYS } from '../../utils/queryKeys';

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.me,
    queryFn: userApi.getProfile,
  });
}
