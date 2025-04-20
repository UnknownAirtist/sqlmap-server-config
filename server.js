const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 18080;

// Создадим директорию для хранения данных сканирования
const scanDirectory = path.join(__dirname, 'scans');
if (!fs.existsSync(scanDirectory)) {
  fs.mkdirSync(scanDirectory);
}

// Настраиваем middleware
app.use(cors());
app.use(bodyParser.json());

// Хранилище для сканирований
const scans = {};

// Проверка здоровья сервера
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'SQLMap MCP Server is running' });
});

// Запуск сканирования
app.post('/scan', (req, res) => {
  const { target, scan_type = 'full', options = {} } = req.body;
  
  if (!target) {
    return res.status(400).json({ error: 'Target URL is required' });
  }

  const scanId = uuidv4();
  const outputDir = path.join(scanDirectory, scanId);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Базовая команда SQLMap
  let sqlmapCommand = `sqlmap -u "${target}" --batch`;
  
  // Добавляем параметры в зависимости от типа сканирования
  if (scan_type === 'full') {
    sqlmapCommand += ' --level=5 --risk=3 --forms --crawl=3';
  } else if (scan_type === 'quick') {
    sqlmapCommand += ' --level=1 --risk=1';
  }
  
  // Добавляем выходной файл
  const outputFile = path.join(outputDir, 'scan_results.txt');
  sqlmapCommand += ` -o --output-dir="${outputDir}"`;
  
  // Добавляем дополнительные опции
  if (options) {
    Object.keys(options).forEach(key => {
      const value = options[key];
      if (typeof value === 'boolean' && value) {
        sqlmapCommand += ` --${key}`;
      } else if (value !== null && value !== undefined) {
        sqlmapCommand += ` --${key}="${value}"`;
      }
    });
  }
  
  // Сохраняем информацию о сканировании
  scans[scanId] = {
    id: scanId,
    target,
    scan_type,
    options,
    status: 'running',
    start_time: new Date().toISOString(),
    command: sqlmapCommand,
    output_directory: outputDir
  };
  
  // Запускаем процесс сканирования
  const scanProcess = exec(sqlmapCommand, (error, stdout, stderr) => {
    if (error) {
      scans[scanId].status = 'error';
      scans[scanId].error = error.message;
      fs.writeFileSync(path.join(outputDir, 'error.log'), stderr);
    } else {
      scans[scanId].status = 'completed';
      fs.writeFileSync(path.join(outputDir, 'output.log'), stdout);
    }
    scans[scanId].end_time = new Date().toISOString();
  });
  
  res.status(201).json({ 
    scan_id: scanId, 
    status: 'running',
    message: 'Scan started successfully'
  });
});

// Получение статуса сканирования
app.get('/scan/:scanId/status', (req, res) => {
  const { scanId } = req.params;
  
  if (!scans[scanId]) {
    return res.status(404).json({ error: 'Scan not found' });
  }
  
  res.status(200).json({
    scan_id: scanId,
    status: scans[scanId].status,
    start_time: scans[scanId].start_time,
    end_time: scans[scanId].end_time || null
  });
});

// Получение результатов сканирования
app.get('/scan/:scanId/results', (req, res) => {
  const { scanId } = req.params;
  
  if (!scans[scanId]) {
    return res.status(404).json({ error: 'Scan not found' });
  }
  
  const outputDir = scans[scanId].output_directory;
  let results = {
    scan_id: scanId,
    status: scans[scanId].status,
    target: scans[scanId].target,
    start_time: scans[scanId].start_time,
    end_time: scans[scanId].end_time || null
  };
  
  // Если сканирование завершено, читаем файлы результатов
  if (scans[scanId].status === 'completed') {
    try {
      const files = fs.readdirSync(outputDir);
      const resultsFile = files.find(f => f.endsWith('scan_results.txt'));
      
      if (resultsFile) {
        const resultContent = fs.readFileSync(path.join(outputDir, resultsFile), 'utf8');
        results.raw_output = resultContent;
        
        // Попытаемся найти уязвимости в выводе
        const vulnerabilities = [];
        if (resultContent.includes('sqlmap identified')) {
          // Парсинг вывода SQLMap для поиска уязвимостей
          // Это упрощенный пример, в реальном коде нужно использовать более сложную логику
          const vulnLines = resultContent.split('\n').filter(line => 
            line.includes('parameter') && line.includes('is vulnerable')
          );
          
          vulnLines.forEach(line => {
            vulnerabilities.push({
              type: 'SQL Injection',
              description: line.trim()
            });
          });
        }
        
        results.vulnerabilities = vulnerabilities;
      } else {
        results.error = 'Results file not found';
      }
    } catch (error) {
      results.error = `Failed to read results: ${error.message}`;
    }
  }
  
  res.status(200).json(results);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`SQLMap MCP Server running on port ${PORT}`);
});

module.exports = app;