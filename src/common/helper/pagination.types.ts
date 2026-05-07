/**
 * Pagination Types and Interfaces
 *
 * Standardized type definitions for offset-based and cursor-based pagination
 * Used across all API endpoints for consistent response formats
 *
 * @module PaginationTypes
 */

/**
 * Pagination request parameters for offset-based pagination
 *
 * @template T - Type of items in the response
 *
 * @example
 * const params: OffsetPaginationParams<RoleResponseDto> = {
 *   items: roles,
 *   totalItems: 150,
 *   currentPage: 1,
 *   itemsPerPage: 10,
 *   baseUrl: '/api/v1/roles',
 *   query: { search: 'admin' }
 * };
 */
export interface OffsetPaginationParams<T> {
  /** Array of items for current page */
  items: T[];

  /** Total number of items in database */
  totalItems: number;

  /** Current page number (1-indexed) */
  currentPage: number;

  /** Number of items per page */
  itemsPerPage: number;

  /** Base URL for link generation */
  baseUrl: string;

  /** Additional query parameters to preserve in links */
  query?: Record<string, any>;
}

/**
 * Pagination request parameters for cursor-based pagination
 *
 * @template T - Type of items in the response
 *
 * @example
 * const params: CursorPaginationParams<MessageDto> = {
 *   items: messages,
 *   hasMore: true,
 *   nextCursor: 'encoded_cursor_123',
 *   limit: 20,
 *   baseUrl: '/api/v1/messages',
 *   query: { conversation_id: 'conv_123' }
 * };
 */
export interface CursorPaginationParams<T> {
  /** Array of items for current batch */
  items: T[];

  /** Whether more items exist after current batch */
  hasMore: boolean;

  /** Cursor to fetch next batch (base64 encoded) */
  nextCursor?: string;

  /** Number of items per batch */
  limit: number;

  /** Base URL for link generation */
  baseUrl: string;

  /** Additional query parameters to preserve in links */
  query?: Record<string, any>;
}

/**
 * Standard offset pagination response metadata
 *
 * @example
 * {
 *   "totalItems": 150,
 *   "itemCount": 10,
 *   "itemsPerPage": 10,
 *   "totalPages": 15,
 *   "currentPage": 1
 * }
 */
export interface PaginationMeta {
  /** Total number of items in entire dataset */
  totalItems: number;

  /** Number of items in current response */
  itemCount: number;

  /** Items returned per page */
  itemsPerPage: number;

  /** Total number of pages */
  totalPages: number;

  /** Current page number */
  currentPage: number;
}

/**
 * Standard offset pagination links for navigation
 *
 * @example
 * {
 *   "first": "/api/v1/roles?page=1&limit=10",
 *   "previous": "/api/v1/roles?page=1&limit=10",
 *   "next": "/api/v1/roles?page=3&limit=10",
 *   "last": "/api/v1/roles?page=15&limit=10"
 * }
 */
export interface PaginationLinks {
  /** Link to first page */
  first: string | null;

  /** Link to previous page */
  previous: string | null;

  /** Link to next page */
  next: string | null;

  /** Link to last page */
  last: string | null;
}

/**
 * Standard offset-based pagination response
 *
 * Use for admin dashboards, reports, and small-to-medium datasets
 *
 * @template T - Type of items in the response
 *
 * @example
 * {
 *   "success": true,
 *   "data": [...],
 *   "meta": {
 *     "totalItems": 150,
 *     "itemCount": 10,
 *     "itemsPerPage": 10,
 *     "totalPages": 15,
 *     "currentPage": 1
 *   },
 *   "links": {
 *     "first": "/api/v1/roles?page=1&limit=10",
 *     "previous": null,
 *     "next": "/api/v1/roles?page=2&limit=10",
 *     "last": "/api/v1/roles?page=15&limit=10"
 *   }
 * }
 */
export interface OffsetPaginatedResponse<T> {
  /** Success status */
  success: true;

  /** Array of paginated items */
  data: T[];

  /** Pagination metadata */
  meta: PaginationMeta;

  /** Navigation links */
  links: PaginationLinks;
}

/**
 * Standard cursor pagination links
 *
 * @example
 * {
 *   "next": "/api/v1/messages?cursor=MTcxNTA2NTUwMA==&limit=20"
 * }
 */
export interface CursorPaginationLinks {
  /** Link to fetch next batch */
  next: string | null;
}

/**
 * Standard cursor pagination information
 *
 * @example
 * {
 *   "limit": 20,
 *   "nextCursor": "MTcxNTA2NTUwMA==",
 *   "hasMore": true
 * }
 */
export interface CursorPaginationInfo {
  /** Items per batch */
  limit: number;

  /** Cursor for fetching next batch (base64 encoded) */
  nextCursor?: string;

  /** Whether more items exist */
  hasMore: boolean;
}

/**
 * Standard cursor-based pagination response
 *
 * Use for feeds, real-time data, chat messages, and large datasets
 *
 * @template T - Type of items in the response
 *
 * @example
 * {
 *   "success": true,
 *   "data": [...],
 *   "pagination": {
 *     "limit": 20,
 *     "nextCursor": "MTcxNTA2NTUwMA==",
 *     "hasMore": true
 *   },
 *   "links": {
 *     "next": "/api/v1/messages?cursor=MTcxNTA2NTUwMA==&limit=20"
 *   }
 * }
 */
export interface CursorPaginatedResponse<T> {
  /** Success status */
  success: true;

  /** Array of paginated items */
  data: T[];

  /** Pagination information */
  pagination: CursorPaginationInfo;

  /** Navigation links */
  links: CursorPaginationLinks;
}

/**
 * Union type for any paginated response
 *
 * @template T - Type of items in the response
 */
export type PaginatedResponse<T> =
  | OffsetPaginatedResponse<T>
  | CursorPaginatedResponse<T>;
