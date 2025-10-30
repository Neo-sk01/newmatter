/**
 * Tests for Everlytic API Client
 * 
 * Run with: npx tsx src/lib/email/everlytic-client.test.ts
 * Or manually verify each test case
 */

import {
  EverlyticClient,
  EverlyticApiError,
  createEverlyticClient,
  type EverlyticConfig,
  type EverlyticErrorResponse,
} from './everlytic-client';

// Simple test runner
function describe(name: string, fn: () => void) {
  console.log(`\n${name}`);
  fn();
}

function it(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.log(`  ✗ ${name}`);
    console.error(`    ${error}`);
  }
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toContain(substring: string) {
      if (!actual || !actual.includes(substring)) {
        throw new Error(`Expected string to contain "${substring}"`);
      }
    },
    toThrow(expectedMessage?: string) {
      let threw = false;
      let error: any;
      try {
        actual();
      } catch (e) {
        threw = true;
        error = e;
      }
      if (!threw) {
        throw new Error('Expected function to throw an error');
      }
      if (expectedMessage && !error.message.includes(expectedMessage)) {
        throw new Error(`Expected error message to contain "${expectedMessage}" but got "${error.message}"`);
      }
    },
  };
}

describe('EverlyticClient', () => {
  describe('constructor', () => {
    it('should create client with valid config', () => {
      const config: EverlyticConfig = {
        apiUrl: 'https://api.everlytic.net',
        username: 'testuser',
        apiKey: 'test-key-123',
      };

      const client = new EverlyticClient(config);

      expect(client).toBe(client); // Just verify it was created
    });
  });

  describe('getAuthHeader', () => {
    it('should generate Basic Auth header with correct format', () => {
      const config: EverlyticConfig = {
        apiUrl: 'https://api.everlytic.net',
        username: 'testuser',
        apiKey: 'testkey',
      };

      const client = new EverlyticClient(config);
      const authHeader = client.getAuthHeader();

      expect(authHeader).toContain('Basic ');
    });

    it('should base64 encode username:apikey', () => {
      const config: EverlyticConfig = {
        apiUrl: 'https://api.everlytic.net',
        username: 'admin',
        apiKey: 'secret123',
      };

      const client = new EverlyticClient(config);
      const authHeader = client.getAuthHeader();

      // Decode and verify
      const base64Part = authHeader.replace('Basic ', '');
      const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
      
      expect(decoded).toBe('admin:secret123');
    });

    it('should handle special characters in credentials', () => {
      const config: EverlyticConfig = {
        apiUrl: 'https://api.everlytic.net',
        username: 'user@example.com',
        apiKey: 'key-with-special-chars!@#$',
      };

      const client = new EverlyticClient(config);
      const authHeader = client.getAuthHeader();

      const base64Part = authHeader.replace('Basic ', '');
      const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
      
      expect(decoded).toBe('user@example.com:key-with-special-chars!@#$');
    });

    it('should handle empty username', () => {
      const config: EverlyticConfig = {
        apiUrl: 'https://api.everlytic.net',
        username: '',
        apiKey: 'testkey',
      };

      const client = new EverlyticClient(config);
      const authHeader = client.getAuthHeader();

      const base64Part = authHeader.replace('Basic ', '');
      const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
      
      expect(decoded).toBe(':testkey');
    });

    it('should handle empty API key', () => {
      const config: EverlyticConfig = {
        apiUrl: 'https://api.everlytic.net',
        username: 'testuser',
        apiKey: '',
      };

      const client = new EverlyticClient(config);
      const authHeader = client.getAuthHeader();

      const base64Part = authHeader.replace('Basic ', '');
      const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
      
      expect(decoded).toBe('testuser:');
    });
  });
});

describe('EverlyticApiError', () => {
  describe('constructor', () => {
    it('should create error with correct properties', () => {
      const errorResponse: EverlyticErrorResponse = {
        code: 400,
        message: 'Bad Request',
        error: {
          errors: [
            {
              domain: 'everlytic',
              reason: 'invalid',
              message: 'Invalid email format',
              locationType: 'field',
              location: 'to.email',
            },
          ],
        },
      };

      const error = new EverlyticApiError(errorResponse);

      expect(error.name).toBe('EverlyticApiError');
      expect(error.code).toBe(400);
      expect(error.message).toBe('Bad Request');
      expect(error.details).toEqual(errorResponse);
    });
  });

  describe('getUserMessage', () => {
    it('should return domain verification message for unverified domain error', () => {
      const errorResponse: EverlyticErrorResponse = {
        code: 400,
        message: 'Unverified domain',
        error: { errors: [] },
      };

      const error = new EverlyticApiError(errorResponse);
      const message = error.getUserMessage();

      expect(message).toContain('domain');
      expect(message).toContain('verify');
      expect(message).toContain('DNS');
    });

    it('should return email format message for invalid email error', () => {
      const errorResponse: EverlyticErrorResponse = {
        code: 400,
        message: 'Invalid email address',
        error: {
          errors: [
            {
              domain: 'everlytic',
              reason: 'invalid',
              message: 'Invalid format',
              locationType: 'field',
              location: 'to.email',
            },
          ],
        },
      };

      const error = new EverlyticApiError(errorResponse);
      const message = error.getUserMessage();

      expect(message).toContain('email');
      expect(message).toContain('format');
    });

    it('should return authentication message for 401 error', () => {
      const errorResponse: EverlyticErrorResponse = {
        code: 401,
        message: 'Unauthorized',
        error: { errors: [] },
      };

      const error = new EverlyticApiError(errorResponse);
      const message = error.getUserMessage();

      expect(message).toContain('Authentication');
      expect(message).toContain('credentials');
      expect(message).toContain('API');
    });

    it('should return field validation message for 412 error', () => {
      const errorResponse: EverlyticErrorResponse = {
        code: 412,
        message: 'Precondition Failed',
        error: {
          errors: [
            {
              domain: 'everlytic',
              reason: 'required',
              message: 'Field is required',
              locationType: 'field',
              location: 'subject',
            },
          ],
        },
      };

      const error = new EverlyticApiError(errorResponse);
      const message = error.getUserMessage();

      expect(message).toContain('Invalid fields');
      expect(message).toContain('subject');
    });

    it('should return rate limit message for 429 error', () => {
      const errorResponse: EverlyticErrorResponse = {
        code: 429,
        message: 'Too Many Requests',
        error: { errors: [] },
      };

      const error = new EverlyticApiError(errorResponse);
      const message = error.getUserMessage();

      expect(message).toContain('Rate limit');
      expect(message).toContain('wait');
    });

    it('should return service error message for 500 error', () => {
      const errorResponse: EverlyticErrorResponse = {
        code: 500,
        message: 'Internal Server Error',
        error: { errors: [] },
      };

      const error = new EverlyticApiError(errorResponse);
      const message = error.getUserMessage();

      expect(message).toContain('service error');
      expect(message).toContain('500');
    });

    it('should return generic message for unknown error code', () => {
      const errorResponse: EverlyticErrorResponse = {
        code: 999,
        message: 'Unknown Error',
        error: { errors: [] },
      };

      const error = new EverlyticApiError(errorResponse);
      const message = error.getUserMessage();

      expect(message).toContain('999');
      expect(message).toContain('Unknown Error');
    });
  });

  describe('getLogDetails', () => {
    it('should return sanitized error details for logging', () => {
      const errorResponse: EverlyticErrorResponse = {
        code: 400,
        message: 'Bad Request',
        error: {
          errors: [
            {
              domain: 'everlytic',
              reason: 'invalid',
              message: 'Invalid field',
              locationType: 'field',
              location: 'to.email',
            },
          ],
        },
      };

      const error = new EverlyticApiError(errorResponse);
      const logDetails = error.getLogDetails();

      expect(logDetails.code).toBe(400);
      expect(logDetails.message).toBe('Bad Request');
      expect(logDetails.errors).toEqual([
        {
          domain: 'everlytic',
          reason: 'invalid',
          location: 'to.email',
          locationType: 'field',
          message: 'Invalid field',
        },
      ]);
    });

    it('should handle errors without error details', () => {
      const errorResponse: EverlyticErrorResponse = {
        code: 500,
        message: 'Server Error',
        error: { errors: [] },
      };

      const error = new EverlyticApiError(errorResponse);
      const logDetails = error.getLogDetails();

      expect(logDetails.code).toBe(500);
      expect(logDetails.message).toBe('Server Error');
      expect(logDetails.errors).toEqual([]);
    });
  });
});

describe('createEverlyticClient', () => {
  it('should throw error when API key is missing', () => {
    // Save original env
    const originalApiKey = process.env.EVERLYTIC_API_KEY;
    
    // Remove API key
    delete process.env.EVERLYTIC_API_KEY;

    expect(() => createEverlyticClient()).toThrow('EVERLYTIC_API_KEY');

    // Restore env
    if (originalApiKey) {
      process.env.EVERLYTIC_API_KEY = originalApiKey;
    }
  });

  it('should use default values for optional config', () => {
    // Save original env
    const originalApiKey = process.env.EVERLYTIC_API_KEY;
    const originalUrl = process.env.EVERLYTIC_API_URL;
    const originalUsername = process.env.EVERLYTIC_USERNAME;
    
    // Set minimal config
    process.env.EVERLYTIC_API_KEY = 'test-key';
    delete process.env.EVERLYTIC_API_URL;
    delete process.env.EVERLYTIC_USERNAME;

    const client = createEverlyticClient();
    const authHeader = client.getAuthHeader();
    
    // Should use default username 'administrator'
    const base64Part = authHeader.replace('Basic ', '');
    const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
    expect(decoded).toContain('administrator:');

    // Restore env
    if (originalApiKey) process.env.EVERLYTIC_API_KEY = originalApiKey;
    if (originalUrl) process.env.EVERLYTIC_API_URL = originalUrl;
    if (originalUsername) process.env.EVERLYTIC_USERNAME = originalUsername;
  });

  it('should use environment variables when provided', () => {
    // Save original env
    const originalApiKey = process.env.EVERLYTIC_API_KEY;
    const originalUrl = process.env.EVERLYTIC_API_URL;
    const originalUsername = process.env.EVERLYTIC_USERNAME;
    
    // Set custom config
    process.env.EVERLYTIC_API_KEY = 'custom-key';
    process.env.EVERLYTIC_API_URL = 'https://custom.api.com';
    process.env.EVERLYTIC_USERNAME = 'customuser';

    const client = createEverlyticClient();
    const authHeader = client.getAuthHeader();
    
    const base64Part = authHeader.replace('Basic ', '');
    const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
    expect(decoded).toBe('customuser:custom-key');

    // Restore env
    if (originalApiKey) process.env.EVERLYTIC_API_KEY = originalApiKey;
    else delete process.env.EVERLYTIC_API_KEY;
    if (originalUrl) process.env.EVERLYTIC_API_URL = originalUrl;
    else delete process.env.EVERLYTIC_API_URL;
    if (originalUsername) process.env.EVERLYTIC_USERNAME = originalUsername;
    else delete process.env.EVERLYTIC_USERNAME;
  });
});

// Run all tests
console.log('Running Everlytic Client Tests...');
console.log('===================================');
