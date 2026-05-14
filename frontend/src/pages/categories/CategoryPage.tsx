import { Header } from '../../components/layout/Header';
import { CategoryForm } from '../../components/categories/CategoryForm';
import { CategoryItem } from '../../components/categories/CategoryItem';
import { useCategories } from '../../hooks/categories/useCategories';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function CategoryPage() {
  const { data: categories = [], isLoading } = useCategories();
  const defaults = categories.filter((c) => c.isDefault);
  const customs = categories.filter((c) => !c.isDefault);

  return (
    <div className="app-layout">
      <Header />
      <main className="app-content">
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 400, marginBottom: 'var(--space-6)' }}>
            카테고리 관리
          </h1>

          <CategoryForm />

          <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <section>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--color-gray-700)', marginBottom: 'var(--space-3)' }}>
                기본 카테고리 (수정/삭제 불가)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {defaults.map((c) => <CategoryItem key={c.id} category={c} />)}
              </div>
            </section>

            <section>
              <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--color-gray-700)', marginBottom: 'var(--space-3)' }}>
                사용자 정의 카테고리
              </h2>
              {isLoading ? (
                <LoadingSpinner />
              ) : customs.length === 0 ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)' }}>
                  사용자 정의 카테고리가 없습니다.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {customs.map((c) => <CategoryItem key={c.id} category={c} />)}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
