-- =====================================================
-- Finansal Otopilot - V2 Migration: User Profile
-- phpMyAdmin'den İçe Aktar ile çalıştır.
-- =====================================================

USE finansal_otopilot;

CREATE TABLE IF NOT EXISTS user_profile (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL DEFAULT 'Kullanıcı',
  email VARCHAR(150) DEFAULT NULL,
  monthly_budget DECIMAL(12,2) DEFAULT 10000.00,
  risk_profile ENUM('Güvenli','Dengeli','Agresif') NOT NULL DEFAULT 'Dengeli',
  preferred_currency VARCHAR(10) DEFAULT 'TRY',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Varsayılan profil (id=1) — uygulama bunu kullanıyor
INSERT INTO user_profile (id, name, monthly_budget, risk_profile)
VALUES (1, 'Murat Can', 12000.00, 'Dengeli')
ON DUPLICATE KEY UPDATE name = VALUES(name);
