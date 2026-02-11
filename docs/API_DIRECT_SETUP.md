# Инструкция по настройке api-direct.itoq.ru

## Текущий статус

✅ Nginx конфигурация подготовлена
✅ Скрипт автоматической установки SSL загружен на сервер
✅ DNS запись api-direct.itoq.ru существует
❌ Cloudflare proxy ВКЛЮЧЁН (нужно отключить!)

## Важно: Обнаружена проблема с DNS

Диагностика показала, что:
- ✅ `api-direct.itoq.ru` уже существует
- ❌ Указывает на Cloudflare IP (proxy включён)
- ❌ Нельзя создать `api-direct.itoq.ru` (вложенные поддомены)

**Решение:** Использовать `api-direct.itoq.ru` (без `ai.`) и отключить Cloudflare proxy.

## Шаг 1: Отключите Cloudflare Proxy

1. Откройте: https://dash.cloudflare.com/
2. Выберите домен: itoq.ru
3. Перейдите в: DNS → Records
4. Найдите запись: **api-direct.itoq.ru** (уже существует!)

**Измените proxy status:**
```
Type: A
Name: api-direct
IPv4: 146.103.97.73  (если другой IP - измените!)
Proxy status: Кликните на ОРАНЖЕВУЮ тучку → должна стать СЕРОЙ ☁️
TTL: Auto
```

5. Нажмите "Save"

### Проверка DNS после отключения proxy:

На вашем компьютере:
```bash
dig +short api-direct.itoq.ru @1.1.1.1
```

Раньше выводило: `104.21.51.143` или `172.67.181.104` (Cloudflare IP)
**Теперь должно:** `146.103.97.73` (ваш сервер)

Если всё ещё показывает Cloudflare IP - подождите 5-15 минут и проверьте снова.

## Шаг 2: Запустите автоматическую установку

Когда DNS заработает (команда выше выводит 146.103.97.73):

```bash
ssh root@146.103.97.73
# Пароль: Lp8R9mqgxiT6D#V3bF1%

# Запустите исправленный скрипт:
/tmp/setup-api-direct-fixed.sh
```

**Примечание:** Скрипт автоматически проверит, что Cloudflare proxy отключён, и остановится с инструкциями, если proxy всё ещё включён.

Скрипт автоматически:
1. Проверит DNS
2. Установит Nginx конфигурацию
3. Получит SSL сертификат от Let's Encrypt
4. Настроит HTTPS с оптимизацией для SSE streaming
5. Обновит frontend на использование прямого API
6. Пересоберёт и перезапустит приложение

## Шаг 3: Проверка работы

После успешной установки:

```bash
# Проверьте API доступность:
curl -I https://api-direct.itoq.ru/api/health

# Должно вернуть:
# HTTP/2 200
# content-type: application/json
```

Откройте сайт и попробуйте отправить сообщение в чат.

## Ожидаемый результат

- ✅ Streaming работает без ошибок ERR_QUIC_PROTOCOL_ERROR
- ✅ GPT-3.5-turbo работает без прерываний
- ✅ Сообщения полностью доходят
- ✅ Не нужно пополнять баланс на стримминг через Cloudflare

## Что изменилось?

**Раньше:** Веб → https://ai.itoq.ru/api (через Cloudflare proxy) → Ваш сервер
**Теперь:** Веб → https://api-direct.itoq.ru/api (напрямую) → Ваш сервер

Cloudflare proxy конфликтует с Server-Sent Events (SSE), вызывая QUIC ошибки.
Прямое подключение без прокси решает эту проблему.

## Файлы на сервере

- `/tmp/api-direct-nginx-fixed.conf` - конфигурация Nginx (HTTP только)
- `/tmp/setup-api-direct-fixed.sh` - скрипт автоматической установки
- `/tmp/api-direct-nginx-ssl-fixed.conf` - будет создан скриптом (HTTPS)
- `/tmp/diagnose-dns.sh` - скрипт диагностики DNS (локально)

## Если что-то пошло не так

### DNS не разрешается через час

Проверьте:
1. Правильность записи в Cloudflare (точное имя: api-direct)
2. Proxy ОТКЛЮЧЕН (серая тучка)
3. IP правильный: 146.103.97.73

### Certbot не может получить сертификат

```bash
# Проверьте, что Nginx слушает на 80 порту:
ss -tlnp | grep :80

# Проверьте логи:
tail -f /var/log/letsencrypt/letsencrypt.log
```

### После установки streaming всё равно не работает

Проверьте, что frontend использует новый API:

```bash
ssh root@146.103.97.73
cat /root/ai-chat-platform/apps/web/.env.local | grep API_URL
# Должно быть: NEXT_PUBLIC_API_URL=https://api-direct.itoq.ru
```

## Следующие шаги после установки

1. Пополните баланс OpenRouter: https://openrouter.ai/settings/credits
2. Модели должны заработать без ошибки 402 Payment Required
