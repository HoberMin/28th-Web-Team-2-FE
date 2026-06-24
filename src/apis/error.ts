// 프론트 API 레이어 공통 에러 (api-patterns: `new Error` 대신 ApiError throw)

export interface FieldError {
  field: string;
  reason: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly errorCode?: string;
  readonly fieldErrors?: FieldError[];

  constructor(
    status: number,
    message: string,
    errorCode?: string,
    fieldErrors?: FieldError[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.fieldErrors = fieldErrors;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
