# 🔐 Production Access Credentials

**Проект:** AI Chat Platform
**Дата деплоя:** 2026-02-11
**Статус:** ✅ Production Ready

---

## 🌐 Публичные адреса

### Приложение
- **Frontend:** https://ai.itoq.ru
- **API:** https://api.ai.itoq.ru
- **API Health:** https://api.ai.itoq.ru/health

---

## 👥 Пользователи приложения

⚠️ **ВАЖНО:** Тестовые пользователи НЕ СОЗДАНЫ в production БД!

### Вариант 1: Создать нового пользователя
1. Откройте https://ai.itoq.ru/register
2. Зарегистрируйте нового пользователя
3. Для admin доступа нужно изменить роль в БД вручную

### Вариант 2: Создать тестовых пользователей вручную
Подключитесь к VPS и выполните:
```bash
ssh root@185.209.30.133
cd /var/www/ai-chat-platform/packages/database
npm install -g tsx
tsx scripts/update-admin-role.ts
```

Это создаст:
- **Admin:** admin@test.com / admin123
- **Premium:** premium@test.com / admin123
- **Free:** user@test.com / admin123

---

## 🖥️ VPS Server Access

### SSH подключение
```bash
ssh root@185.209.30.133
```

**Credentials:**
- **IP:** 185.209.30.133
- **User:** root
- **Password:** 9WD7_Qz4943ddgrQ#166

---

## 🗄️ PostgreSQL Database

### Локальное подключение (на VPS)
```bash
psql -U aichatuser -d aichatdb -h localhost
```

**Credentials:**
- **Host:** localhost (185.209.30.133 для удаленного доступа)
- **Port:** 5432
- **Database:** aichatdb
- **User:** aichatuser
- **Password:** aichat2026secure

### Connection String
```
postgresql://aichatuser:aichat2026secure@localhost:5432/aichatdb
```

---

## 🔑 API Keys & Secrets

### OpenRouter API Key
```
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
```

### JWT Secret
```
ai-chat-platform-super-secret-jwt-key-2026-production
```

⚠️ **ВАЖНО:** Эти ключи используются в production! Храните в секрете.

---

## 🐳 Process Management (PM2)

### Подключение и управление
```bash
ssh root@185.209.30.133

# Проверить статус
pm2 status

# Логи
pm2 logs

# Перезапуск
pm2 restart all

# Остановка
pm2 stop all

# Запуск
pm2 start all
```

### Процессы
- **ai-chat-api** - API сервер (порт 3001)
- **ai-chat-web** - Web сервер (порт 3000)

---

## 🌐 Nginx

### Конфигурация
```bash
# Редактировать конфиг
nano /etc/nginx/sites-available/ai-chat

# Проверить синтаксис
nginx -t

# Перезагрузить
systemctl reload nginx

# Логи
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🔐 SSL Certificates (Let's Encrypt)

### Информация о сертификатах
- **Домены:** ai.itoq.ru, api.ai.itoq.ru
- **Expires:** 2026-05-12
- **Auto-renewal:** ✅ Настроено (Certbot)

### Пути к сертификатам
```
Certificate: /etc/letsencrypt/live/ai.itoq.ru/fullchain.pem
Private Key: /etc/letsencrypt/live/ai.itoq.ru/privkey.pem
```

### Ручное продление (если нужно)
```bash
certbot renew
```

---

## ☁️ Cloudflare

### DNS Records
```
Type: A
Name: ai
IPv4: 185.209.30.133
Proxy: ✅ Enabled

Type: A
Name: api.ai
IPv4: 185.209.30.133
Proxy: ✅ Enabled
```

### SSL/TLS Settings
- **Encryption mode:** Full (рекомендуется)
- **Always Use HTTPS:** ✅ Enabled

**Панель управления:** https://dash.cloudflare.com/

---

## 📁 Файловая структура на VPS

### Основные директории
```
/var/www/ai-chat-platform/          # Основная директория проекта
├── apps/web/                        # Next.js приложение
│   └── .env.local                   # Web environment variables
├── services/api/                    # Fastify API
│   └── .env                         # API environment variables
└── packages/database/               # Database schemas
    └── .env                         # DB connection string
```

### Environment Files

**API (.env):**
```bash
DATABASE_URL=postgresql://aichatuser:aichat2026secure@localhost:5432/aichatdb
JWT_SECRET=ai-chat-platform-super-secret-jwt-key-2026-production
OPENROUTER_API_KEY=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
FRONTEND_URL=https://ai.itoq.ru
PORT=3001
NODE_ENV=production
```

**Web (.env.local):**
```bash
NEXT_PUBLIC_API_URL=https://api.ai.itoq.ru
```

---

## 🔄 Обновление кода (Deployment)

### Процесс обновления
```bash
# 1. Подключиться к VPS
ssh root@185.209.30.133

# 2. Перейти в директорию проекта
cd /var/www/ai-chat-platform

# 3. Получить последние изменения
git pull origin main

# 4. Установить зависимости (если были изменения)
pnpm install

# 5. Собрать проект
pnpm build

# 6. Перезапустить приложения
pm2 restart all

# 7. Проверить логи
pm2 logs
```

---

## 📊 Мониторинг и логи

### PM2 Logs
```bash
# Все логи
pm2 logs

# Только API
pm2 logs ai-chat-api

# Только Web
pm2 logs ai-chat-web

# Последние 100 строк
pm2 logs --lines 100
```

### Nginx Logs
```bash
# Access log
tail -f /var/log/nginx/access.log

# Error log
tail -f /var/log/nginx/error.log
```

### Системные ресурсы
```bash
# Использование памяти и CPU
pm2 monit

# Системная информация
htop  # или top
free -h  # память
df -h    # диск
```

---

## 🆘 Troubleshooting

### Сайт не открывается
```bash
# Проверить статус сервисов
systemctl status nginx
pm2 status

# Проверить порты
netstat -tlnp | grep -E "80|443|3000|3001"

# Перезапустить все
pm2 restart all
systemctl restart nginx
```

### База данных не подключается
```bash
# Проверить статус PostgreSQL
systemctl status postgresql

# Перезапустить
systemctl restart postgresql

# Подключиться напрямую
psql -U aichatuser -d aichatdb -h localhost
```

### SSL проблемы
```bash
# Проверить сертификаты
certbot certificates

# Обновить сертификаты
certbot renew

# Проверить Nginx конфиг
nginx -t
```

---

## 📞 GitHub Repository

**URL:** https://github.com/privatych/ai-chat-platform

### Последний коммит
```
80d2b08 - feat: complete production preparation and fixes
```

---

## 💰 Стоимость инфраструктуры

### Текущие расходы
- **VPS:** (уточните у провайдера)
- **Домен itoq.ru:** уже оплачен
- **Cloudflare:** $0/месяц (Free plan)
- **Let's Encrypt SSL:** $0 (бесплатно)
- **OpenRouter API:** pay-as-you-go (зависит от использования)

---

## ⚠️ Важные заметки

1. **Регулярное резервное копирование БД:**
   ```bash
   pg_dump -U aichatuser -d aichatdb > backup-$(date +%Y%m%d).sql
   ```

2. **Обновление зависимостей:**
   ```bash
   pnpm update
   ```

3. **Мониторинг использования API:**
   - Отслеживайте расходы на OpenRouter: https://openrouter.ai/activity

4. **Безопасность:**
   - Регулярно обновляйте систему: `apt update && apt upgrade`
   - Меняйте пароли раз в 3-6 месяцев
   - Проверяйте логи на подозрительную активность

---

**Дата создания:** 2026-02-11
**Версия:** 1.0.0
