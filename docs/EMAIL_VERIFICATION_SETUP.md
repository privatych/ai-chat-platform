# Настройка подтверждения email

## Обзор

Система требует подтверждения email адреса при регистрации:
1. Пользователь регистрируется → получает письмо
2. Переходит по ссылке из письма → email подтверждается
3. Автоматический вход в систему
4. Существующие пользователи автоматически помечены как подтвержденные

## Настройка SMTP

### Вариант 1: Gmail (рекомендуется для разработки)

1. **Создайте App Password в Gmail:**
   - Откройте: https://myaccount.google.com/security
   - Включите 2-Step Verification
   - Перейдите в "App passwords"
   - Создайте пароль для приложения "Mail"
   - Скопируйте сгенерированный пароль

2. **Настройте .env на сервере:**
   ```bash
   # SMTP Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password-here  # 16-значный код из Gmail
   SMTP_FROM=noreply@ai.itoq.ru
   WEB_URL=https://ai.itoq.ru
   ```

### Вариант 2: Yandex Mail

```bash
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@yandex.ru
SMTP_PASS=your-password
SMTP_FROM=noreply@ai.itoq.ru
WEB_URL=https://ai.itoq.ru
```

### Вариант 3: Mail.ru

```bash
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@mail.ru
SMTP_PASS=your-password
SMTP_FROM=noreply@ai.itoq.ru
WEB_URL=https://ai.itoq.ru
```

### Вариант 4: Собственный домен (рекомендуется для продакшн)

Используйте SMTP от вашего хостинг-провайдера (Timeweb, Beget, etc.):

```bash
SMTP_HOST=smtp.your-hosting.ru
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@ai.itoq.ru
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@ai.itoq.ru
WEB_URL=https://ai.itoq.ru
```

## Установка на сервер

### 1. Обновите database schema

```bash
ssh root@146.103.97.73
cd /var/www/ai-chat-platform
git pull origin main
pnpm install

# Запустите миграцию
cd packages/database
pnpm tsx scripts/add-email-verification.ts
```

Вывод:
```
Adding email verification fields to users table...
✓ Added email_verified column
✓ Added verification_token column
✓ Added verification_expires column
✓ Created index on verification_token
✓ Marked 4 existing users as verified

✅ Email verification fields added successfully!
```

### 2. Настройте SMTP в .env

```bash
nano /var/www/ai-chat-platform/services/api/.env
```

Добавьте SMTP настройки (см. выше варианты):

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@ai.itoq.ru
WEB_URL=https://ai.itoq.ru
```

### 3. Пересоберите и перезапустите

```bash
cd /var/www/ai-chat-platform
pnpm build
pm2 restart all --update-env
pm2 save
```

### 4. Проверка

```bash
pm2 logs ai-chat-api --lines 50
```

Должны увидеть:
```
✅ All required environment variables are valid
[Pricing] Loaded pricing for 345 models
🚀 Server ready at http://0.0.0.0:3001
```

## Тестирование

### 1. Регистрация нового пользователя

1. Откройте: https://ai.itoq.ru/register
2. Заполните форму регистрации
3. Нажмите "Create an account"
4. Должно появиться сообщение: "Регистрация успешна! Проверьте вашу почту для подтверждения email."

### 2. Проверка письма

Письмо должно содержать:
- Приветствие с именем пользователя
- Кнопку "Подтвердить email"
- Ссылку вида: `https://ai.itoq.ru/verify-email?token=...`
- Предупреждение о сроке действия (24 часа)

### 3. Подтверждение email

1. Перейдите по ссылке из письма
2. Email автоматически подтвердится
3. Автоматический вход в систему
4. Редирект в /chat

### 4. Попытка входа до подтверждения

Если попытаться войти до подтверждения email:
- Логин/пароль правильные
- Ошибка: "Пожалуйста, подтвердите ваш email. Проверьте почту."

## Логи для диагностики

### Проверка отправки email

```bash
pm2 logs ai-chat-api --lines 100 | grep -i "email\|smtp"
```

Успешная отправка:
```
[Email] Verification email sent to: user@example.com
[Register] Verification email sent to: user@example.com
```

Ошибка отправки:
```
[Register] Failed to send verification email: Error: Invalid login: ...
```

### Проверка подтверждения

```bash
pm2 logs ai-chat-api --lines 100 | grep -i "verify"
```

Успешное подтверждение:
```
[Verify Email] Email verified for user: user@example.com
```

## Troubleshooting

### Письма не отправляются

**Проблема:** `Failed to send verification email: Invalid login`

**Решение:** 
1. Проверьте SMTP_USER и SMTP_PASS в .env
2. Для Gmail: используйте App Password, не основной пароль
3. Перезапустите API: `pm2 restart ai-chat-api --update-env`

---

**Проблема:** `ECONNREFUSED`

**Решение:**
1. Проверьте SMTP_HOST и SMTP_PORT
2. Убедитесь что порт открыт на сервере
3. Для Gmail: 587 (TLS) или 465 (SSL)

---

**Проблема:** Письма попадают в спам

**Решение:**
1. Используйте SMTP от собственного домена
2. Настройте SPF и DKIM записи
3. Используйте SMTP_FROM с вашим доменом

### Пользователь не получил письмо

1. **Проверьте логи:**
   ```bash
   pm2 logs ai-chat-api | grep -i "verification email sent"
   ```

2. **Проверьте папку "Спам"**

3. **Проверьте SMTP credentials:**
   ```bash
   # Тест SMTP подключения
   telnet smtp.gmail.com 587
   ```

### Токен устарел

Токен действителен 24 часа. После истечения:
- Пользователь получит ошибку "Неверный или устаревший токен"
- Нужно зарегистрироваться заново

## Обратная совместимость

Существующие пользователи:
- Автоматически помечены как `emailVerified = true`
- Могут входить без подтверждения
- Не получают письма

Новые пользователи:
- Должны подтвердить email
- Не могут войти до подтверждения

## Отключение email verification (для разработки)

Если нужно отключить проверку email в dev окружении:

1. **Временно:** Закомментируйте проверку в login.ts:
   ```typescript
   // if (!user.emailVerified) {
   //   return reply.code(403).send(...)
   // }
   ```

2. **Для всех новых:** Изменить default в schema:
   ```typescript
   emailVerified: boolean('email_verified').notNull().default(true)
   ```
