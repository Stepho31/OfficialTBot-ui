/**
 * React Server Components Security Utilities
 * 
 * Provides safe JSON parsing and validation for RSC payloads
 * to prevent DoS attacks (CVE-2025-55184, CVE-2025-55183)
 */

const MAX_JSON_SIZE = 1024 * 1024; // 1MB
const MAX_JSON_DEPTH = 32;
const MAX_STRING_LENGTH = 100000; // 100KB per string

/**
 * Calculate the maximum depth of a nested object/array structure
 */
function getObjectDepth(obj: any, currentDepth: number = 0): number {
  if (currentDepth > MAX_JSON_DEPTH) {
    return currentDepth;
  }

  if (obj === null || typeof obj !== 'object') {
    return currentDepth;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return currentDepth;
    return Math.max(
      currentDepth,
      ...obj.map((item) => getObjectDepth(item, currentDepth + 1))
    );
  }

  const values = Object.values(obj);
  if (values.length === 0) return currentDepth;
  
  const depths = values.map((value) =>
    getObjectDepth(value, currentDepth + 1)
  );
  return Math.max(currentDepth, ...depths);
}

/**
 * Validate string length in an object recursively
 */
function validateStringLengths(obj: any, path: string = ''): void {
  if (obj === null || obj === undefined) {
    return;
  }

  if (typeof obj === 'string') {
    if (obj.length > MAX_STRING_LENGTH) {
      throw new Error(
        `String at path "${path}" exceeds maximum length of ${MAX_STRING_LENGTH}`
      );
    }
    return;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      validateStringLengths(item, `${path}[${index}]`);
    });
    return;
  }

  if (typeof obj === 'object') {
    Object.entries(obj).forEach(([key, value]) => {
      const newPath = path ? `${path}.${key}` : key;
      validateStringLengths(value, newPath);
    });
  }
}

/**
 * Safe JSON parse with size, depth, and structure validation
 * 
 * @param text - JSON string to parse
 * @param maxSize - Maximum size in bytes (default: 1MB)
 * @returns Parsed JSON object
 * @throws Error if JSON is invalid, too large, too deep, or contains oversized strings
 */
export function safeJsonParse(text: string, maxSize: number = MAX_JSON_SIZE): any {
  // Check size before parsing
  const sizeInBytes = new TextEncoder().encode(text).length;
  if (sizeInBytes > maxSize) {
    throw new Error(
      `JSON payload exceeds maximum size of ${maxSize} bytes (got ${sizeInBytes} bytes)`
    );
  }

  // Parse JSON with error handling
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
    throw error;
  }

  // Check depth
  const depth = getObjectDepth(parsed);
  if (depth > MAX_JSON_DEPTH) {
    throw new Error(
      `JSON structure too deeply nested (depth: ${depth}, max: ${MAX_JSON_DEPTH})`
    );
  }

  // Validate string lengths
  validateStringLengths(parsed);

  return parsed;
}

/**
 * Safe JSON stringify with size validation
 * 
 * @param obj - Object to stringify
 * @param maxSize - Maximum size in bytes (default: 1MB)
 * @returns JSON string
 * @throws Error if stringified JSON exceeds max size
 */
export function safeJsonStringify(
  obj: any,
  maxSize: number = MAX_JSON_SIZE
): string {
  const json = JSON.stringify(obj);
  const sizeInBytes = new TextEncoder().encode(json).length;
  
  if (sizeInBytes > maxSize) {
    throw new Error(
      `Stringified JSON exceeds maximum size of ${maxSize} bytes (got ${sizeInBytes} bytes)`
    );
  }

  return json;
}

/**
 * Validate RSC payload structure
 * 
 * @param payload - RSC payload to validate
 * @throws Error if payload structure is invalid
 */
export function validateRscPayload(payload: any): void {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('RSC payload must be an object');
  }

  // Add additional RSC-specific validations here if needed
  // For example, check for required fields, validate types, etc.
}

/**
 * Safe handler wrapper for RSC route handlers
 * 
 * @param handler - Async handler function
 * @returns Wrapped handler with error handling and validation
 */
export function withRscSecurity<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error: any) {
      // Log error for monitoring (in production, use proper logging)
      console.error('[RSC Security] Error in handler:', error);

      // Return safe error response
      if (error instanceof Error) {
        // Don't expose internal error details
        throw new Error('Request processing failed');
      }
      throw error;
    }
  }) as T;
}


