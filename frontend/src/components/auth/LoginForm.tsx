import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useLogin } from '../../hooks/auth/useLogin';
import { getApiError } from '../../utils/apiError';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해 주세요.');
      return;
    }
    setError('');
    login.mutate(
      { email, password },
      {
        onError: (err) => {
          const apiError = getApiError(err);
          setError(apiError?.message ?? '이메일 또는 비밀번호가 올바르지 않습니다.');
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {error && (
        <p role="alert" style={{ color: 'var(--color-error-600)', fontSize: 'var(--text-sm)', margin: 0 }}>
          {error}
        </p>
      )}

      <div className="form-group">
        <label className="form-label">이메일</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(''); }}
          placeholder="이메일을 입력하세요"
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label className="form-label">비밀번호</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          placeholder="비밀번호를 입력하세요"
          autoComplete="current-password"
        />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
        <Button type="submit" variant="primary" loading={login.isPending}>
          로그인
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/auth/register')}>
          회원가입하기
        </Button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)', margin: 0 }}>
        아직 계정이 없으신가요?{' '}
        <Link to="/auth/register" style={{ color: 'var(--color-primary-600)' }}>회원가입하기</Link>
      </p>
    </form>
  );
}
