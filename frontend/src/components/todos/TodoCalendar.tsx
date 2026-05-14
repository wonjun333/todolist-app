import { useState } from 'react';
import type { Todo } from '../../types/todo.types';
import type { Category } from '../../types/category.types';

interface TodoCalendarProps {
  todos: Todo[];
  categories: Category[];
  onDateClick: (date: string) => void;
  onTodoClick: (id: string) => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function TodoCalendar({ todos, categories, onDateClick, onTodoClick }: TodoCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const catMap = new Map(categories.map((c) => [c.id, c]));

  const todosByDate = new Map<string, Todo[]>();
  for (const todo of todos) {
    if (!todo.dueDate) continue;
    const key = todo.dueDate.slice(0, 10);
    if (!todosByDate.has(key)) todosByDate.set(key, []);
    todosByDate.get(key)!.push(todo);
  }

  const cells: { dateStr: string; day: number; isCurrentMonth: boolean }[] = [];

  for (let i = 0; i < firstDay; i++) {
    const day = daysInPrevMonth - firstDay + 1 + i;
    cells.push({ dateStr: toDateStr(year, month - 1, day), day, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateStr: toDateStr(year, month, d), day: d, isCurrentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ dateStr: toDateStr(year, month + 1, d), day: d, isCurrentMonth: false });
  }

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  return (
    <div className="calendar">
      <div className="calendar__header">
        <button className="btn btn-ghost calendar__nav" onClick={prevMonth} aria-label="이전 달">‹</button>
        <span className="calendar__title">{year}년 {month + 1}월</span>
        <button className="btn btn-ghost calendar__nav" onClick={nextMonth} aria-label="다음 달">›</button>
      </div>

      <div className="calendar__grid">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`calendar__weekday${i === 0 ? ' calendar__weekday--sun' : i === 6 ? ' calendar__weekday--sat' : ''}`}>
            {w}
          </div>
        ))}

        {cells.map(({ dateStr, day, isCurrentMonth }) => {
          const dayTodos = todosByDate.get(dateStr) ?? [];
          const isToday = dateStr === todayStr;
          const isSun = new Date(dateStr).getDay() === 0;
          const isSat = new Date(dateStr).getDay() === 6;

          return (
            <div
              key={dateStr}
              className={[
                'calendar__cell',
                !isCurrentMonth ? 'calendar__cell--other' : '',
                isToday ? 'calendar__cell--today' : '',
              ].join(' ')}
              onClick={() => isCurrentMonth && onDateClick(dateStr)}
              role="button"
              aria-label={`${dateStr} 할일 등록`}
            >
              <span className={[
                'calendar__day-num',
                isSun ? 'calendar__day-num--sun' : '',
                isSat ? 'calendar__day-num--sat' : '',
                isToday ? 'calendar__day-num--today' : '',
              ].join(' ')}>
                {day}
              </span>
              <div className="calendar__todo-list">
                {dayTodos.slice(0, 3).map((todo) => {
                  const cat = catMap.get(todo.categoryId);
                  return (
                    <div
                      key={todo.id}
                      className={`calendar__todo-item${todo.isCompleted ? ' calendar__todo-item--done' : ''}`}
                      onClick={(e) => { e.stopPropagation(); onTodoClick(todo.id); }}
                      title={todo.title}
                    >
                      {cat && <span className="calendar__todo-dot" />}
                      <span className="calendar__todo-title">{todo.title}</span>
                    </div>
                  );
                })}
                {dayTodos.length > 3 && (
                  <div className="calendar__todo-more">+{dayTodos.length - 3}개</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
