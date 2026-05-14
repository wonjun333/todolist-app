import { useState } from 'react';
import type { Category } from '../../types/category.types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Modal } from '../common/Modal';
import { useUpdateCategory } from '../../hooks/categories/useUpdateCategory';
import { useDeleteCategory } from '../../hooks/categories/useDeleteCategory';
import { getApiError } from '../../utils/apiError';

interface CategoryItemProps {
  category: Category;
}

export function CategoryItem({ category }: CategoryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [editError, setEditError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const handleSave = () => {
    if (!editName.trim()) {
      setEditError('카테고리명을 입력해 주세요.');
      return;
    }
    updateCategory.mutate(
      { id: category.id, data: { name: editName.trim() } },
      {
        onSuccess: () => { setIsEditing(false); setEditError(''); },
        onError: (err) => {
          const apiError = getApiError(err);
          if (apiError?.code === 'CATEGORY_NAME_DUPLICATE') {
            setEditError('이미 사용 중인 카테고리명입니다.');
          } else {
            setEditError(apiError?.message ?? '수정 중 오류가 발생했습니다.');
          }
        },
      }
    );
  };

  const handleDelete = () => {
    deleteCategory.mutate(category.id, {
      onSuccess: () => setShowDeleteModal(false),
      onError: (err) => {
        const apiError = getApiError(err);
        setShowDeleteModal(false);
        if (apiError?.code === 'CATEGORY_HAS_TODOS') {
          setDeleteError('연결된 할일이 있어 삭제할 수 없습니다. 할일을 다른 카테고리로 이동하거나 먼저 삭제하세요.');
        } else {
          setDeleteError(apiError?.message ?? '삭제 중 오류가 발생했습니다.');
        }
      },
    });
  };

  if (category.isDefault) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-gray-300)', background: 'var(--color-white)' }}>
        <span style={{ flex: 1, fontSize: 'var(--text-base)', color: 'var(--color-gray-900)' }}>{category.name}</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-gray-500)' }}>(기본)</span>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-gray-300)', background: 'var(--color-white)' }}>
        {isEditing ? (
          <>
            <Input
              type="text"
              value={editName}
              onChange={(e) => { setEditName(e.target.value); setEditError(''); }}
              error={editError || undefined}
              style={{ flex: 1 }}
              autoFocus
            />
            <Button variant="primary" loading={updateCategory.isPending} onClick={handleSave} style={{ height: 32 }}>
              저장
            </Button>
            <Button variant="secondary" onClick={() => { setIsEditing(false); setEditName(category.name); setEditError(''); }} style={{ height: 32 }}>
              취소
            </Button>
          </>
        ) : (
          <>
            <span style={{ flex: 1, fontSize: 'var(--text-base)', color: 'var(--color-gray-900)' }}>{category.name}</span>
            <Button variant="secondary" onClick={() => { setIsEditing(true); setEditName(category.name); }} style={{ height: 32 }}>
              수정
            </Button>
            <Button variant="danger" onClick={() => { setDeleteError(''); setShowDeleteModal(true); }} style={{ height: 32 }}>
              삭제
            </Button>
          </>
        )}
      </div>
      {editError && !isEditing && <p role="alert" className="form-error">{editError}</p>}
      {deleteError && <p role="alert" className="form-error" style={{ marginTop: 4 }}>{deleteError}</p>}

      <Modal
        open={showDeleteModal}
        title="카테고리 삭제"
        confirmLabel="삭제"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onClose={() => setShowDeleteModal(false)}
      >
        이 카테고리를 삭제하시겠습니까?
      </Modal>
    </>
  );
}
