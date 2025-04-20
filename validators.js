/**
 * Валидаторы для SQLMap MCP сервера
 */

const config = require('./config');
const url = require('url');

/**
 * Валидатор для URL
 * @param {string} targetUrl URL для проверки
 * @returns {Object} Результат валидации
 */
function validateUrl(targetUrl) {
  if (!targetUrl) {
    return {
      isValid: false,
      error: 'Target URL is required'
    };
  }
  
  try {
    const parsedUrl = new URL(targetUrl);
    
    // Проверка протокола
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'Only HTTP and HTTPS protocols are supported'
      };
    }
    
    // Проверка разрешенных доменов, если они указаны
    const allowedDomains = config.SECURITY.ALLOWED_DOMAINS;
    if (allowedDomains && allowedDomains.length > 0) {
      const hostname = parsedUrl.hostname;
      const isDomainAllowed = allowedDomains.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
      
      if (!isDomainAllowed) {
        return {
          isValid: false,
          error: 'Target domain is not in the allowed domains list'
        };
      }
    }
    
    return {
      isValid: true
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
}

/**
 * Валидатор для типа сканирования
 * @param {string} scanType Тип сканирования
 * @returns {Object} Результат валидации
 */
function validateScanType(scanType) {
  const validScanTypes = ['quick', 'full', 'advanced'];
  
  if (!scanType) {
    // Значение по умолчанию - full
    return {
      isValid: true,
      value: 'full'
    };
  }
  
  if (!validScanTypes.includes(scanType)) {
    return {
      isValid: false,
      error: `Invalid scan type. Valid options are: ${validScanTypes.join(', ')}`
    };
  }
  
  return {
    isValid: true,
    value: scanType
  };
}

/**
 * Валидатор для опций SQLMap
 * @param {Object} options Опции для SQLMap
 * @returns {Object} Результат валидации
 */
function validateOptions(options) {
  if (!options) {
    return {
      isValid: true,
      value: {}
    };
  }
  
  if (typeof options !== 'object') {
    return {
      isValid: false,
      error: 'Options must be an object'
    };
  }
  
  // Список опций, которые могут быть опасными
  const dangerousOptions = [
    'os-shell',
    'os-cmd',
    'os-pwn',
    'os-smbrelay',
    'os-bof',
    'priv-esc',
    'msf-path',
    'tmp-path',
    'tmp-dir',
    'waf-bypass',
    'method',
    'python-shell',
    'eval'
  ];
  
  // Проверка на опасные опции
  for (const option of dangerousOptions) {
    if (option in options) {
      return {
        isValid: false,
        error: `Option '${option}' is not allowed for security reasons`
      };
    }
  }
  
  // Проверка типов значений опций
  for (const [key, value] of Object.entries(options)) {
    if (typeof value !== 'string' && typeof value !== 'boolean' && typeof value !== 'number') {
      return {
        isValid: false,
        error: `Option value for '${key}' must be a string, boolean, or number`
      };
    }
  }
  
  return {
    isValid: true,
    value: options
  };
}

/**
 * Валидация запроса на сканирование
 * @param {Object} scanRequest Запрос на сканирование
 * @returns {Object} Результат валидации
 */
function validateScanRequest(scanRequest) {
  if (!scanRequest || typeof scanRequest !== 'object') {
    return {
      isValid: false,
      error: 'Invalid scan request format'
    };
  }
  
  // Валидация URL
  const urlValidation = validateUrl(scanRequest.target);
  if (!urlValidation.isValid) {
    return urlValidation;
  }
  
  // Валидация типа сканирования
  const scanTypeValidation = validateScanType(scanRequest.scan_type);
  if (!scanTypeValidation.isValid) {
    return scanTypeValidation;
  }
  
  // Валидация опций
  const optionsValidation = validateOptions(scanRequest.options);
  if (!optionsValidation.isValid) {
    return optionsValidation;
  }
  
  return {
    isValid: true,
    validatedRequest: {
      target: scanRequest.target,
      scan_type: scanTypeValidation.value,
      options: optionsValidation.value
    }
  };
}

module.exports = {
  validateUrl,
  validateScanType,
  validateOptions,
  validateScanRequest
};