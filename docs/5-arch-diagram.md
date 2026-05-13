# 기술 아키텍처 다이어그램

**프로젝트명:** TodoListApp
**버전:** 1.0.0
**작성일:** 2026-05-13
**참조 문서:** `docs/2-prd.md`, `docs/4-project-structure.md`

---

## 1. 전체 시스템 구조

```mermaid
graph TD
  Browser["🌐 브라우저\n(Web + Mobile Web)"]

  subgraph Frontend["Frontend — React 19 + TypeScript"]
    UI["Pages / Components"]
    State["Zustand\n전역 UI 상태"]
    Query["TanStack Query\n서버 상태·캐시"]
  end

  subgraph Backend["Backend — Node.js + Express"]
    API["REST API\n(Routes / Controllers)"]
    Svc["Services\n비즈니스 로직"]
    Repo["Repositories\nSQL (pg)"]
  end

  DB[("🗄️ PostgreSQL 17")]

  Browser --> UI
  UI <--> State
  UI <--> Query
  Query -- "HTTP + JWT" --> API
  API --> Svc
  Svc --> Repo
  Repo -- "Parameterized Query" --> DB
```

---

## 2. 백엔드 레이어 구조

```mermaid
graph LR
  R["Router\n경로 매핑"] --> M["Auth Middleware\nJWT 검증"]
  M --> C["Controller\n요청·응답 처리"]
  C --> S["Service\n비즈니스 규칙"]
  S --> Repo["Repository\npg 직접 SQL"]
  Repo --> DB[("PostgreSQL")]

  style R   fill:#dbeafe
  style M   fill:#fef9c3
  style C   fill:#dbeafe
  style S   fill:#dcfce7
  style Repo fill:#ede9fe
  style DB  fill:#f3f4f6
```

> 의존 방향: Router → Middleware → Controller → Service → Repository → DB (단방향, 역방향 금지)

---

## 3. 프론트엔드 레이어 구조

```mermaid
graph LR
  P["Pages\n화면 단위"] --> Comp["Components\nUI 컴포넌트"]
  Comp --> H["Custom Hooks\n도메인 로직"]
  H --> TQ["TanStack Query\nAPI 호출·캐시"]
  H --> Z["Zustand Store\n전역 UI 상태"]
  TQ --> AC["API Client\naxios / fetch"]
  AC -- "HTTP" --> BE["Backend API"]

  style P    fill:#dbeafe
  style Comp fill:#dbeafe
  style H    fill:#dcfce7
  style TQ   fill:#fef9c3
  style Z    fill:#fef9c3
  style AC   fill:#ede9fe
```

---

## 4. 인증 흐름

```mermaid
sequenceDiagram
  actor U as 사용자
  participant FE as Frontend
  participant BE as Backend
  participant DB as PostgreSQL

  U->>FE: 이메일·비밀번호 입력
  FE->>BE: POST /auth/login
  BE->>DB: SELECT user WHERE email
  DB-->>BE: user row
  BE->>BE: bcrypt 비교
  BE-->>FE: 200 + JWT
  FE->>FE: 토큰 저장 (Zustand)

  Note over FE,BE: 이후 모든 요청
  FE->>BE: API 요청 + Authorization: Bearer JWT
  BE->>BE: JWT 검증 미들웨어
  BE-->>FE: 200 + 데이터 (or 401)
```

---

## 5. DB 엔티티 관계

```mermaid
erDiagram
  USER {
    uuid   id        PK
    string email     UK
    string password
    string name
    timestamp createdAt
    timestamp updatedAt
  }

  CATEGORY {
    uuid    id        PK
    uuid    userId    FK "NULL = 기본 카테고리"
    string  name
    boolean isDefault
    timestamp createdAt
  }

  TODO {
    uuid    id          PK
    uuid    userId      FK
    uuid    categoryId  FK
    string  title
    string  description
    date    dueDate
    boolean isCompleted
    timestamp createdAt
    timestamp updatedAt
  }

  USER    ||--o{ TODO     : "소유"
  USER    ||--o{ CATEGORY : "생성"
  CATEGORY ||--o{ TODO   : "분류"
```

---

## 6. 도메인별 API 엔드포인트 구조

```mermaid
graph LR
  subgraph Auth["🔐 /auth"]
    A1["POST /register"]
    A2["POST /login"]
  end

  subgraph Users["👤 /users"]
    U1["GET  /me"]
    U2["PATCH /me"]
  end

  subgraph Todos["📝 /todos"]
    T1["GET    /"]
    T2["POST   /"]
    T3["GET    /:id"]
    T4["PATCH  /:id"]
    T5["DELETE /:id"]
    T6["PATCH  /:id/complete"]
  end

  subgraph Categories["🏷️ /categories"]
    C1["GET    /"]
    C2["POST   /"]
    C3["PATCH  /:id"]
    C4["DELETE /:id"]
  end

  Client["Client"] --> Auth
  Client --> Users
  Client --> Todos
  Client --> Categories
```
