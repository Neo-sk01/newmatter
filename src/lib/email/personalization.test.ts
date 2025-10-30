/**
 * Tests for Email Personalization Utility
 * 
 * Run with: node --loader ts-node/esm src/lib/email/personalization.test.ts
 * Or manually verify each test case
 */

import {
  applyPersonalization,
  validatePersonalizationData,
  buildEverlyticPersonalizationFields,
  type EmailRecipient,
} from './personalization';

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
    toBeUndefined() {
      if (actual !== undefined) {
        throw new Error(`Expected undefined but got ${JSON.stringify(actual)}`);
      }
    },
    toHaveLength(length: number) {
      if (!actual || actual.length !== length) {
        throw new Error(`Expected length ${length} but got ${actual?.length}`);
      }
    },
    toContain(item: any) {
      if (!actual || !actual.includes(item)) {
        throw new Error(`Expected array to contain ${item}`);
      }
    },
    not: {
      toContain(item: any) {
        if (actual && actual.includes(item)) {
          throw new Error(`Expected array not to contain ${item}`);
        }
      },
    },
  };
}

describe('applyPersonalization', () => {
  it('should return content unchanged when no personalization tags exist', () => {
    const html = '<p>Hello world</p>';
    const text = 'Hello world';
    const recipients: EmailRecipient[] = [
      { email: 'test@example.com', name: 'Test User' },
    ];

    const result = applyPersonalization(html, text, recipients);

    expect(result.html).toBe(html);
    expect(result.text).toBe(text);
    expect(result.uniqueFields).toBeUndefined();
    expect(result.commonFields).toBeUndefined();
  });

  it('should replace common field tags in both HTML and text', () => {
    const html = '<p>Hello {{firstName}} {{lastName}}</p>';
    const text = 'Hello {{firstName}} {{lastName}}';
    const recipients: EmailRecipient[] = [
      { email: 'test@example.com', name: 'Test User' },
    ];
    const commonFields = {
      firstName: 'John',
      lastName: 'Doe',
    };

    const result = applyPersonalization(html, text, recipients, commonFields);

    expect(result.html).toBe('<p>Hello John Doe</p>');
    expect(result.text).toBe('Hello John Doe');
    expect(result.commonFields).toEqual(commonFields);
  });

  it('should build unique fields structure for per-recipient personalization', () => {
    const html = '<p>Hello {{firstName}}</p>';
    const text = 'Hello {{firstName}}';
    const recipients: EmailRecipient[] = [
      {
        email: 'john@example.com',
        name: 'John Doe',
        personalization: { firstName: 'John', company: 'Acme Corp' },
      },
      {
        email: 'jane@example.com',
        name: 'Jane Smith',
        personalization: { firstName: 'Jane', company: 'Tech Inc' },
      },
    ];

    const result = applyPersonalization(html, text, recipients);

    expect(result.uniqueFields).toHaveLength(2);
    expect(result.uniqueFields?.[0]).toEqual({
      'john@example.com': { firstName: 'John', company: 'Acme Corp' },
    });
    expect(result.uniqueFields?.[1]).toEqual({
      'jane@example.com': { firstName: 'Jane', company: 'Tech Inc' },
    });
  });

  it('should handle missing personalization data with fallback values', () => {
    const html = '<p>Hello {{firstName}} from {{company}}</p>';
    const text = 'Hello {{firstName}} from {{company}}';
    const recipients: EmailRecipient[] = [
      { email: 'test@example.com', name: 'Test User' },
    ];
    const commonFields = {}; // No data provided

    const result = applyPersonalization(html, text, recipients, commonFields);

    // Should use default fallbacks
    expect(result.html).toBe('<p>Hello there from your company</p>');
    expect(result.text).toBe('Hello there from your company');
  });

  it('should handle recipients without personalization data', () => {
    const html = '<p>Hello {{firstName}}</p>';
    const text = 'Hello {{firstName}}';
    const recipients: EmailRecipient[] = [
      { email: 'test1@example.com', name: 'Test User 1' },
      { email: 'test2@example.com', name: 'Test User 2' },
    ];

    const result = applyPersonalization(html, text, recipients);

    expect(result.uniqueFields).toBeUndefined();
  });

  it('should convert non-string values to strings', () => {
    const html = '<p>Count: {{count}}</p>';
    const text = 'Count: {{count}}';
    const recipients: EmailRecipient[] = [
      { email: 'test@example.com', name: 'Test User' },
    ];
    const commonFields = {
      count: 42, // Number value
    };

    const result = applyPersonalization(html, text, recipients, commonFields as any);

    expect(result.html).toBe('<p>Count: 42</p>');
    expect(result.text).toBe('Count: 42');
  });
});

describe('validatePersonalizationData', () => {
  it('should return empty array when all tags have data', () => {
    const content = 'Hello {{firstName}} {{lastName}}';
    const data = {
      firstName: 'John',
      lastName: 'Doe',
    };

    const missing = validatePersonalizationData(content, data);

    expect(missing).toEqual([]);
  });

  it('should return missing field names', () => {
    const content = 'Hello {{firstName}} from {{company}} in {{city}}';
    const data = {
      firstName: 'John',
    };

    const missing = validatePersonalizationData(content, data);

    expect(missing).toContain('city');
    expect(missing).not.toContain('firstName');
    expect(missing).not.toContain('company'); // Has default fallback
  });

  it('should not report fields with default fallbacks as missing', () => {
    const content = 'Hello {{firstName}} {{lastName}} from {{company}}';
    const data = {};

    const missing = validatePersonalizationData(content, data);

    // firstName, lastName, company all have default fallbacks
    expect(missing).toEqual([]);
  });
});

describe('buildEverlyticPersonalizationFields', () => {
  it('should return empty object when no fields provided', () => {
    const result = buildEverlyticPersonalizationFields();

    expect(result).toEqual({});
  });

  it('should build structure with only common fields', () => {
    const commonFields = {
      firstName: 'John',
      company: 'Acme Corp',
    };

    const result = buildEverlyticPersonalizationFields(commonFields);

    expect(result).toEqual({
      personalisation_fields: {
        common_fields: commonFields,
      },
    });
  });

  it('should build structure with only unique fields', () => {
    const uniqueFields = [
      { 'john@example.com': { firstName: 'John' } },
      { 'jane@example.com': { firstName: 'Jane' } },
    ];

    const result = buildEverlyticPersonalizationFields(undefined, uniqueFields);

    expect(result).toEqual({
      personalisation_fields: {
        unique_fields: uniqueFields,
      },
    });
  });

  it('should build structure with both common and unique fields', () => {
    const commonFields = { company: 'Acme Corp' };
    const uniqueFields = [
      { 'john@example.com': { firstName: 'John' } },
    ];

    const result = buildEverlyticPersonalizationFields(commonFields, uniqueFields);

    expect(result).toEqual({
      personalisation_fields: {
        common_fields: commonFields,
        unique_fields: uniqueFields,
      },
    });
  });
});
