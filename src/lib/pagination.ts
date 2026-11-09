import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(10000).optional(),
  search: z.string().max(200).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

/**
 * Universal pagination parser enforcing minimums and maximum caps (max limit 100)
 * to prevent database memory exhaustion or unbounded queries.
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaultLimit = 20,
  maxLimit = 100
): { page: number; limit: number; skip: number; take: number } {
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawLimit = parseInt(searchParams.get('limit') || String(defaultLimit), 10);
  const rawOffset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : undefined;

  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = isNaN(rawLimit) || rawLimit < 1 ? defaultLimit : Math.min(rawLimit, maxLimit);
  const skip = rawOffset !== undefined && !isNaN(rawOffset) && rawOffset >= 0 ? rawOffset : (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    take: limit,
  };
}

