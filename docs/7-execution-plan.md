# 실행계획서 (Execution Plan)

**프로젝트명:** TodoListApp
**버전:** 1.0.0
**작성일:** 2026-05-13
**참조 문서:** `docs/2-prd.md`, `docs/4-project-structure.md`, `docs/5-arch-diagram.md`, `docs/6-erd.md`

---

## 개요

| 구분 | 내용 |
|------|------|
| 개발 기간 | 3일 |
| 기술 스택 | PostgreSQL 17 / Node.js LTS + Express (JavaScript) / React 19 + TypeScript (FE 전용) |
| 레이어 원칙 | Router → Middleware → Controller → Service → Repository → DB (단방향) |
| 인증 방식 | JWT — Zustand 메모리 저장 (localStorage 사용 금지) |

### 의존성 요약

```
[DB 구성] → [BE 초기 설정] → [BE 미들웨어] → [BE 인증 API]
                                               → [BE 카테고리 API]
                                               → [BE 할일 API]
                                               → [BE 사용자 API]
[FE 초기 설정] → [FE 공통 설정] → [SCR-01 회원가입]
                                → [SCR-02 로그인]   ─→ [SCR-03 할일 목록]
                                                    ─→ [SCR-04 할일 등록/수정]
                                                    ─→ [SCR-05 카테고리 관리]
                                                    ─→ [SCR-06 개인정보 수정]
```

---

## Phase 1 — 데이터베이스 (Day 1 오전)

### TASK-DB-01. PostgreSQL 17 환경 구성

**의존성:** 없음 (시작점)

- [x] PostgreSQL 17 인스턴스 실행 확인
- [x] `todolist_app` 데이터베이스 생성
- [x] 접속 사용자/권한 설정
- [x] `.env.example`에 DB 접속 정보 키 정의 (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`)

**완료 조건**
- [x] `psql -U <user> -d todolist_app -c "SELECT version();"` 정상 출력
- [x] `.env.example` 파일에 모든 DB 키 포함

---

### TASK-DB-02. 스키마 마이그레이션 실행

**의존성:** TASK-DB-01

- [x] `uuid-ossp` 확장 활성화 확인 (`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`)
- [x] `database/schema.sql` 실행 (`psql -f database/schema.sql`)
- [x] 테이블 3개 생성 확인: `users`, `categories`, `todos`
- [x] 인덱스 5개 생성 확인

**완료 조건**
- [x] `\dt` — `users`, `categories`, `todos` 3개 테이블 존재
- [x] `\di` — 5개 인덱스 존재 (`idx_todos_user_id` 등)
- [x] FK 제약 확인: `todos.category_id → ON DELETE RESTRICT`, `todos.user_id → ON DELETE CASCADE`

---

### TASK-DB-03. 기본 카테고리 시드 데이터 확인

**의존성:** TASK-DB-02

- [x] 회원가입 시 사용자별 기본 카테고리 3개 생성 확인 (일반·업무·개인, `user_id = 신규 사용자`, `is_default = TRUE`)

**완료 조건**
- [x] `SELECT name FROM categories WHERE is_default = true;` → 3개 행 반환
- [x] `SELECT user_id FROM categories WHERE is_default = true;` → 전부 NULL

---

## Phase 2 — 백엔드 (Day 1 오후 ~ Day 2)

### TASK-BE-01. 프로젝트 초기 설정

**의존성:** TASK-DB-01

- [x] `backend/` 디렉토리 생성
- [x] `npm init` + 디렉토리 구조 생성: `src/config/`, `src/routes/`, `src/controllers/`, `src/services/`, `src/repositories/`, `src/middlewares/`, `src/types/`, `src/utils/`
- [x] 패키지 설치: `express`, `pg`, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`, `swagger-ui-express`
- [x] 환경 변수 설정: `NODE_ENV`, `PORT`, `DB_*`, `JWT_SECRET`(32자↑), `JWT_EXPIRES_IN`(24h), `BCRYPT_SALT_ROUNDS`(≥10), `CORS_ORIGIN`
- [x] `src/config/env.js` 작성 — 필수 키 누락 시 서버 시작 거부
- [x] `src/db/pool.js` 작성 — `pg.Pool` 연결 풀 설정
- [x] Express 앱 진입점 `src/app.js` 작성

**완료 조건**
- [x] `npm run dev` 실행 시 `Listening on port 3000` 로그 출력
- [x] 환경 변수 누락 시 명확한 에러 메시지 후 프로세스 종료
- [x] `GET /health` → `200 { status: "ok" }` 응답
- [x] `GET /api-docs` → Swagger UI 서빙 (`swagger/swagger.json` 기반)
- [x] HTTP 요청 로깅 미들웨어 (메서드, 경로, 상태 코드, 응답 시간)

---

### TASK-BE-02. 공통 미들웨어

**의존성:** TASK-BE-01

- [x] `src/middlewares/authenticate.js` — `Authorization: Bearer <JWT>` 검증, `req.userId` 설정
- [x] `src/middlewares/validate.js` — 요청 바디 필수 필드 검증 헬퍼
- [x] `src/middlewares/error-handler.js` — 전역 에러 핸들러, 표준 응답 형식: `{ error: { code, message } }`, PostgreSQL 22P02(잘못된 UUID 형식) → 400 처리
- [x] CORS 미들웨어 설정 (허용 메서드: GET/POST/PATCH/DELETE/OPTIONS)
- [x] `src/utils/jwt.js` — `createToken(payload)`, `verifyToken(token)` 유틸
- [x] `src/utils/password.js` — `hashPassword(plain)`, `comparePassword(plain, hash)` 유틸
- [x] `src/utils/format.js` — DB row → camelCase 변환 유틸 (`formatUser`, `formatCategory`, `formatTodo`)
- [x] `src/types/errors.js` — `AppError`, `NotFoundError`, `ForbiddenError`, `ConflictError` 커스텀 에러 클래스

**완료 조건**
- [x] 토큰 없이 보호된 라우트 요청 → `401 { error: { code: "UNAUTHORIZED", message: "..." } }`
- [x] 만료된 토큰 → `401` 응답
- [x] 존재하지 않는 라우트 → `404` 응답
- [x] 서버 에러 → `500` 응답, 운영 환경에서 스택 트레이스 미노출

---

### TASK-BE-03. 인증 API (Auth)

**의존성:** TASK-BE-02, TASK-DB-03

**엔드포인트:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`

- [x] `src/repositories/user.repository.js` — `findByEmail`, `create`, `findById`, `update` (파라미터화 쿼리 필수)
- [x] `src/repositories/category.repository.js` — `createDefaultCategories(userId)` 포함
- [x] `src/services/auth.service.js`
  - [x] `register`: 이메일 중복 검사(BR-U-01) → bcrypt 해시(BR-U-02) → 사용자 생성 → 기본 카테고리 3개 자동 생성(BR-C-03)
  - [x] `login`: 사용자 조회 → bcrypt 비교 → JWT 발급
- [x] `src/controllers/auth.controller.js` — 요청/응답 처리
- [x] `src/routes/auth.routes.js` — 라우터 등록

**완료 조건**
- [x] `POST /api/v1/auth/register` 정상 요청 → `201`, DB에 사용자 1명 + 카테고리 3개 생성 확인
- [x] 중복 이메일 → `409 { error: { code: "EMAIL_DUPLICATE" } }`
- [x] 필수 필드 누락 → `400`
- [x] `POST /api/v1/auth/login` 정상 요청 → `200 { accessToken }`, JWT payload에 `userId`, `email` 포함
- [x] 잘못된 자격증명 → `401`, 이유 미구분 (보안)
- [x] DB에 비밀번호 평문 저장 안 됨 확인

---

### TASK-BE-04. 사용자 API (Users)

**의존성:** TASK-BE-03

**엔드포인트:** `GET /api/v1/users/me`, `PATCH /api/v1/users/me`

- [x] `src/services/user.service.js`
  - [x] `getProfile(userId)`: password 필드 제외 반환
  - [x] `updateProfile(userId, { name?, newPassword? })`: 비밀번호 변경 시 bcrypt 재해시
- [x] `src/controllers/user.controller.js`
- [x] `src/routes/user.routes.js` — `authenticate` 미들웨어 적용

**완료 조건**
- [x] 유효한 JWT → `GET /api/v1/users/me` → `200 { id, email, name, createdAt, updatedAt }` (password 미포함)
- [x] 이름 수정 → `200`, DB `updated_at` 갱신 확인
- [x] 비밀번호 변경 → 새 비밀번호로 로그인 성공 확인
- [x] 토큰 없음 → `401`

---

### TASK-BE-05. 카테고리 API (Categories)

**의존성:** TASK-BE-03

**엔드포인트:** `GET /api/v1/categories`, `POST /api/v1/categories`, `PATCH /api/v1/categories/:id`, `DELETE /api/v1/categories/:id`

- [x] `src/repositories/category.repository.js` 완성
  - [x] `findAll(userId)`: 기본 카테고리 + 사용자 카테고리 통합 조회
  - [x] `findById`, `create`, `update`, `delete`, `countTodosByCategory`
- [x] `src/services/category.service.js`
  - [x] `getCategories(userId)`: 기본 + 사용자 정의 반환
  - [x] `createCategory`: 이름 중복 검사
  - [x] `updateCategory`: BR-C-01 기본 카테고리 수정 금지
  - [x] `deleteCategory`: BR-C-01 기본 카테고리 삭제 금지, BR-C-02 할일 존재 시 삭제 거부
- [x] `src/controllers/category.controller.js`
- [x] `src/routes/category.routes.js` — `authenticate` 미들웨어 적용

**완료 조건**
- [x] `GET /api/v1/categories` → 기본 카테고리 3개 + 사용자 정의 카테고리 반환
- [x] `POST /api/v1/categories` 정상 → `201`, `is_default = false`, `user_id = 현재 사용자`
- [x] 중복 카테고리명 → `409`
- [x] `PATCH /api/v1/categories/:id` 기본 카테고리 시도 → `403`
- [x] `DELETE /api/v1/categories/:id` 연결 할일 존재 시 → `409`
- [x] `DELETE /api/v1/categories/:id` 기본 카테고리 시도 → `403`
- [x] 타인 카테고리 접근 → `403`

---

### TASK-BE-06. 할일 API (Todos)

**의존성:** TASK-BE-05

**엔드포인트:** `GET /api/v1/todos`, `POST /api/v1/todos`, `GET /api/v1/todos/:id`, `PATCH /api/v1/todos/:id`, `DELETE /api/v1/todos/:id`, `PATCH /api/v1/todos/:id/complete`

- [x] `src/repositories/todo.repository.js`
  - [x] `findByUserIdWithFilters(userId, { categoryId?, dueDateFrom?, dueDateTo?, isCompleted? })` — 동적 파라미터화 쿼리
  - [x] `findById`, `create`, `update`, `delete`
- [x] `src/services/todo.service.js`
  - [x] `getTodos(userId, filters)`: 자신의 할일만 반환, 등록일 역순
  - [x] `createTodo`: BR-T-01 categoryId 필수, 카테고리 소유권 검증
  - [x] `getTodoById`: BR-T-04 소유권 검증
  - [x] `updateTodo`: 단건 조회 선행(UC-T-05 include), 소유권 검증
  - [x] `deleteTodo`: 소유권 검증
  - [x] `completeTodo`: 소유권 검증, `is_completed = true` 저장
- [x] `src/controllers/todo.controller.js`
- [x] `src/routes/todo.routes.js` — `authenticate` 미들웨어 적용

**완료 조건**
- [x] `GET /api/v1/todos` → 자신의 할일만 반환 (타인 할일 미포함)
- [x] 필터 쿼리 파라미터 동작 확인: `?categoryId=`, `?dueDateFrom=&dueDateTo=`, `?isCompleted=`
- [x] `POST /api/v1/todos` title 누락 → `400`; categoryId 누락 → `400`
- [x] `POST /api/v1/todos` 정상 → `201`, `is_completed = false`
- [x] `GET /api/v1/todos/:id` 타인 할일 → `403`; 없는 ID → `404`
- [x] `PATCH /api/v1/todos/:id` 정상 → `200`, `updated_at` 갱신
- [x] `DELETE /api/v1/todos/:id` 정상 → `204`
- [x] `PATCH /api/v1/todos/:id/complete` → `200 { isCompleted: true }`
- [x] 파라미터화 쿼리 사용 확인 (SQL Injection 방지)

---

## Phase 3 — 프론트엔드 (Day 2 오후 ~ Day 3)

### TASK-FE-01. 프로젝트 초기 설정

**의존성:** 없음 (BE와 병렬 시작 가능)

- [x] `frontend/` 디렉토리 생성
- [x] Vite + React 19 + TypeScript 프로젝트 생성
- [x] 패키지 설치: `react-router-dom`, `zustand`, `@tanstack/react-query`, `axios`
- [x] `tsconfig.json` — `strict: true` 활성화
- [x] `vite.config.ts` — API 프록시 설정 (`/api → http://localhost:3000`)
- [x] ESLint, Prettier 설정
- [x] `.env.example` 작성 (`VITE_API_BASE_URL`)
- [x] 디렉토리 구조 생성: `src/pages/`, `src/components/`, `src/hooks/`, `src/api/`, `src/stores/`, `src/types/`, `src/utils/`

**완료 조건**
- [x] `npm run dev` — 브라우저에서 앱 접속 가능
- [x] `npm run build` — TypeScript 컴파일 에러 없음

---

### TASK-FE-02. 공통 기반 설정

**의존성:** TASK-FE-01

- [x] **TypeScript 타입 정의** (`src/types/`)
  - [x] `auth.types.ts`: `LoginRequest`, `RegisterRequest`, `AuthResponse`, `User`
  - [x] `todo.types.ts`: `Todo`, `CreateTodoRequest`, `UpdateTodoRequest`, `TodoFilter`
  - [x] `category.types.ts`: `Category`, `CreateCategoryRequest`, `UpdateCategoryRequest`
  - [x] `api.types.ts`: `ApiError`, `ApiResponse<T>`

- [x] **HTTP 클라이언트** (`src/api/httpClient.ts`)
  - [x] Axios 인스턴스 생성 (`baseURL = VITE_API_BASE_URL`)
  - [x] 요청 인터셉터: `Authorization: Bearer <token>` 자동 주입
  - [x] 응답 인터셉터: `401` → 로그아웃 처리 + 로그인 페이지 리다이렉트

- [x] **API 클라이언트** (`src/api/`)
  - [x] `authApi.ts`: `register`, `login`
  - [x] `todoApi.ts`: `getTodos`, `getTodo`, `createTodo`, `updateTodo`, `deleteTodo`, `completeTodo`
  - [x] `categoryApi.ts`: `getCategories`, `createCategory`, `updateCategory`, `deleteCategory`
  - [x] `userApi.ts`: `getProfile`, `updateProfile`

- [x] **Zustand 인증 스토어** (`src/stores/authStore.ts`)
  - [x] 상태: `accessToken`, `currentUser`, `isAuthenticated`
  - [x] 액션: `setToken`, `setCurrentUser`, `logout`
  - [x] `persist` 미들웨어 사용 금지 (메모리 저장만)

- [x] **TanStack Query 설정** (`src/main.tsx`)
  - [x] `QueryClient` 생성 (`staleTime: 5분`, retry: 1)
  - [x] `QueryClientProvider`로 앱 감싸기

- [x] **React Router 설정** (`src/router.tsx`)
  - [x] 라우트 정의: `/auth/register`, `/auth/login`, `/todos`, `/todos/new`, `/todos/:id`, `/categories`, `/profile`
  - [x] `ProtectedRoute` 컴포넌트: 비인증 시 `/auth/login` 리다이렉트

- [x] **유틸리티** (`src/utils/`)
  - [x] `queryKeys.ts`: TanStack Query 키 상수
  - [x] `validators.ts`: `validateEmail`, `validatePassword`, `validateDateRange`
  - [x] `dateFormatter.ts`: 날짜 포맷 함수 (YYYY-MM-DD, 한국어 표시)

- [x] **공통 컴포넌트** (`src/components/common/`)
  - [x] `Button.tsx`: variant(primary/secondary/danger), loading 상태 지원
  - [x] `Input.tsx`: type, error 메시지 지원
  - [x] `Modal.tsx`: 확인/취소, ESC 키 닫기
  - [x] `LoadingSpinner.tsx`
  - [x] `ErrorMessage.tsx`: 재시도 버튼 포함

**완료 조건**
- [x] `useAuthStore`에서 토큰 저장/삭제 정상 동작
- [x] HTTP 클라이언트 요청 시 Authorization 헤더 자동 포함 확인 (개발자 도구 네트워크 탭)
- [x] 401 응답 시 로그인 화면으로 자동 이동
- [x] `ProtectedRoute`: 토큰 없으면 `/auth/login`으로 리다이렉트

---

### TASK-FE-03. SCR-01 회원가입 화면

**의존성:** TASK-FE-02

- [x] `src/hooks/auth/useRegister.ts` — `useMutation` + `authApi.register`
- [x] `src/components/auth/RegisterForm.tsx`
  - [x] 입력 필드: 이름, 이메일, 비밀번호, 비밀번호 확인
  - [x] 실시간 유효성 검증 (이메일 형식, 비밀번호 8자↑, 비밀번호 일치)
  - [x] 유효하지 않을 때 저장 버튼 비활성화
- [x] `src/pages/auth/RegisterPage.tsx`

**완료 조건**
- [x] 이메일 형식 오류 → 필드 하단에 에러 메시지 표시
- [x] 비밀번호 불일치 → "비밀번호가 일치하지 않습니다." 표시
- [x] 가입 성공 → `/auth/login`으로 이동
- [x] 중복 이메일 → "이미 사용 중인 이메일입니다." 표시
- [x] API 호출 중 버튼 비활성화 (중복 요청 방지)

---

### TASK-FE-04. SCR-02 로그인 화면

**의존성:** TASK-FE-02

- [x] `src/hooks/auth/useLogin.ts` — `useMutation` + `authApi.login` + Zustand 토큰 저장
- [x] `src/components/auth/LoginForm.tsx`
  - [x] 입력 필드: 이메일, 비밀번호
  - [x] 에러 메시지 표시 (통합 메시지)
- [x] `src/pages/auth/LoginPage.tsx`

**완료 조건**
- [x] 로그인 성공 → Zustand `accessToken` 저장 확인 (개발자 도구) + `/todos`로 이동
- [x] 잘못된 자격증명 → "이메일 또는 비밀번호가 올바르지 않습니다." 표시
- [x] 이미 로그인 상태에서 `/auth/login` 접근 → `/todos`로 리다이렉트

---

### TASK-FE-05. SCR-03 할일 목록 화면

**의존성:** TASK-FE-04, TASK-BE-06

- [x] `src/hooks/todos/useTodos.ts` — `useQuery` + `todoApi.getTodos(filters)`
- [x] `src/hooks/todos/useCompleteTodo.ts` — `useMutation` + 낙관적 업데이트(onMutate/onError 롤백)
- [x] `src/hooks/todos/useDeleteTodo.ts` — `useMutation` + 쿼리 무효화
- [x] `src/components/layout/Header.tsx` — 좌측 사이드바 (로고, 네비게이션, 사용자명, 로그아웃 버튼)
- [x] `src/components/todos/TodoCalendar.tsx` — 월별 달력 뷰 (오늘 날짜 기본 표시, 날짜 클릭 시 할일 등록 이동)
- [x] `src/components/todos/TodoFilter.tsx`
  - [x] 카테고리 드롭다운 (`useCategories` 훅 사용)
  - [x] 기간 날짜 필드 (시작일, 종료일)
  - [x] 완료 여부 탭/라디오 (전체/미완료/완료)
  - [x] 날짜 범위 유효성 검증 (시작일 > 종료일 시 경고)
  - [x] 필터 초기화 버튼
- [x] `src/components/todos/TodoCard.tsx`
  - [x] 완료 체크박스, 제목, 카테고리 배지, 마감일
  - [x] 삭제 버튼 + 확인 다이얼로그
  - [x] 완료된 할일 시각적 구분 (취소선 등)
- [x] `src/components/todos/TodoList.tsx` — 로딩/에러/빈 상태 처리
- [x] `src/pages/todos/TodoListPage.tsx`

**완료 조건**
- [x] 페이지 로드 시 달력 뷰 기본 표시 (오늘 날짜 기준 월 캘린더)
- [x] 달력/목록 뷰 토글 버튼으로 전환 가능
- [x] 달력 날짜 클릭 → `/todos/new?date=YYYY-MM-DD`로 이동 (마감일 자동 입력)
- [x] 목록 뷰: 필터 변경 시 목록 자동 갱신
- [x] 체크박스 클릭 → 낙관적 업데이트로 즉시 UI 변경, 서버 실패 시 롤백
- [x] 삭제 확인 → 성공 시 목록에서 즉시 제거
- [x] 로그아웃 → 토큰 삭제 + `/auth/login`으로 이동, 뒤로 가기 불가
- [x] 할일 없음 → "등록된 할일이 없습니다." 안내 메시지

---

### TASK-FE-06. SCR-04 할일 등록/수정 화면

**의존성:** TASK-FE-05

- [x] `src/hooks/todos/useTodo.ts` — `useQuery` + `todoApi.getTodo(id)` (ID 있을 때만 실행)
- [x] `src/hooks/todos/useCreateTodo.ts` — `useMutation` + 성공 시 `/todos`로 이동
- [x] `src/hooks/todos/useUpdateTodo.ts` — `useMutation` + 캐시 갱신 후 `/todos`로 이동
- [x] `src/components/todos/TodoForm.tsx`
  - [x] 입력 필드: 제목(필수), 설명(선택), 마감일(선택), 카테고리(필수)
  - [x] 수정 모드: `initialData`로 폼 pre-fill
  - [x] 카테고리 드롭다운 (기본 + 사용자 정의 통합)
  - [x] 실시간 유효성 검증 (제목, 카테고리 필수)
- [x] `src/pages/todos/TodoFormPage.tsx` — URL `:id` 유무로 등록/수정 모드 구분

**완료 조건**
- [x] 등록 모드: 필드 빈 상태로 시작
- [x] 수정 모드: `GET /api/v1/todos/:id` 선행 호출 후 폼 pre-fill (UC-T-05)
- [x] 제목/카테고리 미입력 → 저장 버튼 비활성화 + 에러 메시지
- [x] 저장 성공 → 할일 목록 캐시 갱신 + `/todos`로 이동
- [x] 취소 → 변경 미저장, `/todos`로 이동

---

### TASK-FE-07. SCR-05 카테고리 관리 화면

**의존성:** TASK-FE-04, TASK-BE-05

- [x] `src/hooks/categories/useCategories.ts` — `useQuery` + `categoryApi.getCategories`
- [x] `src/hooks/categories/useCreateCategory.ts` — `useMutation`
- [x] `src/hooks/categories/useUpdateCategory.ts` — `useMutation`
- [x] `src/hooks/categories/useDeleteCategory.ts` — `useMutation`
- [x] `src/components/categories/CategoryForm.tsx` — 카테고리명 입력 + 추가 버튼
- [x] `src/components/categories/CategoryItem.tsx`
  - [x] 기본 카테고리: 수정/삭제 버튼 비활성화 + "(기본)" 라벨
  - [x] 사용자 정의 카테고리: 인라인 수정 모드 (입력 필드 + 저장/취소)
  - [x] 삭제 확인 다이얼로그
- [x] `src/pages/categories/CategoryPage.tsx`

**완료 조건**
- [x] 기본 카테고리 수정/삭제 버튼 비활성화 UI 확인
- [x] 카테고리 추가 성공 → 목록 즉시 갱신
- [x] 중복 이름 → "이미 사용 중인 카테고리명입니다." 표시
- [x] 연결 할일 있는 카테고리 삭제 시도 → "연결된 할일이 있어 삭제할 수 없습니다." 표시
- [x] 인라인 수정 저장 → 목록 즉시 갱신

---

### TASK-FE-08. SCR-06 개인정보 수정 화면

**의존성:** TASK-FE-04, TASK-BE-04

- [x] `src/hooks/users/useProfile.ts` — `useQuery` + `userApi.getProfile` (프로필 단건 조회)
- [x] `src/hooks/users/useUpdateProfile.ts` — `useMutation` + 캐시 갱신 + Zustand `currentUser` 갱신
- [x] `src/components/users/ProfileForm.tsx`
  - [x] 입력 필드: 이름(현재값 표시), 새 비밀번호(선택), 비밀번호 확인(선택)
  - [x] 변경 항목 있을 때만 저장 버튼 활성화
  - [x] 비밀번호 변경 시 일치 여부 검증
- [x] `src/pages/users/ProfilePage.tsx`

**완료 조건**
- [x] 페이지 로드 시 현재 이름 자동 표시
- [x] 이름 수정 성공 → "저장이 완료되었습니다." 메시지 표시
- [x] 비밀번호 불일치 → 에러 메시지, 저장 불가
- [x] 변경 없음 → 저장 버튼 비활성화

---

## Phase 4 — 통합 검증 (Day 3)

### TASK-INT-01. 유스케이스 전체 흐름 검증

**의존성:** 모든 TASK-BE-*, TASK-FE-* 완료

- [ ] **UC-A-01 회원가입 흐름**: 회원가입 → 기본 카테고리 3개 자동 생성 확인
- [ ] **UC-A-02 로그인 흐름**: 로그인 → JWT Zustand 저장 → 할일 목록 이동
- [ ] **UC-A-03 로그아웃 흐름**: 로그아웃 → 토큰 삭제 → 로그인 화면, 뒤로 가기 접근 불가
- [ ] **UC-T-01~04 할일 CRUD**: 등록 → 수정 (단건 조회 선행) → 완료 처리 → 삭제
- [ ] **UC-C-01~03 카테고리 CRUD**: 추가 → 수정 → 삭제 (할일 없을 때)
- [ ] **UC-F-01~05 필터링**: 카테고리/기간/완료여부/복합 필터 전부 동작 확인
- [ ] **UC-U-01 개인정보 수정**: 이름 수정 + 비밀번호 변경 후 재로그인 확인

---

### TASK-INT-02. 보안 및 비즈니스 규칙 검증

**의존성:** TASK-INT-01

- [ ] **BR-U-01**: 동일 이메일 중복 가입 → 409 응답
- [ ] **BR-U-02**: DB에서 비밀번호 bcrypt 해시 확인 (평문 없음)
- [ ] **BR-U-04**: 사용자 탈퇴 시 할일, 카테고리 CASCADE 삭제 (DB 직접 확인)
- [ ] **BR-T-01**: categoryId 없이 할일 등록 → 400 응답
- [ ] **BR-C-01**: 기본 카테고리 수정/삭제 → 403 응답
- [ ] **BR-C-02**: 할일 있는 카테고리 삭제 → 409 응답
- [ ] **JWT 메모리 저장**: 새로고침 후 로그인 화면으로 이동 (localStorage에 토큰 없음 확인)
- [ ] **SQL Injection 방지**: 파라미터화 쿼리 사용 코드 리뷰

---

### TASK-INT-03. 반응형 UI 검증

**의존성:** TASK-FE-03 ~ TASK-FE-08

**반응형 구현 현황:**
- 데스크탑: 좌측 사이드바(220px) + 콘텐츠 영역 (flex 레이아웃)
- 모바일(≤767px): 사이드바 → 하단 고정 탭바 전환 (position: fixed; bottom: 0)
- 콘텐츠 영역: app-content__inner (max-width: 1200px; margin: 0 auto) 가운데 정렬

- [ ] 모바일 (375px): 모든 화면 레이아웃 깨짐 없음
- [ ] 태블릿 (768px): 모든 화면 레이아웃 확인
- [ ] 데스크탑 (1280px): 모든 화면 레이아웃 확인
- [ ] 터치 인터페이스: 버튼 최소 48px 확인

---

## 전체 일정 요약

| Day | 오전 | 오후 |
|-----|------|------|
| Day 1 | DB-01~03 (DB 구성·마이그레이션) | BE-01~03 (BE 초기 설정·미들웨어·인증 API) |
| Day 2 | BE-04~06 (사용자·카테고리·할일 API) | FE-01~05 (FE 초기 설정·로그인·회원가입·목록) |
| Day 3 | FE-06~08 (등록/수정·카테고리·프로필) | INT-01~03 (통합 검증·보안·반응형) |

---

## 체크리스트 — 최종 완료 기준

### 데이터베이스
- [x] TASK-DB-01 PostgreSQL 17 환경 구성
- [x] TASK-DB-02 스키마 마이그레이션 실행
- [x] TASK-DB-03 기본 카테고리 시드 확인

### 백엔드
- [x] TASK-BE-01 프로젝트 초기 설정
- [x] TASK-BE-02 공통 미들웨어
- [x] TASK-BE-03 인증 API
- [x] TASK-BE-04 사용자 API
- [x] TASK-BE-05 카테고리 API
- [x] TASK-BE-06 할일 API

### 프론트엔드
- [x] TASK-FE-01 프로젝트 초기 설정
- [x] TASK-FE-02 공통 기반 설정
- [x] TASK-FE-03 SCR-01 회원가입
- [x] TASK-FE-04 SCR-02 로그인
- [x] TASK-FE-05 SCR-03 할일 목록
- [x] TASK-FE-06 SCR-04 할일 등록/수정
- [x] TASK-FE-07 SCR-05 카테고리 관리
- [x] TASK-FE-08 SCR-06 개인정보 수정

### 통합 검증
- [ ] TASK-INT-01 유스케이스 전체 흐름
- [ ] TASK-INT-02 보안 및 비즈니스 규칙
- [ ] TASK-INT-03 반응형 UI
