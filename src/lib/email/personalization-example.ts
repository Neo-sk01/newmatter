/**
 * Example usage of personalization utility
 * This demonstrates the expected output format for Everlytic API
 */

import { applyPersonalization, buildEverlyticPersonalizationFields } from './personalization';

// Example: Sending personalized emails to multiple recipients
const htmlTemplate = `
<html>
  <body>
    <p>Hi {{firstName}},</p>
    <p>I noticed you work at {{company}} as a {{role}}. I wanted to reach out...</p>
    <p>Best regards,<br>Sales Team</p>
  </body>
</html>
`;

const textTemplate = `
Hi {{firstName}},

I noticed you work at {{company}} as a {{role}}. I wanted to reach out...

Best regards,
Sales Team
`;

const recipients = [
  {
    email: 'john@acme.com',
    name: 'John Doe',
    personalization: {
      firstName: 'John',
      company: 'Acme Corp',
      role: 'CTO',
    },
  },
  {
    email: 'jane@techco.com',
    name: 'Jane Smith',
    personalization: {
      firstName: 'Jane',
      company: 'TechCo',
      role: 'VP of Engineering',
    },
  },
];

// Apply personalization
const result = applyPersonalization(htmlTemplate, textTemplate, recipients);

console.log('Personalization Result:');
console.log(JSON.stringify(result, null, 2));

// Build Everlytic API structure
const everlyticFields = buildEverlyticPersonalizationFields(
  result.commonFields,
  result.uniqueFields
);

console.log('\nEverlytic API Structure:');
console.log(JSON.stringify(everlyticFields, null, 2));

// Expected output format for Everlytic API:
// {
//   "personalisation_fields": {
//     "unique_fields": [
//       {
//         "john@acme.com": {
//           "firstName": "John",
//           "company": "Acme Corp",
//           "role": "CTO"
//         }
//       },
//       {
//         "jane@techco.com": {
//           "firstName": "Jane",
//           "company": "TechCo",
//           "role": "VP of Engineering"
//         }
//       }
//     ]
//   }
// }
