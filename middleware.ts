import { NextRequest, NextResponse } from 'next/server';
import { safeJsonParse } from './lib/rsc-security';

// Security constants
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window

// In-memory rate limit store (for production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of Array.from(rateLimitStore.entries())) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: NextRequest): string {
  // Use IP address or forwarded IP
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.ip || 'unknown';
  return ip;
}

/**
 * Check rate limit for a client
 */
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);

  if (!record || record.resetAt < now) {
    // Create new record
    rateLimitStore.set(clientId, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}


/**
 * Validate request size
 */
async function validateRequestSize(request: NextRequest): Promise<boolean> {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > MAX_REQUEST_SIZE) {
      return false;
    }
  }
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to App Router routes and API routes
  if (!pathname.startsWith('/app') && !pathname.startsWith('/api')) {
    // For Pages Router, we still want to protect RSC endpoints
    if (pathname.startsWith('/_next') && pathname.includes('rsc')) {
      // This is an RSC request - apply protections
    } else {
      return NextResponse.next();
    }
  }

  // Check rate limit
  const clientId = getClientId(request);
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  // Validate request size
  if (!(await validateRequestSize(request))) {
    return NextResponse.json(
      { error: 'Request body too large' },
      { status: 413 }
    );
  }

  // For POST/PUT/PATCH requests, validate body if present
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    try {
      const contentType = request.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        // Clone request to read body without consuming it
        const clonedRequest = request.clone();
        const text = await clonedRequest.text();
        
        if (text) {
          // Validate JSON structure using safe parsing
          safeJsonParse(text, MAX_REQUEST_SIZE);
        }
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Invalid request payload' },
        { status: 400 }
      );
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

