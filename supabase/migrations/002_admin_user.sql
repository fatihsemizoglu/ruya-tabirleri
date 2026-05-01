-- Admin kullanıcısı oluştur
INSERT INTO users (id, email, password, created_at, updated_at) VALUES
('bf48a7a8-daee-411f-b8d0-d8ba951cd37a', 'admin@mysticlogbook.com', '$2a$10$2nDK31kfqMbbOlvOgPZZguhJGuhw/B6/ybBCGgaAArQxDirZlbTGi', NOW(), NOW());

-- Admin profili oluştur
INSERT INTO profiles (id, user_id, email, full_name, username, created_at, updated_at) VALUES
('3e15a783-1718-47f6-ac35-ff12d5360db2', 'bf48a7a8-daee-411f-b8d0-d8ba951cd37a', 'admin@mysticlogbook.com', 'Admin User', 'admin', NOW(), NOW());

-- Admin rolü oluştur
INSERT INTO user_roles (id, user_id, role, created_at) VALUES
('44528ae8-74e6-46a7-a1e8-72cd21f77384', 'bf48a7a8-daee-411f-b8d0-d8ba951cd37a', 'admin', NOW());
