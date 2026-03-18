-- Migration: Add admin_notifications table
-- Run this SQL to add the notifications table to your existing database

CREATE TABLE IF NOT EXISTS admin_notifications (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    type ENUM('info', 'warning', 'success', 'error', 'comment', 'message') NOT NULL DEFAULT 'info',
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    link VARCHAR(500) NULL,
    is_active BOOLEAN NULL DEFAULT TRUE,
    is_read BOOLEAN NULL DEFAULT FALSE,
    display_order INT NULL DEFAULT 0,
    created_by VARCHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    INDEX idx_admin_notifications_is_active (is_active),
    INDEX idx_admin_notifications_display_order (display_order),
    INDEX idx_admin_notifications_created_at (created_at),
    INDEX idx_admin_notifications_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
