export const QUERY_KEYS = {
  todos: ['todos'] as const,
  todo: (id: string) => ['todos', id] as const,
  categories: ['categories'] as const,
  me: ['users', 'me'] as const,
};
