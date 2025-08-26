# Design Inspector API

A Visual Design Intelligence Platform API for analyzing website design systems.
This TypeScript-based API extracts design tokens, typography, colors, and CSS
rules from any website.

## Features

-  🔍 **Website Analysis**: Extract design tokens from any website
-  🎨 **Color Analysis**: Identify text, background, and border colors
-  🔤 **Typography Analysis**: Analyze fonts, headings, paragraphs, buttons, and
   inputs
-  📏 **Spacing Analysis**: Extract padding and margin values
-  🎯 **CSS Rules**: Extract CSS rules from stylesheets
-  📊 **Metadata**: Get page title, description, and viewport information

## Quick Start

### Prerequisites

-  Node.js 18+
-  npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd design-inspector

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Clean build directory
npm run clean
```

## API Endpoints

### Base URL

```
http://localhost:3000
```

### Endpoints

#### GET /

Returns API information and available endpoints.

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

#### POST /api/analyze

Analyzes a website's design system.

**Request Body:**

```json
{
   "url": "https://example.com"
}
```

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
        "headings": [...],
        "paragraphs": [...],
        "buttons": [...],
        "inputs": [...],
        "links": [...]
      },
      "colors": {
        "primary": [],
        "secondary": [],
        "accent": [],
        "background": [...],
        "text": [...],
        "border": [...]
      },
      "fonts": [...],
      "spacing": [...]
    },
    "cssRules": [...],
    "summary": {
      "totalElements": 25,
      "uniqueFonts": 3,
      "uniqueColors": 8,
      "uniqueSpacing": 12
    }
  }
}
```

#### GET /api/health

Health check endpoint.

**Response:**

```json
{
   "status": "OK",
   "timestamp": "2024-01-01T00:00:00.000Z",
   "service": "Design Inspector API"
}
```

## Usage Examples

### Using cURL

```bash
# Analyze a website
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Check health
curl http://localhost:3000/api/health
```

### Using JavaScript/TypeScript

```typescript
// Analyze a website
const response = await fetch("http://localhost:3000/api/analyze", {
   method: "POST",
   headers: {
      "Content-Type": "application/json",
   },
   body: JSON.stringify({
      url: "https://example.com",
   }),
});

const result = await response.json();
console.log(result.data.summary);
```

## Project Structure

```
design-inspector/
├── src/
│   ├── services/
│   │   └── analyzer.ts      # Website analysis logic
│   ├── server.ts            # Express server setup
│   └── test.ts              # Test script
├── dist/                    # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

-  `PORT`: Server port (default: 3000)

## Error Handling

The API returns consistent error responses:

```json
{
   "success": false,
   "error": "Error message"
}
```

Common HTTP status codes:

-  `200`: Success
-  `400`: Bad Request (missing URL)
-  `404`: Endpoint not found
-  `500`: Internal Server Error

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Build the project: `npm run build`
6. Submit a pull request

## License

MIT
