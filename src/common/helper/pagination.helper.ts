import {
  OffsetPaginationParams,
  CursorPaginationParams,
  OffsetPaginatedResponse,
  CursorPaginatedResponse,
  PaginationMeta,
  PaginationLinks,
  PrismaOffsetPaginationParams,
} from './pagination.types';

/**
 * PaginationHelper
 *
 * Professional pagination utility for building standardized API responses.
 * Supports both offset-based and cursor-based pagination strategies.
 *
 * Use this helper to ensure consistent pagination across all endpoints.
 *
 * **When to use offset pagination:**
 * - Admin dashboards and list pages
 * - Reports and exports where total count matters
 * - UIs with pagination controls (Page 1, 2, 3... Last)
 * - Small to medium datasets (< 1M records)
 *
 * **When to use cursor pagination:**
 * - Real-time feeds and activity streams
 * - Chat messages and conversations
 * - Infinite scroll implementations
 * - Large datasets (1M+ records)
 * - Time-series data
 *
 * @example
 * // Offset pagination in RoleService
 * const roles = await this.roleRepository.getAll(page, limit);
 * return PaginationHelper.offsetPaginate({
 *   items: roles,
 *   totalItems: 150,
 *   currentPage: page,
 *   itemsPerPage: limit,
 *   baseUrl: '/api/v1/roles',
 *   query: { search: 'admin' }
 * });
 *
 * @example
 * // Cursor pagination in MessageService
 * const messages = await this.messageRepository.findWithCursor({ cursor, limit });
 * return PaginationHelper.cursorPaginate({
 *   items: messages.data,
 *   hasMore: messages.hasMore,
 *   nextCursor: messages.nextCursor,
 *   limit: 20,
 *   baseUrl: '/api/v1/messages',
 *   query: { conversation_id: 'conv_123' }
 * });
 *
 * @class PaginationHelper
 */
export class PaginationHelper {
  /**
   * Build offset-based pagination response directly from Prisma delegate.
   *
   * This method centralizes both DB fetching and response shaping so endpoints
   * only pass delegate + query config.
   */
  static async prismaOffsetPaginate<T>(
    params: PrismaOffsetPaginationParams<T>,
  ): Promise<OffsetPaginatedResponse<T>> {
    const {
      delegate,
      page,
      limit,
      where = {},
      orderBy,
      select,
      include,
      baseUrl,
      query = {},
    } = params;

    this.validateOffsetParams(page, limit, 0, 0);

    const skip = (page - 1) * limit;
    const take = limit;

    const findManyArgs: any = {
      where,
      skip,
      take,
    };

    if (orderBy !== undefined) {
      findManyArgs.orderBy = orderBy;
    }
    if (select !== undefined) {
      findManyArgs.select = select;
    }
    if (include !== undefined) {
      findManyArgs.include = include;
    }

    const [items, totalItems] = await Promise.all([
      delegate.findMany(findManyArgs),
      delegate.count({ where }),
    ]);

    return this.offsetPaginate({
      items,
      totalItems,
      currentPage: page,
      itemsPerPage: limit,
      baseUrl,
      query,
    });
  }

  /**
   * Build offset-based pagination response
   *
   * Use this for:
   * - Admin dashboards and list pages
   * - Reports and exports where total count matters
   * - UIs with pagination controls (Page 1, 2, 3... Last)
   * - Small to medium datasets (< 1M records)
   *
   * @template T - Type of items in the response
   * @param params - Pagination parameters including items, totals, and page info
   * @returns Standardized offset pagination response with meta and links
   * @throws Error if params are invalid
   *
   * @example
   * const response = PaginationHelper.offsetPaginate({
   *   items: [role1, role2, role3],
   *   totalItems: 150,
   *   currentPage: 2,
   *   itemsPerPage: 10,
   *   baseUrl: '/api/v1/roles'
   * });
   *
   * // Returns:
   * // {
   * //   success: true,
   * //   data: [role1, role2, role3],
   * //   meta: {
   * //     totalItems: 150,
   * //     itemCount: 3,
   * //     itemsPerPage: 10,
   * //     totalPages: 15,
   * //     currentPage: 2
   * //   },
   * //   links: {
   * //     first: "/api/v1/roles?page=1&limit=10",
   * //     previous: "/api/v1/roles?page=1&limit=10",
   * //     next: "/api/v1/roles?page=3&limit=10",
   * //     last: "/api/v1/roles?page=15&limit=10"
   * //   }
   * // }
   *
   * @example
   * // With additional query parameters preserved
   * const response = PaginationHelper.offsetPaginate({
   *   items: filteredRoles,
   *   totalItems: 50,
   *   currentPage: 1,
   *   itemsPerPage: 10,
   *   baseUrl: '/api/v1/roles',
   *   query: { search: 'admin', sort: 'name' }
   * });
   *
   * // Links will include: ?page=X&limit=10&search=admin&sort=name
   */
  static offsetPaginate<T>(
    params: OffsetPaginationParams<T>,
  ): OffsetPaginatedResponse<T> {
    const {
      items,
      totalItems,
      currentPage,
      itemsPerPage,
      baseUrl,
      query = {},
    } = params;

    // Validation
    this.validateOffsetParams(
      currentPage,
      itemsPerPage,
      totalItems,
      items.length,
    );

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const meta: PaginationMeta = {
      totalItems,
      itemCount: items.length,
      itemsPerPage,
      totalPages,
      currentPage,
    };

    // Generate pagination links
    const links: PaginationLinks = {
      first: this.buildOffsetUrl(baseUrl, 1, itemsPerPage, query),
      previous:
        currentPage > 1
          ? this.buildOffsetUrl(baseUrl, currentPage - 1, itemsPerPage, query)
          : null,
      next:
        currentPage < totalPages
          ? this.buildOffsetUrl(baseUrl, currentPage + 1, itemsPerPage, query)
          : null,
      last: this.buildOffsetUrl(baseUrl, totalPages, itemsPerPage, query),
    };

    return {
      success: true,
      data: items,
      meta,
      links,
    };
  }

  /**
   * Build cursor-based pagination response
   *
   * Use this for:
   * - Real-time feeds and activity streams
   * - Chat messages and conversations
   * - Infinite scroll implementations
   * - Large datasets (1M+ records)
   * - Time-series data
   *
   * Pros: Stable under inserts/deletes, efficient with large data
   * Cons: Cannot jump to arbitrary page, requires stable sort key
   *
   * @template T - Type of items in the response
   * @param params - Pagination parameters including items and cursor info
   * @returns Standardized cursor pagination response with pagination info and links
   * @throws Error if params are invalid
   *
   * @example
   * const response = PaginationHelper.cursorPaginate({
   *   items: [message1, message2, ...],
   *   hasMore: true,
   *   nextCursor: 'MTcxNTA2NTUwMA==',
   *   limit: 20,
   *   baseUrl: '/api/v1/messages'
   * });
   *
   * // Returns:
   * // {
   * //   success: true,
   * //   data: [message1, message2, ...],
   * //   pagination: {
   * //     limit: 20,
   * //     nextCursor: "MTcxNTA2NTUwMA==",
   * //     hasMore: true
   * //   },
   * //   links: {
   * //     next: "/api/v1/messages?cursor=MTcxNTA2NTUwMA==&limit=20"
   * //   }
   * // }
   *
   * @example
   * // With additional query parameters preserved
   * const response = PaginationHelper.cursorPaginate({
   *   items: messages,
   *   hasMore: true,
   *   nextCursor: 'encoded_cursor_123',
   *   limit: 20,
   *   baseUrl: '/api/v1/messages',
   *   query: { conversation_id: 'conv_456', sort: 'recent' }
   * });
   *
   * // Links will include: ?cursor=encoded_cursor_123&limit=20&conversation_id=conv_456&sort=recent
   */
  static cursorPaginate<T>(
    params: CursorPaginationParams<T>,
  ): CursorPaginatedResponse<T> {
    const { items, hasMore, nextCursor, limit, baseUrl, query = {} } = params;

    // Validation
    this.validateCursorParams(limit, items.length);

    // Build next link
    const nextLink =
      hasMore && nextCursor
        ? this.buildCursorUrl(baseUrl, nextCursor, limit, query)
        : null;

    return {
      success: true,
      data: items,
      pagination: {
        limit,
        nextCursor,
        hasMore,
      },
      links: {
        next: nextLink,
      },
    };
  }

  /**
   * Internal: Build URL with offset pagination parameters
   *
   * @private
   * @param baseUrl - Base URL path
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @param query - Additional query parameters to preserve
   * @returns Full URL with query string
   *
   * @example
   * const url = PaginationHelper['buildOffsetUrl'](
   *   '/api/v1/roles',
   *   2,
   *   10,
   *   { search: 'admin' }
   * );
   * // Returns: "/api/v1/roles?page=2&limit=10&search=admin"
   */
  private static buildOffsetUrl(
    baseUrl: string,
    page: number,
    limit: number,
    query: Record<string, any> = {},
  ): string {
    const params = new URLSearchParams();

    // Add pagination params
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    // Add custom query params (preserve order and exclude pagination keys)
    Object.entries(query).forEach(([key, value]) => {
      if (key !== 'page' && key !== 'limit' && value !== undefined) {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Internal: Build URL with cursor pagination parameters
   *
   * @private
   * @param baseUrl - Base URL path
   * @param cursor - Cursor for next batch (base64 encoded)
   * @param limit - Items per batch
   * @param query - Additional query parameters to preserve
   * @returns Full URL with query string
   *
   * @example
   * const url = PaginationHelper['buildCursorUrl'](
   *   '/api/v1/messages',
   *   'MTcxNTA2NTUwMA==',
   *   20,
   *   { conversation_id: 'conv_123' }
   * );
   * // Returns: "/api/v1/messages?cursor=MTcxNTA2NTUwMA==&limit=20&conversation_id=conv_123"
   */
  private static buildCursorUrl(
    baseUrl: string,
    cursor: string,
    limit: number,
    query: Record<string, any> = {},
  ): string {
    const params = new URLSearchParams();

    // Add pagination params
    params.append('cursor', cursor);
    params.append('limit', limit.toString());

    // Add custom query params (exclude pagination keys)
    Object.entries(query).forEach(([key, value]) => {
      if (key !== 'cursor' && key !== 'limit' && value !== undefined) {
        params.append(key, String(value));
      }
    });

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Internal: Validate offset pagination parameters
   *
   * @private
   * @param page - Current page number
   * @param limit - Items per page
   * @param total - Total items in database
   * @param itemCount - Items in current response
   * @throws Error if any parameter is invalid
   *
   * @example
   * // Valid parameters
   * PaginationHelper['validateOffsetParams'](1, 10, 100, 10); // OK
   *
   * // Invalid: page < 1
   * PaginationHelper['validateOffsetParams'](0, 10, 100, 10); // Throws
   *
   * // Invalid: limit > 100
   * PaginationHelper['validateOffsetParams'](1, 150, 100, 10); // Throws
   */
  private static validateOffsetParams(
    page: number,
    limit: number,
    total: number,
    itemCount: number,
  ): void {
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('Page must be an integer >= 1');
    }
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error('Limit must be an integer >= 1');
    }
    if (limit > 100) {
      throw new Error(
        'Limit must be <= 100 to prevent excessive data transfer',
      );
    }
    if (total < 0) {
      throw new Error('Total items cannot be negative');
    }
    if (itemCount > limit) {
      throw new Error(`Item count (${itemCount}) exceeds limit (${limit})`);
    }
  }

  /**
   * Internal: Validate cursor pagination parameters
   *
   * @private
   * @param limit - Items per batch
   * @param itemCount - Items in current response
   * @throws Error if any parameter is invalid
   *
   * @example
   * // Valid parameters
   * PaginationHelper['validateCursorParams'](20, 20); // OK
   *
   * // Invalid: limit > 100
   * PaginationHelper['validateCursorParams'](150, 50); // Throws
   *
   * // Invalid: itemCount > limit
   * PaginationHelper['validateCursorParams'](10, 15); // Throws
   */
  private static validateCursorParams(limit: number, itemCount: number): void {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error('Limit must be an integer >= 1');
    }
    if (limit > 100) {
      throw new Error(
        'Limit must be <= 100 to prevent excessive data transfer',
      );
    }
    if (itemCount > limit) {
      throw new Error(`Item count (${itemCount}) exceeds limit (${limit})`);
    }
  }
}
