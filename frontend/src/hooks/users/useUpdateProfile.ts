import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../api/userApi';
import { useAuthStore } from '../../stores/authStore';
import { QUERY_KEYS } from '../../utils/queryKeys';
import type { UpdateProfileRequest } from '../../types/user.types';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => userApi.updateProfile(data),
    onSuccess: (user) => {
      queryClient.setQueryData(QUERY_KEYS.me, user);
      setCurrentUser(user);
    },
  });
}
