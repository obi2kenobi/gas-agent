/**
 * PromptTemplates.gs
 *
 * Library of ready-to-use prompt templates for common use cases
 *
 * Features:
 * - Document summarization
 * - Data extraction
 * - Classification
 * - Translation
 * - Q&A
 * - Custom template builder
 *
 * @version 1.0
 */

const PromptTemplates = (function() {

  /**
   * Template: Document Summarization
   */
  const SUMMARIZE = {
    name: 'Summarize Document',
    description: 'Generate concise summary of document',

    generate: function(options = {}) {
      const {
        length = 'medium', // short, medium, long
        focus = null,       // specific aspect to focus on
        format = 'paragraph' // paragraph, bullets, structured
      } = options;

      const lengthGuide = {
        short: '2-3 sentences',
        medium: '1-2 paragraphs',
        long: '3-5 paragraphs'
      };

      let prompt = `Please provide a ${length} summary of the following document.`;

      if (focus) {
        prompt += `\nFocus specifically on: ${focus}`;
      }

      if (format === 'bullets') {
        prompt += '\nProvide the summary as bullet points.';
      } else if (format === 'structured') {
        prompt += '\nOrganize the summary with clear headings.';
      }

      prompt += `\nTarget length: ${lengthGuide[length] || lengthGuide.medium}`;

      return prompt;
    }
  };

  /**
   * Template: Data Extraction
   */
  const EXTRACT_DATA = {
    name: 'Extract Structured Data',
    description: 'Extract specific data points from document',

    generate: function(fields, options = {}) {
      const {
        format = 'json',
        strict = true,
        includeConfidence = false
      } = options;

      let prompt = 'Extract the following information from the document:\n\n';

      fields.forEach(field => {
        prompt += `- ${field.name}`;
        if (field.description) {
          prompt += `: ${field.description}`;
        }
        if (field.type) {
          prompt += ` (type: ${field.type})`;
        }
        prompt += '\n';
      });

      if (format === 'json') {
        const schema = {};
        fields.forEach(field => {
          schema[field.name] = field.example || null;
        });

        prompt += '\n' + (strict ? 'Return ONLY valid JSON:' : 'Return as JSON:') + '\n';
        prompt += JSON.stringify(schema, null, 2);
      }

      if (includeConfidence) {
        prompt += '\n\nFor each field, include a confidence score (0-100).';
      }

      return prompt;
    },

    // Helper: Create schema from field names
    createSchema: function(fieldNames) {
      return fieldNames.map(name => ({
        name: name,
        type: 'string'
      }));
    }
  };

  /**
   * Template: Classification
   */
  const CLASSIFY = {
    name: 'Classify Document',
    description: 'Classify document into categories',

    generate: function(categories, options = {}) {
      const {
        multiLabel = false,
        includeConfidence = true,
        explainReasoning = false
      } = options;

      let prompt = `Classify this document into ${multiLabel ? 'one or more' : 'one'} of the following categories:\n\n`;

      categories.forEach((cat, index) => {
        prompt += `${index + 1}. ${cat.name}`;
        if (cat.description) {
          prompt += `: ${cat.description}`;
        }
        prompt += '\n';
      });

      prompt += '\nReturn the classification';

      if (includeConfidence) {
        prompt += ' with confidence score (0-100)';
      }

      if (explainReasoning) {
        prompt += ' and explain your reasoning';
      }

      prompt += '.';

      return prompt;
    }
  };

  /**
   * Template: Question Answering
   */
  const ANSWER_QUESTIONS = {
    name: 'Answer Questions',
    description: 'Answer specific questions about document',

    generate: function(questions, options = {}) {
      const {
        citeSources = true,
        format = 'structured'
      } = options;

      let prompt = 'Based on the document, please answer the following questions:\n\n';

      questions.forEach((q, index) => {
        prompt += `${index + 1}. ${q}\n`;
      });

      if (citeSources) {
        prompt += '\nCite relevant sections from the document for each answer.';
      }

      if (format === 'structured') {
        prompt += '\nFormat: Question → Answer → Citation';
      }

      return prompt;
    }
  };

  /**
   * Template: Key Points Extraction
   */
  const EXTRACT_KEY_POINTS = {
    name: 'Extract Key Points',
    description: 'Identify main points and insights',

    generate: function(options = {}) {
      const {
        maxPoints = 10,
        category = null, // e.g., 'risks', 'opportunities', 'requirements'
        prioritize = false
      } = options;

      let prompt = `Identify the ${maxPoints} most important points in this document.`;

      if (category) {
        prompt = `Identify the ${maxPoints} most important ${category} in this document.`;
      }

      if (prioritize) {
        prompt += '\nRank them by importance (1 = most important).';
      }

      prompt += '\n\nFor each point, provide:\n';
      prompt += '- Clear, concise statement\n';
      prompt += '- Brief explanation\n';
      prompt += '- Relevant context from document';

      return prompt;
    }
  };

  /**
   * Template: Comparison
   */
  const COMPARE = {
    name: 'Compare Documents',
    description: 'Compare multiple documents or sections',

    generate: function(aspects, options = {}) {
      const {
        format = 'table',
        highlightDifferences = true
      } = options;

      let prompt = 'Compare the documents on the following aspects:\n\n';

      aspects.forEach(aspect => {
        prompt += `- ${aspect}\n`;
      });

      if (format === 'table') {
        prompt += '\nProvide comparison in table format.';
      }

      if (highlightDifferences) {
        prompt += '\nHighlight key differences and similarities.';
      }

      return prompt;
    }
  };

  /**
   * Template: Translation
   */
  const TRANSLATE = {
    name: 'Translate Document',
    description: 'Translate document to another language',

    generate: function(targetLanguage, options = {}) {
      const {
        preserveFormatting = true,
        tone = 'neutral', // formal, casual, neutral
        glossary = null
      } = options;

      let prompt = `Translate the following document to ${targetLanguage}.`;

      if (preserveFormatting) {
        prompt += '\nPreserve the original formatting and structure.';
      }

      if (tone !== 'neutral') {
        prompt += `\nUse a ${tone} tone.`;
      }

      if (glossary) {
        prompt += '\n\nUse these translations for key terms:\n';
        for (const [term, translation] of Object.entries(glossary)) {
          prompt += `- "${term}" → "${translation}"\n`;
        }
      }

      return prompt;
    }
  };

  /**
   * Template: Sentiment Analysis
   */
  const ANALYZE_SENTIMENT = {
    name: 'Analyze Sentiment',
    description: 'Analyze sentiment and tone',

    generate: function(options = {}) {
      const {
        aspects = ['overall'],
        includeQuotes = true,
        scale = 'detailed' // simple, detailed
      } = options;

      let prompt = 'Analyze the sentiment of this document';

      if (aspects.length > 1 || aspects[0] !== 'overall') {
        prompt += ' for the following aspects:\n';
        aspects.forEach(aspect => {
          prompt += `- ${aspect}\n`;
        });
      } else {
        prompt += '.';
      }

      if (scale === 'simple') {
        prompt += '\n\nClassify as: Positive, Negative, or Neutral.';
      } else {
        prompt += '\n\nProvide:\n';
        prompt += '- Overall sentiment (positive/negative/neutral/mixed)\n';
        prompt += '- Confidence score (0-100)\n';
        prompt += '- Emotional tone (e.g., excited, concerned, formal)\n';
        prompt += '- Key sentiment indicators';
      }

      if (includeQuotes) {
        prompt += '\n\nInclude relevant quotes that support your analysis.';
      }

      return prompt;
    }
  };

  /**
   * Template: Action Items Extraction
   */
  const EXTRACT_ACTION_ITEMS = {
    name: 'Extract Action Items',
    description: 'Identify tasks and action items',

    generate: function(options = {}) {
      const {
        includeOwners = true,
        includeDates = true,
        prioritize = true
      } = options;

      let prompt = 'Identify all action items, tasks, and to-dos mentioned in this document.\n\n';
      prompt += 'For each item, extract:\n';
      prompt += '- Action description (what needs to be done)\n';

      if (includeOwners) {
        prompt += '- Responsible person (if mentioned)\n';
      }

      if (includeDates) {
        prompt += '- Deadline or due date (if mentioned)\n';
      }

      if (prioritize) {
        prompt += '- Priority level (high/medium/low)\n';
      }

      prompt += '\nFormat as a structured list.';

      return prompt;
    }
  };

  /**
   * Build custom template
   *
   * @param {Object} config - Template configuration
   * @returns {string} Generated prompt
   */
  function buildCustomTemplate(config) {
    const {
      task,
      context = null,
      outputFormat = null,
      constraints = [],
      examples = []
    } = config;

    let prompt = `Task: ${task}\n\n`;

    if (context) {
      prompt += `Context: ${context}\n\n`;
    }

    if (constraints.length > 0) {
      prompt += 'Constraints:\n';
      constraints.forEach(constraint => {
        prompt += `- ${constraint}\n`;
      });
      prompt += '\n';
    }

    if (outputFormat) {
      prompt += `Output Format: ${outputFormat}\n\n`;
    }

    if (examples.length > 0) {
      prompt += 'Examples:\n';
      examples.forEach((example, index) => {
        prompt += `\nExample ${index + 1}:\n`;
        prompt += `Input: ${example.input}\n`;
        prompt += `Output: ${example.output}\n`;
      });
      prompt += '\n';
    }

    return prompt;
  }

  /**
   * Get all available templates
   *
   * @returns {Array} List of template names
   */
  function listTemplates() {
    return [
      { id: 'SUMMARIZE', name: SUMMARIZE.name, description: SUMMARIZE.description },
      { id: 'EXTRACT_DATA', name: EXTRACT_DATA.name, description: EXTRACT_DATA.description },
      { id: 'CLASSIFY', name: CLASSIFY.name, description: CLASSIFY.description },
      { id: 'ANSWER_QUESTIONS', name: ANSWER_QUESTIONS.name, description: ANSWER_QUESTIONS.description },
      { id: 'EXTRACT_KEY_POINTS', name: EXTRACT_KEY_POINTS.name, description: EXTRACT_KEY_POINTS.description },
      { id: 'COMPARE', name: COMPARE.name, description: COMPARE.description },
      { id: 'TRANSLATE', name: TRANSLATE.name, description: TRANSLATE.description },
      { id: 'ANALYZE_SENTIMENT', name: ANALYZE_SENTIMENT.name, description: ANALYZE_SENTIMENT.description },
      { id: 'EXTRACT_ACTION_ITEMS', name: EXTRACT_ACTION_ITEMS.name, description: EXTRACT_ACTION_ITEMS.description }
    ];
  }

  // Public API
  return {
    SUMMARIZE,
    EXTRACT_DATA,
    CLASSIFY,
    ANSWER_QUESTIONS,
    EXTRACT_KEY_POINTS,
    COMPARE,
    TRANSLATE,
    ANALYZE_SENTIMENT,
    EXTRACT_ACTION_ITEMS,
    buildCustomTemplate,
    listTemplates
  };
})();
