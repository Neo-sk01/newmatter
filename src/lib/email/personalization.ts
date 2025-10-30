/**
 * Email Personalization Utility
 * 
 * Handles personalization tag detection and replacement for email content.
 * Supports both common fields (shared across all recipients) and unique fields
 * (per-recipient personalization) for Everlytic API integration.
 */

export interface EmailRecipient {
  email: string;
  name: string;
  personalization?: Record<string, string>;
}

export interface PersonalizationResult {
  html: string;
  text: string;
  uniqueFields?: Array<Record<string, Record<string, string>>>;
  commonFields?: Record<string, string>;
}

/**
 * Default fallback values for common personalization fields
 */
const DEFAULT_FALLBACKS: Record<string, string> = {
  firstName: 'there',
  lastName: '',
  company: 'your company',
  role: 'professional',
};

/**
 * Detects if content contains personalization tags like {{fieldName}}
 */
function hasPersonalizationTags(content: string): boolean {
  return /\{\{[^}]+\}\}/.test(content);
}

/**
 * Extracts all personalization tag names from content
 * Example: "Hello {{firstName}} from {{company}}" returns ["firstName", "company"]
 */
function extractPersonalizationTags(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const tags: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const tagName = match[1].trim();
    if (!tags.includes(tagName)) {
      tags.push(tagName);
    }
  }
  
  return tags;
}

/**
 * Replaces personalization tags in content with values from a data object
 * Uses fallback values for missing data
 */
function replacePersonalizationTags(
  content: string,
  data: Record<string, string>,
  fallbacks: Record<string, string> = DEFAULT_FALLBACKS
): string {
  let result = content;
  
  // Extract all tags from the content
  const tags = extractPersonalizationTags(content);
  
  // Replace each tag with its value or fallback
  tags.forEach(tag => {
    const value = data[tag] || fallbacks[tag] || `{{${tag}}}`;
    const regex = new RegExp(`\\{\\{${tag}\\}\\}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
}

/**
 * Applies personalization to email content for single or multiple recipients
 * 
 * @param html - HTML version of email content
 * @param text - Plain text version of email content
 * @param recipients - Array of recipients with optional personalization data
 * @param commonFields - Shared personalization fields for all recipients
 * @returns Personalized content with Everlytic-compatible field structures
 */
export function applyPersonalization(
  html: string,
  text: string,
  recipients: EmailRecipient[],
  commonFields?: Record<string, any>
): PersonalizationResult {
  // Check if personalization is needed
  const htmlHasTags = hasPersonalizationTags(html);
  const textHasTags = hasPersonalizationTags(text);
  
  if (!htmlHasTags && !textHasTags) {
    // No personalization tags found, return as-is
    return { html, text };
  }

  // Apply common fields if provided
  let personalizedHtml = html;
  let personalizedText = text;
  let processedCommonFields: Record<string, string> | undefined;

  if (commonFields && Object.keys(commonFields).length > 0) {
    // Convert all common field values to strings
    processedCommonFields = Object.entries(commonFields).reduce(
      (acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      },
      {} as Record<string, string>
    );

    // Replace common field tags in both HTML and text
    personalizedHtml = replacePersonalizationTags(
      personalizedHtml,
      processedCommonFields
    );
    personalizedText = replacePersonalizationTags(
      personalizedText,
      processedCommonFields
    );
  }

  // Build unique fields structure for Everlytic
  // Format: [{ "email@example.com": { "firstName": "John", "lastName": "Doe" } }]
  const uniqueFields: Array<Record<string, Record<string, string>>> = [];
  
  recipients.forEach(recipient => {
    if (recipient.personalization && Object.keys(recipient.personalization).length > 0) {
      // Ensure all values are strings
      const personalizedData = Object.entries(recipient.personalization).reduce(
        (acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        },
        {} as Record<string, string>
      );
      
      uniqueFields.push({
        [recipient.email]: personalizedData,
      });
    }
  });

  return {
    html: personalizedHtml,
    text: personalizedText,
    uniqueFields: uniqueFields.length > 0 ? uniqueFields : undefined,
    commonFields: processedCommonFields,
  };
}

/**
 * Validates that all personalization tags in content have corresponding data
 * Returns array of missing field names
 */
export function validatePersonalizationData(
  content: string,
  data: Record<string, string>
): string[] {
  const tags = extractPersonalizationTags(content);
  const missingFields: string[] = [];
  
  tags.forEach(tag => {
    if (!data[tag] && !DEFAULT_FALLBACKS[tag]) {
      missingFields.push(tag);
    }
  });
  
  return missingFields;
}

/**
 * Builds Everlytic personalization_fields structure
 * Combines common and unique fields into the format expected by Everlytic API
 */
export function buildEverlyticPersonalizationFields(
  commonFields?: Record<string, string>,
  uniqueFields?: Array<Record<string, Record<string, string>>>
): { personalisation_fields?: any } {
  if (!commonFields && !uniqueFields) {
    return {};
  }

  const personalisationFields: any = {};

  if (commonFields && Object.keys(commonFields).length > 0) {
    personalisationFields.common_fields = commonFields;
  }

  if (uniqueFields && uniqueFields.length > 0) {
    personalisationFields.unique_fields = uniqueFields;
  }

  return Object.keys(personalisationFields).length > 0
    ? { personalisation_fields: personalisationFields }
    : {};
}
