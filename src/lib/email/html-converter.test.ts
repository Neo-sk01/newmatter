/**
 * Tests for HTML Converter Utility
 * 
 * Run with: npx tsx src/lib/email/html-converter.test.ts
 * Or manually verify each test case
 */

import { convertToHtml, stripHtml } from './html-converter';

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
    toContain(substring: string) {
      if (!actual || !actual.includes(substring)) {
        throw new Error(`Expected string to contain "${substring}"`);
      }
    },
    not: {
      toContain(substring: string) {
        if (actual && actual.includes(substring)) {
          throw new Error(`Expected string not to contain "${substring}"`);
        }
      },
    },
  };
}

describe('convertToHtml', () => {
  it('should convert plain text to HTML with paragraph tags', () => {
    const text = 'Hello world\nThis is a test';
    const subject = 'Test Email';
    
    const result = convertToHtml(text, subject);
    
    expect(result).toContain('<p>Hello world</p>');
    expect(result).toContain('<p>This is a test</p>');
  });

  it('should include proper DOCTYPE and HTML structure', () => {
    const text = 'Test content';
    const subject = 'Test';
    
    const result = convertToHtml(text, subject);
    
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html>');
    expect(result).toContain('<head>');
    expect(result).toContain('<body');
    expect(result).toContain('</body>');
    expect(result).toContain('</html>');
  });

  it('should include meta tags for charset and viewport', () => {
    const text = 'Test';
    const subject = 'Test';
    
    const result = convertToHtml(text, subject);
    
    expect(result).toContain('<meta charset="utf-8">');
    expect(result).toContain('<meta name="viewport"');
  });

  it('should include subject in title tag', () => {
    const text = 'Test content';
    const subject = 'Important Email';
    
    const result = convertToHtml(text, subject);
    
    expect(result).toContain('<title>Important Email</title>');
  });

  it('should escape HTML special characters in content', () => {
    const text = 'Price: $100 < $200 & "special" offer';
    const subject = 'Test';
    
    const result = convertToHtml(text, subject);
    
    expect(result).toContain('&lt;');
    expect(result).toContain('&amp;');
    expect(result).toContain('&quot;');
    expect(result).not.toContain('< $200');
    expect(result).not.toContain('& "special"');
  });

  it('should escape HTML special characters in subject', () => {
    const text = 'Test';
    const subject = 'Test <script>alert("xss")</script>';
    
    const result = convertToHtml(text, subject);
    
    expect(result).toContain('&lt;script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('should filter out empty lines', () => {
    const text = 'Line 1\n\n\nLine 2\n   \nLine 3';
    const subject = 'Test';
    
    const result = convertToHtml(text, subject);
    
    // Should only have 3 paragraph tags
    const pCount = (result.match(/<p>/g) || []).length;
    expect(pCount).toBe(3);
  });

  it('should trim whitespace from lines', () => {
    const text = '   Hello   \n   World   ';
    const subject = 'Test';
    
    const result = convertToHtml(text, subject);
    
    expect(result).toContain('<p>Hello</p>');
    expect(result).toContain('<p>World</p>');
  });

  it('should include inline CSS styling', () => {
    const text = 'Test';
    const subject = 'Test';
    
    const result = convertToHtml(text, subject);
    
    expect(result).toContain('font-family');
    expect(result).toContain('line-height');
    expect(result).toContain('max-width');
  });

  it('should handle empty string', () => {
    const text = '';
    const subject = 'Empty Email';
    
    const result = convertToHtml(text, subject);
    
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<title>Empty Email</title>');
    // Should have no paragraph tags
    expect(result).not.toContain('<p>');
  });

  it('should handle single line text', () => {
    const text = 'Single line';
    const subject = 'Test';
    
    const result = convertToHtml(text, subject);
    
    expect(result).toContain('<p>Single line</p>');
  });

  it('should escape apostrophes', () => {
    const text = "It's a test with John's content";
    const subject = 'Test';
    
    const result = convertToHtml(text, subject);
    
    expect(result).toContain('&#039;');
  });
});

describe('stripHtml', () => {
  it('should remove HTML tags', () => {
    const html = '<p>Hello <strong>world</strong></p>';
    
    const result = stripHtml(html);
    
    expect(result).toBe('Hello world');
  });

  it('should decode HTML entities', () => {
    const html = 'Price: $100 &lt; $200 &amp; &quot;special&quot; offer';
    
    const result = stripHtml(html);
    
    expect(result).toBe('Price: $100 < $200 & "special" offer');
  });

  it('should decode nbsp entities', () => {
    const html = 'Hello&nbsp;world&nbsp;test';
    
    const result = stripHtml(html);
    
    expect(result).toBe('Hello world test');
  });

  it('should decode apostrophe entities', () => {
    const html = "It&#039;s a test";
    
    const result = stripHtml(html);
    
    expect(result).toBe("It's a test");
  });

  it('should handle nested HTML tags', () => {
    const html = '<div><p>Hello <span><strong>world</strong></span></p></div>';
    
    const result = stripHtml(html);
    
    expect(result).toBe('Hello world');
  });

  it('should trim whitespace', () => {
    const html = '   <p>Hello</p>   ';
    
    const result = stripHtml(html);
    
    expect(result).toBe('Hello');
  });

  it('should handle empty string', () => {
    const html = '';
    
    const result = stripHtml(html);
    
    expect(result).toBe('');
  });

  it('should handle plain text without HTML', () => {
    const html = 'Plain text content';
    
    const result = stripHtml(html);
    
    expect(result).toBe('Plain text content');
  });

  it('should handle self-closing tags', () => {
    const html = 'Line 1<br/>Line 2<hr/>Line 3';
    
    const result = stripHtml(html);
    
    expect(result).toBe('Line 1Line 2Line 3');
  });

  it('should handle HTML with attributes', () => {
    const html = '<p class="test" id="para">Content</p>';
    
    const result = stripHtml(html);
    
    expect(result).toBe('Content');
  });

  it('should handle multiple entities in sequence', () => {
    const html = '&lt;&gt;&amp;&quot;&#039;';
    
    const result = stripHtml(html);
    
    expect(result).toBe('<>&"\'');
  });
});

// Run all tests
console.log('Running HTML Converter Tests...');
console.log('================================');
