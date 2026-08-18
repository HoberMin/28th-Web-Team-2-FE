"use client";

import { useState } from "react";

import { Textfield } from "@/components/ui/textfield";
import { TextfieldSet } from "@/components/ui/textfield-set";

import { Section, SpecNote, SpecRow } from "./spec";

// 폼. 규칙은 1열(product-spec: 닉네임 설정 = 폼 1열, 모바일 퍼스트).
// TextfieldSet 은 label htmlFor·aria-describedby·aria-invalid 를 자동으로 묶어준다
// → 접근성 배선을 화면마다 손으로 하지 않게 하려고 만든 래퍼다.

const NICKNAME_MAX = 10;

export function FormSection() {
  const [value, setValue] = useState("");
  const tooLong = value.length > NICKNAME_MAX;

  return (
    <Section
      id="form"
      title="폼"
      description="1열 고정. 라벨·설명·에러 배선은 TextfieldSet 이 담당한다."
    >
      <SpecRow name="Textfield" usage="라벨 없이 단독으로 쓸 때. 높이 60px">
        <Textfield placeholder="김루키" aria-label="닉네임" />
      </SpecRow>

      <SpecRow name="Textfield · disabled">
        <Textfield placeholder="입력할 수 없어요" disabled aria-label="비활성 예시" />
      </SpecRow>

      <SpecRow
        name="TextfieldSet"
        usage="라벨 + 입력 + 설명/에러 한 묶음. 대부분 이걸 쓴다"
      >
        <TextfieldSet
          label="닉네임"
          inputProps={{ placeholder: "김루키" }}
        />
      </SpecRow>

      <SpecRow
        name="TextfieldSet · 에러"
        usage="isError 로 aria-invalid 전달 + red-300 테두리·설명"
      >
        <TextfieldSet
          label="닉네임"
          description={`${NICKNAME_MAX}자 이하로 입력해주세요`}
          isError
          inputProps={{ placeholder: "김루키", defaultValue: "너무나긴닉네임입니다" }}
        />
      </SpecRow>

      <SpecRow
        name="TextfieldSet · 실시간 검증"
        usage="입력해보면 길이 초과 시 에러로 바뀐다"
      >
        <TextfieldSet
          label="닉네임"
          description={tooLong ? `${NICKNAME_MAX}자 이하로 입력해주세요` : undefined}
          isError={tooLong}
          inputProps={{
            placeholder: "김루키",
            value,
            onChange: (e) => setValue(e.target.value),
          }}
        />
      </SpecRow>

      <SpecNote>
        닉네임 길이·금칙어 규칙은 아직 미정입니다 (product-spec #2 TODO). 여기
        {NICKNAME_MAX}자는 동작 예시용 임시값입니다.
      </SpecNote>
    </Section>
  );
}
