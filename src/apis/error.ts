// 프론트 API 레이어 공통 에러 (api-patterns: `new Error` 대신 ApiError throw)
export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(status: number, statusText: string, payload?: unknown) {
    super(`API ${status} ${statusText}`);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
