/**
 * Fetch wrapper with timeout protection using AbortController.
 * Prevents the UI from hanging indefinitely when external APIs become unresponsive.
 */

export interface FetchWithTimeoutOptions extends RequestInit {
  /** Timeout in milliseconds. Default is 10000 (10 seconds). */
  timeoutMs?: number;
}

/**
 * Performs a fetch request with a configurable timeout.
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options including custom timeout
 * @returns Promise that resolves to the Response or rejects on timeout/error
 * @throws Error with message "Request timeout" if the request exceeds the timeout
 * 
 * @example
 * ```typescript
 * const response = await fetchWithTimeout(
 *   "https://api.example.com/data",
 *   { timeoutMs: 5000 } // 5 second timeout
 * );
 * ```
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeoutMs = 10000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}

/**
 * Performs a fetch request with JSON parsing and timeout protection.
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options including custom timeout
 * @returns Promise that resolves to the parsed JSON data
 * @throws Error on timeout, network error, or JSON parsing error
 * 
 * @example
 * ```typescript
 * const data = await fetchJsonWithTimeout<MyDataType>(
 *   "https://api.example.com/data",
 *   { timeoutMs: 5000 }
 * );
 * ```
 */
export async function fetchJsonWithTimeout<T = unknown>(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }
  
  return response.json() as Promise<T>;
}
