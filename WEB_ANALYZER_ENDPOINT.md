# Web Analyzer Endpoint

## Overview

The `/api/web-analyze` endpoint provides an alternative website analysis service
using the `web-analyzer.ts` service. This endpoint focuses on extracting
typography, spacing, colors, and font information from websites.

## Endpoint Details

-  **URL**: `POST /api/web-analyze`
-  **Service**: Uses `WebsiteAnalyzer` class from `src/services/web-analyzer.ts`
-  **Analysis Type**: Focused on design tokens and visual elements

## Request Format

```json
{
   "url": "https://example.com"
}
```

## Response Format

```json
{
  "success": true,
  "url": "https://example.com",
  "timestamp": "2025-08-26T12:07:53.740Z",
  "data": {
    "typography": [...],
    "spacing": [...],
    "colors": [...],
    "fonts": [...],
    "tagBasedColors": [...],
    "uniqueFonts": [...],
    "shadows": [...],
    "animations": [...]
  },
  "analysisType": "web-analyzer",
  "summary": {
    "typographyStyles": 15,
    "spacingPatterns": 8,
    "uniqueColors": 12,
    "fontFamilies": 5,
    "tagBasedColors": 25,
    "uniqueFonts": 5,
    "shadows": 3,
    "animations": 2
  }
}
```

## Features

-  **Typography Analysis**: Extracts font families, weights, sizes, and line
   heights
-  **Spacing Patterns**: Identifies padding and margin patterns
-  **Color Extraction**: Analyzes text, background, and border colors
-  **Font Analysis**: Categorizes fonts by usage and context
-  **Tag-based Colors**: Maps colors to specific HTML elements
-  **Shadow & Animation**: Extracts box shadows, text shadows, and animations

## Differences from Main Analyzer

-  **Focus**: More focused on visual design tokens
-  **Output**: Structured around typography, spacing, and colors
-  **Browser**: Uses Puppeteer for real-time analysis
-  **Performance**: Optimized for design system extraction

## Usage Example

```bash
curl -X POST http://localhost:3000/api/web-analyzer \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

## Error Handling

-  URL validation (must be HTTP/HTTPS)
-  Browser initialization errors
-  Network timeouts
-  Analysis failures

## Browser Management

-  Automatically initializes Puppeteer browser
-  Graceful shutdown on process termination
-  Resource cleanup after each analysis
