import { Header } from '../../components/layout/Header';
import { ProfileForm } from '../../components/users/ProfileForm';
import { useProfile } from '../../hooks/users/useProfile';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';

export function ProfilePage() {
  const { data: user, isLoading, isError, refetch } = useProfile();

  return (
    <div className="app-layout">
      <Header />
      <main className="app-content">
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 400, marginBottom: 'var(--space-6)' }}>
            개인정보 수정
          </h1>

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <LoadingSpinner />
            </div>
          )}
          {isError && <ErrorMessage message="프로필을 불러올 수 없습니다." onRetry={refetch} />}
          {user && <ProfileForm user={user} />}
        </div>
      </main>
    </div>
  );
}
