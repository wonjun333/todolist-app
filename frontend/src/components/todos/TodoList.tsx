import { useMemo, useState } from 'react';
import type { Todo } from '../../types/todo.types';
import type { Category } from '../../types/category.types';
import { TodoCard } from './TodoCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';
import { Modal } from '../common/Modal';
import { useNavigate } from 'react-router-dom';

interface TodoListProps {
  todos: Todo[];
  categories: Category[];
  isLoading: boolean;
  isError: boolean;
  hasFilter: boolean;
  onRefetch: () => void;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onDeleteMany: (ids: string[]) => Promise<void>;
  isDeleting?: boolean;
}

export function TodoList({
  todos,
  categories,
  isLoading,
  isError,
  hasFilter,
  onRefetch,
  onComplete,
  onDelete,
  onDeleteMany,
  isDeleting = false,
}: TodoListProps) {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const customCategories = categories.filter((c) => !c.isDefault);
  const todoIds = useMemo(() => todos.map((todo) => todo.id), [todos]);
  const todoIdSet = useMemo(() => new Set(todoIds), [todoIds]);
  const visibleSelectedIds = useMemo(
    () => selectedIds.filter((id) => todoIdSet.has(id)),
    [selectedIds, todoIdSet]
  );
  const selectedSet = useMemo(() => new Set(visibleSelectedIds), [visibleSelectedIds]);
  const allSelected = todos.length > 0 && visibleSelectedIds.length === todos.length;

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : todoIds);
  };

  const handleBulkDelete = async () => {
    await onDeleteMany(visibleSelectedIds);
    setSelectedIds([]);
    setShowBulkDeleteModal(false);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return <ErrorMessage message="할일 목록을 불러올 수 없습니다." onRetry={onRefetch} />;
  }

  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state__title">
          {hasFilter ? '해당하는 할일이 없습니다.' : '등록된 할일이 없습니다.'}
        </p>
        <p className="empty-state__desc">
          {hasFilter ? '필터 조건을 조정해 보세요.' : '새 할일을 추가해 보세요.'}
        </p>
        {!hasFilter && (
          <button className="btn btn-primary" onClick={() => navigate('/todos/new')}>
            할일 등록
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div className="todo-list__bulk-bar">
        <label className="todo-list__select-all">
          <input
            type="checkbox"
            className="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            aria-label="전체 일정 선택"
          />
          <span>전체 선택</span>
        </label>
        <div className="todo-list__bulk-actions">
          <span className="todo-list__selected-count">{visibleSelectedIds.length}개 선택됨</span>
          <button
            className="btn btn-danger"
            disabled={visibleSelectedIds.length === 0 || isDeleting}
            onClick={() => setShowBulkDeleteModal(true)}
          >
            선택 삭제
          </button>
        </div>
      </div>
      {todos.map((todo) => {
        const category = catMap.get(todo.categoryId);
        const customIdx = category && !category.isDefault
          ? customCategories.findIndex((c) => c.id === category.id)
          : 0;
        return (
          <TodoCard
            key={todo.id}
            todo={todo}
            category={category}
            categoryIndex={customIdx}
            onComplete={onComplete}
            onDelete={onDelete}
            selectable
            isSelected={selectedSet.has(todo.id)}
            onSelectChange={toggleSelected}
          />
        );
      })}
      <Modal
        open={showBulkDeleteModal}
        title="선택 일정 삭제"
        confirmLabel="삭제"
        confirmVariant="danger"
        onConfirm={() => { void handleBulkDelete(); }}
        onClose={() => setShowBulkDeleteModal(false)}
      >
        선택한 {visibleSelectedIds.length}개의 일정을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.
      </Modal>
    </div>
  );
}
