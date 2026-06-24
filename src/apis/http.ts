import { ApiError } from "@/apis/error";
import type { FieldError } from "@/apis/error";

// 외부 Spring을 직접 호출하는 얇은 fetch 래퍼.
// 백엔드를 상상하지 말고 스펙대로 (backend-api-reference 참조).
// 시크릿 금지: NEXT_PUBLIC_* 만 클라이언트에 노출 (conventions #7).
// 인증/refresh/401 retry/Sentry 로직 금지 (looky는 비회원, 보안스킴 0개).
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

type QueryParams = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: QueryParams;
}

// 백엔드 공통 envelope
interface SuccessEnvelope<T> {
  status: "success";
  message: string;
  payload: T;
}

interface ErrorEnvelopePayload {
  errorCode: string;
  errors?: FieldError[];
}

interface ErrorEnvelope {
  status: "fail";
  message: string;
  payload?: ErrorEnvelopePayload;
}

function buildUrl(path: string, params?: QueryParams): string {
  const base = `${BASE_URL}${path}`;
  if (!params) return base;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      search.append(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, params, headers, ...rest } = options;
  const isFormData = body instanceof FormData;

  const response = await fetch(buildUrl(path, params), {
    ...rest,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (!response.ok) {
    // 에러 본문을 best-effort 파싱
    let errorMessage = `API ${response.status} ${response.statusText}`;
    let errorCode: string | undefined;
    let fieldErrors: FieldError[] | undefined;

    try {
      const errorBody = (await response.json()) as ErrorEnvelope;
      if (errorBody.message) {
        errorMessage = errorBody.message;
      }
      if (errorBody.payload?.errorCode) {
        errorCode = errorBody.payload.errorCode;
      }
      if (errorBody.payload?.errors && errorBody.payload.errors.length > 0) {
        fieldErrors = errorBody.payload.errors;
      }
    } catch {
      // 비-JSON 에러 바디는 무시
    }

    throw new ApiError(response.status, errorMessage, errorCode, fieldErrors);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  // 성공 envelope에서 payload만 추출해 반환
  const envelope = (await response.json()) as SuccessEnvelope<T>;
  return envelope.payload;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    http<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    http<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    http<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    http<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    http<T>(path, { ...options, method: "DELETE" }),
};
