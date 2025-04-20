/**
 * Конфигурация SQLMap MCP сервера
 */

module.exports = {
  // Порт, на котором будет запущен сервер
  PORT: process.env.PORT || 18080,
  
  // Время ожидания для операций SQLMap (в миллисекундах)
  TIMEOUT: 3600000, // 1 час
  
  // Максимальное количество одновременных сканирований
  MAX_CONCURRENT_SCANS: 5,
  
  // Настройки SQLMap по умолчанию
  DEFAULT_SQLMAP_OPTIONS: {
    // Настройки для полного сканирования
    full: {
      level: 5,
      risk: 3,
      forms: true,
      crawl: 3,
      threads: 4
    },
    
    // Настройки для быстрого сканирования
    quick: {
      level: 1,
      risk: 1,
      threads: 10
    },
    
    // Настройки для продвинутого сканирования
    advanced: {
      level: 5,
      risk: 3,
      forms: true,
      crawl: 5,
      threads: 8,
      tamper: 'space2comment,between,randomcase'
    }
  },
  
  // Настройки безопасности
  SECURITY: {
    // Список разрешенных доменов для тестирования
    // Пустой массив означает, что ограничений нет
    ALLOWED_DOMAINS: [],
    
    // Ограничение по IP
    ALLOWED_IPS: [],
    
    // Требуется ли аутентификация
    REQUIRE_AUTH: false,
    
    // API ключ (если REQUIRE_AUTH = true)
    API_KEY: process.env.SQLMAP_API_KEY || 'change-me-in-production'
  },
  
  // Пути к файлам и директориям
  PATHS: {
    // Директория для хранения результатов сканирования
    SCAN_DIRECTORY: process.env.SCAN_DIRECTORY || './scans',
    
    // Путь к SQLMap
    SQLMAP_PATH: process.env.SQLMAP_PATH || 'sqlmap'
  },
  
  // Настройки логирования
  LOGGING: {
    // Уровень логирования (error, warn, info, verbose, debug)
    LEVEL: process.env.LOG_LEVEL || 'info',
    
    // Сохранять ли логи в файл
    SAVE_TO_FILE: process.env.SAVE_LOGS || false,
    
    // Путь к директории с логами
    LOG_DIRECTORY: process.env.LOG_DIRECTORY || './logs'
  }
};