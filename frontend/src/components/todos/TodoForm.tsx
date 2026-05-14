import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useCategories } from '../../hooks/categories/useCategories';
import type { Todo, CreateTodoRequest, UpdateTodoRequest } from '../../types/todo.types';

interface TodoFormProps {
  mode: 'create' | 'edit';
  initialData?: Todo;
  initialDueDate?: string;
  onSubmit: (data: CreateTodoRequest | UpdateTodoRequest) => void;
  isLoading: boolean;
  error?: string;
}

export function TodoForm({ initialData, initialDueDate, onSubmit, isLoading, error }: TodoFormProps) {
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? initialDueDate ?? '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? '');
  const [touched, setTouched] = useState(false);

  const titleError = !title.trim() ? '제목은 필수 항목입니다.' : null;
  const categoryError = !categoryId ? '카테고리를 선택해 주세요.' : null;
  const isValid = !titleError && !categoryError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      dueDate: dueDate || null,
      categoryId,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {error && (
        <p role="alert" style={{ color: 'var(--color-error-600)', fontSize: 'var(--text-sm)', margin: 0 }}>
          {error}
        </p>
      )}

      <div className="form-group">
        <label className="form-label">제목 <span className="required">*</span></label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="할일 제목을 입력하세요"
          error={touched && titleError ? titleError : undefined}
        />
        {touched && titleError && <p className="form-error">{titleError}</p>}
      </div>

      <div className="form-group">
        <label className="form-label">설명 (선택)</label>
        <textarea
          className="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="상세 설명을 입력하세요"
          rows={3}
        />
      </div>

      <div className="form-group">
        <label className="form-label">종료예정일 (선택)</label>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={{ width: 'auto' }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">카테고리 <span className="required">*</span></label>
        <select
          className="input select"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          style={{ borderColor: touched && categoryError ? 'var(--color-error-600)' : undefined }}
        >
          <option value="">선택하기</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {touched && categoryError && <p className="form-error">{categoryError}</p>}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
        <Button type="submit" variant="primary" loading={isLoading} disabled={touched && !isValid}>
          저장
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate('/todos')}>
          취소
        </Button>
      </div>
    </form>
  );
}
