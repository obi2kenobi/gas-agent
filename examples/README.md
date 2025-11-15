# 📦 GAS-Agent Examples

**Complete, runnable examples demonstrating production-ready patterns**

---

## Overview

This directory contains complete, working examples that you can copy, adapt, and deploy. Each example demonstrates best practices from the GAS-Agent documentation system.

---

## Available Examples

### 1. OAuth2 Business Central Integration ✅ **IMPLEMENTED**

**Location**: [`oauth2-bc-integration/`](oauth2-bc-integration/)
**Complexity**: Intermediate
**Time to implement**: Ready to use (2,449 lines of production code)

**Complete OAuth2 flow for Business Central API integration**

**Features**:
- ✅ OAuth2 client credentials flow with Azure AD
- ✅ Multi-level token caching (Memory → CacheService → Fresh) - 160x faster
- ✅ Full OData v4 support ($filter, $select, $expand, $orderby, $top, $skip)
- ✅ Error handling with exponential backoff and automatic retry
- ✅ 6 production-ready examples (Export to Sheets, Reports, Search, Sync)
- ✅ Comprehensive test suite with performance benchmarks
- ✅ Complete setup guide and documentation

**Files**:
- `Config.gs` (208 lines) - Secure configuration with PropertiesService
- `OAuth2Manager.gs` (260 lines) - Token management with caching
- `BCClient.gs` (398 lines) - OData client with helpers for all BC entities
- `Code.gs` (395 lines) - 6 practical examples ready to use
- `TEST.gs` (371 lines) - Full test suite with performance tests
- `README.md` (817 lines) - Complete documentation and guide

**Quick Start**:
1. Copy all `.gs` files to your Google Apps Script project
2. Run `setupConfig()` with your BC credentials
3. Run `runAllTests()` to verify setup
4. Run `runAllExamples()` to see it in action

**Learn More**: See [oauth2-bc-integration/README.md](oauth2-bc-integration/README.md)

### 2. Sheets Database

**Location**: [`sheets-database/`](sheets-database/)
**Complexity**: Intermediate
**Time to implement**: 2-3 hours

Use Google Sheets as a relational database with:
- Repository pattern for data access
- CRUD operations with validation
- Primary/Foreign key relationships
- Query patterns and indexing

**Files**:
- `Repository.gs` - Data access layer
- `Service.gs` - Business logic layer
- `Schema.gs` - Database schema
- `README.md` - Usage guide

### 3. Claude Document Processor

**Location**: [`claude-document-processor/`](claude-document-processor/)
**Complexity**: Advanced
**Time to implement**: 4-6 hours

AI-powered document processing system with:
- Claude API integration
- PDF text extraction
- Structured data extraction
- Response caching for token optimization
- Batch processing pipeline

**Files**:
- `ClaudeClient.gs` - API client
- `DocumentProcessor.gs` - Processing pipeline
- `CacheManager.gs` - Multi-level caching
- `README.md` - Setup and usage

### 4. Performance Optimization

**Location**: [`performance-optimization/`](performance-optimization/)
**Complexity**: Beginner-Intermediate
**Time to implement**: 1-2 hours

Before/after examples demonstrating:
- Batch operations vs row-by-row
- Caching strategies
- Pagination for large datasets
- Performance benchmarking

**Files**:
- `slow-version.gs` - Unoptimized code
- `optimized-version.gs` - Optimized code
- `benchmarks.md` - Performance comparisons
- `README.md` - Optimization guide

---

## How to Use These Examples

### Quick Start

1. **Choose an example** based on your needs
2. **Read the README** in that example's directory
3. **Copy the code files** to your GAS project
4. **Configure credentials** (see each README)
5. **Test** with the provided test functions
6. **Adapt** to your specific requirements

### Setup Steps (General)

1. Create new GAS project:
   ```bash
   clasp create --title "My Project" --type standalone
   ```

2. Copy example files:
   ```bash
   cp examples/oauth2-bc-integration/*.gs src/
   ```

3. Configure properties:
   - Run `setupConfig()` function
   - Add your API keys, URLs, etc.

4. Test:
   - Run test functions
   - Check logs for errors
   - Verify expected behavior

5. Deploy:
   ```bash
   clasp push
   clasp deploy
   ```

---

## Example Combinations

You can combine multiple examples for complete solutions:

### E-commerce Order Management
- OAuth2 BC Integration (API access)
- Sheets Database (local storage)
- Performance Optimization (handle volume)

### Invoice Processing System
- Claude Document Processor (data extraction)
- Sheets Database (storage)
- OAuth2 Integration (if using external API)

### Data Sync Pipeline
- OAuth2 Integration (source API)
- Performance Optimization (large datasets)
- Sheets Database (destination)

---

## Testing Your Implementation

Each example includes test functions. Always test before deploying:

```javascript
// Run all tests
function runAllTests() {
  testOAuth2TokenRefresh();
  testBCAPIConnection();
  testSheetsDatabaseCRUD();
  testClaudeExtraction();
  Logger.log('✓ All tests passed');
}
```

---

## Common Issues

### "Authorization required"
**Solution**: Run function manually first to grant permissions

### "Service invoked too many times"
**Solution**: Implement caching and batch operations (see Performance example)

### "Execution timeout after 6 minutes"
**Solution**: Use checkpointing pattern (see Advanced examples)

### OAuth2 token refresh fails
**Solution**: Check token expiry buffer, verify refresh token stored correctly

---

## Contributing Examples

Have a great example to share? Consider:

1. Following the quality standards (see [quality-standards.md](../docs/quality-standards.md))
2. Including complete setup instructions
3. Adding test functions
4. Documenting configuration requirements
5. Providing performance benchmarks

---

## Related Documentation

- **Getting Started**: [../docs/getting-started/](../docs/getting-started/) - Learning paths
- **Specialists**: [../docs/specialists/](../docs/specialists/) - Domain experts
- **Deep Docs**: [../docs/deep/](../docs/deep/) - Detailed patterns
- **Quality Standards**: [../docs/quality-standards.md](../docs/quality-standards.md) - Best practices

---

**Ready to build? Pick an example and start coding! 🚀**
