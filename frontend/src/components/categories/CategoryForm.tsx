import { useState } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useCreateCategory } from '../../hooks/categories/useCreateCategory';
import { getApiError } from '../../utils/apiError';

export function CategoryForm() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const createCategory = useCreateCategory();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('카테고리명을 입력해 주세요.');
      return;
    }
    setError('');
    createCategory.mutate(
      { name: name.trim() },
      {
        onSuccess: () => setName(''),
        onError: (err) => {
          const apiError = getApiError(err);
          if (apiError?.code === 'CATEGORY_NAME_DUPLICATE') {
            setError('이미 사용 중인 카테고리명입니다.');
          } else {
            setError(apiError?.message ?? '추가 중 오류가 발생했습니다.');
          }
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-gray-700)' }}>
        새 카테고리 추가
      </label>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          placeholder="카테고리명을 입력하세요"
          error={error || undefined}
          style={{ flex: 1 }}
        />
        <Button type="submit" variant="primary" loading={createCategory.isPending}>
          추가
        </Button>
      </div>
      {error && <p role="alert" className="form-error">{error}</p>}
    </form>
  );
}
