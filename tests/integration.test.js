const axios = require('axios');
const cheerio = require('cheerio');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const { sampleHtmlWithYale } = require('./test-utils');
const nock = require('nock');

// Set a different port for testing to avoid conflict with the main app
const TEST_PORT = 3099;
let server;
let app;

describe('Integration Tests', () => {
  // Modify the app to use a test port
  beforeAll(async () => {
    // Allow localhost connections for our test server
    nock.disableNetConnect();
    nock.enableNetConnect('localhost');
    
    // Create a test app instance
    app = require('../app');
    app.set('port', TEST_PORT);
    
    // Start the test server
    server = app.listen(TEST_PORT);
    
    // Give the server time to start
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, 10000); // Increase timeout for server startup

  afterAll(async () => {
    // Close the test server
    if (server) {
      server.close();
    }
    nock.cleanAll();
    nock.enableNetConnect();
  });

  test('Should replace Yale with Fale in fetched content', async () => {
    // Setup mock for example.com
    const scope = nock('https://example.com')
      .persist()
      .get('/')
      .reply(200, sampleHtmlWithYale, {
        'Content-Type': 'text/html'
      });
    
    // Make a request to our proxy app
    const response = await axios.post(`http://localhost:${TEST_PORT}/fetch`, {
      url: 'https://example.com/'
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    console.log('Mock HTML:', sampleHtmlWithYale);
    console.log('Response content:', response.data.content);
    
    // Verify Yale has been replaced with Fale in text
    const $ = cheerio.load(response.data.content);
    expect($('title').text()).toBe('Fale University Test Page');
    expect($('h1').text()).toBe('Welcome to Fale University');
    expect($('p').first().text()).toContain('Fale University is a private');
    
    // Verify URLs remain unchanged
    const links = $('a');
    let hasYaleUrl = false;
    links.each((i, link) => {
      const href = $(link).attr('href');
      if (href && href.includes('yale.edu')) {
        hasYaleUrl = true;
      }
    });
    expect(hasYaleUrl).toBe(true);
    
    // Verify link text is changed
    expect($('a').first().text()).toBe('About Fale');
  }, 10000); // Increase timeout for this test

  test('Should handle invalid URLs', async () => {
    // Mock the request to fail
    nock('https://not-a-valid-url')
      .get('/')
      .replyWithError('Invalid URL');

    const response = await axios.post(`http://localhost:${TEST_PORT}/fetch`, {
      url: 'https://not-a-valid-url'
    }).catch(e => e.response);

    expect(response.status).toBe(500);
    expect(response.data.error).toContain('Failed to fetch content');
  });

  test('Should handle missing URL parameter', async () => {
    const response = await axios.post(`http://localhost:${TEST_PORT}/fetch`, {})
      .catch(e => e.response);

    expect(response.status).toBe(400);
    expect(response.data.error).toBe('URL is required');
  });
});
