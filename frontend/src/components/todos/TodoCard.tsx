import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Todo } from '../../types/todo.types';
import type { Category } from '../../types/category.types';
import { Modal } from '../common/Modal';
import { formatDisplayDate } from '../../utils/dateFormatter';

const BADGE_COLORS: Record<string, { bg: string; color: string }> = {
  '일반': { bg: '#E8F0FE', color: '#1A73E8' },
  '업무': { bg: '#D2E3FC', color: '#1967D2' },
  '개인': { bg: '#FDE7F3', color: '#C5221F' },
};
const CUSTOM_COLORS = [
  { bg: '#E6F4EA', color: '#188038' },
  { bg: '#FEF7E0', color: '#B06000' },
  { bg: '#F3E8FD', color: '#7627BB' },
  { bg: '#E8EAED', color: '#3C4043' },
];

interface TodoCardProps {
  todo: Todo;
  category?: Category;
  categoryIndex?: number;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  selectable?: boolean;
  isSelected?: boolean;
  onSelectChange?: (id: string) => void;
}

export function TodoCard({
  todo,
  category,
  categoryIndex = 0,
  onComplete,
  onDelete,
  selectable = false,
  isSelected = false,
  onSelectChange,
}: TodoCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();

  const badgeStyle = category
    ? (BADGE_COLORS[category.name] ?? CUSTOM_COLORS[categoryIndex % CUSTOM_COLORS.length])
    : { bg: '#E8EAED', color: '#3C4043' };

  return (
    <>
      <div
        onClick={() => navigate(`/todos/${todo.id}`)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-gray-300)',
          background: 'var(--color-white)',
          cursor: 'pointer',
          transition: 'background var(--transition-fast)',
          opacity: todo.isCompleted ? 0.65 : 1,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-gray-100)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-white)')}
      >
        {selectable && (
          <input
            type="checkbox"
            className="checkbox"
            checked={isSelected}
            aria-label={`삭제 대상으로 선택: ${todo.title}`}
            onChange={() => onSelectChange?.(todo.id)}
            onClick={(e) => e.stopPropagation()}
            style={{ marginTop: 2, flexShrink: 0 }}
          />
        )}
        <input
          type="checkbox"
          className="checkbox"
          checked={todo.isCompleted}
          aria-label="할일 완료 처리"
          onChange={() => onComplete(todo.id)}
          onClick={(e) => e.stopPropagation()}
          style={{ marginTop: 2, flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{
            fontSize: 'var(--text-base)',
            textDecoration: todo.isCompleted ? 'line-through' : 'none',
            color: todo.isCompleted ? 'var(--color-gray-500)' : 'var(--color-gray-900)',
          }}>
            {todo.title}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            {category && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 20,
                padding: '0 var(--space-2)',
                borderRadius: 10,
                fontSize: 'var(--text-xs)',
                fontWeight: 500,
                background: badgeStyle.bg,
                color: badgeStyle.color,
                whiteSpace: 'nowrap',
              }}>
                {category.name}
              </span>
            )}
            {todo.dueDate && (
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)' }}>
                {formatDisplayDate(todo.dueDate)}
              </span>
            )}
          </div>
        </div>
        <button
          className="btn btn-danger"
          aria-label={`할일 삭제: ${todo.title}`}
          onClick={(e) => { e.stopPropagation(); setShowDeleteModal(true); }}
          style={{ height: 28, padding: '0 var(--space-2)', fontSize: 'var(--text-sm)' }}
        >
          삭제
        </button>
      </div>

      <Modal
        open={showDeleteModal}
        title="삭제 확인"
        confirmLabel="삭제"
        confirmVariant="danger"
        onConfirm={() => { onDelete(todo.id); setShowDeleteModal(false); }}
        onClose={() => setShowDeleteModal(false)}
      >
        이 할일을 삭제하시겠습니까? 삭제 후 복구할 수 없습니다.
      </Modal>
    </>
  );
}
