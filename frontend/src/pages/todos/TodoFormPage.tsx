import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { TodoForm } from '../../components/todos/TodoForm';
import { useTodo } from '../../hooks/todos/useTodo';
import { useCreateTodo } from '../../hooks/todos/useCreateTodo';
import { useUpdateTodo } from '../../hooks/todos/useUpdateTodo';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { getApiError } from '../../utils/apiError';

export function TodoFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const initialDate = searchParams.get('date') ?? undefined;
  const isEdit = !!id;
  const [formError, setFormError] = useState('');

  const { data: todo, isLoading: isTodoLoading } = useTodo(id);
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo(id ?? '');

  const mutation = isEdit ? updateTodo : createTodo;

  const handleSubmit = (data: Parameters<typeof mutation.mutate>[0]) => {
    setFormError('');
    mutation.mutate(data as never, {
      onError: (error) => {
        const apiError = getApiError(error);
        setFormError(apiError?.message ?? '저장 중 오류가 발생했습니다.');
      },
    });
  };

  return (
    <div className="app-layout">
      <Header />
      <main className="app-content">
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 400, marginBottom: 'var(--space-6)' }}>
            {isEdit ? '할일 수정' : '할일 등록'}
          </h1>

          {isEdit && isTodoLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <LoadingSpinner />
            </div>
          ) : (
            <TodoForm
              mode={isEdit ? 'edit' : 'create'}
              initialData={isEdit ? todo : undefined}
              initialDueDate={!isEdit ? initialDate : undefined}
              onSubmit={handleSubmit}
              isLoading={mutation.isPending}
              error={formError}
            />
          )}
        </div>
      </main>
    </div>
  );
}
