-- ============================================================
-- TodoListApp — Database Schema
-- Version  : 1.0.0
-- Date     : 2026-05-13
-- Database : PostgreSQL 17
-- Ref      : docs/6-erd.md, docs/2-prd.md
-- ============================================================

-- UUID 생성 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 기존 테이블 정리 (개발 환경 재실행 대비)
-- ============================================================
DROP TABLE IF EXISTS todos      CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users      CASCADE;

-- ============================================================
-- 1. users
-- BR-U-01 : 이메일은 전체 시스템에서 고유
-- BR-U-02 : 비밀번호는 애플리케이션 레이어에서 bcrypt(salt≥10) 해시 후 저장
-- BR-U-04 : 탈퇴 시 연관 데이터 CASCADE 삭제 (todos, categories)
-- ============================================================
CREATE TABLE users (
    id          UUID        NOT NULL DEFAULT uuid_generate_v4(),
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_users        PRIMARY KEY (id),
    CONSTRAINT uq_users_email  UNIQUE      (email)
);

COMMENT ON TABLE  users            IS '서비스 사용자';
COMMENT ON COLUMN users.id         IS '고유 식별자 (UUID v4)';
COMMENT ON COLUMN users.email      IS '로그인 이메일 — 시스템 전체 고유 (BR-U-01)';
COMMENT ON COLUMN users.password   IS 'bcrypt 해시 문자열, salt≥10 (BR-U-02)';
COMMENT ON COLUMN users.name       IS '표시 이름';
COMMENT ON COLUMN users.created_at IS '가입 일시';
COMMENT ON COLUMN users.updated_at IS '정보 수정 일시';

-- ============================================================
-- 2. categories
-- BR-C-01 : isDefault=true 카테고리는 수정·삭제 불가 (애플리케이션 레이어 적용)
-- BR-C-03 : 회원가입 성공 시 기본 카테고리 3개(일반·업무·개인) 자동 생성
--           → user_id=NULL, is_default=true 로 공유 기본 카테고리 사용
-- ============================================================
CREATE TABLE categories (
    id          UUID         NOT NULL DEFAULT uuid_generate_v4(),
    user_id     UUID,                           -- NULL = 기본 카테고리 (BR-C-03)
    name        VARCHAR(100) NOT NULL,
    is_default  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_categories            PRIMARY KEY (id),
    CONSTRAINT fk_categories_user       FOREIGN KEY (user_id)
                                            REFERENCES users (id)
                                            ON DELETE CASCADE,  -- BR-U-04
    CONSTRAINT uq_categories_user_name  UNIQUE (user_id, name)
);

COMMENT ON TABLE  categories             IS '할일 분류 카테고리';
COMMENT ON COLUMN categories.id          IS '고유 식별자 (UUID v4)';
COMMENT ON COLUMN categories.user_id     IS '소유 사용자 FK — NULL이면 시스템 기본 카테고리 (BR-C-03)';
COMMENT ON COLUMN categories.name        IS '카테고리명';
COMMENT ON COLUMN categories.is_default  IS 'true이면 수정·삭제 불가 (BR-C-01), user_id=NULL과 함께 사용';
COMMENT ON COLUMN categories.created_at  IS '생성 일시';

-- ============================================================
-- 3. todos
-- BR-T-01 : 할일은 반드시 하나의 카테고리에 속해야 함 (category_id NOT NULL)
-- BR-T-04 : 완료된 할일은 미완료로 되돌릴 수 없음 (애플리케이션 레이어 적용)
-- BR-C-02 : 카테고리 삭제 시 해당 할일을 기본 카테고리로 이동
--           → ON DELETE RESTRICT + 애플리케이션 레이어에서 이동 후 삭제 처리
-- ============================================================
CREATE TABLE todos (
    id           UUID         NOT NULL DEFAULT uuid_generate_v4(),
    user_id      UUID         NOT NULL,
    category_id  UUID         NOT NULL,         -- BR-T-01
    title        VARCHAR(255) NOT NULL,
    description  TEXT,                          -- nullable
    due_date     DATE,                          -- nullable
    is_completed BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_todos           PRIMARY KEY (id),
    CONSTRAINT fk_todos_user      FOREIGN KEY (user_id)
                                      REFERENCES users      (id)
                                      ON DELETE CASCADE,    -- BR-U-04
    CONSTRAINT fk_todos_category  FOREIGN KEY (category_id)
                                      REFERENCES categories (id)
                                      ON DELETE RESTRICT    -- BR-C-02: 앱 레이어에서 이동 후 삭제
);

COMMENT ON TABLE  todos              IS '사용자 할일';
COMMENT ON COLUMN todos.id           IS '고유 식별자 (UUID v4)';
COMMENT ON COLUMN todos.user_id      IS '소유 사용자 FK';
COMMENT ON COLUMN todos.category_id  IS '분류 카테고리 FK — NOT NULL 필수 (BR-T-01)';
COMMENT ON COLUMN todos.title        IS '할일 제목';
COMMENT ON COLUMN todos.description  IS '상세 설명 (선택)';
COMMENT ON COLUMN todos.due_date     IS '마감일 (선택)';
COMMENT ON COLUMN todos.is_completed IS '완료 여부 — true로 변경 후 되돌릴 수 없음 (BR-T-04)';
COMMENT ON COLUMN todos.created_at   IS '생성 일시';
COMMENT ON COLUMN todos.updated_at   IS '수정 일시';

-- ============================================================
-- 인덱스
-- ============================================================

-- todos: 사용자별 목록 조회 (UC-F-01)
CREATE INDEX idx_todos_user_id       ON todos (user_id);

-- todos: 카테고리별 필터링 (UC-F-02)
CREATE INDEX idx_todos_category_id   ON todos (category_id);

-- todos: 완료 여부 필터링 (UC-F-04)
CREATE INDEX idx_todos_is_completed  ON todos (user_id, is_completed);

-- todos: 기간 필터링 (UC-F-03)
CREATE INDEX idx_todos_due_date      ON todos (user_id, due_date);

-- categories: 사용자별 카테고리 조회
CREATE INDEX idx_categories_user_id  ON categories (user_id);

-- ============================================================
-- 기본 카테고리 시드 데이터 (BR-C-03)
-- user_id=NULL, is_default=true — 모든 사용자가 공유하는 기본값
-- ============================================================
INSERT INTO categories (id, user_id, name, is_default) VALUES
    (uuid_generate_v4(), NULL, '일반', TRUE),
    (uuid_generate_v4(), NULL, '업무', TRUE),
    (uuid_generate_v4(), NULL, '개인', TRUE);
