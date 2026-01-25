/**
 * Query parameters and headers for API requests.
 * @internal
 */
export interface QueryAndHeaders {
  /** URL query parameters */
  query: Record<string, string>;
  
  /** HTTP headers */
  headers: Record<string, string>;
}
