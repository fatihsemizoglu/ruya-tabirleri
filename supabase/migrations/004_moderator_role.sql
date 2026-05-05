-- Moderator rolüne sahip örnek kullanıcı oluştur
INSERT INTO users (id, email, password, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440000', 'moderator@example.com', '$2a$10$2nDK31kfqMbbOlvOgPZZguhJGuhw/B6/ybBCGgaAArQxDirZlbTGi', NOW(), NOW());

-- Moderator profili oluştur
INSERT INTO profiles (id, user_id, email, full_name, username, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440000', 'moderator@example.com', 'Moderator Kullanıcı', 'moderator', NOW(), NOW());

-- Moderator rolü oluştur
INSERT INTO user_roles (id, user_id, role, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440000', 'moderator', NOW());