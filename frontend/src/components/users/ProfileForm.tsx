import { useState } from 'react';
import type { User } from '../../types/user.types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useUpdateProfile } from '../../hooks/users/useUpdateProfile';
import { validatePassword } from '../../utils/validators';
import { getApiError } from '../../utils/apiError';

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const updateProfile = useUpdateProfile();

  const passwordError = newPassword ? validatePassword(newPassword) : null;
  const confirmError = newPassword && confirmPassword && newPassword !== confirmPassword
    ? '비밀번호가 일치하지 않습니다.'
    : null;

  const hasChange = name !== user.name || newPassword !== '';
  const isValid = hasChange && !passwordError && !confirmError &&
    (newPassword === '' || (newPassword === confirmPassword));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError('');
    const payload: { name?: string; newPassword?: string } = {};
    if (name !== user.name) payload.name = name;
    if (newPassword) payload.newPassword = newPassword;
    updateProfile.mutate(payload, {
      onSuccess: () => {
        setSuccessMsg('저장이 완료되었습니다.');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccessMsg(''), 2000);
      },
      onError: (err) => {
        const apiError = getApiError(err);
        setError(apiError?.message ?? '저장 중 오류가 발생했습니다.');
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {successMsg && (
        <p role="status" style={{ color: 'var(--color-success-600)', fontSize: 'var(--text-sm)', margin: 0 }}>
          {successMsg}
        </p>
      )}
      {error && (
        <p role="alert" style={{ color: 'var(--color-error-600)', fontSize: 'var(--text-sm)', margin: 0 }}>
          {error}
        </p>
      )}

      <div className="form-group">
        <label className="form-label">이메일</label>
        <Input
          type="email"
          value={user.email}
          readOnly
          className="input input--readonly"
        />
      </div>

      <div className="form-group">
        <label className="form-label">이름</label>
        <Input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">새 비밀번호 (선택)</label>
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
          placeholder="새 비밀번호 (8자 이상)"
          error={newPassword && passwordError ? passwordError : undefined}
        />
        {newPassword && passwordError && <p className="form-error">{passwordError}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">비밀번호 확인 (선택)</label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
          placeholder="비밀번호를 다시 입력하세요"
          error={confirmError || undefined}
        />
        {confirmError && <p className="form-error">{confirmError}</p>}
        {newPassword && confirmPassword && !confirmError && (
          <p className="form-success">비밀번호가 일치합니다.</p>
        )}
      </div>

      {!hasChange && (
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)', margin: 0 }}>
          변경된 항목이 없습니다.
        </p>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
        <Button type="submit" variant="primary" loading={updateProfile.isPending} disabled={!isValid}>
          저장
        </Button>
      </div>
    </form>
  );
}
