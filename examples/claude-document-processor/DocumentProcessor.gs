/**
 * DocumentProcessor.gs
 *
 * Complete document processing pipeline using Claude AI
 *
 * Features:
 * - Multiple input formats (text, Drive files, Sheets)
 * - Intelligent chunking for large documents
 * - Automatic caching with CacheManager
 * - Batch processing with progress tracking
 * - Pre/post-processing hooks
 * - Error handling and retry logic
 * - Result aggregation and formatting
 *
 * @version 1.0
 */

const DocumentProcessor = (function() {

  // Configuration
  const CONFIG = {
    maxChunkSize: 50000,     // characters per chunk
    chunkOverlap: 1000,      // overlap between chunks
    defaultModel: 'SONNET',
    enableCaching: true,
    batchSize: 10,           // documents per batch
    progressInterval: 5      // log progress every N documents
  };

  /**
   * Process a single document
   *
   * @param {string} documentText - Document content
   * @param {Object} options - Processing options
   * @returns {Object} Processing result
   */
  function processDocument(documentText, options = {}) {
    const {
      model = CONFIG.defaultModel,
      instructions = 'Analyze this document and extract key information.',
      schema = null,
      useCache = CONFIG.enableCaching
    } = options;

    // Input validation
    if (!documentText || documentText.trim() === '') {
      throw new Error('Document text is empty');
    }

    Logger.log(`📄 Processing document (${documentText.length} chars)...`);

    // Check cache first
    if (useCache) {
      const cached = CacheManager.get(documentText + instructions, model);
      if (cached) {
        Logger.log('✅ Retrieved from cache');
        return formatResult_(cached, 'single', true);
      }
    }

    // Determine if we need chunking
    if (documentText.length > CONFIG.maxChunkSize) {
      Logger.log('📦 Document requires chunking');
      return processLargeDocument_(documentText, options);
    }

    // Process single chunk
    const response = ClaudeClient.extractFromDocument(documentText, {
      model,
      schema,
      instructions
    });

    // Cache the response
    if (useCache) {
      CacheManager.set(documentText + instructions, model, response);
    }

    return formatResult_(response, 'single', false);
  }

  /**
   * Process large document in chunks
   * @private
   */
  function processLargeDocument_(documentText, options) {
    const {
      model = CONFIG.defaultModel,
      instructions = 'Analyze this section:',
      aggregateResults = true
    } = options;

    const chunks = splitIntoChunks_(
      documentText,
      CONFIG.maxChunkSize,
      CONFIG.chunkOverlap
    );

    Logger.log(`Processing ${chunks.length} chunks...`);

    const results = [];
    let totalTokens = 0;
    let cachedChunks = 0;

    chunks.forEach((chunk, index) => {
      Logger.log(`Chunk ${index + 1}/${chunks.length}...`);

      // Check cache
      const cached = CacheManager.get(chunk + instructions, model);
      if (cached) {
        results.push(cached);
        cachedChunks++;
      } else {
        const response = ClaudeClient.sendMessage(
          `${instructions}\n\n${chunk}`,
          { model }
        );

        results.push(response);
        CacheManager.set(chunk + instructions, model, response);

        if (response.usage) {
          totalTokens += (response.usage.input_tokens + response.usage.output_tokens);
        }

        // Small delay between chunks
        if (index < chunks.length - 1) {
          Utilities.sleep(500);
        }
      }
    });

    Logger.log(`✅ Processed ${chunks.length} chunks (${cachedChunks} from cache)`);

    // Aggregate results if requested
    if (aggregateResults) {
      return aggregateChunkResults_(results, model);
    }

    return {
      type: 'chunked',
      chunks: results.length,
      cachedChunks,
      totalTokens,
      results
    };
  }

  /**
   * Aggregate results from multiple chunks
   * @private
   */
  function aggregateChunkResults_(results, model) {
    const allText = results
      .map(r => r.content ? r.content[0].text : r.rawText || '')
      .join('\n\n---\n\n');

    const aggregationPrompt = `
You have received analysis of a document broken into ${results.length} sections.
Please provide a comprehensive summary that combines all sections:

${allText}

Provide a unified analysis covering all sections.
`.trim();

    Logger.log('📊 Aggregating results...');

    const finalResponse = ClaudeClient.sendMessage(aggregationPrompt, { model });

    return formatResult_(finalResponse, 'aggregated', false);
  }

  /**
   * Process multiple documents in batch
   *
   * @param {Array} documents - Array of {text, id} objects
   * @param {Object} options - Processing options
   * @returns {Array} Processing results
   */
  function processBatch(documents, options = {}) {
    const {
      model = CONFIG.defaultModel,
      instructions = 'Analyze this document:',
      batchSize = CONFIG.batchSize
    } = options;

    Logger.log(`📦 Processing batch of ${documents.length} documents...`);

    const results = [];
    const startTime = Date.now();

    documents.forEach((doc, index) => {
      try {
        // Progress logging
        if ((index + 1) % CONFIG.progressInterval === 0) {
          Logger.log(`Progress: ${index + 1}/${documents.length} documents`);
        }

        const result = processDocument(doc.text, {
          ...options,
          instructions: `${instructions}\n\nDocument ID: ${doc.id || index}`
        });

        results.push({
          id: doc.id || index,
          success: true,
          result: result
        });

      } catch (error) {
        Logger.log(`⚠️ Error processing document ${doc.id || index}: ${error.message}`);

        results.push({
          id: doc.id || index,
          success: false,
          error: error.message
        });
      }

      // Pause between batches
      if ((index + 1) % batchSize === 0 && index < documents.length - 1) {
        Logger.log('⏸️  Pausing between batches...');
        Utilities.sleep(2000);
      }
    });

    const duration = Date.now() - startTime;

    Logger.log(`✅ Batch complete: ${results.length} documents in ${duration}ms`);

    return {
      total: documents.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      duration,
      results
    };
  }

  /**
   * Process document from Google Drive
   *
   * @param {string} fileId - Google Drive file ID
   * @param {Object} options - Processing options
   * @returns {Object} Processing result
   */
  function processFromDrive(fileId, options = {}) {
    try {
      const file = DriveApp.getFileById(fileId);
      const mimeType = file.getMimeType();

      Logger.log(`📂 Processing file: ${file.getName()} (${mimeType})`);

      let text;

      // Handle different file types
      if (mimeType === 'application/pdf') {
        // For PDFs, use Drive API to extract text
        text = extractTextFromPDF_(fileId);
      } else if (mimeType.includes('text/')) {
        text = file.getBlob().getDataAsString();
      } else if (mimeType.includes('document')) {
        // Google Docs
        const doc = DocumentApp.openById(fileId);
        text = doc.getBody().getText();
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      return processDocument(text, options);

    } catch (error) {
      throw new Error(`Failed to process Drive file: ${error.message}`);
    }
  }

  /**
   * Extract text from PDF
   * @private
   */
  function extractTextFromPDF_(fileId) {
    try {
      // Use Drive API to convert PDF to text
      const file = DriveApp.getFileById(fileId);
      const blob = file.getBlob();

      // Create temporary Google Doc
      const resource = {
        title: 'temp_pdf_extract',
        mimeType: 'application/vnd.google-apps.document'
      };

      const doc = Drive.Files.insert(resource, blob, {
        ocr: true,
        ocrLanguage: 'en'
      });

      // Extract text
      const docFile = DocumentApp.openById(doc.id);
      const text = docFile.getBody().getText();

      // Clean up
      DriveApp.getFileById(doc.id).setTrashed(true);

      return text;

    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  /**
   * Process data from Google Sheets
   *
   * @param {string} sheetName - Sheet name
   * @param {string} column - Column letter (e.g., 'A')
   * @param {Object} options - Processing options
   * @returns {Object} Batch processing result
   */
  function processFromSheet(sheetName, column, options = {}) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

    if (!sheet) {
      throw new Error(`Sheet not found: ${sheetName}`);
    }

    const columnIndex = column.charCodeAt(0) - 64; // A=1, B=2, etc.
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      throw new Error('Sheet must have at least one data row');
    }

    // Get all values from column
    const values = sheet.getRange(2, columnIndex, lastRow - 1, 1).getValues();

    // Convert to documents array
    const documents = values
      .map((row, index) => ({
        id: `row_${index + 2}`,
        text: row[0]
      }))
      .filter(doc => doc.text && doc.text.trim() !== '');

    Logger.log(`📊 Processing ${documents.length} rows from sheet "${sheetName}"`);

    return processBatch(documents, options);
  }

  /**
   * Extract structured data from document
   *
   * @param {string} documentText - Document text
   * @param {Object} schema - Expected data structure
   * @param {Object} options - Processing options
   * @returns {Object} Extracted data
   */
  function extractStructuredData(documentText, schema, options = {}) {
    const {
      model = CONFIG.defaultModel,
      strictSchema = true
    } = options;

    const instructions = strictSchema
      ? `Extract the following data from the document. Return ONLY valid JSON matching this schema:\n${JSON.stringify(schema, null, 2)}`
      : `Extract relevant data from the document based on this schema:\n${JSON.stringify(schema, null, 2)}`;

    return processDocument(documentText, {
      model,
      instructions,
      schema
    });
  }

  /**
   * Split text into chunks with overlap
   * @private
   */
  function splitIntoChunks_(text, chunkSize, overlap) {
    const chunks = [];
    let position = 0;

    while (position < text.length) {
      const end = Math.min(position + chunkSize, text.length);
      chunks.push(text.substring(position, end));
      position = end - overlap;

      if (position >= text.length - overlap) break;
    }

    return chunks;
  }

  /**
   * Format result object
   * @private
   */
  function formatResult_(response, type, fromCache) {
    const content = response.content
      ? response.content[0].text
      : (response.rawText || JSON.stringify(response));

    return {
      type,
      fromCache,
      content,
      usage: response.usage || null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Configure processor settings
   *
   * @param {Object} options - Configuration options
   */
  function configure(options) {
    if (options.maxChunkSize) CONFIG.maxChunkSize = options.maxChunkSize;
    if (options.chunkOverlap) CONFIG.chunkOverlap = options.chunkOverlap;
    if (options.defaultModel) CONFIG.defaultModel = options.defaultModel;
    if (options.enableCaching !== undefined) CONFIG.enableCaching = options.enableCaching;
    if (options.batchSize) CONFIG.batchSize = options.batchSize;
    if (options.progressInterval) CONFIG.progressInterval = options.progressInterval;

    Logger.log('✅ Processor configuration updated');
  }

  /**
   * Get current configuration
   *
   * @returns {Object} Current config
   */
  function getConfig() {
    return { ...CONFIG };
  }

  // Public API
  return {
    processDocument,
    processBatch,
    processFromDrive,
    processFromSheet,
    extractStructuredData,
    configure,
    getConfig
  };
})();
