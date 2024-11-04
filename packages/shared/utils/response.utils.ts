export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface ResponsePayload {
  status: 'success' | 'fail' | 'error';
  data: {
    message: string;
    payload: any;
    pagination?: PaginationMeta;
  } | null;
  error: { message: string; details?: any } | null;
  meta: Record<string, any>;
  version: number;
}

export function createResponse(
  status: 'success' | 'fail' | 'error',
  message: string,
  payload: any = null,
  error: { message: string; details?: any } | null = null,
  meta: Record<string, any> = {},
  version: number = 1,
  pagination?: PaginationMeta
): ResponsePayload {
  return {
    status,
    data: status === 'success' ? { message, payload, pagination } : null,
    error: error !== null ? error : status !== 'success' ? { message: message } : null,
    meta,
    version,
  };
}