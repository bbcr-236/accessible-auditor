const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const axeCore = require('axe-core');
const { JSDOM } = require('jsdom');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static('public'));

// Helper function to calculate accessibility score
function calculateScore(violations) {
  if (violations.length === 0) {
    return 100;
  }

  // Weighted severity points
  const severityWeights = {
    critical: 40,  // Critical issues are severe
    serious: 20,   // Serious issues are moderate impact
    moderate: 10,  // Moderate issues are minor impact
    minor: 3       // Minor issues have small impact
  };

  let totalPoints = 0;

  violations.forEach(violation => {
    const weight = severityWeights[violation.impact] || 0;
    const nodeCount = violation.nodes.length;
    
    // Calculate points: base weight + additional for multiple instances
    const basePoints = weight;
    const multiplierPoints = Math.min(nodeCount - 1, 3) * (weight * 0.3);
    
    totalPoints += basePoints + multiplierPoints;
  });

  // Convert to 0-100 scale with better granularity
  // Each violation category has diminishing impact
  let score;
  if (totalPoints < 10) {
    score = 95 - (totalPoints * 0.5);
  } else if (totalPoints < 30) {
    score = 90 - ((totalPoints - 10) * 0.4);
  } else if (totalPoints < 60) {
    score = 82 - ((totalPoints - 30) * 0.3);
  } else if (totalPoints < 100) {
    score = 71 - ((totalPoints - 60) * 0.2);
  } else {
    score = 51 - ((totalPoints - 100) * 0.1);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Helper function to categorize violations by severity
function categorizeBySeverity(violations) {
  const categories = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0
  };

  violations.forEach(violation => {
    const impact = violation.impact;
    if (categories.hasOwnProperty(impact)) {
      categories[impact] += violation.nodes.length;
    }
  });

  return categories;
}

// Helper function to generate fix suggestions
function generateFixSuggestion(violation) {
  const suggestions = {
    'image-alt': {
      title: 'Add descriptive alt text to image',
      code: '<img src="image.jpg" alt="Descriptive text about the image content">'
    },
    'button-name': {
      title: 'Provide accessible button text or aria-label',
      code: '<button aria-label="Close menu">×</button>\n<!-- OR -->\n<button>Close Menu</button>'
    },
    'label': {
      title: 'Associate label with form input',
      code: '<label for="email">Email Address</label>\n<input id="email" type="email" required>'
    },
    'color-contrast': {
      title: 'Improve color contrast ratio (min 4.5:1)',
      code: '/* Increase contrast */\n.text { color: #333333; background: #ffffff; /* 21:1 contrast */ }\n/* Use tools like https://webaim.org/resources/contrastchecker/ */'
    },
    'heading-order': {
      title: 'Use proper heading hierarchy without skipping levels',
      code: '<h1>Main Title</h1>\n<h2>Section Title</h2>\n<h3>Subsection Title</h3>\n<!-- Never jump from h1 to h3 -->'
    },
    'link-name': {
      title: 'Provide descriptive link text',
      code: '<a href="/docs">View documentation</a>\n<!-- Instead of -->\n<a href="/docs">Click here</a>'
    },
    'aria-required-attr': {
      title: 'Add required ARIA attributes for the role',
      code: '<div role="button" aria-pressed="false" tabindex="0">Click me</div>'
    },
    'list': {
      title: 'Use semantic list structure',
      code: '<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n  <li>Item 3</li>\n</ul>'
    },
    'document-title': {
      title: 'Add descriptive page title',
      code: '<head>\n  <title>Page Name - Website Name</title>\n</head>'
    },
    'html-has-lang': {
      title: 'Specify language for the document',
      code: '<html lang="en">\n  <!-- Use appropriate language code: en, es, fr, etc. -->\n</html>'
    },
    'duplicate-id': {
      title: 'Ensure all IDs are unique on the page',
      code: '<input id="email-1" type="email">\n<input id="email-2" type="email">\n<!-- Each ID must be used only once -->'
    },
    'empty-heading': {
      title: 'Add meaningful content to heading',
      code: '<h2>Section Title</h2>\n<!-- Instead of -->\n<h2></h2>'
    },
    'input-image-alt': {
      title: 'Add alt attribute to image input button',
      code: '<input type="image" src="submit.png" alt="Submit form">'
    },
    'input-button-name': {
      title: 'Add accessible name to button input',
      code: '<input type="button" value="Submit">\n<!-- OR -->\n<input type="button" aria-label="Submit form">'
    },
    'select-name': {
      title: 'Associate label with select element',
      code: '<label for="country">Country:</label>\n<select id="country" name="country">\n  <option value="">Select...</option>\n</select>'
    },
    'video-caption': {
      title: 'Provide captions for video content',
      code: '<video controls>\n  <source src="movie.mp4" type="video/mp4">\n  <track kind="captions" src="captions.vtt" srclang="en">\n</video>'
    },
    'meta-viewport': {
      title: 'Allow zoom on mobile (remove user-scalable=no)',
      code: '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    },
    'tabindex': {
      title: 'Use tabindex only when necessary (0 or -1)',
      code: '<button tabindex="0">Focusable</button>\n<div tabindex="-1">Not in tab order</div>'
    },
    'focusable-no-name': {
      title: 'Add accessible name to focusable element',
      code: '<button aria-label="Close"></button>\n<!-- OR -->\n<button>Close</button>'
    },
    'region': {
      title: 'Add landmark regions for page structure',
      code: '<header>...</header>\n<nav>...</nav>\n<main>...</main>\n<footer>...</footer>'
    },
    'valid-html': {
      title: 'Fix HTML validation errors',
      code: '<!-- Validate at https://validator.w3.org/ -->\n<!-- Common issues: unclosed tags, invalid nesting -->'
    },
    'aria-valid-attr': {
      title: 'Use valid ARIA attributes',
      code: '<div role="button" aria-pressed="false" aria-label="Toggle">Toggle</div>\n<!-- Check valid attributes for the role -->'
    }
  };

  const suggestion = suggestions[violation.id] || {
    title: 'Review WCAG guidelines for this issue',
    code: '<!-- Visit https://www.w3.org/WAI/WCAG21/quickref/ -->\n<!-- Or check axe documentation for: ' + violation.id + ' -->'
  };

  return suggestion;
}

// Main audit endpoint
app.post('/api/audit', async (req, res) => {
  const { url, html } = req.body;

  if (!url && !html) {
    return res.status(400).json({ error: 'Please provide either a URL or HTML content' });
  }

  let browser;
  try {
    let content = html ? html.substring(0, 100) : url;

    // Validate HTML length
    if (html && html.length > 5000000) {
      return res.status(400).json({ error: 'HTML content too large (max 5MB)' });
    }

    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set User-Agent to avoid blocking by websites
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set additional headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Referer': 'https://www.google.com/',
      'DNT': '1'
    });

    // Load content (either HTML or URL)
    if (html) {
      console.log('Loading HTML content...');
      await page.setContent(html, { waitUntil: 'networkidle0' });
    } else {
      let urlToLoad = url.trim();
      if (!urlToLoad.startsWith('http://') && !urlToLoad.startsWith('https://')) {
        urlToLoad = 'https://' + urlToLoad;
      }

      try {
        console.log('Loading URL:', urlToLoad);
        
        // Try loading with a longer timeout and domcontentloaded condition
        let response;
        try {
          response = await page.goto(urlToLoad, { waitUntil: 'domcontentloaded', timeout: 45000 });
        } catch (timeoutError) {
          // If domcontentloaded times out, try with just load event
          console.log('domcontentloaded timeout, trying load event...');
          try {
            response = await page.goto(urlToLoad, { waitUntil: 'load', timeout: 45000 });
          } catch (loadError) {
            // If load also fails, try networkidle0
            console.log('load timeout, trying networkidle0...');
            response = await page.goto(urlToLoad, { waitUntil: 'networkidle0', timeout: 45000 });
          }
        }

        if (!response || (response.status() === 403)) {
          await browser.close();
          return res.status(400).json({ 
            error: `The website blocked our audit request (403 Forbidden). Some websites restrict automated access. Try a different URL.` 
          });
        } else if (!response || (response.status() < 200 || response.status() > 399)) {
          await browser.close();
          return res.status(400).json({ 
            error: `Unable to load the URL. Status: ${response?.status() || 'Unknown'}. Please check the URL and try again.` 
          });
        }
      } catch (error) {
        console.log('Error loading URL:', error.message);
        await browser.close();
        return res.status(400).json({ 
          error: `Unable to reach the URL. The page took too long to load or is not accessible. Please try a simpler website or check your internet connection.` 
        });
      }
      content = urlToLoad;
    }

    // Run axe-core audit
    console.log('Running axe audit...');
    
    try {
      // Inject axe-core library from local file
      const axeSourcePath = path.join(__dirname, 'node_modules', 'axe-core', 'axe.min.js');
      await page.addScriptTag({ path: axeSourcePath });
      console.log('axe-core injected');

      // Wait for axe to be available
      await page.waitForFunction(() => typeof window.axe !== 'undefined', { timeout: 5000 });
      console.log('axe-core ready');

      // Run the audit with all default rules
      const axeResults = await page.evaluate(() => {
        return new Promise((resolve, reject) => {
          // Run with default rules (all enabled by default in axe-core)
          window.axe.run((error, results) => {
            if (error) {
              reject(error);
            } else {
              resolve(results);
            }
          });
        });
      });

      console.log('Audit complete. Violations found:', axeResults.violations.length);
      
      await browser.close();

      // Process violations
      const violations = axeResults.violations.map(violation => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map(node => ({
          html: node.html,
          target: node.target
        })),
        affectedCount: violation.nodes.length,
        suggestion: generateFixSuggestion(violation)
      }));

      const severityCounts = categorizeBySeverity(axeResults.violations);
      const score = calculateScore(axeResults.violations);

      return res.json({
        success: true,
        url: content,
        violations: violations,
        severityCounts: severityCounts,
        score: score,
        totalViolations: violations.length,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Audit execution error:', error);
      await browser.close();
      throw error;
    }

  } catch (error) {
    console.error('Audit error:', error);
    res.status(500).json({ error: 'An error occurred during the audit. Please try again.' });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        // ignore
      }
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Accessible Auditor running on http://localhost:${PORT}`);
  console.log(`Also available at http://127.0.0.1:${PORT}`);
});
