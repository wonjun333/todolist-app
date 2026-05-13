# 프로젝트 구조 설계 원칙

**프로젝트명:** TodoListApp
**버전:** 1.0.0
**작성일:** 2026-05-13
**작성자:** Software Architect
**참조 문서:** `docs/1-domain-definition.md`, `docs/2-prd.md`

---

## 목차

1. [공통 최상위 원칙](#1-공통-최상위-원칙)
2. [의존성/레이어 원칙](#2-의존성레이어-원칙)
3. [코드/네이밍 원칙](#3-코드네이밍-원칙)
4. [테스트/품질 원칙](#4-테스트품질-원칙)
5. [설정/보안/운영 원칙](#5-설정보안운영-원칙)
6. [디렉토리 구조](#6-디렉토리-구조)

---

## 1. 공통 최상위 원칙

### 1.1 단일 책임 원칙 (Single Responsibility Principle)

모든 모듈, 클래스, 함수는 하나의 책임만 가진다. 변경 이유가 두 가지 이상이면 분리를 검토한다.

- 백엔드 라우터는 요청 라우팅만 담당하며 비즈니스 로직을 포함하지 않는다.
- 서비스 레이어는 비즈니스 규칙만 담당하며 HTTP 관련 코드(req, res)를 포함하지 않는다.
- 프론트엔드 컴포넌트는 렌더링만 담당하며 API 호출 로직을 직접 포함하지 않는다.

### 1.2 관심사 분리 (Separation of Concerns)

기능적 경계와 계층적 경계를 명확히 구분한다.

- 인증(auth), 할일(todos), 카테고리(categories), 사용자(users) 도메인을 독립적으로 분리한다.
- HTTP 처리, 비즈니스 로직, 데이터 접근, UI 렌더링 각 계층은 서로의 구현 세부사항을 알지 않는다.
- 공통 유틸리티는 도메인 코드와 분리된 디렉토리(`utils/`, `lib/`)에 위치한다.

### 1.3 환경 변수 관리

민감 정보 및 환경별 설정값은 코드에 하드코딩하지 않는다.

- DB 접속 정보, JWT Secret, bcrypt salt rounds 등 모든 민감 정보는 환경 변수로 관리한다.
- `.env` 파일은 절대 버전 관리 시스템(Git)에 커밋하지 않는다. `.gitignore`에 반드시 포함한다.
- `.env.example` 파일에 필요한 환경 변수 키 목록과 설명을 유지하여 팀 온보딩을 지원한다.
- 애플리케이션 시작 시 필수 환경 변수 존재 여부를 검증하고, 누락 시 즉시 프로세스를 종료한다.

### 1.4 버전 관리 전략

- `main` 브랜치는 항상 배포 가능한 상태를 유지한다.
- 기능 개발은 `feature/<도메인>-<기능명>` 형식의 브랜치에서 진행한다. 예: `feature/auth-login`
- 버그 수정은 `fix/<문제-요약>` 형식의 브랜치에서 진행한다. 예: `fix/todo-owner-check`
- 커밋 메시지는 `<type>: <한국어 또는 영문 요약>` 형식을 사용한다. 예: `feat: 할일 완료 처리 API 구현`
- `type`은 `feat`, `fix`, `refactor`, `test`, `docs`, `chore` 중 하나를 사용한다.

### 1.5 일관성 원칙

코드베이스 전반에 걸쳐 동일한 패턴과 컨벤션을 적용한다.

- 동일한 문제는 동일한 방식으로 해결한다. 예: 에러 처리 방식, API 응답 형식.
- 개인 취향이 아닌 팀 합의 컨벤션을 우선한다.
- ESLint, Prettier 설정을 통해 자동으로 일관성을 강제한다.

---

## 2. 의존성/레이어 원칙

### 2.1 백엔드 레이어 구조

백엔드는 다음 5개 레이어로 구성되며, 의존 방향은 단방향(위에서 아래로)으로만 흐른다.

```
[Client] → Route → Controller → Service → Repository → [PostgreSQL DB]
```

| 레이어 | 위치 | 역할 |
|--------|------|------|
| Route | `src/routes/` | HTTP 메서드와 경로를 Controller에 연결. 미들웨어 체인 구성(인증, 검증). |
| Controller | `src/controllers/` | `req`, `res` 객체를 처리. 입력 추출 및 응답 직렬화. Service 호출. HTTP 상태 코드 결정. |
| Service | `src/services/` | 비즈니스 로직 구현. 도메인 규칙 적용(BR-*). 트랜잭션 조율. HTTP 개념(req/res) 미포함. |
| Repository | `src/repositories/` | `pg` 라이브러리를 직접 사용하여 DB 쿼리 실행. SQL 작성 및 파라미터 바인딩. 데이터 매핑. |
| DB | `src/db/` | pg Pool 인스턴스 생성 및 연결 관리. |

#### 레이어별 의존 방향 규칙

- Route는 Controller만 호출한다. Service 또는 Repository를 직접 호출하지 않는다.
- Controller는 Service만 호출한다. Repository를 직접 호출하지 않는다.
- Service는 Repository만 호출한다. `req`, `res` 등 HTTP 객체를 인자로 받지 않는다.
- Repository는 DB Pool(`pg`)만 사용한다. 비즈니스 로직을 포함하지 않는다.
- 역방향 의존(하위 레이어가 상위 레이어를 import하는 것)은 엄격히 금지한다.

#### Repository 레이어 역할 상세

ORM을 사용하지 않으므로 Repository가 DB 접근의 유일한 추상화 계층이다.

- `pg`의 `Pool.query(sql, params)` 메서드를 사용하여 파라미터화된 쿼리를 실행한다.
- SQL 쿼리 문자열과 바인딩 파라미터를 명시적으로 관리한다.
- DB에서 반환된 snake_case 컬럼을 애플리케이션에서 사용하는 camelCase 필드로 변환한다.
- 특정 쿼리에 대해 트랜잭션이 필요한 경우 `pg Client`를 직접 사용하여 `BEGIN`, `COMMIT`, `ROLLBACK`을 제어한다.
- DB 에러(예: unique violation, foreign key constraint)를 Service 레이어가 처리하기 쉬운 형태로 변환하거나 그대로 전파한다.

### 2.2 프론트엔드 레이어 구조

프론트엔드는 다음 4개 레이어로 구성되며, 의존 방향은 단방향(위에서 아래로)으로만 흐른다.

```
Page → Component → Hook → API Client
```

| 레이어 | 위치 | 역할 |
|--------|------|------|
| Page | `src/pages/` | 라우트에 대응하는 최상위 화면 컴포넌트. 레이아웃 구성 및 하위 컴포넌트 조합. |
| Component | `src/components/` | 재사용 가능한 UI 단위. Props를 통해 데이터를 받고 이벤트를 상위로 전달. |
| Hook | `src/hooks/` | TanStack Query 기반 서버 상태 관리 및 UI 로직 캡슐화. API Client 호출. |
| API Client | `src/api/` | 백엔드 REST API 호출 함수 모음. HTTP 요청/응답 처리. JWT 토큰 헤더 주입. |

#### 레이어별 의존 방향 규칙

- Page는 Component와 Hook을 직접 사용할 수 있다.
- Component는 Hook을 사용할 수 있으나, API Client를 직접 호출하지 않는다.
- Hook은 API Client만 호출한다.
- API Client는 순수한 HTTP 호출 함수만 포함하며 상태나 UI 로직을 포함하지 않는다.
- Zustand Store는 전역 UI 상태(인증 상태, 사용자 정보 등) 관리에만 사용하며, 서버에서 fetching한 데이터는 TanStack Query가 관리한다.

### 2.3 레이어 간 역방향 의존 금지

```
금지 예시 (백엔드):
  - Repository에서 Service 함수 import
  - Service에서 Controller 함수 import
  - DB Pool에서 비즈니스 로직 직접 실행

금지 예시 (프론트엔드):
  - API Client에서 Zustand Store import
  - Hook에서 Page 컴포넌트 import
  - Component에서 API Client 직접 호출
```

---

## 3. 코드/네이밍 원칙

### 3.1 공통 원칙

- 이름은 의도를 드러내야 한다. 축약어보다 명확한 이름을 우선한다. 예: `u` 대신 `userId`, `c` 대신 `categoryId`.
- 매직 넘버(magic number)는 상수로 추출하고 이름을 부여한다.
- Boolean 변수와 함수는 `is`, `has`, `can` 등의 접두사를 사용한다. 예: `isCompleted`, `hasPermission`.

### 3.2 백엔드 (Node.js + Express) 컨벤션

| 대상 | 컨벤션 | 예시 |
|------|--------|------|
| 파일명 (모듈) | kebab-case | `todo-service.js`, `auth-controller.js` |
| 파일명 (타입/인터페이스) | kebab-case | `todo-types.ts` |
| 함수명 | camelCase | `getTodoById`, `createTodo` |
| 변수명 | camelCase | `userId`, `accessToken` |
| 상수명 | SCREAMING_SNAKE_CASE | `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS` |
| 클래스명 | PascalCase | `TodoRepository`, `AuthService` |
| DB 쿼리 결과 필드 | snake_case → camelCase 변환 | `user_id` → `userId` |
| 라우터 변수 | camelCase | `todoRouter`, `authRouter` |

#### 백엔드 함수 네이밍 패턴

| 레이어 | 패턴 | 예시 |
|--------|------|------|
| Controller | `<동사><도메인>` | `createTodo`, `updateCategory` |
| Service | `<동사><도메인>` | `createTodo`, `validateOwnership` |
| Repository | `<동사><도메인>By<조건>` | `findTodoById`, `findTodosByUserId` |

### 3.3 프론트엔드 (React + TypeScript) 컨벤션

| 대상 | 컨벤션 | 예시 |
|------|--------|------|
| 파일명 (컴포넌트) | PascalCase | `TodoCard.tsx`, `CategoryList.tsx` |
| 파일명 (훅) | camelCase, `use` 접두사 | `useTodos.ts`, `useAuth.ts` |
| 파일명 (API 클라이언트) | camelCase | `todoApi.ts`, `authApi.ts` |
| 파일명 (스토어) | camelCase, `Store` 접미사 | `authStore.ts`, `uiStore.ts` |
| 파일명 (유틸) | camelCase | `dateFormatter.ts`, `httpClient.ts` |
| 컴포넌트명 | PascalCase | `TodoCard`, `LoginForm` |
| 훅명 | camelCase, `use` 접두사 | `useTodos`, `useCreateTodo` |
| 타입명/인터페이스명 | PascalCase | `Todo`, `CreateTodoRequest`, `ApiResponse` |
| 변수/함수명 | camelCase | `todoList`, `handleSubmit` |
| 상수 (모듈 레벨) | SCREAMING_SNAKE_CASE | `API_BASE_URL`, `QUERY_KEYS` |
| Props 타입 | PascalCase, `Props` 접미사 | `TodoCardProps`, `LoginFormProps` |
| Enum | PascalCase | `FilterStatus` |

#### 컴포넌트 파일 구조

단일 파일에 컴포넌트와 관련 타입을 함께 정의한다. 컴포넌트가 커지면 분리한다.

```typescript
// 순서: import → 타입 → 컴포넌트 → export
import ...
type TodoCardProps = { ... }
function TodoCard({ ... }: TodoCardProps) { ... }
export default TodoCard
```

### 3.4 API 엔드포인트 네이밍 규칙 (REST 컨벤션)

- URL 경로는 복수 명사를 사용한다. 동사를 경로에 포함하지 않는다.
- 경로 세그먼트는 kebab-case를 사용한다.
- 리소스 식별자는 경로 파라미터(`:id`)로 표현한다.
- 서브 리소스 액션은 `/resource/:id/action` 형식을 사용한다.

| 메서드 | 경로 | 역할 |
|--------|------|------|
| POST | `/api/v1/auth/register` | 회원가입 |
| POST | `/api/v1/auth/login` | 로그인 |
| GET | `/api/v1/users/me` | 내 정보 조회 |
| PATCH | `/api/v1/users/me` | 내 정보 수정 |
| GET | `/api/v1/todos` | 할일 목록 조회 |
| POST | `/api/v1/todos` | 할일 생성 |
| GET | `/api/v1/todos/:id` | 할일 단건 조회 |
| PATCH | `/api/v1/todos/:id` | 할일 수정 |
| DELETE | `/api/v1/todos/:id` | 할일 삭제 |
| PATCH | `/api/v1/todos/:id/complete` | 할일 완료 토글 |
| GET | `/api/v1/categories` | 카테고리 목록 조회 |
| POST | `/api/v1/categories` | 카테고리 생성 |
| PATCH | `/api/v1/categories/:id` | 카테고리 수정 |
| DELETE | `/api/v1/categories/:id` | 카테고리 삭제 |

### 3.5 환경 변수 네이밍

환경 변수는 SCREAMING_SNAKE_CASE를 사용하며, 접두사로 도메인을 구분한다.

```
# DB
DATABASE_URL=
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_POOL_MAX=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=

# 보안
BCRYPT_SALT_ROUNDS=

# 서버
PORT=
NODE_ENV=
CORS_ORIGIN=
```

### 3.6 DB 컬럼명 규칙

PostgreSQL 컬럼명은 snake_case를 사용한다. 애플리케이션 코드와의 경계에서 Repository 레이어가 변환을 담당한다.

```sql
-- DB 컬럼: snake_case
user_id, category_id, is_completed, due_date, created_at, updated_at, is_default

-- 애플리케이션 코드: camelCase (Repository에서 변환)
userId, categoryId, isCompleted, dueDate, createdAt, updatedAt, isDefault
```

---

## 4. 테스트/품질 원칙

### 4.1 테스트 전략

#### 단위 테스트 (Unit Test)

- 대상: Service 레이어의 비즈니스 로직 함수.
- Repository와 외부 의존성은 Mock으로 대체한다.
- 비즈니스 규칙(BR-*) 단위로 테스트 케이스를 작성한다.
- 정상 흐름, 경계값, 예외 흐름을 모두 커버한다.
- 프론트엔드 유틸리티 함수 및 순수 로직 함수.

#### 통합 테스트 (Integration Test)

- 대상: 백엔드 API 엔드포인트 (Route → Controller → Service → Repository → 실제 DB).
- 테스트용 PostgreSQL 데이터베이스를 사용한다.
- 각 테스트 케이스 전후에 테스트 데이터를 초기화한다.
- HTTP 상태 코드, 응답 바디, DB 상태 변화를 함께 검증한다.
- 인증 흐름(토큰 없음, 만료, 타인 접근)을 포함한다.

#### E2E 테스트

- v1에서는 E2E 자동화 테스트 도구(Playwright, Cypress 등)를 필수로 적용하지 않는다.
- 대신 수동 통합 테스트 체크리스트를 사용하여 전체 유스케이스를 검증한다.
- v2 이후 E2E 자동화 도입을 검토한다.

### 4.2 pg 직접 사용 환경에서의 Repository 테스트 전략

ORM이 없으므로 SQL 쿼리 자체의 정확성을 검증하는 것이 중요하다.

#### 방법 A: 실제 DB를 사용하는 통합 테스트 (권장)

- 테스트 실행 전 테스트 전용 DB 스키마(또는 별도 DB)를 사용한다.
- `beforeEach`/`afterEach` 훅에서 트랜잭션을 열고 각 테스트 후 롤백하여 데이터 격리를 보장한다.
- 실제 SQL의 정확성(조인, 필터, 제약 조건)을 검증할 수 있다.

```javascript
// 예시: 트랜잭션 롤백을 이용한 테스트 격리
let client;
beforeEach(async () => {
  client = await pool.connect();
  await client.query('BEGIN');
});
afterEach(async () => {
  await client.query('ROLLBACK');
  client.release();
});
```

#### 방법 B: pg Pool Mock

- 복잡한 SQL 없이 Repository의 호출 방식(파라미터 전달, 에러 처리)만 검증할 때 사용한다.
- 실제 쿼리 정확성은 검증하지 못하므로 방법 A를 보완적으로 함께 사용한다.

### 4.3 테스트 파일 위치 및 네이밍 컨벤션

```
백엔드:
  src/services/__tests__/todo-service.test.js     (단위 테스트)
  src/repositories/__tests__/todo-repository.test.js
  tests/integration/todos.test.js                 (통합 테스트)
  tests/integration/auth.test.js

프론트엔드:
  src/hooks/__tests__/useTodos.test.ts            (훅 단위 테스트)
  src/utils/__tests__/dateFormatter.test.ts       (유틸 단위 테스트)
```

- 테스트 파일명: `<대상파일명>.test.<확장자>` 형식.
- 테스트 설명은 한국어 또는 영어로 일관되게 작성한다.
- `describe` 블록으로 기능 단위를 그룹화하고, `it`/`test` 블록으로 개별 케이스를 작성한다.

### 4.4 코드 품질 도구 설정 원칙

#### ESLint

- 백엔드: `eslint:recommended` 기반에 Node.js 환경 설정 추가.
- 프론트엔드: `eslint:recommended` + `plugin:react/recommended` + `plugin:@typescript-eslint/recommended`.
- `no-console` 규칙: 프로덕션 코드에서 `console.log` 경고 처리 (구조화된 로거 사용 권장).
- `no-unused-vars`: 에러 수준으로 설정.
- 규칙 예외(`eslint-disable`)는 주석으로 반드시 사유를 명시한다.

#### Prettier

- 백엔드, 프론트엔드 동일한 Prettier 설정을 공유한다.
- 주요 설정: `singleQuote: true`, `semi: true`, `printWidth: 100`, `trailingComma: 'es5'`.
- 저장 시 자동 포맷팅(format on save)을 IDE에서 활성화한다.
- CI 단계에서 `prettier --check`를 실행하여 포맷팅 미적용 코드의 병합을 차단한다.

#### TypeScript (프론트엔드)

- `strict: true`를 활성화하여 엄격한 타입 검사를 적용한다.
- `any` 타입 사용을 최소화하고, 불가피한 경우 `// TODO` 주석과 함께 임시 사용 사유를 명시한다.
- API 응답 타입은 `src/types/` 디렉토리에 중앙화하여 일관성을 유지한다.

---

## 5. 설정/보안/운영 원칙

### 5.1 환경 변수 파일 구성

#### `.env` (버전 관리 제외)

실제 운영/개발에 사용하는 환경 변수 파일. `.gitignore`에 반드시 포함.

```
# 서버
NODE_ENV=development
PORT=3000

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todolist_dev
DB_USER=todolist_user
DB_PASSWORD=your_secure_password_here
DB_POOL_MAX=10

# JWT
JWT_SECRET=your_very_long_and_random_secret_key_here
JWT_EXPIRES_IN=24h

# 보안
BCRYPT_SALT_ROUNDS=10

# CORS
CORS_ORIGIN=http://localhost:5173
```

#### `.env.example` (버전 관리 포함)

키 목록과 설명만 포함하며 실제 값은 비워두거나 예시값을 사용. 팀 온보딩 참조용.

```
# 서버 설정
NODE_ENV=development          # development | production | test
PORT=3000                     # 서버 포트

# PostgreSQL 연결 정보
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todolist_dev
DB_USER=
DB_PASSWORD=
DB_POOL_MAX=10                # 커넥션 풀 최대 연결 수

# JWT 설정
JWT_SECRET=                   # 최소 32자 이상의 랜덤 문자열 사용
JWT_EXPIRES_IN=24h            # 토큰 만료 시간 (예: 1h, 24h, 7d)

# 보안
BCRYPT_SALT_ROUNDS=10         # bcrypt salt rounds (최소 10)

# CORS
CORS_ORIGIN=http://localhost:5173  # 허용할 프론트엔드 오리진
```

### 5.2 JWT 설정 원칙

- **Secret 관리:** `JWT_SECRET`은 최소 32자 이상의 랜덤 문자열을 사용한다. 환경별로 다른 Secret을 사용한다.
- **만료 시간:** `JWT_EXPIRES_IN`은 `24h`를 기본값으로 사용한다. 만료 시간이 없는 토큰은 절대 발급하지 않는다.
- **페이로드:** JWT 페이로드에는 `userId`와 `email`만 포함한다. 민감 정보(비밀번호 해시 등)는 포함하지 않는다.
- **검증 미들웨어:** `authenticateToken` 미들웨어를 인증이 필요한 모든 라우터에 적용한다. 토큰 없음 또는 유효하지 않은 토큰은 즉시 HTTP 401을 반환한다.
- **v1 로그아웃:** 클라이언트 사이드에서 토큰을 삭제하는 방식으로 처리한다. 서버 블랙리스트는 v2에서 구현한다.
- **알고리즘:** HS256 알고리즘을 사용한다.

```javascript
// JWT 페이로드 구조 예시
{
  userId: "uuid-v4",
  email: "user@example.com",
  iat: 1234567890,
  exp: 1234567890
}
```

### 5.3 bcrypt 설정

- `BCRYPT_SALT_ROUNDS`는 최소 10 이상으로 설정한다 (PRD 보안 요구사항 BR-U-02 준수).
- 비밀번호 비교는 반드시 `bcrypt.compare()`를 사용한다. 평문 비교를 절대 사용하지 않는다.
- 해시된 비밀번호는 API 응답에 절대 포함하지 않는다.

### 5.4 CORS 설정

- `CORS_ORIGIN` 환경 변수로 허용 오리진을 제어한다.
- 운영 환경에서 와일드카드(`*`)를 사용하지 않는다. 허용 오리진을 명시적으로 지정한다.
- 허용 메서드: `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`.
- 허용 헤더: `Content-Type`, `Authorization`.
- `credentials: true`를 설정하여 인증 헤더 전송을 허용한다.

```javascript
// CORS 설정 예시 (Express)
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
```

### 5.5 SQL Injection 방지: 파라미터화된 쿼리 사용 원칙

**ORM을 사용하지 않으므로 SQL Injection 방지는 개발자가 직접 책임진다.**

- `pg` 라이브러리의 파라미터 바인딩(`$1`, `$2`, ...)을 항상 사용한다.
- 사용자 입력값을 SQL 문자열에 직접 삽입(문자열 보간, 연결)하는 것을 절대 금지한다.
- 동적 쿼리(예: 필터 조건 추가)에서도 파라미터 배열을 사용하여 조건을 추가한다.

```javascript
// 올바른 방법 (파라미터화된 쿼리)
const result = await pool.query(
  'SELECT * FROM todos WHERE user_id = $1 AND id = $2',
  [userId, todoId]
);

// 금지된 방법 (SQL Injection 취약)
// const result = await pool.query(
//   `SELECT * FROM todos WHERE user_id = '${userId}' AND id = '${todoId}'`
// );
```

#### 동적 필터 쿼리 작성 패턴

여러 선택적 필터 조건이 있을 때는 조건 배열과 파라미터 배열을 함께 관리한다.

```javascript
const conditions = ['t.user_id = $1'];
const params = [userId];
let paramIndex = 2;

if (categoryId) {
  conditions.push(`t.category_id = $${paramIndex++}`);
  params.push(categoryId);
}
if (isCompleted !== undefined) {
  conditions.push(`t.is_completed = $${paramIndex++}`);
  params.push(isCompleted);
}

const sql = `SELECT * FROM todos t WHERE ${conditions.join(' AND ')}`;
const result = await pool.query(sql, params);
```

### 5.6 에러 응답 형식 표준화

모든 API 에러 응답은 다음 형식을 따른다.

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "할일을 찾을 수 없습니다."
  }
}
```

| 필드 | 설명 |
|------|------|
| `error.code` | SCREAMING_SNAKE_CASE 형식의 에러 코드. 클라이언트가 프로그래밍적으로 처리하는 데 사용. |
| `error.message` | 사용자에게 보여줄 수 있는 한국어 메시지. |

#### HTTP 상태 코드 표준

| 상태 코드 | 사용 상황 |
|-----------|-----------|
| 200 OK | 조회, 수정 성공 |
| 201 Created | 리소스 생성 성공 |
| 204 No Content | 삭제 성공 (바디 없음) |
| 400 Bad Request | 입력 유효성 오류, 잘못된 형식 |
| 401 Unauthorized | 인증 토큰 없음 또는 만료 |
| 403 Forbidden | 인증은 됐으나 접근 권한 없음 (소유권 위반) |
| 404 Not Found | 리소스가 존재하지 않음 |
| 409 Conflict | 중복 데이터 (이메일, 카테고리명), 삭제 불가 제약 |
| 500 Internal Server Error | 서버 내부 오류 (구체적인 오류 내용은 응답에 포함하지 않음) |

#### 글로벌 에러 핸들러

Express 글로벌 에러 핸들러 미들웨어를 `app.js`에 등록하여 모든 처리되지 않은 에러를 표준 형식으로 변환한다. 운영 환경에서 스택 트레이스를 클라이언트에 노출하지 않는다.

---

## 6. 디렉토리 구조

### 6.1 백엔드 디렉토리 구조 (Node.js + Express + pg)

```
backend/
├── src/
│   ├── app.js                      # Express 앱 생성, 미들웨어 등록, 라우터 연결
│   ├── server.js                   # HTTP 서버 시작, 환경 변수 검증
│   │
│   ├── config/                     # 설정 모음
│   │   ├── env.js                  # 환경 변수 로드 및 유효성 검증
│   │   └── constants.js            # 앱 전역 상수 (BCRYPT_SALT_ROUNDS 등)
│   │
│   ├── db/                         # 데이터베이스 연결 관리
│   │   ├── pool.js                 # pg Pool 인스턴스 생성 및 export
│   │   └── migrations/             # SQL 마이그레이션 스크립트 (순서 번호 접두사)
│   │       ├── 001_create_users.sql
│   │       ├── 002_create_categories.sql
│   │       └── 003_create_todos.sql
│   │
│   ├── middlewares/                # Express 미들웨어
│   │   ├── authenticate.js         # JWT 검증 미들웨어 (authenticateToken)
│   │   ├── validate.js             # 입력 유효성 검증 미들웨어 팩토리
│   │   └── error-handler.js        # 글로벌 에러 핸들러 미들웨어
│   │
│   ├── routes/                     # 라우터: URL 경로 ↔ Controller 매핑
│   │   ├── index.js                # 전체 라우터 통합 및 /api/v1 접두사 등록
│   │   ├── auth.routes.js          # POST /auth/register, POST /auth/login
│   │   ├── user.routes.js          # GET/PATCH /users/me
│   │   ├── todo.routes.js          # CRUD /todos, PATCH /todos/:id/complete
│   │   └── category.routes.js      # CRUD /categories
│   │
│   ├── controllers/                # Controller: req/res 처리, Service 호출
│   │   ├── auth.controller.js      # 회원가입, 로그인 요청 처리
│   │   ├── user.controller.js      # 내 정보 조회/수정 요청 처리
│   │   ├── todo.controller.js      # 할일 CRUD 요청 처리
│   │   └── category.controller.js  # 카테고리 CRUD 요청 처리
│   │
│   ├── services/                   # Service: 비즈니스 로직 및 도메인 규칙
│   │   ├── auth.service.js         # 회원가입/로그인 로직, JWT 발급
│   │   ├── user.service.js         # 개인정보 수정 로직
│   │   ├── todo.service.js         # 할일 CRUD 비즈니스 로직, 소유권 검증
│   │   └── category.service.js     # 카테고리 비즈니스 로직, 기본 카테고리 보호
│   │
│   ├── repositories/               # Repository: pg를 이용한 DB 쿼리 실행
│   │   ├── user.repository.js      # users 테이블 쿼리 (findByEmail, create, update)
│   │   ├── todo.repository.js      # todos 테이블 쿼리 (CRUD, 필터 조회)
│   │   └── category.repository.js  # categories 테이블 쿼리 (CRUD, 중복 검사)
│   │
│   ├── types/                      # 공통 타입/상수 정의 (JSDoc 또는 별도 타입 파일)
│   │   ├── errors.js               # 커스텀 에러 클래스 (NotFoundError, ForbiddenError 등)
│   │   └── response.js             # 표준 응답 생성 헬퍼 함수
│   │
│   └── utils/                      # 공통 유틸리티 함수
│       ├── password.js             # bcrypt 해시/비교 함수
│       ├── jwt.js                  # JWT 생성/검증 함수
│       └── logger.js               # 구조화된 로깅 유틸
│
├── tests/
│   ├── integration/                # API 엔드포인트 통합 테스트
│   │   ├── auth.test.js
│   │   ├── todos.test.js
│   │   └── categories.test.js
│   └── helpers/                    # 테스트 헬퍼 (DB 초기화, 토큰 생성 등)
│       └── test-setup.js
│
├── scripts/
│   └── seed.js                     # 기본 카테고리 초기 데이터 삽입 스크립트
│
├── .env                            # 환경 변수 (Git 제외)
├── .env.example                    # 환경 변수 템플릿 (Git 포함)
├── .eslintrc.js                    # ESLint 설정
├── .prettierrc                     # Prettier 설정
├── .gitignore
├── package.json
└── package-lock.json
```

### 6.2 프론트엔드 디렉토리 구조 (React 19 + TypeScript + Zustand + TanStack Query)

```
frontend/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── main.tsx                    # React 앱 진입점, QueryClient Provider 등록
│   ├── App.tsx                     # 최상위 컴포넌트, 라우터 설정, 인증 가드
│   ├── router.tsx                  # React Router 경로 정의 및 인증 보호 라우트
│   │
│   ├── pages/                      # 라우트에 대응하는 최상위 화면 컴포넌트
│   │   ├── auth/
│   │   │   ├── RegisterPage.tsx    # 회원가입 화면 (SCR-01)
│   │   │   └── LoginPage.tsx       # 로그인 화면 (SCR-02)
│   │   ├── todos/
│   │   │   ├── TodoListPage.tsx    # 할일 목록 화면 (SCR-03)
│   │   │   └── TodoFormPage.tsx    # 할일 등록/수정 화면 (SCR-04)
│   │   ├── categories/
│   │   │   └── CategoryPage.tsx    # 카테고리 관리 화면 (SCR-05)
│   │   └── users/
│   │       └── ProfilePage.tsx     # 개인정보 수정 화면 (SCR-06)
│   │
│   ├── components/                 # 재사용 가능한 UI 컴포넌트
│   │   ├── common/                 # 도메인 무관 공통 컴포넌트
│   │   │   ├── Button.tsx          # 버튼 컴포넌트
│   │   │   ├── Input.tsx           # 입력 필드 컴포넌트
│   │   │   ├── Modal.tsx           # 모달 다이얼로그
│   │   │   ├── ErrorMessage.tsx    # 에러 메시지 표시 컴포넌트
│   │   │   └── LoadingSpinner.tsx  # 로딩 스피너
│   │   ├── auth/
│   │   │   ├── RegisterForm.tsx    # 회원가입 폼
│   │   │   └── LoginForm.tsx       # 로그인 폼
│   │   ├── todos/
│   │   │   ├── TodoCard.tsx        # 할일 카드 (제목, 카테고리, 완료 여부 표시)
│   │   │   ├── TodoList.tsx        # 할일 목록 컨테이너
│   │   │   ├── TodoForm.tsx        # 할일 등록/수정 폼
│   │   │   └── TodoFilter.tsx      # 카테고리/기간/완료 여부 필터 UI
│   │   ├── categories/
│   │   │   ├── CategoryItem.tsx    # 카테고리 항목 (수정/삭제 UI 포함)
│   │   │   └── CategoryForm.tsx    # 카테고리 추가 폼
│   │   └── layout/
│   │       ├── Header.tsx          # 상단 헤더 (로그아웃, 네비게이션)
│   │       └── ProtectedLayout.tsx # 인증 필요 화면 공통 레이아웃
│   │
│   ├── hooks/                      # TanStack Query 기반 서버 상태 및 UI 로직 훅
│   │   ├── auth/
│   │   │   ├── useRegister.ts      # 회원가입 mutation
│   │   │   └── useLogin.ts         # 로그인 mutation
│   │   ├── todos/
│   │   │   ├── useTodos.ts         # 할일 목록 조회 쿼리 (필터 파라미터 포함)
│   │   │   ├── useTodo.ts          # 할일 단건 조회 쿼리
│   │   │   ├── useCreateTodo.ts    # 할일 생성 mutation
│   │   │   ├── useUpdateTodo.ts    # 할일 수정 mutation
│   │   │   ├── useDeleteTodo.ts    # 할일 삭제 mutation
│   │   │   └── useCompleteTodo.ts  # 할일 완료 토글 mutation (낙관적 업데이트)
│   │   ├── categories/
│   │   │   ├── useCategories.ts    # 카테고리 목록 조회 쿼리
│   │   │   ├── useCreateCategory.ts
│   │   │   ├── useUpdateCategory.ts
│   │   │   └── useDeleteCategory.ts
│   │   └── users/
│   │       └── useUpdateProfile.ts # 개인정보 수정 mutation
│   │
│   ├── api/                        # 백엔드 REST API 호출 함수 (순수 HTTP 함수)
│   │   ├── httpClient.ts           # axios 또는 fetch 기반 HTTP 클라이언트 (JWT 헤더 주입, 401 처리)
│   │   ├── authApi.ts              # /auth/* 엔드포인트 호출 함수
│   │   ├── todoApi.ts              # /todos/* 엔드포인트 호출 함수
│   │   ├── categoryApi.ts          # /categories/* 엔드포인트 호출 함수
│   │   └── userApi.ts              # /users/* 엔드포인트 호출 함수
│   │
│   ├── stores/                     # Zustand 전역 UI 상태 스토어
│   │   ├── authStore.ts            # 인증 상태 (accessToken, 현재 사용자 정보, isAuthenticated)
│   │   └── todoFilterStore.ts      # 할일 필터 UI 상태 (선택된 카테고리, 기간, 완료 여부)
│   │
│   ├── types/                      # TypeScript 타입/인터페이스 정의
│   │   ├── auth.types.ts           # LoginRequest, RegisterRequest, AuthResponse
│   │   ├── todo.types.ts           # Todo, CreateTodoRequest, UpdateTodoRequest, TodoFilter
│   │   ├── category.types.ts       # Category, CreateCategoryRequest, UpdateCategoryRequest
│   │   ├── user.types.ts           # User, UpdateProfileRequest
│   │   └── api.types.ts            # ApiError, ApiResponse<T> 공통 타입
│   │
│   ├── utils/                      # 순수 유틸리티 함수
│   │   ├── dateFormatter.ts        # 날짜 포맷팅 함수 (dueDate 표시용)
│   │   ├── queryKeys.ts            # TanStack Query 쿼리 키 상수 관리
│   │   └── validators.ts           # 클라이언트 사이드 유효성 검증 함수
│   │
│   └── styles/                     # 전역 스타일
│       ├── global.css              # 전역 CSS 리셋 및 기본 스타일
│       └── variables.css           # CSS 변수 (색상, 폰트, 브레이크포인트) - 다크 모드 v2 대비
│
├── .env                            # 프론트엔드 환경 변수 (Git 제외)
├── .env.example                    # 프론트엔드 환경 변수 템플릿
├── .eslintrc.js                    # ESLint 설정
├── .prettierrc                     # Prettier 설정 (백엔드와 공유 또는 동일하게 설정)
├── .gitignore
├── index.html
├── tsconfig.json                   # TypeScript 설정 (strict: true)
├── vite.config.ts                  # Vite 빌드 설정
├── package.json
└── package-lock.json
```

### 6.3 모노레포 최상위 구조 (권장)

백엔드와 프론트엔드를 단일 저장소로 관리하는 경우의 최상위 구조.

```
todolist-app/                   # 프로젝트 루트
├── backend/                    # 백엔드 (Node.js + Express + pg)
├── frontend/                   # 프론트엔드 (React 19 + TypeScript)
├── docs/                       # 프로젝트 문서
│   ├── 1-domain-definition.md
│   ├── 2-prd.md
│   ├── 3-user-scenario.md
│   └── 4-project-structure.md
├── .gitignore                  # 루트 gitignore (.env 파일 제외 포함)
└── README.md                   # 프로젝트 개요 및 로컬 개발 환경 설정 가이드
```
