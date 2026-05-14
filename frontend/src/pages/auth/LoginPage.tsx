import { LoginForm } from '../../components/auth/LoginForm';

export function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">로그인</h1>
        <LoginForm />
      </div>
    </div>
  );
}
