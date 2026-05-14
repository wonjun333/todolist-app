# 프론트엔드 통합 가이드

**프로젝트명:** TodoListApp
**버전:** 1.0.0
**작성일:** 2026-05-14
**참조 문서:** `docs/2-prd.md`, `docs/4-project-structure.md`, `swagger/swagger.json`

---

## 목차

1. [개요](#1-개요)
2. [환경 설정](#2-환경-설정)
3. [인증 흐름](#3-인증-흐름)
4. [HTTP 클라이언트 설정](#4-http-클라이언트-설정)
5. [API 엔드포인트 레퍼런스](#5-api-엔드포인트-레퍼런스)
6. [응답 타입 정의](#6-응답-타입-정의)
7. [에러 처리](#7-에러-처리)
8. [화면별 API 호출 패턴](#8-화면별-api-호출-패턴)
9. [주요 구현 주의사항](#9-주요-구현-주의사항)

---

## 1. 개요

백엔드는 `http://localhost:3000`에서 실행되는 Node.js + Express REST API 서버다. 모든 API 엔드포인트는 `/api/v1` 접두사를 사용하며, 인증이 필요한 엔드포인트는 JWT Bearer Token을 요구한다.

- **API 문서:** `http://localhost:3000/api-docs` (Swagger UI)
- **기본 URL:** `http://localhost:3000`
- **인증 방식:** JWT Bearer Token (`Authorization: Bearer <token>`)
- **요청/응답 형식:** JSON

---

## 2. 환경 설정

### 프론트엔드 `.env`

```
VITE_API_BASE_URL=http://localhost:3000
```

### Vite 프록시 설정 (`vite.config.ts`)

로컬 개발 시 CORS 우회 및 경로 단순화를 위해 프록시를 설정한다.

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

프록시를 사용하면 `VITE_API_BASE_URL`을 빈 문자열로 두고 `/api/v1/...`로 직접 호출할 수 있다.

---

## 3. 인증 흐름

### 3.1 토큰 저장 정책

JWT는 **Zustand 메모리**에만 저장한다. `localStorage`, `sessionStorage`, 쿠키 사용 금지.

```typescript
// src/stores/authStore.ts
interface AuthState {
  accessToken: string | null;
  currentUser: User | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  setCurrentUser: (user: User) => void;
  logout: () => void;
}
```

> **주의:** `persist` 미들웨어를 사용하지 않는다. 새로고침 시 토큰이 사라지고 로그인 화면으로 이동하는 것이 의도된 동작이다.

### 3.2 로그인 흐름

```
POST /api/v1/auth/login
  → 응답: { accessToken: "..." }
  → Zustand authStore에 accessToken 저장
  → GET /api/v1/users/me 호출로 currentUser 초기화 (선택)
  → /todos로 리다이렉트
```

### 3.3 401 자동 처리

모든 401 응답에서 Zustand 상태를 초기화하고 `/auth/login`으로 리다이렉트한다. Axios 응답 인터셉터에서 처리한다. (§4 참조)

### 3.4 로그아웃

서버 API 호출 없이 클라이언트에서만 처리한다.

```typescript
// 로그아웃 처리
authStore.logout();          // Zustand 상태 초기화
queryClient.clear();         // TanStack Query 캐시 전체 삭제
navigate('/auth/login');
```

---

## 4. HTTP 클라이언트 설정

### 4.1 Axios 인스턴스 (`src/api/httpClient.ts`)

```typescript
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터: JWT 자동 주입
httpClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 처리
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default httpClient;
```

### 4.2 에러 응답 타입 추출

```typescript
import { ApiError } from '../types/api.types';

function getApiError(error: unknown): ApiError | null {
  if (axios.isAxiosError(error) && error.response?.data?.error) {
    return error.response.data.error as ApiError;
  }
  return null;
}
```

---

## 5. API 엔드포인트 레퍼런스

### 5.1 인증 (Auth)

#### 회원가입
```
POST /api/v1/auth/register
Content-Type: application/json

Body: { email, password, name }

성공: 201 → UserResponse
실패: 400 (필드 누락), 409 EMAIL_DUPLICATE
```

- 성공 후 기본 카테고리(일반·업무·개인) 3개가 자동 생성된다.
- 회원가입 성공 후 자동 로그인하지 않고 로그인 화면으로 이동한다.

#### 로그인
```
POST /api/v1/auth/login
Content-Type: application/json

Body: { email, password }

성공: 200 → { accessToken: string }
실패: 400 (필드 누락), 401 UNAUTHORIZED
```

---

### 5.2 사용자 (Users)

> 모든 엔드포인트에 `Authorization: Bearer <token>` 필요

#### 내 프로필 조회
```
GET /api/v1/users/me

성공: 200 → UserResponse
실패: 401
```

#### 내 프로필 수정
```
PATCH /api/v1/users/me
Content-Type: application/json

Body: { name?, newPassword? }  // 하나 이상 필수

성공: 200 → UserResponse
실패: 400, 401
```

- `name`만, `newPassword`만, 또는 둘 다 보낼 수 있다.
- 비밀번호 변경 시 기존 JWT는 그대로 유효하다. (재로그인 불필요)

---

### 5.3 할일 (Todos)

> 모든 엔드포인트에 `Authorization: Bearer <token>` 필요

#### 할일 목록 조회
```
GET /api/v1/todos
GET /api/v1/todos?categoryId=<uuid>
GET /api/v1/todos?dueDateFrom=2026-05-01&dueDateTo=2026-05-31
GET /api/v1/todos?isCompleted=false
GET /api/v1/todos?categoryId=<uuid>&dueDateFrom=...&dueDateTo=...&isCompleted=false

성공: 200 → TodoResponse[]  (빈 목록이면 [] 반환)
실패: 400 (날짜 형식 오류), 401
```

쿼리 파라미터 상세:

| 파라미터 | 타입 | 설명 |
|---------|------|------|
| `categoryId` | UUID string | 해당 카테고리 할일만 반환 |
| `dueDateFrom` | YYYY-MM-DD | 마감일 범위 시작일 |
| `dueDateTo` | YYYY-MM-DD | 마감일 범위 종료일 |
| `isCompleted` | boolean | `true` = 완료만, `false` = 미완료만, 생략 = 전체 |

- 기본 정렬: `createdAt` 내림차순 (최신 등록 순)
- `dueDateFrom > dueDateTo`이면 400 반환

#### 할일 단건 조회
```
GET /api/v1/todos/:id

성공: 200 → TodoResponse
실패: 401, 403 FORBIDDEN, 404 NOT_FOUND
```

수정 화면 진입 시 pre-fill 용도로 호출한다.

#### 할일 등록
```
POST /api/v1/todos
Content-Type: application/json

Body: { title, categoryId, description?, dueDate? }

성공: 201 → TodoResponse  (isCompleted: false로 초기화)
실패: 400 (title/categoryId 누락, 날짜 형식), 401
```

- `title`, `categoryId`는 필수.
- `dueDate`는 `YYYY-MM-DD` 형식.
- `categoryId`는 기본 카테고리 또는 자신의 카테고리여야 한다.

#### 할일 수정
```
PATCH /api/v1/todos/:id
Content-Type: application/json

Body: { title?, description?, dueDate?, categoryId? }  // 변경할 필드만

성공: 200 → TodoResponse  (updatedAt 자동 갱신)
실패: 400, 401, 403 FORBIDDEN, 404 NOT_FOUND
```

#### 할일 삭제
```
DELETE /api/v1/todos/:id

성공: 204 (본문 없음)
실패: 401, 403 FORBIDDEN, 404 NOT_FOUND
```

#### 할일 완료 처리 (토글)
```
PATCH /api/v1/todos/:id/complete

성공: 200 → TodoResponse  (isCompleted 반전 저장)
실패: 401, 403 FORBIDDEN, 404 NOT_FOUND
```

- 요청 본문 없음. 매번 호출 시 `isCompleted` 값이 반전된다 (true↔false).
- 낙관적 업데이트와 함께 사용하며, 실패 시 롤백 처리.

---

### 5.4 카테고리 (Categories)

> 모든 엔드포인트에 `Authorization: Bearer <token>` 필요

#### 카테고리 목록 조회
```
GET /api/v1/categories

성공: 200 → CategoryResponse[]
실패: 401
```

응답에는 **사용자별 기본 카테고리**(isDefault: true)와 **사용자 정의 카테고리**(isDefault: false)가 함께 포함된다.

```json
[
  { "id": "...", "userId": "<내 UUID>", "name": "일반", "isDefault": true, "createdAt": "..." },
  { "id": "...", "userId": "<내 UUID>", "name": "업무", "isDefault": true, "createdAt": "..." },
  { "id": "...", "userId": "<내 UUID>", "name": "개인", "isDefault": true, "createdAt": "..." },
  { "id": "...", "userId": "<내 UUID>", "name": "사이드 프로젝트", "isDefault": false, "createdAt": "..." }
]
```

#### 카테고리 추가
```
POST /api/v1/categories
Content-Type: application/json

Body: { name }

성공: 201 → CategoryResponse  (isDefault: false, userId: 내 id)
실패: 400, 401, 409 CATEGORY_NAME_DUPLICATE
```

- 기본 카테고리명(일반·업무·개인)과 동일한 이름도 409 반환.

#### 카테고리 수정
```
PATCH /api/v1/categories/:id
Content-Type: application/json

Body: { name }

성공: 200 → CategoryResponse
실패: 400, 401, 403 FORBIDDEN, 404 NOT_FOUND, 409 CATEGORY_NAME_DUPLICATE
```

- 기본 카테고리(`isDefault: true`) 수정 시도 → 403.
- 타인 카테고리 수정 시도 → 403.

#### 카테고리 삭제
```
DELETE /api/v1/categories/:id

성공: 204 (본문 없음)
실패: 401, 403 FORBIDDEN, 404 NOT_FOUND, 409 CATEGORY_HAS_TODOS
```

- 기본 카테고리 삭제 시도 → 403.
- 연결된 할일이 있는 카테고리 삭제 시도 → 409 `CATEGORY_HAS_TODOS`.

---

## 6. 응답 타입 정의

`src/types/` 디렉토리에 아래 타입을 정의한다.

### `api.types.ts`

```typescript
export interface ApiError {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  error: ApiError;
}
```

에러 코드 목록:

| code | HTTP | 설명 |
|------|------|------|
| `BAD_REQUEST` | 400 | 필수 필드 누락, 형식 오류 |
| `UNAUTHORIZED` | 401 | 토큰 없음, 만료, 인증 실패 |
| `FORBIDDEN` | 403 | 접근 권한 없음 (소유권 위반, 기본 카테고리 조작) |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `EMAIL_DUPLICATE` | 409 | 이메일 중복 |
| `CATEGORY_NAME_DUPLICATE` | 409 | 카테고리명 중복 |
| `CATEGORY_HAS_TODOS` | 409 | 연결 할일이 있어 삭제 불가 |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 내부 오류 |

### `auth.types.ts`

```typescript
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}
```

### `user.types.ts`

```typescript
export interface User {
  id: string;           // UUID
  email: string;
  name: string;
  createdAt: string;    // ISO 8601 datetime
  updatedAt: string;    // ISO 8601 datetime
}

export interface UpdateProfileRequest {
  name?: string;
  newPassword?: string;
}
```

### `todo.types.ts`

```typescript
export interface Todo {
  id: string;           // UUID
  userId: string;       // UUID
  categoryId: string;   // UUID
  title: string;
  description: string | null;
  dueDate: string | null;  // YYYY-MM-DD 형식
  isCompleted: boolean;
  createdAt: string;    // ISO 8601 datetime
  updatedAt: string;    // ISO 8601 datetime
}

export interface CreateTodoRequest {
  title: string;
  categoryId: string;
  description?: string | null;
  dueDate?: string | null;  // YYYY-MM-DD
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string | null;
  dueDate?: string | null;  // YYYY-MM-DD
  categoryId?: string;
}

export interface TodoFilter {
  categoryId?: string;
  dueDateFrom?: string;  // YYYY-MM-DD
  dueDateTo?: string;    // YYYY-MM-DD
  isCompleted?: boolean;
}
```

### `category.types.ts`

```typescript
export interface Category {
  id: string;           // UUID
  userId: string;       // UUID
  name: string;
  isDefault: boolean;
  createdAt: string;    // ISO 8601 datetime
}

export interface CreateCategoryRequest {
  name: string;
}

export interface UpdateCategoryRequest {
  name: string;
}
```

---

## 7. 에러 처리

### 7.1 표준 에러 응답 형식

모든 에러 응답은 아래 형식을 따른다.

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자에게 표시할 한국어 메시지"
  }
}
```

### 7.2 화면별 에러 처리 패턴

#### 회원가입 / 로그인
```typescript
try {
  await authApi.register(data);
} catch (error) {
  const apiError = getApiError(error);
  if (apiError?.code === 'EMAIL_DUPLICATE') {
    setFieldError('email', '이미 사용 중인 이메일입니다.');
  } else {
    setGlobalError(apiError?.message ?? '오류가 발생했습니다.');
  }
}
```

#### 할일 / 카테고리 조작 (TanStack Query mutation)
```typescript
useMutation({
  mutationFn: createTodo,
  onError: (error) => {
    const apiError = getApiError(error);
    toast.error(apiError?.message ?? '오류가 발생했습니다.');
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todos });
    navigate('/todos');
  },
});
```

#### 카테고리 삭제 — 연결 할일 존재
```typescript
if (apiError?.code === 'CATEGORY_HAS_TODOS') {
  alert('연결된 할일이 있어 삭제할 수 없습니다. 할일을 다른 카테고리로 이동하거나 먼저 삭제하세요.');
}
```

### 7.3 낙관적 업데이트 (할일 완료 토글)

```typescript
useMutation({
  mutationFn: (id: string) => todoApi.completeTodo(id),
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: QUERY_KEYS.todos });
    const previous = queryClient.getQueryData<Todo[]>(QUERY_KEYS.todos);

    queryClient.setQueryData<Todo[]>(QUERY_KEYS.todos, (old) =>
      old?.map((todo) =>
        todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
      )
    );
    return { previous };
  },
  onError: (_err, _id, context) => {
    queryClient.setQueryData(QUERY_KEYS.todos, context?.previous);
    toast.error('완료 처리에 실패했습니다. 다시 시도해 주세요.');
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todos });
  },
});
```

---

## 8. 화면별 API 호출 패턴

### SCR-01 — 회원가입 화면

```
POST /api/v1/auth/register
  → 성공: 201 → /auth/login으로 이동
  → 실패 409 EMAIL_DUPLICATE: 이메일 필드 오류 표시
  → 실패 400: 필드 오류 표시
```

### SCR-02 — 로그인 화면

```
POST /api/v1/auth/login
  → 성공: 200 → accessToken Zustand 저장 → /todos로 이동
  → 실패 401: "이메일 또는 비밀번호가 올바르지 않습니다." 표시
```

### SCR-03 — 할일 목록 화면 (메인)

```
// 마운트 시
GET /api/v1/categories          → 카테고리 필터 목록 채우기
GET /api/v1/todos[?filters]     → 할일 목록 렌더링

// 필터 변경 시
GET /api/v1/todos?categoryId=...&dueDateFrom=...&isCompleted=...

// 완료 토글
PATCH /api/v1/todos/:id/complete  → 낙관적 업데이트

// 삭제
DELETE /api/v1/todos/:id  → 확인 다이얼로그 후 호출 → 캐시 갱신
```

### SCR-04 — 할일 등록/수정 화면

```
// 공통 (마운트 시 카테고리 목록)
GET /api/v1/categories

// 등록 모드
POST /api/v1/todos
  → 성공: 201 → todos 캐시 무효화 → /todos로 이동

// 수정 모드 (URL에 :id 있을 때)
GET /api/v1/todos/:id   → 폼 pre-fill
PATCH /api/v1/todos/:id
  → 성공: 200 → todos 캐시 무효화 → /todos로 이동
```

### SCR-05 — 카테고리 관리 화면

```
// 마운트 시
GET /api/v1/categories

// 추가
POST /api/v1/categories
  → 성공: 201 → categories 캐시 무효화

// 수정 (인라인)
PATCH /api/v1/categories/:id
  → 성공: 200 → categories 캐시 무효화

// 삭제
DELETE /api/v1/categories/:id
  → 성공: 204 → categories 캐시 무효화
  → 실패 409 CATEGORY_HAS_TODOS: 오류 메시지 표시
```

### SCR-06 — 개인정보 수정 화면

```
// 마운트 시
GET /api/v1/users/me  → 현재 이름 pre-fill

// 저장
PATCH /api/v1/users/me
  → 성공: 200 → Zustand currentUser 갱신 → "저장이 완료되었습니다." 표시
```

---

## 9. 주요 구현 주의사항

### 9.1 dueDate 형식

백엔드는 `dueDate`를 항상 `YYYY-MM-DD` 문자열로 반환한다. 프론트엔드에서 날짜 선택기(date picker)와 연동 시 변환에 주의한다.

```typescript
// Date 객체 → API 전송 형식
const toApiDate = (date: Date): string =>
  date.toISOString().split('T')[0];

// API 응답 → Date 객체 (필요 시)
const fromApiDate = (dateStr: string): Date =>
  new Date(dateStr + 'T00:00:00');
```

### 9.2 카테고리 목록 — 기본 카테고리 구분

`isDefault: true`인 항목은 수정·삭제 버튼을 비활성화하고 "(기본)" 라벨을 표시한다.

```typescript
const isEditable = (category: Category) => !category.isDefault;
```

### 9.3 TanStack Query 쿼리 키

```typescript
// src/utils/queryKeys.ts
export const QUERY_KEYS = {
  todos: ['todos'] as const,
  todo: (id: string) => ['todos', id] as const,
  categories: ['categories'] as const,
  me: ['users', 'me'] as const,
};
```

필터가 변경될 때 목록을 자동 갱신하려면 필터 값을 쿼리 키에 포함시킨다.

```typescript
useQuery({
  queryKey: [...QUERY_KEYS.todos, filters],
  queryFn: () => todoApi.getTodos(filters),
});
```

### 9.4 비인증 보호 라우트

```typescript
// src/components/common/ProtectedRoute.tsx
function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  return <>{children}</>;
}
```

### 9.5 로그아웃 후 뒤로 가기 방지

로그아웃 시 `navigate('/auth/login', { replace: true })`를 사용해 히스토리를 교체한다. `ProtectedRoute`가 비인증 상태를 감지하므로 뒤로 가기 시에도 자동으로 로그인 화면으로 이동된다.

### 9.6 비밀번호 변경 후 동작

`PATCH /api/v1/users/me`로 비밀번호를 변경해도 현재 JWT는 계속 유효하다. 별도의 재로그인 처리가 필요하지 않다.

### 9.7 isCompleted 쿼리 파라미터 전송

`false` 값을 쿼리스트링으로 전송할 때 Axios가 생략하지 않도록 명시적으로 처리한다.

```typescript
const getTodos = (filter: TodoFilter) => {
  const params: Record<string, unknown> = {};
  if (filter.categoryId) params.categoryId = filter.categoryId;
  if (filter.dueDateFrom) params.dueDateFrom = filter.dueDateFrom;
  if (filter.dueDateTo) params.dueDateTo = filter.dueDateTo;
  if (filter.isCompleted !== undefined) params.isCompleted = filter.isCompleted;
  return httpClient.get<Todo[]>('/api/v1/todos', { params });
};
```

### 9.8 UUID 유효성

경로 파라미터로 유효하지 않은 UUID 형식을 전달하면 서버가 `400 BAD_REQUEST`를 반환한다. 클라이언트에서 UUID 형식을 검증하거나 항상 API에서 받아온 id 값만 사용한다.
