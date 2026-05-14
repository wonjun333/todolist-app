# 프론트엔드 스타일 가이드

**프로젝트명:** TodoListApp
**버전:** 1.0.0
**작성일:** 2026-05-14
**디자인 레퍼런스:** Google Calendar (클린 사이드바, 배지 기반 카테고리, 컴팩트 그리드 패턴)
**참조 문서:** `docs/8-wireframe.md`, `docs/2-prd.md`

---

## 목차

1. [디자인 원칙](#1-디자인-원칙)
2. [컬러 팔레트](#2-컬러-팔레트)
3. [타이포그래피](#3-타이포그래피)
4. [간격 및 레이아웃](#4-간격-및-레이아웃)
5. [컴포넌트](#5-컴포넌트)
6. [아이콘](#6-아이콘)
7. [반응형 브레이크포인트](#7-반응형-브레이크포인트)
8. [CSS 변수 정의](#8-css-변수-정의)
9. [접근성](#9-접근성)

---

## 1. 디자인 원칙

Google Calendar의 UI를 레퍼런스로 삼아 아래 4가지 원칙을 따른다.

| 원칙 | 설명 |
|------|------|
| **클린 플랫** | 불필요한 그림자와 그라디언트를 배제하고 여백과 경계선만으로 구조를 표현한다. |
| **정보 밀도** | 화면을 낭비하지 않고 필요한 정보를 적절히 밀집시킨다. 단, 가독성을 해치지 않는다. |
| **명확한 계층** | 타이포그래피 크기·굵기·색상 조합만으로 정보 계층을 전달한다. |
| **즉각적 피드백** | 호버·포커스·로딩·성공·에러 상태를 빠짐없이 시각화하여 사용자가 현재 상태를 즉시 파악할 수 있게 한다. |

---

## 2. 컬러 팔레트

### 2.1 Primary (브랜드 색상)

Google Calendar의 파란색 계열을 주 색상으로 사용한다.

| 토큰 | Hex | 용도 |
|------|-----|------|
| `--color-primary-600` | `#1A73E8` | 주요 버튼, 포커스 링, 활성 탭, 배지 강조 |
| `--color-primary-500` | `#4285F4` | 버튼 호버, 링크 |
| `--color-primary-100` | `#D2E3FC` | 배경 하이라이트, 선택된 카드 배경 |
| `--color-primary-50`  | `#EAF2FF` | 가벼운 배경 강조 |

```css
/* 사용 예시 */
.btn-primary        { background-color: var(--color-primary-600); }
.btn-primary:hover  { background-color: var(--color-primary-500); }
.input:focus        { border-color: var(--color-primary-600); }
.tab--active        { color: var(--color-primary-600); border-bottom: 2px solid var(--color-primary-600); }
```

### 2.2 Neutral (회색 계열)

| 토큰 | Hex | 용도 |
|------|-----|------|
| `--color-gray-900` | `#202124` | 본문 기본 텍스트 |
| `--color-gray-700` | `#3C4043` | 서브 타이틀, 레이블 |
| `--color-gray-500` | `#70757A` | 보조 텍스트, 플레이스홀더, 비활성 |
| `--color-gray-300` | `#DADCE0` | 테두리, 구분선 |
| `--color-gray-100` | `#F1F3F4` | 사이드바 배경, 호버 배경 |
| `--color-gray-50`  | `#F8F9FA` | 페이지 배경, 입력 필드 비활성 배경 |
| `--color-white`    | `#FFFFFF` | 카드 배경, 메인 콘텐츠 배경 |

### 2.3 Semantic (상태 색상)

| 토큰 | Hex | 용도 |
|------|-----|------|
| `--color-success-600` | `#188038` | 성공 메시지, 완료 상태 체크 |
| `--color-success-100` | `#E6F4EA` | 성공 메시지 배경 |
| `--color-error-600`   | `#D93025` | 에러 메시지, 삭제 버튼 |
| `--color-error-100`   | `#FCE8E6` | 에러 메시지 배경 |
| `--color-warning-600` | `#E37400` | 경고 (마감일 임박 등) |
| `--color-warning-100` | `#FEF7E0` | 경고 배경 |

### 2.4 카테고리 배지 색상

기본 카테고리 3종과 사용자 정의 카테고리는 아래 팔레트에서 순환 할당한다.

| 카테고리 | 배경 | 텍스트 | 용도 |
|---------|------|--------|------|
| 일반 | `#E8F0FE` | `#1A73E8` | 기본 카테고리 |
| 업무 | `#D2E3FC` | `#1967D2` | 기본 카테고리 |
| 개인 | `#FDE7F3` | `#C5221F` | 기본 카테고리 |
| 사용자 정의 #1 | `#E6F4EA` | `#188038` | 순환 배정 |
| 사용자 정의 #2 | `#FEF7E0` | `#B06000` | 순환 배정 |
| 사용자 정의 #3 | `#F3E8FD` | `#7627BB` | 순환 배정 |
| 사용자 정의 #4 | `#E8EAED` | `#3C4043` | 순환 배정 |

---

## 3. 타이포그래피

### 3.1 폰트 패밀리

```css
--font-sans: 'Pretendard', 'Google Sans', -apple-system, BlinkMacSystemFont,
             'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
```

- 한국어 최적화: Pretendard 우선 사용 (Google Fonts 대안: Noto Sans KR)
- 영문/숫자 폴백: Google Sans → Roboto

### 3.2 스케일

| 토큰 | Size | Weight | Line-height | 용도 |
|------|------|--------|-------------|------|
| `--text-xs`   | 11px | 400 | 1.5 | 보조 라벨, 타임스탬프 |
| `--text-sm`   | 13px | 400 | 1.5 | 배지 텍스트, 보조 정보, 플레이스홀더 |
| `--text-base` | 14px | 400 | 1.6 | 기본 본문, 입력값, 버튼 |
| `--text-md`   | 16px | 400 | 1.6 | 카드 제목, 폼 레이블 |
| `--text-lg`   | 18px | 500 | 1.4 | 섹션 헤딩 |
| `--text-xl`   | 22px | 400 | 1.3 | 페이지 타이틀 |
| `--text-2xl`  | 28px | 300 | 1.2 | 앱 로고명 |

### 3.3 사용 원칙

- **굵기:** 중요 텍스트에만 `font-weight: 500` 사용. Bold(700)는 에러 강조 등 최소한으로.
- **색상:** 본문은 `--color-gray-900`, 보조는 `--color-gray-500`. 색상만으로 정보를 전달하지 않는다.
- **완료된 할일 제목:** `text-decoration: line-through; color: var(--color-gray-500)` 적용.

---

## 4. 간격 및 레이아웃

### 4.1 스페이싱 스케일 (4px 베이스 그리드)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--space-1` | 4px  | 아이콘-텍스트 사이 |
| `--space-2` | 8px  | 배지 내 패딩, 인접 요소 사이 |
| `--space-3` | 12px | 입력 필드 내 패딩 |
| `--space-4` | 16px | 컴포넌트 기본 패딩, 카드 내부 패딩 |
| `--space-5` | 20px | 섹션 내 요소 간격 |
| `--space-6` | 24px | 카드 간 간격, 섹션 간격 |
| `--space-8` | 32px | 페이지 여백 (데스크탑) |
| `--space-10`| 40px | 헤더 높이 보조 간격 |

### 4.2 레이아웃 구조

```
┌──────────┬──────────────────────────────────────────┐
│          │                                          │
│ SIDEBAR  │  MAIN CONTENT                            │
│ 220px    │  flex: 1, background: gray-50            │
│          │  padding: 24px 32px (데스크탑)            │
│ - 로고    │  16px 80px (모바일, 하단 탭바 공간 확보)  │
│ - 네비    │                                          │
│ - 유저명  │  .app-content__inner                     │
│ - 로그아웃│  max-width: 1200px, margin: 0 auto       │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

- 인증 화면(SCR-01, SCR-02): 중앙 정렬 카드, max-width 400px
- 메인 화면(SCR-03~06): 좌측 사이드바 + 콘텐츠 영역, app-content__inner max-width 1200px, margin: 0 auto

### 4.3 사이드바

```
너비: 220px
배경: #FFFFFF
우측 경계선: 1px solid var(--color-gray-300)
height: 100vh, position: sticky, top: 0

구성 (위→아래):
[앱 로고]
─────────────────
[홈]
[카테고리]
[프로필]
(flex: 1, 여백 채움)
─────────────────
[유저명]
[로그아웃 버튼]
```

### 4.4 카드

```css
.card {
  background: var(--color-white);
  border: 1px solid var(--color-gray-300);
  border-radius: 8px;
  padding: var(--space-4);
}
/* 호버 시 */
.card:hover {
  background: var(--color-gray-100);
  cursor: pointer;
}
```

---

## 5. 컴포넌트

### 5.1 버튼

#### 종류

| Variant | 사용 상황 | 스타일 |
|---------|----------|--------|
| `primary` | 주 액션 (저장, 가입, 로그인, 추가) | 파란 배경, 흰 텍스트, pill 형태 |
| `secondary` | 보조 액션 (취소, 돌아가기) | 흰 배경, 회색 테두리, 회색 텍스트 |
| `danger` | 삭제, 위험 액션 | 흰 배경, 빨간 텍스트/테두리 (또는 빨간 배경) |
| `ghost` | 아이콘 버튼, 텍스트 링크 버튼 | 배경 없음, 호버 시 회색 배경 |

#### 스타일 명세

```css
/* Base */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  height: 36px;
  padding: 0 var(--space-4);
  border-radius: 18px;         /* pill 형태 */
  font-size: var(--text-base);
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, box-shadow 0.15s;
  white-space: nowrap;
}

/* Primary */
.btn-primary {
  background: var(--color-primary-600);
  color: var(--color-white);
}
.btn-primary:hover {
  background: var(--color-primary-500);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.btn-primary:focus-visible {
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
}

/* Secondary */
.btn-secondary {
  background: var(--color-white);
  color: var(--color-gray-700);
  border-color: var(--color-gray-300);
}
.btn-secondary:hover {
  background: var(--color-gray-100);
}

/* Danger */
.btn-danger {
  background: var(--color-white);
  color: var(--color-error-600);
  border-color: var(--color-error-600);
}
.btn-danger:hover {
  background: var(--color-error-100);
}

/* Disabled (공통) */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Loading (공통) */
.btn--loading {
  pointer-events: none;
  opacity: 0.8;
}
```

#### 모바일 터치 대응

모바일(~767px)에서는 버튼 최소 높이를 **48px**로 확장한다.

```css
@media (max-width: 767px) {
  .btn { height: 48px; padding: 0 var(--space-5); }
}
```

---

### 5.2 입력 필드 (Input)

```css
.input {
  display: block;
  width: 100%;
  height: 44px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-gray-300);
  border-radius: 6px;
  font-size: var(--text-base);
  color: var(--color-gray-900);
  background: var(--color-white);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input::placeholder {
  color: var(--color-gray-500);
}

/* 포커스 */
.input:focus {
  outline: none;
  border-color: var(--color-primary-600);
  box-shadow: 0 0 0 3px var(--color-primary-50);
}

/* 에러 */
.input--error {
  border-color: var(--color-error-600);
}
.input--error:focus {
  box-shadow: 0 0 0 3px var(--color-error-100);
}

/* 비활성 */
.input:disabled {
  background: var(--color-gray-50);
  color: var(--color-gray-500);
  cursor: not-allowed;
}

/* 읽기 전용 */
.input--readonly {
  background: var(--color-gray-50);
  border-color: var(--color-gray-100);
  color: var(--color-gray-500);
  cursor: default;
}
```

#### Textarea (설명 필드)

```css
.textarea {
  /* input 스타일 상속 */
  height: auto;
  min-height: 80px;
  padding: var(--space-3);
  resize: vertical;
  line-height: 1.6;
}
```

#### 폼 그룹 구조

```html
<div class="form-group">
  <label class="form-label">제목 <span class="required">*</span></label>
  <input class="input input--error" />
  <p class="form-error">제목은 필수 항목입니다.</p>
</div>
```

```css
.form-group      { display: flex; flex-direction: column; gap: var(--space-1); }
.form-label      { font-size: var(--text-sm); font-weight: 500; color: var(--color-gray-700); }
.form-label .required { color: var(--color-error-600); margin-left: 2px; }
.form-error      { font-size: var(--text-sm); color: var(--color-error-600); }
.form-success    { font-size: var(--text-sm); color: var(--color-success-600); }
```

---

### 5.3 카테고리 배지 (Badge)

Google Calendar의 이벤트 배지에서 착안한 컴팩트한 색상 배지.

```css
.badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 var(--space-2);
  border-radius: 10px;       /* pill */
  font-size: var(--text-xs);
  font-weight: 500;
  white-space: nowrap;
}

/* 기본 카테고리 */
.badge--일반   { background: #E8F0FE; color: #1A73E8; }
.badge--업무   { background: #D2E3FC; color: #1967D2; }
.badge--개인   { background: #FDE7F3; color: #C5221F; }

/* 사용자 정의 (동적 클래스 또는 CSS 변수) */
.badge--custom-1 { background: #E6F4EA; color: #188038; }
.badge--custom-2 { background: #FEF7E0; color: #B06000; }
.badge--custom-3 { background: #F3E8FD; color: #7627BB; }
.badge--custom-4 { background: #E8EAED; color: #3C4043; }
```

---

### 5.4 할일 카드 (Todo Card)

```css
.todo-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: 8px;
  border: 1px solid var(--color-gray-300);
  background: var(--color-white);
  cursor: pointer;
  transition: background 0.1s;
}

.todo-card:hover {
  background: var(--color-gray-100);
}

/* 완료된 할일 */
.todo-card--completed {
  opacity: 0.65;
}
.todo-card--completed .todo-title {
  text-decoration: line-through;
  color: var(--color-gray-500);
}

/* 구조 */
.todo-card__checkbox  { flex-shrink: 0; margin-top: 2px; }
.todo-card__body      { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.todo-card__title     { font-size: var(--text-base); color: var(--color-gray-900); }
.todo-card__meta      { display: flex; align-items: center; gap: var(--space-2); }
.todo-card__due-date  { font-size: var(--text-sm); color: var(--color-gray-500); }
.todo-card__actions   { flex-shrink: 0; opacity: 0; transition: opacity 0.15s; }
.todo-card:hover .todo-card__actions { opacity: 1; }
```

---

### 5.5 체크박스

```css
.checkbox {
  appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-gray-500);
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  flex-shrink: 0;
}

.checkbox:hover {
  border-color: var(--color-primary-600);
}

.checkbox:checked {
  border-color: var(--color-primary-600);
  background: var(--color-primary-600);
  background-image: url("data:image/svg+xml,..."); /* 체크 아이콘 */
}

.checkbox:focus-visible {
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
}
```

---

### 5.6 드롭다운 / Select

```css
.select {
  /* input 스타일 상속 */
  appearance: none;
  background-image: url("chevron-down.svg");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 36px;
  cursor: pointer;
}
```

---

### 5.7 모달 다이얼로그

Google Calendar의 팝업 스타일: 부드러운 그림자, 둥근 모서리.

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-white);
  border-radius: 12px;
  padding: var(--space-6);
  width: 400px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}

.modal__title   { font-size: var(--text-lg); font-weight: 500; margin-bottom: var(--space-3); }
.modal__body    { font-size: var(--text-base); color: var(--color-gray-700); margin-bottom: var(--space-6); }
.modal__actions { display: flex; justify-content: flex-end; gap: var(--space-2); }
```

---

### 5.8 토스트 알림

```css
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: 8px;
  font-size: var(--text-base);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  z-index: 2000;
  animation: toast-in 0.2s ease;
}

.toast--success { background: #323232; color: #FFFFFF; }   /* Google-style dark toast */
.toast--error   { background: var(--color-error-600); color: #FFFFFF; }

@keyframes toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
}
```

---

### 5.9 사이드바 네비게이션

```css
.sidebar {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--color-white);
  border-right: 1px solid var(--color-gray-300);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}
.sidebar__logo {
  display: block;
  padding: var(--space-5) var(--space-4);
  font-size: var(--text-lg);
  font-weight: 500;
  color: var(--color-gray-900);
  text-decoration: none;
  border-bottom: 1px solid var(--color-gray-200);
}
.sidebar__nav {
  display: flex;
  flex-direction: column;
  padding: var(--space-3) var(--space-2);
  gap: var(--space-1);
  flex: 1;
}
.sidebar__nav-item {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--color-gray-700);
  text-decoration: none;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.sidebar__nav-item:hover {
  background: var(--color-gray-100);
  color: var(--color-gray-900);
}
.sidebar__nav-item--active {
  background: var(--color-primary-50);
  color: var(--color-primary-600);
  font-weight: 500;
}
.sidebar__footer {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border-top: 1px solid var(--color-gray-200);
}
```

---

### 5.10 필터 바

```css
.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-gray-300);
  flex-wrap: wrap;
}

.filter-bar .select,
.filter-bar .input[type="date"] {
  height: 36px;
  width: auto;
}
```

---

### 5.11 섹션 구분선

```css
.divider {
  height: 1px;
  background: var(--color-gray-300);
  margin: var(--space-4) 0;
}
```

---

### 5.12 빈 상태 (Empty State)

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-8) 0;
  color: var(--color-gray-500);
  text-align: center;
}

.empty-state__icon  { font-size: 48px; opacity: 0.4; }
.empty-state__title { font-size: var(--text-md); font-weight: 500; }
.empty-state__desc  { font-size: var(--text-sm); }
```

---

### 5.13 로딩 스피너

```css
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-gray-300);
  border-top-color: var(--color-primary-600);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

### 5.14 인증 화면 카드 (SCR-01, SCR-02)

```css
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-gray-50);
  padding: var(--space-4);
}

.auth-card {
  background: var(--color-white);
  border: 1px solid var(--color-gray-300);
  border-radius: 12px;
  padding: 40px 48px;
  width: 100%;
  max-width: 400px;
}

.auth-card__title {
  font-size: var(--text-xl);
  font-weight: 400;
  color: var(--color-gray-900);
  margin-bottom: var(--space-6);
  text-align: center;
}
```

---

## 6. 아이콘

**라이브러리:** [Lucide React](https://lucide.dev/) 사용 권장 (Google Material Icons 대안, React 친화적)

| 기능 | 아이콘 이름 | 크기 |
|------|------------|------|
| 추가 | `Plus` | 16px (버튼 내), 20px (단독) |
| 삭제 | `Trash2` | 16px |
| 수정 | `Pencil` | 16px |
| 완료 체크 | `Check` | 14px (체크박스 내) |
| 로그아웃 | `LogOut` | 16px |
| 카테고리 | `Tag` | 16px |
| 사용자 | `User` | 16px |
| 홈 | `Home` | 16px |
| 필터 | `Filter` | 16px |
| 닫기 | `X` | 16px |
| 마감일 | `Calendar` | 14px |
| 에러 | `AlertCircle` | 16px |
| 성공 | `CheckCircle` | 16px |
| 로딩 | `Loader2` (회전) | 16px |
| 이전/다음 | `ChevronLeft` / `ChevronRight` | 20px |

```tsx
// 사용 예시
import { Plus } from 'lucide-react';
<button className="btn btn-primary">
  <Plus size={16} />
  할일 등록
</button>
```

---

## 7. 반응형 브레이크포인트

| 이름 | 범위 | 설명 |
|------|------|------|
| mobile | `< 768px` | 싱글 컬럼, 필터 접기, 터치 최적화 |
| tablet | `768px ~ 1023px` | 헤더 탭 유지, 필터 가로 배치 |
| desktop | `>= 1024px` | 풀 레이아웃, max-width 960px 콘텐츠 영역 |

```css
/* CSS 미디어 쿼리 */
@media (max-width: 767px)  { /* mobile */ }
@media (min-width: 768px)  { /* tablet+ */ }
@media (min-width: 1024px) { /* desktop */ }
```

### 모바일 전용 조정

- 사이드바: `≤767px`에서 `position: fixed; bottom: 0; width: 100%; height: auto;` 하단 탭바로 전환. `flex-direction: row`로 가로 배치. `.sidebar__logo`와 `.sidebar__footer`는 숨김.
- app-content: 하단 탭바에 콘텐츠가 가려지지 않도록 하단 패딩 80px 추가.
- 필터 바: 드롭다운만 노출하고 날짜 필터는 "기간 설정" 버튼으로 접기.
- 할일 카드 액션 버튼: 항상 표시 (hover 제거).
- 인증 카드: padding을 `24px 24px`으로 축소.

---

## 8. CSS 변수 정의

`src/styles/variables.css`에 전역 변수로 정의한다.

```css
:root {
  /* ─── Color: Primary ─── */
  --color-primary-50:  #EAF2FF;
  --color-primary-100: #D2E3FC;
  --color-primary-500: #4285F4;
  --color-primary-600: #1A73E8;

  /* ─── Color: Neutral ─── */
  --color-white:      #FFFFFF;
  --color-gray-50:    #F8F9FA;
  --color-gray-100:   #F1F3F4;
  --color-gray-300:   #DADCE0;
  --color-gray-500:   #70757A;
  --color-gray-700:   #3C4043;
  --color-gray-900:   #202124;

  /* ─── Color: Semantic ─── */
  --color-success-100: #E6F4EA;
  --color-success-600: #188038;
  --color-error-100:   #FCE8E6;
  --color-error-600:   #D93025;
  --color-warning-100: #FEF7E0;
  --color-warning-600: #E37400;

  /* ─── Typography ─── */
  --font-sans: 'Pretendard', 'Google Sans', -apple-system, BlinkMacSystemFont,
               'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 14px;
  --text-md:   16px;
  --text-lg:   18px;
  --text-xl:   22px;
  --text-2xl:  28px;

  /* ─── Spacing ─── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;

  /* ─── Border ─── */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-pill: 999px;

  /* ─── Shadow ─── */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.12);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.16);

  /* ─── Transition ─── */
  --transition-fast: 0.1s ease;
  --transition-base: 0.15s ease;
}
```

---

## 9. 접근성

### 9.1 색상 대비

| 조합 | 비율 | WCAG 등급 |
|------|------|-----------|
| `gray-900` on `white` | 16.1:1 | AAA |
| `gray-700` on `white` | 7.0:1 | AA |
| `gray-500` on `white` | 4.6:1 | AA |
| `white` on `primary-600` | 4.6:1 | AA |
| `error-600` on `white` | 5.1:1 | AA |

### 9.2 포커스

모든 상호작용 요소에 `focus-visible` 스타일을 명시한다. 마우스 클릭 시에는 포커스 링이 표시되지 않도록 `:focus-visible`을 사용한다.

```css
:focus-visible {
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
}
```

### 9.3 ARIA

| 컴포넌트 | 필수 속성 |
|---------|----------|
| 체크박스 | `aria-label="할일 완료 처리"`, `aria-checked` |
| 삭제 버튼 | `aria-label="할일 삭제: {제목}"` |
| 에러 메시지 | `role="alert"`, `aria-live="polite"` |
| 로딩 스피너 | `aria-label="로딩 중"`, `role="status"` |
| 모달 | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| 네비게이션 | `role="navigation"`, 현재 페이지에 `aria-current="page"` |

### 9.4 키보드 네비게이션

- 모든 버튼, 입력 필드, 링크, 체크박스는 Tab 키로 접근 가능.
- 모달 열릴 때 포커스가 모달 내부로 이동, 닫힐 때 트리거 요소로 복귀 (focus trap).
- `Escape` 키로 모달 닫기.
- 드롭다운: 방향키로 옵션 이동, `Enter`로 선택.
