-- Обновить пользователя admin@test.com до админа с премиум подпиской
UPDATE users
SET role = 'admin',
    subscription_tier = 'premium',
    subscription_status = 'active',
    subscription_start = NOW(),
    subscription_end = NOW() + INTERVAL '1 year'
WHERE email = 'admin@test.com';

-- Создать дополнительного премиум пользователя
INSERT INTO users (id, email, password_hash, role, subscription_tier, subscription_status, subscription_start, subscription_end, full_name, created_at)
VALUES (
    gen_random_uuid(),
    'premium@test.com',
    '$2b$10$YqmZHvW8zX7KqH.F6Y5VVOvN.sJ9w2zWxE8zQ8KvB5cJvW7xY9.5G',
    'premiumuser',
    'premium',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    'Premium User',
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    role = 'premiumuser',
    subscription_tier = 'premium',
    subscription_status = 'active';

-- Проверка
SELECT email, role, subscription_tier, subscription_status FROM users WHERE email IN ('admin@test.com', 'premium@test.com');
