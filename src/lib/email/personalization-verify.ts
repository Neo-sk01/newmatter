/**
 * Simple verification script for personalization utility
 * Run with: npx tsx src/lib/email/personalization-verify.ts
 */

import {
  applyPersonalization,
  validatePersonalizationData,
  buildEverlyticPersonalizationFields,
  type EmailRecipient,
} from './personalization';

console.log('🧪 Testing Email Personalization Utility\n');

// Test 1: No personalization tags
console.log('Test 1: Content without personalization tags');
const test1 = applyPersonalization(
  '<p>Hello world</p>',
  'Hello world',
  [{ email: 'test@example.com', name: 'Test User' }]
);
console.log('✓ HTML unchanged:', test1.html === '<p>Hello world</p>');
console.log('✓ No unique fields:', test1.uniqueFields === undefined);
console.log('');

// Test 2: Common fields
console.log('Test 2: Common field replacement');
const test2 = applyPersonalization(
  '<p>Hello {{firstName}} {{lastName}}</p>',
  'Hello {{firstName}} {{lastName}}',
  [{ email: 'test@example.com', name: 'Test User' }],
  { firstName: 'John', lastName: 'Doe' }
);
console.log('✓ HTML replaced:', test2.html === '<p>Hello John Doe</p>');
console.log('✓ Text replaced:', test2.text === 'Hello John Doe');
console.log('✓ Common fields set:', JSON.stringify(test2.commonFields));
console.log('');

// Test 3: Unique fields per recipient
console.log('Test 3: Per-recipient personalization');
const test3 = applyPersonalization(
  '<p>Hello {{firstName}}</p>',
  'Hello {{firstName}}',
  [
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
  ]
);
console.log('✓ Unique fields created:', test3.uniqueFields?.length === 2);
console.log('✓ First recipient:', JSON.stringify(test3.uniqueFields?.[0]));
console.log('✓ Second recipient:', JSON.stringify(test3.uniqueFields?.[1]));
console.log('');

// Test 4: Fallback values
console.log('Test 4: Fallback values for missing data');
const test4 = applyPersonalization(
  '<p>Hello {{firstName}} from {{company}}</p>',
  'Hello {{firstName}} from {{company}}',
  [{ email: 'test@example.com', name: 'Test User' }],
  {}
);
console.log('✓ HTML with fallbacks:', test4.html);
console.log('✓ Uses "there" for firstName:', test4.html.includes('there'));
console.log('✓ Uses "your company" for company:', test4.html.includes('your company'));
console.log('');

// Test 5: Validate personalization data
console.log('Test 5: Validation of personalization data');
const missing = validatePersonalizationData(
  'Hello {{firstName}} from {{company}} in {{city}}',
  { firstName: 'John' }
);
console.log('✓ Missing fields detected:', missing);
console.log('✓ Contains "city":', missing.includes('city'));
console.log('✓ Does not contain "firstName":', !missing.includes('firstName'));
console.log('✓ Does not contain "company" (has fallback):', !missing.includes('company'));
console.log('');

// Test 6: Build Everlytic structure
console.log('Test 6: Build Everlytic personalization fields');
const everlyticFields = buildEverlyticPersonalizationFields(
  { company: 'Acme Corp' },
  [{ 'john@example.com': { firstName: 'John' } }]
);
console.log('✓ Structure created:', JSON.stringify(everlyticFields, null, 2));
console.log('');

console.log('✅ All tests completed!');
