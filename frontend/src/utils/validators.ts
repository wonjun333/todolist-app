export const validateEmail = (email: string): string | null => {
  if (!email) return '이메일을 입력해 주세요.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '올바른 이메일 형식이 아닙니다.';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return '비밀번호를 입력해 주세요.';
  if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
  return null;
};

export const validateDateRange = (from: string, to: string): string | null => {
  if (from && to && from > to) return '시작일이 종료일보다 늦을 수 없습니다.';
  return null;
};
