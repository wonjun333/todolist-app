import axios from 'axios';
import type { ApiError } from '../types/api.types';

export const getApiError = (error: unknown): ApiError | null => {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    return error.response.data.error as ApiError;
  }
  return null;
};
