#!/usr/bin/env bash
# .claude/skills → .agents/skills 동기화
#
# 왜 필요한가:
#   Claude Code는 .claude/skills/, Codex는 .agents/skills/ 를 읽는다.
#   SKILL.md 포맷은 두 도구가 동일하므로 내용은 같아야 하는데, 지금까지
#   손으로 복사해 왔다. 한쪽만 고치면 조용히 갈라진다(drift).
#
# 진실 소스: .claude/skills/  ← 여기만 편집한다.
#
# 사용법:
#   pnpm sync:skills          동기화 실행
#   pnpm sync:skills --check  갈라졌는지 검사만 (CI용, 다르면 exit 1)

set -euo pipefail

cd "$(dirname "$0")/.."

SRC=".claude/skills"
DST=".agents/skills"

if [[ ! -d "$SRC" ]]; then
  echo "✗ 진실 소스가 없다: $SRC" >&2
  exit 1
fi

if [[ "${1:-}" == "--check" ]]; then
  if diff -rq "$SRC" "$DST" > /dev/null 2>&1; then
    echo "✓ 스킬 동기화 상태 정상 ($SRC == $DST)"
    exit 0
  fi
  echo "✗ 스킬이 갈라졌다. 아래 차이를 확인하고 'pnpm sync:skills' 를 실행할 것." >&2
  diff -rq "$SRC" "$DST" >&2 || true
  exit 1
fi

rm -rf "$DST"
mkdir -p "$(dirname "$DST")"
cp -R "$SRC" "$DST"

echo "✓ $SRC → $DST 동기화 완료 ($(find "$DST" -name SKILL.md | wc -l | tr -d ' ')개 스킬)"
