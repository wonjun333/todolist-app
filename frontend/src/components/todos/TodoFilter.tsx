import { useCategories } from '../../hooks/categories/useCategories';
import type { TodoFilter } from '../../types/todo.types';
import { validateDateRange } from '../../utils/validators';

interface TodoFilterProps {
  filter: TodoFilter;
  onChange: (filter: TodoFilter) => void;
  onReset: () => void;
}

export function TodoFilterBar({ filter, onChange, onReset }: TodoFilterProps) {
  const { data: categories = [] } = useCategories();
  const dateError = filter.dueDateFrom && filter.dueDateTo
    ? validateDateRange(filter.dueDateFrom, filter.dueDateTo)
    : null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--color-gray-300)' }}>
      <select
        className="input select"
        style={{ height: 36, width: 'auto' }}
        value={filter.categoryId ?? ''}
        onChange={(e) => onChange({ ...filter, categoryId: e.target.value || undefined })}
      >
        <option value="">전체 카테고리</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <input
        type="date"
        className="input"
        style={{ height: 36, width: 'auto' }}
        value={filter.dueDateFrom ?? ''}
        onChange={(e) => onChange({ ...filter, dueDateFrom: e.target.value || undefined })}
      />
      <span style={{ color: 'var(--color-gray-500)', fontSize: 'var(--text-sm)' }}>~</span>
      <input
        type="date"
        className="input"
        style={{ height: 36, width: 'auto' }}
        value={filter.dueDateTo ?? ''}
        onChange={(e) => onChange({ ...filter, dueDateTo: e.target.value || undefined })}
      />

      <select
        className="input select"
        style={{ height: 36, width: 'auto' }}
        value={filter.isCompleted === undefined ? '' : String(filter.isCompleted)}
        onChange={(e) => {
          const val = e.target.value;
          onChange({ ...filter, isCompleted: val === '' ? undefined : val === 'true' });
        }}
      >
        <option value="">전체</option>
        <option value="false">미완료</option>
        <option value="true">완료</option>
      </select>

      <button className="btn btn-secondary" onClick={onReset} style={{ height: 36 }}>
        필터 초기화
      </button>

      {dateError && (
        <p role="alert" style={{ width: '100%', fontSize: 'var(--text-sm)', color: 'var(--color-error-600)', margin: 0 }}>
          {dateError}
        </p>
      )}
    </div>
  );
}
