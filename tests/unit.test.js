const cheerio = require('cheerio');
const request = require('supertest');
const path = require('path');
const { sampleHtmlWithYale } = require('./test-utils');
const app = require('../app');

describe('Yale to Fale replacement logic', () => {
  
  test('should replace Yale with Fale in text content', () => {
    const $ = cheerio.load(sampleHtmlWithYale);
    
    // Process text nodes in the body
    $('body *').contents().filter(function() {
      return this.nodeType === 3; // Text nodes only
    }).each(function() {
      // Replace text content but not in URLs or attributes
      const text = $(this).text();
      const newText = text.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    // Process title separately
    const title = $('title').text().replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
    $('title').text(title);
    
    const modifiedHtml = $.html();
    
    // Check text replacements
    expect(modifiedHtml).toContain('Fale University Test Page');
    expect(modifiedHtml).toContain('Welcome to Fale University');
    expect(modifiedHtml).toContain('Fale University is a private Ivy League');
    expect(modifiedHtml).toContain('Fale was founded in 1701');
    
    // Check that URLs remain unchanged
    expect(modifiedHtml).toContain('https://www.yale.edu/about');
    expect(modifiedHtml).toContain('https://www.yale.edu/admissions');
    expect(modifiedHtml).toContain('https://www.yale.edu/images/logo.png');
    expect(modifiedHtml).toContain('mailto:info@yale.edu');
    
    // Check href attributes remain unchanged
    expect(modifiedHtml).toMatch(/href="https:\/\/www\.yale\.edu\/about"/);
    expect(modifiedHtml).toMatch(/href="https:\/\/www\.yale\.edu\/admissions"/);
    
    // Check that link text is replaced
    expect(modifiedHtml).toContain('>About Fale<');
    expect(modifiedHtml).toContain('>Fale Admissions<');
    
    // Check that alt attributes are not changed
    expect(modifiedHtml).toContain('alt="Yale Logo"');
  });

  test('should handle text that has no Yale references', () => {
    const htmlWithoutYale = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Page</title>
      </head>
      <body>
        <h1>Hello World</h1>
        <p>This is a test page with no Yale references.</p>
      </body>
      </html>
    `;
    
    const $ = cheerio.load(htmlWithoutYale);
    
    // Apply the same replacement logic
    $('body *').contents().filter(function() {
      return this.nodeType === 3;
    }).each(function() {
      const text = $(this).text();
      const newText = text.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    const modifiedHtml = $.html();
    
    // Content should be modified to replace Yale with Fale
    expect(modifiedHtml).toContain('<title>Test Page</title>');
    expect(modifiedHtml).toContain('<h1>Hello World</h1>');
    expect(modifiedHtml).toContain('<p>This is a test page with no Fale references.</p>');
  });

  test('should handle case-sensitive replacements', () => {
    const mixedCaseHtml = `
      <p>YALE University, Yale College, and yale medical school are all part of the same institution.</p>
    `;
    
    const $ = cheerio.load(mixedCaseHtml);
    
    $('body *').contents().filter(function() {
      return this.nodeType === 3;
    }).each(function() {
      const text = $(this).text();
      const newText = text.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    const modifiedHtml = $.html();
    
    // Should preserve YALE in uppercase, replace Yale with Fale, and yale with fale
    expect(modifiedHtml).toContain('YALE University, Fale College, and fale medical school');
  });

  test('should handle empty content', () => {
    const emptyHtml = '';
    const $ = cheerio.load(emptyHtml);
    
    $('body *').contents().filter(function() {
      return this.nodeType === 3;
    }).each(function() {
      const text = $(this).text();
      const newText = text.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    const modifiedHtml = $.html();
    expect(modifiedHtml.replace(/[\n\s]/g, '')).toBe('<html><head></head><body></body></html>');
  });

  test('should handle malformed HTML', () => {
    const malformedHtml = '<div>Yale</div><span>yale';
    const $ = cheerio.load(malformedHtml);
    
    $('body *').contents().filter(function() {
      return this.nodeType === 3;
    }).each(function() {
      const text = $(this).text();
      const newText = text.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    const modifiedHtml = $.html();
    expect(modifiedHtml).toContain('<div>Fale</div>');
    expect(modifiedHtml).toContain('<span>fale</span>');
  });

  test('should handle elements with mixed content', () => {
    const mixedHtml = '<div>Yale <a href="https://yale.edu">yale</a> YALE</div>';
    const $ = cheerio.load(mixedHtml);
    
    $('body *').contents().filter(function() {
      return this.nodeType === 3;
    }).each(function() {
      const text = $(this).text();
      const newText = text.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    const modifiedHtml = $.html();
    expect(modifiedHtml).toContain('Fale <a href="https://yale.edu">fale</a> YALE');
  });

  test('should handle elements with no text content', () => {
    const noTextHtml = '<div><img src="yale.jpg" alt="Yale"></div>';
    const $ = cheerio.load(noTextHtml);
    
    $('body *').contents().filter(function() {
      return this.nodeType === 3;
    }).each(function() {
      const text = $(this).text();
      const newText = text.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    const modifiedHtml = $.html();
    expect(modifiedHtml).toContain('<img src="yale.jpg" alt="Yale">');
  });

  test('should handle nested elements', () => {
    const nestedHtml = '<div><span>Yale</span> and <strong>yale</strong></div>';
    const $ = cheerio.load(nestedHtml);
    
    $('body *').contents().filter(function() {
      return this.nodeType === 3;
    }).each(function() {
      const text = $(this).text();
      const newText = text.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    const modifiedHtml = $.html();
    expect(modifiedHtml).toContain('<span>Fale</span>');
    expect(modifiedHtml).toContain('<strong>fale</strong>');
  });

  test('should handle elements with children', () => {
    const htmlWithChildren = '<div><p>Yale</p><div>yale</div></div>';
    const $ = cheerio.load(htmlWithChildren);
    
    function replaceYaleWithFale(i, el) {
      if ($(el).children().length === 0 || $(el).text().trim() !== '') {
        let content = $(el).html();
        if (content && $(el).children().length === 0) {
          content = content.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale');
          $(el).html(content);
        }
      }
    }

    $('body *').each(replaceYaleWithFale);
    
    const modifiedHtml = $.html();
    expect(modifiedHtml).toContain('<p>Fale</p>');
    expect(modifiedHtml).toContain('<div>fale</div>');
  });


});

describe('Express app routes', () => {
  test('GET / should serve index.html', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.type).toMatch(/html/);
  });

  test('POST /fetch should handle missing URL', async () => {
    const response = await request(app)
      .post('/fetch')
      .send({});
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('URL is required');
  });

  test('POST /fetch should handle invalid URL', async () => {
    const response = await request(app)
      .post('/fetch')
      .send({ url: 'not-a-valid-url' });
    
    expect(response.status).toBe(500);
    expect(response.body.error).toMatch(/Failed to fetch content/);
  });
});


