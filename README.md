# Accessible UI Auditor

A modern web application for scanning and improving website accessibility using axe-core and Puppeteer. Get detailed accessibility reports with actionable fix suggestions.

## Features

- **URL Auditing**: Scan live websites for accessibility issues
- **HTML Auditing**: Paste raw HTML to test local code snippets
- **Comprehensive Reports**: Detailed violations with fix suggestions and code examples
- **Accessibility Score**: 0-100 score based on WCAG 2.0 AA standards
- **Severity Breakdown**: Issues categorized by critical, serious, moderate, and minor
- **Smart Suggestions**: Contextual fix recommendations with code examples
- **Download Reports**: Export audit results as HTML files
- **Mobile Responsive**: Works seamlessly on desktop and mobile devices
- **Clean UI**: No CSS frameworks, modern vanilla design

## Tech Stack

- **Frontend**: Vanilla JavaScript + CSS (single index.html)
- **Backend**: Node.js with Express
- **Accessibility Engine**: axe-core 4.7.2
- **Browser Automation**: Puppeteer
- **Standards**: WCAG 2.0 AA

## Requirements

- Node.js 14+ 
- npm or yarn

## Installation

1. Navigate to the project directory:
```bash
cd accessible-auditor
```

2. Install dependencies:
```bash
npm install
```

This will install:
- **express** - Web server framework
- **puppeteer** - Browser automation
- **axe-core** - Accessibility audit engine

## Running the Application

Start the server:
```bash
npm start
```

Or for development:
```bash
node server.js
```

The application will be available at `http://localhost:3000`

## Usage

### Audit a Website URL
1. Open http://localhost:3000
2. Go to the "Audit URL" tab
3. Enter a website URL (e.g., https://example.com)
4. Click "Run Accessibility Audit"
5. Review the results and fix suggestions

### Audit HTML Code
1. Go to the "Audit HTML" tab
2. Paste raw HTML or a complete page snippet
3. Click "Run Accessibility Audit"
4. Get instant feedback on accessibility issues

### Understanding Results

**Score (0-100)**
- 90-100: Excellent ✅
- 80-89: Good 👍
- 60-79: Fair ⚠️
- 40-59: Poor ❌
- 0-39: Critical 🔴

**Severity Levels**
- **Critical**: Major barriers to accessibility (WCAG Level A failures)
- **Serious**: Significant accessibility issues (WCAG Level AA failures)
- **Moderate**: Minor usability issues
- **Minor**: Best practice recommendations

**Each Issue Includes**
- Issue description and impact
- Number of affected elements
- Example of the problematic HTML
- Fix suggestion with code snippet
- Link to axe documentation

## API Reference

### POST /api/audit

Runs an accessibility audit on a provided URL or HTML content.

**Request Body**
```json
{
  "url": "https://example.com",
  "html": null
}
```
Or for HTML:
```json
{
  "url": null,
  "html": "<html>...</html>"
}
```

**Response**
```json
{
  "success": true,
  "url": "https://example.com",
  "violations": [...],
  "severityCounts": {
    "critical": 2,
    "serious": 5,
    "moderate": 12,
    "minor": 8
  },
  "score": 65,
  "totalViolations": 27,
  "timestamp": "2024-03-15T10:30:00.000Z"
}
```

### GET /api/health

Health check endpoint returns `{"status": "ok"}`

## Common Accessibility Issues

### 1. Image Alt Text
- **Issue**: Images without descriptive alt text
- **Fix**: Add alt attributes to all img tags
```html
<img src="logo.png" alt="Company logo">
```

### 2. Color Contrast
- **Issue**: Text color too similar to background
- **Fix**: Ensure sufficient contrast ratio (4.5:1 minimum)
```css
/* Increase contrast */
color: #333;
background: #fff;
```

### 3. Form Labels
- **Issue**: Form inputs without associated labels
- **Fix**: Link labels to inputs using for attribute
```html
<label for="email">Email Address</label>
<input id="email" type="email">
```

### 4. Heading Hierarchy
- **Issue**: Skipped heading levels (h1 → h3)
- **Fix**: Use sequential heading levels
```html
<h1>Main Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
```

### 5. Button Names
- **Issue**: Buttons without readable text
- **Fix**: Add descriptive text or aria-label
```html
<button aria-label="Close menu">×</button>
```

## Error Handling

- **Invalid URL**: Server returns 400 with friendly error message
- **Unreachable URL**: Checks HTTP status and catches network errors
- **Large Content**: Max 5MB for HTML uploads
- **Server Errors**: 500 status with error message for debugging

## Performance

- Typical audit takes 5-15 seconds depending on page complexity
- Puppeteer runs in headless mode for efficiency
- Automatic cleanup of browser instances

## Browser Support

Works best with modern browsers supporting:
- ES6 JavaScript
- CSS Grid and Flexbox
- Fetch API
- Modern accessibility standards

## Troubleshooting

### Port 3000 Already in Use
Change the port in `server.js`:
```javascript
const PORT = 3001; // or another port
```

### Puppeteer Installation Issues
On Linux, install additional dependencies:
```bash
sudo apt-get install -y libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6
```

### Memory Issues with Large Pages
The server includes sandbox limitations to prevent resource exhaustion.

## WCAG Standards

This auditor checks against WCAG 2.0 Level AA standards, which include:
- Level A: Basic web accessibility
- Level AA: Enhanced accessibility and contrast requirements

## Contributing

To add new fix suggestion templates, edit the `generateFixSuggestion()` function in `server.js`.

## License

MIT

## Resources

- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [WCAG 2.0 Standards](https://www.w3.org/WAI/WCAG20/quickref/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Deque Accessibility Resources](https://www.deque.com/resources/)

## Support

For issues or feature requests, check the axe-core documentation and WCAG guidelines for current best practices in web accessibility.
