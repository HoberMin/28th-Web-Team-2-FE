// 날짜 표기 유틸 (표시 전용 · 계산 로직 아님)

/**
 * ISO 문자열 → `"YYYY. MM. DD"` (Figma 4cuts 캡션 날짜 규격).
 * 파싱 불가한 값은 빈 문자열 — 호출부에서 캡션 자체를 생략하는 데 쓴다.
 */
export function formatResultDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${day}`;
}
