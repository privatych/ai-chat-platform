-- Создание тестового администратора с премиум подпиской
-- Email: admin@test.com
-- Password: admin123

-- Вставка пользователя (хеш для пароля admin123)
INSERT INTO users (id, email, password_hash, role, subscription_tier, subscription_status, subscription_start, subscription_end, created_at)
VALUES (
    gen_random_uuid(),
    'admin@test.com',
    '$2b$10$YqmZHvW8zX7KqH.F6Y5VVOvN.sJ9w2zWxE8zQ8KvB5cJvW7xY9.5G', -- admin123
    'admin',
    'premium',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    subscription_tier = 'premium',
    subscription_status = 'active',
    subscription_start = NOW(),
    subscription_end = NOW() + INTERVAL '1 year';

-- Создание обычного премиум пользователя для тестов
INSERT INTO users (id, email, password_hash, role, subscription_tier, subscription_status, subscription_start, subscription_end, created_at)
VALUES (
    gen_random_uuid(),
    'premium@test.com',
    '$2b$10$YqmZHvW8zX7KqH.F6Y5VVOvN.sJ9w2zWxE8zQ8KvB5cJvW7xY9.5G', -- admin123
    'premiumuser',
    'premium',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    role = 'premiumuser',
    subscription_tier = 'premium',
    subscription_status = 'active';

-- Создание обычного бесплатного пользователя
INSERT INTO users (id, email, password_hash, role, subscription_tier, subscription_status, created_at)
VALUES (
    gen_random_uuid(),
    'user@test.com',
    '$2b$10$YqmZHvW8zX7KqH.F6Y5VVOvN.sJ9w2zWxE8zQ8KvB5cJvW7xY9.5G', -- admin123
    'user',
    'free',
    'active',
    NOW()
)
ON CONFLICT (email) DO NOTHING;
