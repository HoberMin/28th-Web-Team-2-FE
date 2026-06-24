// queryKey 팩토리 — 인라인 배열 사용 금지, 이 파일에서만 정의
export const surveyKeys = {
  all: ["survey"] as const,
  status: (surveyCode: string) =>
    [...surveyKeys.all, "status", surveyCode] as const,
  result: (surveyCode: string) =>
    [...surveyKeys.all, "result", surveyCode] as const,
} as const;
