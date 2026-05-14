import httpClient from './httpClient';
import type { User, UpdateProfileRequest } from '../types/user.types';

export const userApi = {
  getProfile: () =>
    httpClient.get<User>('/api/v1/users/me').then((r) => r.data),
  updateProfile: (data: UpdateProfileRequest) =>
    httpClient.patch<User>('/api/v1/users/me', data).then((r) => r.data),
};
