## 0. 설계 방향

이 API 명세는 결과 산출 알고리즘을 API 밖으로 숨기는 **알고리즘 중립형**으로 작성한다. 내부 구현은 점수 기반, AI 형용사 기반, 혼합 방식 중 무엇으로 바뀌어도 API 계약이 크게 흔들리지 않게 한다.

확정 전제:

- 비회원 서비스로 설계한다.
- `surveyId`는 서버 내부 식별자다. 외부 공유 URL에는 가능하면 노출하지 않는다.
- 공유 링크는 설문마다 1개가 존재하며, 친구 응답 용 링크와 게시자의 응답 용 링크는 같다.
    - 상태 확인 및 결과 조회용 코드는 따로 없다.
    - 상태는 정책 즉, 결과 자동 생성 조건이 만족되어야만 확인이 가능하다.
- 결과는 서버가 자동 생성한다.
    - 결과 자동 생성 조건은 `본인 응답 완료 + 친구 응답 3명 이상 + 설문 생성 후 24시간 경과`다.
    - 스케줄링을 통해 조건이 충족된 survey에 대해서 결과를 자동 생성한다.
- `GET` API는 조회만 수행한다. submission 생성, 결과 생성 같은 상태 변경은 하지 않는다.

## 1. 주요 상태값

### surveyStatus

```
DRAFT       설문 생성 직후 또는 본인 응답 전
COLLECTING  친구 응답 수집 중
CLOSED      결과 생성 조건 충족 후 응답 마감
EXPIRED     정책상 더 이상 진행할 수 없는 설문
```

### submissionStatus

```
IN_PROGRESS  질문 배정 후 제출 전
COMPLETED    답변 제출 완료
```

### submitterType

```
SELF  개설자 본인 응답
PEER  친구 응답
```

### resultStatus

```
WAITING_SELF_RESPONSE      본인 응답 대기
COLLECTING_PEER_RESPONSES  친구 응답 3명 미만
WAITING_RESULT_OPEN_TIME   친구 응답은 충분하지만 24시간 전
GENERATING                 결과 생성 중
READY                      결과 조회 가능
FAILED                     결과 생성 실패
EXPIRED                    결과 생성 불가 상태
```

### quadrant

```
OPEN     나도 알고 친구도 아는 나
BLIND    친구만 아는 나
HIDDEN   나만 아는 나
UNKNOWN  새롭게 발견될 나
```

## 2. API 흐름

```
1. POST /api/v1/surveys
   설문 생성 및 code 발급

2. POST /api/v1/surveys/{surveyCode}/submissions
   개설자 본인 설문 시작 : submission에 self가 없으면 본인설문 시작
   -> 이렇게 되려면 DB에서 submission에 해당 survey에 대한 fk랑 s
elf 제출 이력이 있는지 확인해야함

3. POST /api/v1/surveys/{surveyCode}/submissions
   친구 설문 시작 : submission에 self 가 있으면 peer역할로 설문 시작

4. POST /api/v1/submissions/{submissionId}/answers
   답변 제출

5. GET /api/v1/owner/surveys/{ownerCode}/status
   개설자 상태 조회

6. GET /api/v1/owner/surveys/{ownerCode}/result
   결과 조회
```

## 3. 설문 생성

```
POST /api/v1/surveys
Content-Type: application/json
```

### Request

```json
{
  "userNickname": "만두"
}
```

### Response: 201 Created

```
HTTP/1.1 201 Created
Content-Type: application/json
```

```json
{
  "status": "success",
  "message": "설문이 생성되었습니다.",
  "payload": {
    "surveyId": 1,
    "userNickname": "만두",
    "surveyCode": "shr_b91k2p",
    "surveyStatus": "DRAFT",
    "resultAvailableAt": "2026-06-23T03:00:00+09:00",
    "createdAt": "2026-06-22T03:00:00+09:00"
  }
}
```

우리는 설문 게시자와 참여자의 링크는 다르지 않아서 설문에 대한 링크는 1개만 필요함(설문 : 링크 = 1 : 1)

닉네임 생성 후 개설자의 설문을 초기화하여 저장한다.

### Backend notes

- `surveyCode`는 추측하기 어려운 랜덤 문자열로 생성한다.
- `resultAvailableAt`은 생성 시각 기준 24시간 뒤로 계산한다.
- 이 단계에서는 질문을 배정하지 않는다.

## 4. 본인 설문 시작

```
POST /api/v1/surveys/{surveyCode}/submissions
Content-Type: application/json
```

### Response: 201 Created

```json
{
  "status": "success",
  "message": "자가 설문 응답 정보를 조회했습니다.",
  "payload": {
    "submissionId": 101,
    "submitterType": "SELF",
    "submissionStatus": "IN_PROGRESS",
    "questions": [
      {
        "questionId": 1,
        "sequence": 1,
        "traitCode": "OPENNESS",
        "content": "갑자기 비어 있는 주말이 생겼다. 나는 어떻게 할까?",
        "options": [
          {
            "answerOptionId": 11,
            "sequence": 1,
            "content": "익숙한 일정을 그대로 유지한다."
          },
          {
            "answerOptionId": 12,
            "sequence": 2,
            "content": "가볍게 새로운 장소를 찾아본다."
          },
          {
            "answerOptionId": 13,
            "sequence": 3,
            "content": "그때 기분에 맞춰 정한다."
          },
          {
            "answerOptionId": 14,
            "sequence": 4,
            "content": "안 가본 곳으로 바로 떠난다."
          },
          {
            "answerOptionId": 15,
            "sequence": 5,
            "content": "친구를 모아 즉흥 계획을 만든다."
          }
        ]
      }
    ]
  }
}
```

### Backend notes

- 같은 `ownerCode`로 본인 응답이 이미 완료된 경우 새 submission을 만들지 않는다.
- 질문 수는 현재 정책상 빅파이브 성향별  8개다.
    - 4개의 성향을 2개씩 총 8개의 문항을 랜덤으로 생성한다. (questions테이블에서 trait_code 별로 2개씩 생성)
    - 현재 정책
        
        ### Big Five (빅파이브)
        
        사람의 성격을 다섯 가지 성향으로 보는 방법으로, 심리학에서 가장 널리 쓰이는 성격 측정 틀입니다.
        
        | 성향 | 쉽게 말하면 |  |
        | --- | --- | --- |
        | 개방성 | 새로운 것·모험을 좋아하나 |  |
        | 성실성 | 책임감 있고 꼼꼼한가 |  |
        | 외향성 | 사람들과 어울리는 걸 좋아하나 |  |
        | 우호성 | 남에게 친절하고 잘 맞춰주나 |  |
        | 신경성 | 불안·감정 기복이 큰가 | 제외 |
        
        우리는 신경성을 빼고 4개만 씁니다. 친구가 평가하기 어렵고 민감한 영역이라서입니다.
        
        > **Big Five는 “내재화”만 합니다.** 이 4개 성향은 문항을 설계할 때 “이 질문이 어떤 성향을 건드리나”를 잡아주는 숨은 잣대로만 쓰입니다. 서비스 화면이나 AI 프롬프트에는 Big Five라는 말도, “개방성 3.8” 같은 성향 점수도 전혀 나오지 않습니다. 실제로 돌아가는 틀은 조하리의 창 하나뿐입니다.
        > 
        
        ### 조하리의 창
        
        이건 성격을 재는 게 아니라, “나에 대한 정보를 누가 알고 있는가”를 네 칸으로 나눈 틀입니다. 기준은 둘입니다 — 나는 아는가, 친구는 아는가.
        
        | 칸 | 뜻 |
        | --- | --- |
        | ① 공개된 나 | 나도 알고, 친구도 아는 모습 |
        | ② 친구만 아는 나 | 나는 모르는데, 친구는 아는 모습 |
        | ③ 나만 아는 나 | 나는 아는데, 친구는 모르는 모습 |
        | ④ 새롭게 발견될 나 | 나도 친구도 확실히 모르는 모습 |
        
        ### 한 문장으로 차이
        
        > Big Five는 “이 사람이 어떤 사람인지”(내용)를 보고, 조하리는 “그 모습을 누가 알고 있는지”(인식)를 나눕니다.
        > 
- 질문 배정은 이 API에서만 발생한다.
- 배정된 질문은 서버에 저장한다. 답변 제출 시 서버에 저장된 질문과 매칭 검증한다.

## 5. 친구 설문 시작

```
POST /api/v1/surveys/{surveyCode}/submissions
Content-Type: application/json
```

### Response: 201 Created

```json
{
  "status": "success",
  "message": "설문 응답 정보를 조회했습니다.",
  "payload": {
    "submissionId": 202,
    "submitterType": "PEER",
    "submissionStatus": "IN_PROGRESS",
    "targetNickname": "만두",
    "questions": [
      {
        "questionId": 3,
        "sequence": 1,
        "traitCode": "OPENNESS",
        "content": "이 사람이 갑자기 비어 있는 주말이 생기면 어떻게 할 것 같나요?",
        "options": [
          {
            "answerOptionId": 31,
            "sequence": 1,
            "content": "익숙한 일정을 그대로 유지할 것 같다."
          },
          {
            "answerOptionId": 32,
            "sequence": 2,
            "content": "가볍게 새로운 장소를 찾아볼 것 같다."
          },
          {
            "answerOptionId": 33,
            "sequence": 3,
            "content": "그때 기분에 맞춰 정할 것 같다."
          },
          {
            "answerOptionId": 34,
            "sequence": 4,
            "content": "안 가본 곳으로 바로 떠날 것 같다."
          },
          {
            "answerOptionId": 35,
            "sequence": 5,
            "content": "친구를 모아 즉흥 계획을 만들 것 같다."
          }
        ]
      }
      ... 총 8개의 질문&답변 세트
    }
  ]
}
```

### Backend notes

- 친구 응답자는 로그인하지 않는다.
- 같은 사람이 여러 번 응답하는 것을 MVP에서는 구분하지 않는다.
- 설문이 `CLOSED` 또는 `EXPIRED`인 경우 새 submission을 만들지 않는다.
- 질문 수는 현재 정책상 빅파이브 성향별  8개다.
4개의 성향을 2개씩 총 8개의 문항을 랜덤으로 생성한다. (questions테이블에서 trait_code 별로 2개씩 생성)
- 질문 배정은 이 API에서만 발생한다.
- 배정된 질문은 서버에 저장한다. 답변 제출 시 서버에 저장된 질문과 매칭 검증한다.

## 6. 답변 제출

```
POST /api/v1/submissions/{submissionId}
Content-Type: application/json
```

### Request

```json
{
  "answers": [
    {
      "questionId": 1,
      "answerOptionId": 13
    },
    {
      "questionId": 2,
      "answerOptionId": 24
    }
  ]
}
```

### Response: 200 OK

```json
{
  "status": "success",
  "message": "설문 제출이 완료되었습니다.",
  "payload": {
    "submissionId": 101,
    "submitterType": "SELF",
    "submissionStatus": "COMPLETED",
    "submittedAt": "2026-06-22T03:10:00+09:00"
  }
}
```

### Backend notes

- `answers` 개수는 배정된 질문 수와 같아야 한다.
- 제출 요청의 `questionId`는 해당 submission에 배정된 질문이어야 한다.
- `answerOptionId`는 해당 질문의 선택지여야 한다.
- 이미 `COMPLETED`인 submission에는 다시 제출할 수 없다.
- 본인 응답 완료 후 `surveyStatus`는 `COLLECTING`으로 전환할 수 있다.
- 수정: 처음으로 제출된 설문은 SELF고 나머지는 PEER

## 7. 설문 상태 조회

설문 링크 접근 시 조회 필요

결과 생성 정책 상, 

충족되면 몇명이 했는지랑 결과 api redirect 같은 것이 필요

불충족되면 왜 안되는지 응답 반환

```
GET /api/v1/surveys/{surveyCode}/status
```

### Response: 200 OK - 결과 준비 완료(인원충족 and 24시간돼서 이미지가 생성됨)

```json
{
  "status": "success",
  "message": "설문 결과 조회가 가능한 상태입니다.",
  "payload": {
    "surveyStatus": "CLOSED",
    "resultStatus": "READY",
    "peerSubmissionCount": 5,
    "requiredPeerSubmissionCount": 3,
    "resultAvailableAt": "2026-06-23T03:00:00+09:00",
    "remainingSecondsToResultOpen": 0,
    "resultUrl": "https://looky.com/owner/own_7f3a9c/result"
  }
}
```

### Response: 409 Conflict - 조건 미충족

```json
{
  "status": "fail",
  "message": "조건 미충족되어 결과를 확인할 수 없습니다.",
  "payload": {
    "errorCode": "RESULT_NOT_READY"
  }
}
```

### Backend notes

- 이 API는 상태 조회만 한다.
- 결과 생성 조건을 만족했더라도 이 API 호출에서 결과를 생성하지 않는다.
- 프론트는 `resultStatus`를 기준으로 화면을 분기한다.

## 8. 자동 결과 생성 정책

결과 생성은 서버 백그라운드 작업으로 수행한다.

### 생성 조건

```
selfSubmitted = true
peerSubmissionCount >= 3
now >= resultAvailableAt
resultStatus is not READY or GENERATING
```

### 처리 흐름

```
1. 조건을 만족한 survey 조회
2. resultStatus를 GENERATING으로 변경
3. 제출된 답변을 기반으로 내부 알고리즘 실행
4. 4분면별 키워드, 설명, 이미지 생성
5. resultStatus를 READY로 변경
6. 실패 시 resultStatus를 FAILED로 변경하고 실패 사유 저장
```

### 주의사항

- 자동 생성은 스케줄러, 큐, 이벤트 기반 작업 중 하나로 구현한다.
- 동일 설문에 대해 결과가 중복 생성되지 않도록 락 또는 유니크 제약을 둔다.
- 생성 실패 시 프론트는 상태 조회에서 `FAILED`를 받고 재시도 안내를 보여준다.
- API 명세는 내부 알고리즘이 점수 기반인지 AI 형용사 기반인지 노출하지 않는다.

## 9. 결과 조회

```
GET /api/v1/surveys/{surveyCode}/result
```

### Response: 202 Accepted - 아직 생성 중

```json
{
  "status": "success",
  "message": "결과를 생성하고 있습니다. 잠시 후 다시 확인해주세요.",
  "payload": {
    "resultStatus": "GENERATING"
  }
}
```

### Response: 200 OK - 결과 준비 완료

```json
{
  "status": "success",
  "message": "설문 결과를 조회했습니다.",
  "payload": {
    "resultId": 501,
    "surveyId": 1,
    "userNickname": "만두",
    "mainImageUrl": "https://cdn.example.com/results/life4cut-501.png",
    "quadrants": [
      {
        "quadrant": "OPEN",
        "frameOrder": 1,
        "title": "나도 알고 친구도 아는 나",
        "keywords": ["탐구심", "다정함"],
        "description": "당신과 주변 사람들이 모두 선명하게 인식하는 모습이에요.",
        "imageUrl": "https://cdn.example.com/results/501-open.png",
      },
      {
        "quadrant": "BLIND",
        "frameOrder": 2,
        "title": "친구만 아는 나",
        "keywords": ["대담함"],
        "description": "본인은 잘 모르지만 주변 사람들이 먼저 발견한 모습이에요.",
        "imageUrl": "https://cdn.example.com/results/501-blind.png",
      },
      {
        "quadrant": "HIDDEN",
        "frameOrder": 3,
        "title": "나만 아는 나",
        "keywords": ["신중함"],
        "description": "스스로는 알고 있지만 아직 주변에는 덜 드러난 모습이에요.",
        "imageUrl": "https://cdn.example.com/results/501-hidden.png",
      },
      {
        "quadrant": "UNKNOWN",
        "frameOrder": 4,
        "title": "새롭게 발견될 나",
        "keywords": [],
        "description": "아직 충분히 드러나지 않은 가능성이에요. 다른 친구들에게도 물어보면 이 칸이 채워질 수 있어요.",
        "imageUrl": "https://cdn.example.com/results/unknown-placeholder.png",
      }
    ],
    "createdAt": "2026-06-23T03:05:00+09:00"
  }
}
```

### Backend notes

- `quadrants`는 항상 4개를 반환한다.
- `keywords`는 문자열 배열로 통일한다.
- 화면 노출용 결과에는 내부 점수, raw answer, AI prompt를 포함하지 않는다.

## 10. 공통 에러 응답

에러 응답은 하위 문서 `응답 코드`의 형식을 따른다.

```json
{
  "success": false,
  "errorCode": "ERROR_CODE",
  "message": "사용자에게 보여줄 수 있는 에러 메시지입니다."
}
```

입력값 검증 에러는 `errors` 배열을 포함할 수 있다.

```json
{
  "success": false,
  "errorCode": "VALIDATION_ERROR",
  "message": "요청값이 올바르지 않습니다.",
  "errors": [
    {
      "field": "answers[0].answerOptionId",
      "reason": "해당 질문의 선택지가 아닙니다."
    }
  ]
}
```

## 11. API별 주요 에러 코드

### 설문 생성

```
VALIDATION_ERROR
INTERNAL_SERVER_ERROR
```

### 본인 설문 시작

```
INVALID_OWNER_CODE
SURVEY_NOT_FOUND
SELF_SUBMISSION_ALREADY_COMPLETED
NOT_ENOUGH_ACTIVE_QUESTIONS
```

### 친구 설문 시작

```
INVALID_SHARE_CODE
SURVEY_NOT_FOUND
SURVEY_NOT_COLLECTING
SURVEY_CLOSED
SURVEY_EXPIRED
NOT_ENOUGH_ACTIVE_QUESTIONS
```

### 답변 제출

```
SUBMISSION_NOT_FOUND
SUBMISSION_ALREADY_COMPLETED
INVALID_ANSWER_COUNT
QUESTION_NOT_IN_SUBMISSION
INVALID_ANSWER_OPTION
DUPLICATED_QUESTION
ANSWER_REQUIRED
```

### 상태 조회

```
INVALID_OWNER_CODE
SURVEY_NOT_FOUND
```

### 결과 조회

```
INVALID_OWNER_CODE
SURVEY_NOT_FOUND
RESULT_NOT_READY
RESULT_GENERATION_FAILED
RESULT_NOT_FOUND
```

## 12. 남은 결정 사항

- 질문 수를 MVP에서 8개로 고정할지, 서버 설정값으로 둘지 결정한다.
- 친구 응답을 생성 후 24시간 이후에도 받을 수 있게 할지, 결과 생성 시점에 마감할지 결정한다.
- 결과 생성 실패 시 자동 재시도 횟수와 수동 재시도 API 필요 여부를 결정한다.
- 결과 공유를 개설자 전용으로 둘지, 별도 공개 `resultShareCode`를 만들지 결정한다.