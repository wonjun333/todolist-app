import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { TodoFilterBar } from '../../components/todos/TodoFilter';
import { TodoList } from '../../components/todos/TodoList';
import { TodoCalendar } from '../../components/todos/TodoCalendar';
import { useTodos } from '../../hooks/todos/useTodos';
import { useCompleteTodo } from '../../hooks/todos/useCompleteTodo';
import { useDeleteTodo } from '../../hooks/todos/useDeleteTodo';
import { useCategories } from '../../hooks/categories/useCategories';
import type { TodoFilter } from '../../types/todo.types';

const EMPTY_FILTER: TodoFilter = {};

export function TodoListPage() {
  const [filter, setFilter] = useState<TodoFilter>(EMPTY_FILTER);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const navigate = useNavigate();

  const { data: todos = [], isLoading, isError, refetch } = useTodos(filter);
  const { data: categories = [] } = useCategories();
  const completeTodo = useCompleteTodo(filter);
  const deleteTodo = useDeleteTodo();

  const hasFilter = !!(filter.categoryId || filter.dueDateFrom || filter.dueDateTo || filter.isCompleted !== undefined);

  return (
    <div className="app-layout">
      <Header />
      <main className="app-content">
        <div className="app-content__inner">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-1)', background: 'var(--color-gray-200)', borderRadius: 'var(--radius-pill)', padding: 2 }}>
            <button
              className={`btn btn-ghost${viewMode === 'calendar' ? ' view-toggle--active' : ''}`}
              style={{ height: 32, padding: '0 var(--space-4)', fontSize: 'var(--text-sm)' }}
              onClick={() => setViewMode('calendar')}
            >
              달력
            </button>
            <button
              className={`btn btn-ghost${viewMode === 'list' ? ' view-toggle--active' : ''}`}
              style={{ height: 32, padding: '0 var(--space-4)', fontSize: 'var(--text-sm)' }}
              onClick={() => setViewMode('list')}
            >
              목록
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/todos/new')}>
            + 할일 등록
          </button>
        </div>

        {viewMode === 'calendar' ? (
          <TodoCalendar
            todos={todos}
            categories={categories}
            onDateClick={(date) => navigate(`/todos/new?date=${date}`)}
            onTodoClick={(id) => navigate(`/todos/${id}`)}
          />
        ) : (
          <>
            <TodoFilterBar
              filter={filter}
              onChange={setFilter}
              onReset={() => setFilter(EMPTY_FILTER)}
            />
            <div style={{ paddingTop: 'var(--space-4)' }}>
              <TodoList
                todos={todos}
                categories={categories}
                isLoading={isLoading}
                isError={isError}
                hasFilter={hasFilter}
                onRefetch={refetch}
                onComplete={(id) => completeTodo.mutate(id)}
                onDelete={(id) => deleteTodo.mutate(id)}
                onDeleteMany={(ids) => Promise.all(ids.map((id) => deleteTodo.mutateAsync(id))).then(() => undefined)}
                isDeleting={deleteTodo.isPending}
              />
            </div>
          </>
        )}
        </div>
      </main>
    </div>
  );
}
