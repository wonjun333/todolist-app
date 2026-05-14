import httpClient from './httpClient';
import type { LoginRequest, LoginResponse, RegisterRequest } from '../types/auth.types';
import type { User } from '../types/user.types';

export const authApi = {
  register: (data: RegisterRequest) =>
    httpClient.post<User>('/api/v1/auth/register', data).then((r) => r.data),
  login: (data: LoginRequest) =>
    httpClient.post<LoginResponse>('/api/v1/auth/login', data).then((r) => r.data),
};
