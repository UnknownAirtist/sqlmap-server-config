# SQLMap MCP Сервер

SQLMap MCP Сервер — это промежуточный сервер для интеграции популярного инструмента тестирования SQL-инъекций SQLMap с агентами искусственного интеллекта.

## Требования

Для работы сервера требуются:

- Node.js (версия 14 или выше)
- SQLMap (должен быть установлен и доступен в PATH)
- Python (для работы SQLMap)

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/UnknownAirtist/sqlmap-server-config.git
cd sqlmap-server-config
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите сервер:
```bash
npm start
```

По умолчанию сервер будет работать на порту 18080. Вы можете изменить порт, установив переменную окружения PORT.

## API

### Проверка статуса сервера

```
GET /health
```

Пример ответа:
```json
{
  "status": "OK",
  "message": "SQLMap MCP Server is running"
}
```

### Запуск сканирования

```
POST /scan
```

Параметры запроса:
- `target` (обязательный): URL-адрес для сканирования
- `scan_type`: тип сканирования ('full' или 'quick', по умолчанию 'full')
- `options`: дополнительные опции SQLMap

Пример запроса:
```json
{
  "target": "http://example.com/vulnerable.php?id=1",
  "scan_type": "full",
  "options": {
    "forms": true,
    "crawl": 3,
    "threads": 5
  }
}
```

Пример ответа:
```json
{
  "scan_id": "12345678-1234-1234-1234-123456789012",
  "status": "running",
  "message": "Scan started successfully"
}
```

### Получение статуса сканирования

```
GET /scan/:scanId/status
```

Пример ответа:
```json
{
  "scan_id": "12345678-1234-1234-1234-123456789012",
  "status": "running",
  "start_time": "2025-04-20T01:23:45.678Z",
  "end_time": null
}
```

### Получение результатов сканирования

```
GET /scan/:scanId/results
```

Пример ответа:
```json
{
  "scan_id": "12345678-1234-1234-1234-123456789012",
  "status": "completed",
  "target": "http://example.com/vulnerable.php?id=1",
  "start_time": "2025-04-20T01:23:45.678Z",
  "end_time": "2025-04-20T01:30:45.678Z",
  "vulnerabilities": [
    {
      "type": "SQL Injection",
      "description": "Parameter 'id' is vulnerable to SQL injection attacks"
    }
  ],
  "raw_output": "..."
}
```

## Безопасность

Этот сервер предназначен для использования в тестовой среде и только на системах, которые вы имеете право тестировать. Неправильное использование этого инструмента может привести к юридическим последствиям.

## Лицензия

MIT