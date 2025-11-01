SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS fynix;
CREATE DATABASE fynix
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fynix;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Local user ID (primary key)',
    firebase_uid VARCHAR(191) NOT NULL COMMENT 'Unique Firebase UID',
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_firebase_uid (firebase_uid),
    INDEX idx_email (email)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = 'Firebase <-> Local user mapping';


-- ============================================================
-- USER PROFILES
-- ============================================================
CREATE TABLE user_profiles (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL COMMENT 'FK → users.id',
    picture_url VARCHAR(512) NULL,
    timezone VARCHAR(64) DEFAULT 'Asia/Manila',
    currency CHAR(3) DEFAULT 'PHP',
    has_balance TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = no initial balance set',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_profile (user_id),
    CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = 'User preferences and onboarding state';


-- ============================================================
-- BALANCES
-- ============================================================
CREATE TABLE balances (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL COMMENT 'FK → users.id',
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency CHAR(3) NOT NULL DEFAULT 'PHP',
    note VARCHAR(255) NULL,
    set_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_balance_user (user_id),
    CONSTRAINT fk_balances_user FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = 'User’s current balance or initial funds';


-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type ENUM('expense', 'income') NOT NULL DEFAULT 'expense',
    user_id INT UNSIGNED NULL COMMENT 'NULL = global category, else custom user category',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_cat_user (user_id),
    CONSTRAINT fk_categories_user FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = 'Global or custom expense/income categories';


-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE transactions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL COMMENT 'FK → users.id',
    category_id SMALLINT UNSIGNED NOT NULL COMMENT 'FK → categories.id',
    amount DECIMAL(15, 2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'PHP',
    note VARCHAR(512) NULL,
    date_spent DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_trx_user_date (user_id, date_spent),
    INDEX idx_trx_category (category_id),
    CONSTRAINT fk_trx_user FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_trx_category FOREIGN KEY (category_id)
        REFERENCES categories (id)
        ON DELETE RESTRICT
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = 'Expense and income transaction records';


-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE reports (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL COMMENT 'FK → users.id',
    name VARCHAR(191) NOT NULL,
    params JSON NULL,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_reports_user (user_id),
    CONSTRAINT fk_reports_user FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = 'User-saved or generated financial reports';


-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NULL COMMENT 'FK → users.id',
    action VARCHAR(100) NOT NULL,
    details JSON NULL,
    ip VARCHAR(45) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_audit_user (user_id),
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE SET NULL
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = 'Track user/system actions for auditing';
