# Accessible UI Auditor - Setup & Test Guide

## Project Structure

```
accessible-auditor/
├── server.js              # Express backend with axe-core integration
├── package.json           # Dependencies (express, puppeteer, axe-core)
├── public/
│   └── index.html         # Single-page frontend with vanilla JS/CSS
├── README.md              # Full documentation
└── SETUP_GUIDE.md         # This file
```

## Installation Status ✅

Dependencies have been installed successfully:
- `express` - Web server
- `puppeteer` - Browser automation
- `axe-core` - Accessibility audit engine

## Quick Start

### 1. Start the Server

Open PowerShell/Terminal in the project directory and run:

```powershell
npm start
```

Or directly:

```powershell
node server.js
```

You should see:
```
Accessible Auditor running on http://localhost:3000
```

### 2. Open in Browser

Navigate to: `http://localhost:3000`

The application should load with:
- Purple gradient background
- Two tabs: "Audit URL" and "Audit HTML"
- Clean, modern interface

## Testing the Application

### Test 1: Audit a Public Website

1. Go to "Audit URL" tab
2. Enter: `https://www.w3.org`
3. Click "Run Accessibility Audit"
4. Wait 5-15 seconds for scan to complete
5. View results with:
   - Accessibility score
   - Issues broken down by severity
   - Fix suggestions with code examples
   - Download button for HTML report

### Test 2: Audit HTML with Issues

1. Go to "Audit HTML" tab
2. Paste this HTML with accessibility issues:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
</head>
<body>
    <h1>Welcome</h1>
    <h3>Skip to Section 3</h3>
    
    <img src="photo.jpg">
    
    <input type="text" placeholder="Email">
    
    <button>X</button>
    
    <div style="color: #888; background: #fff;">Light gray text on white</div>
</body>
</html>
```

3. Click "Run Accessibility Audit"
4. Observe violations for:
   - Missing image alt text
   - Missing form label
   - Inaccessible button text
   - Low color contrast
   - Skipped heading levels

### Test 3: Audit Perfect HTML

1. Go to "Audit HTML" tab
2. Paste this accessible HTML:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Accessible Page</title>
</head>
<body>
    <h1>Welcome</h1>
    <p>This page follows accessibility best practices.</p>
    
    <img src="photo.jpg" alt="A description of the photo">
    
    <label for="email">Email Address</label>
    <input id="email" type="email" placeholder="your@email.com">
    
    <button aria-label="Submit form">Submit</button>
    
    <div style="color: #333; background: #fff;">Dark gray text on white</div>
</body>
</html>
```

3. Click "Run Accessibility Audit"
4. Should show score of 100 with "Perfect! No violations found" message

## Features Verification Checklist

- [ ] **URL Input Tab** - Can enter and submit URLs
- [ ] **HTML Input Tab** - Can paste and submit HTML
- [ ] **Error Handling** - Invalid URLs show friendly errors
- [ ] **Loading State** - Shows spinner while scanning
- [ ] **Score Display** - Shows 0-100 score with color coding
- [ ] **Severity Breakdown** - Shows count of critical, serious, moderate, minor
- [ ] **Violation Cards** - Each violation shows:
  - [ ] Severity badge
  - [ ] Issue name and description
  - [ ] Affected element count
  - [ ] Example HTML snippet
  - [ ] Fix suggestion with code
  - [ ] Link to documentation
- [ ] **Download Report** - Generates HTML file with all results
- [ ] **Mobile Responsive** - Works on smaller screens
- [ ] **Clean UI** - No visual glitches, proper spacing
- [ ] **Performance** - Scans complete in reasonable time

## API Endpoints

### POST /api/audit

**Test with curl:**

```powershell
$body = @{
    url = "https://example.com"
    html = $null
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/api/audit `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Or with HTML:**

```powershell
$html = @"
<!DOCTYPE html>
<html>
<body><img src="test.jpg"></body>
</html>
"@

$body = @{
    url = $null
    html = $html
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:3000/api/audit `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

### GET /api/health

Check server status:
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/health
```

Should return: `{"status":"ok"}`

## Troubleshooting

### Server won't start

**Check Node.js is installed:**
```powershell
node --version
npm --version
```

**Reinstall dependencies:**
```powershell
npm install
```

### Port 3000 already in use

Edit `server.js` line 5:
```javascript
const PORT = 3001; // Change to any available port
```

### Puppeteer installation fails on Linux

Install system dependencies:
```bash
sudo apt-get install -y libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6
```

### Audit takes very long or times out

- Check internet connection if testing URLs
- Some sites may block automated access
- HTML audits should complete in seconds
- Large pages (>10MB HTML) may exceed limits

### Browser console shows CORS errors

The frontend and backend are on same origin (localhost:3000), so CORS shouldn't be an issue. Check Network tab for actual errors.

## File Verification

### Server Configuration (server.js)
- ✅ Express app setup
- ✅ /api/audit POST endpoint with puppeteer
- ✅ /api/health GET endpoint
- ✅ Static file serving from public/
- ✅ Error handling with friendly messages
- ✅ Score calculation (0-100)
- ✅ Severity categorization
- ✅ Fix suggestion templates

### Frontend (public/index.html)
- ✅ Single HTML file
- ✅ Vanilla JavaScript (no frameworks)
- ✅ Custom CSS (no frameworks)
- ✅ Tab switching for URL/HTML input
- ✅ Form validation
- ✅ Loading spinner
- ✅ Results display with violations
- ✅ Download report generation
- ✅ Mobile responsive design
- ✅ Accessibility score display with color coding

### Package Configuration (package.json)
- ✅ All required dependencies listed
- ✅ npm start script defined
- ✅ Proper versions specified

## Performance Expectations

- **First load**: 1-2 seconds
- **URL audit**: 5-15 seconds (depends on site size)
- **HTML audit**: 2-5 seconds
- **Report generation**: <1 second
- **Report download**: Instant

## Browser Compatibility

Works best on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Next Steps

1. **Customize** - Edit fix suggestion templates in server.js
2. **Deploy** - Use PM2, Docker, or cloud platforms
3. **Integrate** - Add to CI/CD pipelines for automated testing
4. **Extend** - Add database for storing historical reports
5. **Monitor** - Track accessibility improvements over time

## Support Resources

- [axe-core GitHub](https://github.com/dequelabs/axe-core)
- [WCAG 2.0 Guidelines](https://www.w3.org/WAI/WCAG20/quickref/)
- [WebAIM Resources](https://webaim.org/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

---

**Status**: ✅ Ready to use
**Last Updated**: March 15, 2026
**Node Version**: 14.0+
**Port**: 3000 (configurable)
