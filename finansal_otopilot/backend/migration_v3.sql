-- =====================================================
-- Finansal Otopilot - V3 Migration: Subscriptions, Fixed Expenses, Goals
-- phpMyAdmin'den İçe Aktar ile çalıştır.
-- =====================================================

USE finansal_otopilot;

-- user_profile (V2'den) garantiye al
CREATE TABLE IF NOT EXISTS user_profile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL DEFAULT 'Kullanıcı',
  email VARCHAR(150) DEFAULT NULL,
  monthly_budget DECIMAL(12,2) DEFAULT 10000.00,
  risk_profile ENUM('Güvenli','Dengeli','Agresif') NOT NULL DEFAULT 'Dengeli',
  preferred_currency VARCHAR(10) DEFAULT 'TRY',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO user_profile (id, name, monthly_budget, risk_profile)
VALUES (1, 'Murat Can', 12000.00, 'Dengeli');

-- Abonelikler
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  cycle ENUM('monthly','yearly') NOT NULL DEFAULT 'monthly',
  next_renewal DATE DEFAULT NULL,
  icon VARCHAR(40) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sabit Giderler
CREATE TABLE IF NOT EXISTS fixed_expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  due_day TINYINT UNSIGNED DEFAULT NULL,
  category VARCHAR(60) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Finansal Hedefler
CREATE TABLE IF NOT EXISTS goals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  current_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  deadline DATE DEFAULT NULL,
  status ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Niko Chat Geçmişi (opsiyonel — son N mesajı saklar)
CREATE TABLE IF NOT EXISTS niko_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role ENUM('user','assistant') NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Örnek veriler
INSERT INTO subscriptions (name, amount, cycle, next_renewal, icon) VALUES
  ('Netflix', 199.99, 'monthly', DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'tv'),
  ('Spotify', 79.99, 'monthly', DATE_ADD(CURDATE(), INTERVAL 18 DAY), 'music'),
  ('YouTube Premium', 89.99, 'monthly', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'youtube');

INSERT INTO fixed_expenses (name, amount, due_day, category) VALUES
  ('Kira', 8500.00, 5, 'Kira'),
  ('Elektrik', 450.00, 12, 'Fatura'),
  ('İnternet', 299.00, 20, 'Fatura');

INSERT INTO goals (title, target_amount, current_amount, deadline) VALUES
  ('Yeni Bilgisayar', 30000.00, 25000.00, DATE_ADD(CURDATE(), INTERVAL 3 MONTH)),
  ('Avrupa Tatili', 50000.00, 12000.00, DATE_ADD(CURDATE(), INTERVAL 8 MONTH));
