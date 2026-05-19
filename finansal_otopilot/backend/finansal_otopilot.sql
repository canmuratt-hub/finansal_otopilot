-- =====================================================
-- Finansal Otopilot - Veritabanı Kurulum Scripti
-- =====================================================

CREATE DATABASE IF NOT EXISTS finansal_otopilot
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE finansal_otopilot;

-- ----------------------------
-- Tablo: transactions
-- ----------------------------
DROP TABLE IF EXISTS transactions;
CREATE TABLE transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amount DECIMAL(12,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  type ENUM('income','expense') NOT NULL DEFAULT 'expense',
  date DATE NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Tablo: ai_insights
-- ----------------------------
DROP TABLE IF EXISTS ai_insights;
CREATE TABLE ai_insights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  insight_text TEXT NOT NULL,
  action_suggested VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Örnek Veri (opsiyonel)
-- ----------------------------
INSERT INTO transactions (amount, category, type, date, description) VALUES
  (250.00, 'Market',     'expense', CURDATE(), 'Haftalık market alışverişi'),
  (45.50,  'Ulaşım',     'expense', CURDATE(), 'Akbil dolumu'),
  (15000.00,'Maaş',      'income',  CURDATE(), 'Aylık maaş');

INSERT INTO ai_insights (insight_text, action_suggested) VALUES
  ('Bu ay market harcamalarınız geçen aya göre %20 arttı.', 'Market bütçenizi gözden geçirin.');
