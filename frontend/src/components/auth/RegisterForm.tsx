import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useRegister } from '../../hooks/auth/useRegister';
import { validateEmail, validatePassword } from '../../utils/validators';
import { getApiError } from '../../utils/apiError';

export function RegisterForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [serverError, setServerError] = useState('');
  const [emailServerError, setEmailServerError] = useState('');
  const register = useRegister();

  const errors = {
    name: !form.name ? '이름을 입력해 주세요.' : null,
    email: emailServerError || validateEmail(form.email),
    password: validatePassword(form.password),
    confirmPassword: form.confirmPassword && form.password !== form.confirmPassword
      ? '비밀번호가 일치하지 않습니다.'
      : (!form.confirmPassword ? '비밀번호 확인을 입력해 주세요.' : null),
  };

  const isValid = !errors.name && !errors.email && !errors.password && !errors.confirmPassword;

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (field === 'email') setEmailServerError('');
    setServerError('');
  };

  const handleBlur = (field: keyof typeof touched) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    if (!isValid) return;
    register.mutate(
      { name: form.name, email: form.email, password: form.password },
      {
        onError: (error) => {
          const apiError = getApiError(error);
          if (apiError?.code === 'EMAIL_DUPLICATE') {
            setEmailServerError('이미 사용 중인 이메일입니다.');
          } else {
            setServerError(apiError?.message ?? '오류가 발생했습니다.');
          }
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {serverError && (
        <p role="alert" style={{ color: 'var(--color-error-600)', fontSize: 'var(--text-sm)', margin: 0 }}>
          {serverError}
        </p>
      )}

      <div className="form-group">
        <label className="form-label">이름 <span className="required">*</span></label>
        <Input
          type="text"
          value={form.name}
          onChange={handleChange('name')}
          onBlur={handleBlur('name')}
          placeholder="이름을 입력하세요"
          error={touched.name && errors.name ? errors.name : undefined}
        />
        {touched.name && errors.name && <p className="form-error">{errors.name}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">이메일 <span className="required">*</span></label>
        <Input
          type="email"
          value={form.email}
          onChange={handleChange('email')}
          onBlur={handleBlur('email')}
          placeholder="이메일을 입력하세요"
          error={(touched.email && errors.email) ? errors.email : undefined}
        />
        {touched.email && errors.email && <p className="form-error">{errors.email}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">비밀번호 (8자 이상) <span className="required">*</span></label>
        <Input
          type="password"
          value={form.password}
          onChange={handleChange('password')}
          onBlur={handleBlur('password')}
          placeholder="비밀번호를 입력하세요"
          error={touched.password && errors.password ? errors.password : undefined}
        />
        {touched.password && errors.password && <p className="form-error">{errors.password}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">비밀번호 확인 <span className="required">*</span></label>
        <Input
          type="password"
          value={form.confirmPassword}
          onChange={handleChange('confirmPassword')}
          onBlur={handleBlur('confirmPassword')}
          placeholder="비밀번호를 다시 입력하세요"
          error={touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : undefined}
        />
        {touched.confirmPassword && errors.confirmPassword && (
          <p className="form-error">{errors.confirmPassword}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
        <Button type="submit" variant="primary" loading={register.isPending} disabled={!isValid && Object.values(touched).some(Boolean)}>
          가입
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/auth/login')}>
          로그인 페이지로
        </Button>
      </div>

      <p style={{ textAlign: 'center', fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)', margin: 0 }}>
        이미 계정이 있으신가요?{' '}
        <Link to="/auth/login" style={{ color: 'var(--color-primary-600)' }}>로그인하기</Link>
      </p>
    </form>
  );
}
