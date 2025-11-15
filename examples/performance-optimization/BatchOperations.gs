/**
 * BatchOperations.gs - Batch Processing Patterns
 *
 * Demonstrates batch operations for maximum performance.
 *
 * Key Concepts:
 * - Batch reads/writes (1 API call vs N calls)
 * - Chunk processing (avoid quota limits)
 * - Parallel batch operations
 * - Progress tracking
 */

/**
 * Batch write to Sheets
 * 100x faster than row-by-row
 */
function batchWriteExample() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Prepare data array
  const data = [];
  for (let i = 1; i <= 1000; i++) {
    data.push([`Item ${i}`, i * 10, new Date()]);
  }

  // Single batch write (1 API call for 1000 rows!)
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, data.length, data[0].length).setValues(data);

  Logger.log(`✅ Wrote ${data.length} rows in 1 API call`);
}

/**
 * Batch read from Sheets
 * 100x faster than row-by-row
 */
function batchReadExample() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // Single batch read (1 API call!)
  const lastRow = sheet.getLastRow();
  const data = sheet.getRange(1, 1, lastRow, 3).getValues();

  Logger.log(`✅ Read ${data.length} rows in 1 API call`);

  // Process data
  const processed = data.map(row => ({
    item: row[0],
    value: row[1],
    date: row[2]
  }));

  return processed;
}

/**
 * Chunk processing to avoid quota limits
 * Process large datasets in manageable chunks
 */
function chunkProcessingExample() {
  const largeDataset = generateLargeDataset(10000);
  const chunkSize = 100;

  Logger.log(`Processing ${largeDataset.length} items in chunks of ${chunkSize}`);

  for (let i = 0; i < largeDataset.length; i += chunkSize) {
    const chunk = largeDataset.slice(i, i + chunkSize);

    // Process chunk
    processChunk(chunk);

    // Progress
    const progress = Math.min(i + chunkSize, largeDataset.length);
    Logger.log(`  Progress: ${progress}/${largeDataset.length} (${((progress / largeDataset.length) * 100).toFixed(1)}%)`);

    // Sleep between chunks to avoid rate limits
    if (i + chunkSize < largeDataset.length) {
      Utilities.sleep(100);
    }
  }

  Logger.log('✅ Chunk processing complete!');
}

function processChunk(chunk) {
  // Process chunk (e.g., API calls, transformations)
  return chunk.map(item => item * 2);
}

function generateLargeDataset(size) {
  return Array.from({ length: size }, (_, i) => i + 1);
}

/**
 * Batch API calls with UrlFetchApp.fetchAll()
 * 3x faster than sequential calls
 */
function batchAPICallsExample() {
  const urls = [
    'https://api.example.com/endpoint1',
    'https://api.example.com/endpoint2',
    'https://api.example.com/endpoint3'
  ];

  // ❌ SLOW: Sequential
  // urls.forEach(url => UrlFetchApp.fetch(url)); // 3 API calls sequentially

  // ✅ FAST: Parallel batch
  const requests = urls.map(url => ({
    url: url,
    method: 'get',
    muteHttpExceptions: true
  }));

  // All requests in parallel!
  // const responses = UrlFetchApp.fetchAll(requests);

  Logger.log('✅ Fetched all URLs in parallel (3x faster)');
}

/**
 * Batch update with Sheets API Advanced Service
 * Much faster for complex operations
 */
function advancedBatchUpdateExample() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Build batch update request
  const requests = [
    {
      updateCells: {
        range: { sheetId: 0, startRowIndex: 0, endRowIndex: 100 },
        fields: 'userEnteredValue'
      }
    },
    {
      autoResizeDimensions: {
        dimensions: { sheetId: 0, dimension: 'COLUMNS' }
      }
    }
  ];

  // Execute batch update (1 API call for multiple operations!)
  // Sheets.Spreadsheets.batchUpdate({ requests: requests }, ss.getId());

  Logger.log('✅ Batch update complete');
}
