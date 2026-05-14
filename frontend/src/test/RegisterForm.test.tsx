import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { RegisterForm } from '../components/auth/RegisterForm';
import * as authApiModule from '../api/authApi';

vi.mock('../api/authApi');
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    default: {
      ...(actual as { default?: object }).default,
      isAxiosError: (e: unknown) => (e as { isAxiosError?: boolean }).isAxiosError === true,
    },
    isAxiosError: (e: unknown) => (e as { isAxiosError?: boolean }).isAxiosError === true,
  };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('4개 입력 필드와 가입/로그인 버튼이 렌더링된다', () => {
    renderWithProviders(<RegisterForm />);
    expect(screen.getByPlaceholderText('이름을 입력하세요')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('이메일을 입력하세요')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('비밀번호를 입력하세요')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('비밀번호를 다시 입력하세요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '가입' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인 페이지로' })).toBeInTheDocument();
  });

  it('빈 폼 제출 시 모든 필드의 에러 메시지가 표시된다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    await user.click(screen.getByRole('button', { name: '가입' }));
    expect(await screen.findByText('이름을 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('이메일을 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('비밀번호를 입력해 주세요.')).toBeInTheDocument();
    expect(screen.getByText('비밀번호 확인을 입력해 주세요.')).toBeInTheDocument();
  });

  it('잘못된 이메일 형식 입력 후 blur 시 에러 메시지가 표시된다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    const emailInput = screen.getByPlaceholderText('이메일을 입력하세요');
    await user.type(emailInput, 'invalid-email');
    await user.tab();
    expect(await screen.findByText('올바른 이메일 형식이 아닙니다.')).toBeInTheDocument();
  });

  it('비밀번호 8자 미만 입력 후 blur 시 에러 메시지가 표시된다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    const passwordInput = screen.getByPlaceholderText('비밀번호를 입력하세요');
    await user.type(passwordInput, '1234567');
    await user.tab();
    expect(await screen.findByText('비밀번호는 8자 이상이어야 합니다.')).toBeInTheDocument();
  });

  it('비밀번호 불일치 시 에러 메시지가 표시된다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    await user.type(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'password123');
    const confirmInput = screen.getByPlaceholderText('비밀번호를 다시 입력하세요');
    await user.type(confirmInput, 'different123');
    await user.tab();
    expect(await screen.findByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
  });

  it('유효한 입력 시 가입 버튼이 활성화된다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    await user.type(screen.getByPlaceholderText('이름을 입력하세요'), '홍길동');
    await user.type(screen.getByPlaceholderText('이메일을 입력하세요'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'password123');
    await user.type(screen.getByPlaceholderText('비밀번호를 다시 입력하세요'), 'password123');
    const submitBtn = screen.getByRole('button', { name: '가입' });
    expect(submitBtn).not.toBeDisabled();
  });

  it('가입 성공 시 /auth/login으로 이동한다', async () => {
    vi.mocked(authApiModule.authApi.register).mockResolvedValue({
      id: '1', email: 'test@example.com', name: '홍길동',
      createdAt: '', updatedAt: '',
    });
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    await user.type(screen.getByPlaceholderText('이름을 입력하세요'), '홍길동');
    await user.type(screen.getByPlaceholderText('이메일을 입력하세요'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'password123');
    await user.type(screen.getByPlaceholderText('비밀번호를 다시 입력하세요'), 'password123');
    await user.click(screen.getByRole('button', { name: '가입' }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
    });
  });

  it('EMAIL_DUPLICATE 에러 시 이메일 필드에 에러 메시지가 표시된다', async () => {
    const axiosError = {
      isAxiosError: true,
      response: { data: { error: { code: 'EMAIL_DUPLICATE', message: '이미 사용 중인 이메일입니다.' } } },
    };
    vi.mocked(authApiModule.authApi.register).mockRejectedValue(axiosError);
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    await user.type(screen.getByPlaceholderText('이름을 입력하세요'), '홍길동');
    await user.type(screen.getByPlaceholderText('이메일을 입력하세요'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'password123');
    await user.type(screen.getByPlaceholderText('비밀번호를 다시 입력하세요'), 'password123');
    await user.click(screen.getByRole('button', { name: '가입' }));
    await waitFor(() => {
      expect(screen.getByText('이미 사용 중인 이메일입니다.')).toBeInTheDocument();
    });
  });

  it('API 호출 중 가입 버튼이 비활성화된다', async () => {
    vi.mocked(authApiModule.authApi.register).mockImplementation(
      () => new Promise(() => {})
    );
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    await user.type(screen.getByPlaceholderText('이름을 입력하세요'), '홍길동');
    await user.type(screen.getByPlaceholderText('이메일을 입력하세요'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('비밀번호를 입력하세요'), 'password123');
    await user.type(screen.getByPlaceholderText('비밀번호를 다시 입력하세요'), 'password123');
    await user.click(screen.getByRole('button', { name: '가입' }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /가입/ })).toBeDisabled();
    });
  });

  it('로그인 페이지로 버튼 클릭 시 /auth/login으로 이동한다', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    await user.click(screen.getByRole('button', { name: '로그인 페이지로' }));
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login');
  });

  it('로그인하기 링크가 /auth/login으로 연결된다', () => {
    renderWithProviders(<RegisterForm />);
    const link = screen.getByRole('link', { name: '로그인하기' });
    expect(link).toBeInTheDocument();
  });
});
