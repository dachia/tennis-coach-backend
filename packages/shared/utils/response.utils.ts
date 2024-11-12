export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface ResponsePayload<T = any> {
  status: 'success' | 'fail' | 'error';
  data: {
    message: string;
    payload: T;
    pagination?: PaginationMeta;
  } | null;
  error: { message: string; details?: any } | null;
  meta: Record<string, any>;
  version: number;
}

export function createResponse<T = any>(
  status: 'success' | 'fail' | 'error',
  message: string,
  payload: T | null = null,
  error: { message: string; details?: any } | null = null,
  meta: Record<string, any> = {},
  version: number = 1,
  pagination?: PaginationMeta
): ResponsePayload<T> {
  return {
    status,
    data: status === 'success' ? { message, payload: payload as T, pagination } : null,
    error: error !== null ? error : status !== 'success' ? { message: message } : null,
    meta,
    version,
  };
}