import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { userApi } from '../../api/userApi';
import { useAuthStore } from '../../stores/authStore';
import type { LoginRequest } from '../../types/auth.types';

export function useLogin() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (data) => {
      setToken(data.accessToken);
      try {
        const user = await userApi.getProfile();
        setCurrentUser(user);
      } catch {
        // ignore — currentUser will remain null, default language used
      }
      navigate('/todos', { replace: true });
    },
  });
}
