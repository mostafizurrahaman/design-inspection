# Design Inspector API Documentation

## Overview

The Design Inspector API is a TypeScript-based service that analyzes website
design systems by extracting design tokens, typography, colors, and CSS rules
from any website URL.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, no authentication is required. All endpoints are publicly accessible.

## Rate Limiting

No rate limiting is currently implemented. Please use responsibly.

## Endpoints

### 1. API Information

**GET /**

Returns information about the API and available endpoints.

**Response:**

```json
{
   "name": "Design Inspector API",
   "version": "1.0.0",
   "description": "A Visual Design Intelligence Platform API for analyzing website design systems",
   "endpoints": {
      "POST /api/analyze": "Analyze a website's design system",
      "GET /api/health": "Health check endpoint"
   }
}
```

### 2. Website Analysis

**POST /api/analyze**

Analyzes a website's design system and returns comprehensive design tokens.

**Request Body:**

```json
{
   "url": "https://example.com"
}
```

**Parameters:**

-  `url` (string, required): The website URL to analyze. Must be a valid
   HTTP/HTTPS URL.

**Response:**

```json
{
  "success": true,
  "url": "https://example.com",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "metadata": {
      "title": "Example Domain",
      "description": "This domain is for use in illustrative examples",
      "viewport": "width=device-width, initial-scale=1",
      "charset": "UTF-8",
      "language": "en"
    },
    "designTokens": {
      "typography": {
        "headings": [
          {
            "tag": "h1",
            "styles": {
              "fontFamily": "Arial, sans-serif",
              "fontSize": "32px",
              "fontWeight": "bold",
              "lineHeight": "1.2",
              "letterSpacing": "normal",
              "fontStyle": "normal",
              "color": "rgb(0, 0, 0)",
              "backgroundColor": "rgba(0, 0, 0, 0)",
              "borderColor": "rgba(0, 0, 0, 0)",
              "padding": "0px",
              "margin": "0px"
            },
            "text": "Example Domain",
            "className": "",
            "id": ""
          }
        ],
        "paragraphs": [...],
        "buttons": [...],
        "inputs": [...],
        "links": [...]
      },
      "colors": {
        "primary": [],
        "secondary": [],
        "accent": [],
        "background": ["rgb(255, 255, 255)", "rgb(248, 249, 250)"],
        "text": ["rgb(0, 0, 0)", "rgb(108, 117, 125)"],
        "border": ["rgb(222, 226, 230)"]
      },
      "fonts": ["Arial, sans-serif", "Georgia, serif"],
      "spacing": ["0px", "16px", "24px", "32px"]
    },
    "cssRules": [
      {
        "selector": "body",
        "fontFamily": "Arial, sans-serif",
        "fontSize": "16px",
        "fontWeight": "normal",
        "color": "rgb(0, 0, 0)",
        "backgroundColor": "rgb(255, 255, 255)"
      }
    ],
    "summary": {
      "totalElements": 25,
      "uniqueFonts": 3,
      "uniqueColors": 8,
      "uniqueSpacing": 12
    }
  }
}
```

**Error Response:**

```json
{
   "success": false,
   "error": "URL is required"
}
```

### 3. Health Check

**GET /api/health**

Returns the health status of the API service.

**Response:**

```json
{
   "status": "OK",
   "timestamp": "2024-01-01T00:00:00.000Z",
   "service": "Design Inspector API"
}
```

## Data Types

### Metadata

```typescript
interface Metadata {
   title: string; // Page title
   description: string; // Meta description
   viewport: string; // Viewport meta tag
   charset: string; // Character encoding
   language: string; // HTML lang attribute
}
```

### ComputedStyles

```typescript
interface ComputedStyles {
   fontFamily: string; // Font family
   fontSize: string; // Font size
   fontWeight: string; // Font weight
   lineHeight: string; // Line height
   letterSpacing: string; // Letter spacing
   fontStyle: string; // Font style
   color: string; // Text color
   backgroundColor: string; // Background color
   borderColor: string; // Border color
   padding: string; // Padding
   margin: string; // Margin
}
```

### TypographyElement

```typescript
interface TypographyElement {
   tag?: string; // HTML tag name
   styles: ComputedStyles; // Computed CSS styles
   text: string; // Element text content (truncated to 100 chars)
   className: string; // CSS class names
   id: string; // Element ID
   placeholder?: string; // Input placeholder (for form elements)
   href?: string; // Link URL (for anchor elements)
}
```

### DesignTokens

```typescript
interface DesignTokens {
   typography: {
      headings: TypographyElement[];
      paragraphs: TypographyElement[];
      buttons: TypographyElement[];
      inputs: TypographyElement[];
      links: TypographyElement[];
   };
   colors: {
      primary: string[];
      secondary: string[];
      accent: string[];
      background: string[];
      text: string[];
      border: string[];
   };
   fonts: string[];
   spacing: string[];
}
```

### CSSRule

```typescript
interface CSSRule {
   selector: string; // CSS selector
   fontFamily?: string; // Font family
   fontSize?: string; // Font size
   fontWeight?: string; // Font weight
   color?: string; // Text color
   backgroundColor?: string; // Background color
}
```

### AnalysisSummary

```typescript
interface AnalysisSummary {
   totalElements: number; // Total analyzed elements
   uniqueFonts: number; // Unique font families
   uniqueColors: number; // Unique colors
   uniqueSpacing: number; // Unique spacing values
}
```

## Error Codes

| Status Code | Description                             |
| ----------- | --------------------------------------- |
| 200         | Success                                 |
| 400         | Bad Request - Missing or invalid URL    |
| 404         | Not Found - Endpoint doesn't exist      |
| 500         | Internal Server Error - Analysis failed |

## Usage Examples

### JavaScript/TypeScript

```typescript
// Analyze a website
async function analyzeWebsite(url: string) {
   try {
      const response = await fetch("http://localhost:3000/api/analyze", {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
         },
         body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (result.success) {
         console.log("Analysis completed:", result.data.summary);
         return result.data;
      } else {
         throw new Error(result.error);
      }
   } catch (error) {
      console.error("Analysis failed:", error);
      throw error;
   }
}

// Usage
analyzeWebsite("https://example.com")
   .then((data) => {
      console.log("Fonts found:", data.designTokens.fonts);
      console.log("Colors found:", data.designTokens.colors.text);
   })
   .catch((error) => console.error(error));
```

### cURL

```bash
# Analyze a website
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}' \
  | jq '.'

# Check health
curl http://localhost:3000/api/health
```

### Python

```python
import requests
import json

def analyze_website(url):
    response = requests.post(
        'http://localhost:3000/api/analyze',
        json={'url': url},
        headers={'Content-Type': 'application/json'}
    )

    if response.status_code == 200:
        result = response.json()
        if result['success']:
            return result['data']
        else:
            raise Exception(result['error'])
    else:
        raise Exception(f'HTTP {response.status_code}: {response.text}')

# Usage
try:
    data = analyze_website('https://example.com')
    print(f"Found {len(data['designTokens']['fonts'])} fonts")
    print(f"Found {len(data['designTokens']['colors']['text'])} text colors")
except Exception as e:
    print(f"Error: {e}")
```

## Performance Notes

-  Analysis typically takes 5-15 seconds depending on website complexity
-  Large websites may take longer due to more elements to analyze
-  The API uses Puppeteer in headless mode for consistent results
-  Browser instance is reused for better performance
-  Each analysis is isolated and doesn't affect subsequent requests

## Limitations

-  Only analyzes publicly accessible websites
-  Cannot analyze websites behind authentication
-  Limited to client-side rendered content (no server-side analysis)
-  CSS rules from cross-origin stylesheets are not accessible
-  Maximum timeout of 30 seconds per analysis
