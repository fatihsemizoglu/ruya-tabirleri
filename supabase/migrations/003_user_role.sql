-- User rolüne sahip örnek kullanıcı oluştur
-- Bu migration development/test ortamları için örnek bir user rolü kullanıcısı ekler

INSERT INTO users (id, email, password, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'user@example.com', '$2a$10$2nDK31kfqMbbOlvOgPZZguhJGuhw/B6/ybBCGgaAArQxDirZlbTGi', NOW(), NOW());

-- User profili oluştur
INSERT INTO profiles (id, user_id, email, full_name, username, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'user@example.com', 'Örnek Kullanıcı', 'user', NOW(), NOW());

-- User rolü oluştur
INSERT INTO user_roles (id, user_id, role, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'user', NOW());