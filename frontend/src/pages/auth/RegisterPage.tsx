import { RegisterForm } from '../../components/auth/RegisterForm';

export function RegisterPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">회원가입</h1>
        <RegisterForm />
      </div>
    </div>
  );
}
