# Property Investment Tool

## 프로젝트 개요
<!-- 여기에 프로젝트가 무엇인지 작성하세요 -->
<!-- 예: 이 프로젝트는 사용자의 자금에 맞는 최적의 부동산 투자 대상을 추천하는 웹 애플리케이션입니다 -->
이 프로젝트는 사용자의 자금에 맞는 최적의 부동산 투자 대상을 추천하는 웹 애플리케이션입니다.
사용자가 자금을 입력하면, 이에 맞게 현재 기준의 부동산 단지 가격을 조사하고, 자금에 맞는 단지 중 투자 가치가 있는 조건에 맞는 단지 리스트를 뽑아내어 유저에게 제공합니다.

**목적**:
내 집 마련 및 투자하기 좋은 아파트를 구매하는데 도움을 주는 것이 프로젝트의 목적입니다.

**주요 기능**:
- 자금 입력 기능
- "나"와 "배우자"의 회사 지역 입력 기능
- 부동산 데이터 분석 기능
- 투자 가치 계산 기능
- 추천 리스트 출력 기능
- API 연동하여 현 기준 아파트 단지 가격 조사 기능
---

## 기술 스택
<!-- 어떤 기술을 사용할지 결정하고 작성하세요 -->

**프론트엔드**:
- HTML5
- CSS3 (반응형 디자인)
- Vanilla JavaScript (ES6+)
- Chart.js (시각화용, 필요 시)

**백엔드**:
- Node.js + Express (API 프록시 서버)
- 또는 Python Flask (개발자 선호도에 따라)
- 초기 개발 단계: 더미 JSON 데이터 사용
- 이후 실제 API 연동

**데이터**:
API 사용
 1. 실거래가/전세가: 국토교통부 공공데이터포털 API
 매매 실거래가 End Point : https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade
 전월세 실거래가 End Point : https://apis.data.go.kr/1613000/RTMSDataSvcAptRent
 인증키 : 809f6dd3985a5e67dfb837341cddb44d9f807844a7eb4a2bf68901501b52e0f4
 2. 공급 물량/미분양: 통계청(KOSIS)
 시·군·구별 미분양현황 : https://kosis.kr/openapi/statisticsBigData.do?method=getList&apiKey=M2UyZmI1Y2MwYzcwOThlOGI5OGE1YzY5M2MyMjIyNjA=&format=xls&userStatsId=aus4826/116/DT_MLTM_2082/3/1/20260112140601&prdSe=M&newEstPrdCnt=3
주택건설 착공실적(공급 물량) : https://kosis.kr/openapi/statisticsBigData.do?method=getList&apiKey=M2UyZmI1Y2MwYzcwOThlOGI5OGE1YzY5M2MyMjIyNjA=&format=xls&userStatsId=aus4826/116/DT_MLTM_5386/3/1/20260112140727&prdSe=M&newEstPrdCnt=3

**개발 전략**:
- Phase 1: 더미 데이터로 UI/UX 및 로직 구현
- Phase 2: 실제 API 연동 (CORS 처리 위해 백엔드 프록시 필요)
- Phase 3: 캐싱 및 최적화
---

## 코딩 컨벤션
<!-- AI가 따라야 할 코딩 스타일을 명시하세요 -->

### 네이밍 규칙
- 변수명: `camelCase` (예: `totalBudget`, `propertyList`)
- 함수명: `camelCase` (예: `calculateROI`, `filterProperties`)
- 상수명: `UPPER_SNAKE_CASE` (예: `MAX_BUDGET`, `MIN_ROI`)
- 클래스명: `PascalCase` (예: `PropertyAnalyzer`)

### 파일 구조
```
property-investment-tool/
├── index.html          # 메인 페이지
├── css/
│   └── style.css      # 스타일시트
├── js/
│   ├── main.js        # 메인 로직
│   ├── calculator.js  # 투자 계산 로직
│   └── data.js        # 데이터 처리
└── data/
    └── properties.json # 부동산 데이터
```

### 코드 스타일
- 들여쓰기: 4 spaces (탭 금지)
- 문자열: 작은따옴표 사용 `'string'`
- 세미콜론: 항상 사용
- 함수: 한 함수당 최대 50줄 이내

---

## 빌드 & 테스트
<!-- 프로젝트를 실행하고 테스트하는 방법 -->

### 개발 서버 실행
```bash
# 방법 1: Python 간단 서버 (추천 - 가장 간단)
python -m http.server 8000

# 방법 2: Node.js Live Server (VS Code 확장)
# Live Server 확장 설치 후 index.html 우클릭 > "Open with Live Server"
```

### 접속
```
브라우저에서 http://localhost:8000 접속
```

### 테스트
```bash
# 수동 테스트 체크리스트:
# 1. 자금 입력 (정상값, 음수, 문자열 등)
# 2. 회사 위치 입력
# 3. 추천 결과 정확성 확인
```

---

## 절대 금지 ❌

### 보안
- API 키를 코드에 직접 하드코딩 금지 (.env 파일 사용)
- .env 파일을 Git에 커밋 금지 (.gitignore에 추가)
- 사용자 입력값을 검증 없이 사용 금지 (XSS 방지)
- 개인 금융 정보를 console.log로 출력 금지
- API 응답 데이터를 그대로 innerHTML에 삽입 금지

### 코드 품질
- `var` 사용 금지 (const/let만 사용)
- `eval()` 사용 금지
- console.log 프로덕션 코드에 남기지 않기
- 전역 변수 남발 금지 (모듈 패턴 사용)

### 데이터
- 실제 부동산 API 키를 코드에 포함 금지
- 더미 데이터에 실존 인물/주소 사용 금지
- 가격 데이터 단위 혼동 금지 (만원/원 명확히)

---

## 필수 사항 ✅

### 코드 작성 시
- [ ] 모든 함수에 JSDoc 주석 작성
- [ ] 에러 핸들링 명시적으로 작성
- [ ] 입력값 검증 필수 (자금 입력 시 음수 체크 등)

### 기능 구현 시
- [ ] ROI(투자수익률) 계산 공식 명확히
- [ ] 필터링 조건 투명하게
- [ ] 결과 정렬 기준 명시

### UI/UX
- [ ] TODO: 여러분이 원하는 UI 가이드 추가

---

## 투자 분석 기준
<!-- AI가 부동산을 분석할 때 사용할 기준을 명시하세요 -->
1. Overview
이 지침은 한국 부동산 시장의 투자 가치를 평가하기 위한 7대 핵심 원칙과 가중치 로직을 정의합니다. AI는 분석 요청을 받을 때 반드시 아래의 프레임워크를 기반으로 점수(Score)를 산출하고 분석 결과를 도출해야 합니다.

2. Core Principles & Weighted Scoring (Total 100%)
[P1] 입지의 희소성: 직주근접 및 교통 (Weight: 30%)
Definition: 고소득 일자리 중심지(강남, 판교, 여의도, 마곡 등)까지의 대중교통 소요 시간.

AI Logic:

강남역 기준 30분 이내(S등급), 45분 이내(A등급), 60분 이내(B등급).

GTX(A/B/C) 신규 노선 및 연장 계획이 있는 지역에 대해 가점(Bonus) 부여.

단순 거리보다 "출퇴근 편의성"에 최고 가점을 부여할 것.

[P2] 공급과 수요의 법칙: 입주 물량 (Weight: 20%)
Definition: 향후 3년간 해당 지역 및 인접 지역의 아파트 입주 예정 물량.

AI Logic:

과잉 공급: 적정 수요(지역 인구의 0.5%)를 초과하는 물량이 3년 내 집중된 경우 감점.

공급 절벽: 2026-2027년 서울처럼 공급이 극도로 적은 지역에 가점.

인근 배후 도시의 공급량까지 합산하여 분석할 것.

[P3] 실거주 수요: 학군 및 인프라 (Weight: 15%)
Definition: 초등학교 접근성(초품아) 및 명문 학원가와의 거리.

AI Logic:

단지 내 초등학교가 있는 '초품아' 단지는 하방 경직성이 강함.

대치동, 목동, 중계동 등 대형 학원가 인근은 전세 수요가 매우 탄탄함.

저출산 시대일수록 '주요 학군지'로의 쏠림 현상을 가치 평가에 반영할 것.

[P4] 시장 신호: 전세가율 및 거래량 (Weight: 10%)
Definition: 매매가 대비 전세가 비율 및 최근 3~6개월 거래량 추이.

AI Logic:

전세가율: 70% 이상일 경우 실거주 가치가 높고 투자금(Gap)이 적어 반등 가능성 높음.

거래량: 가격 변동 전 거래량이 먼저 증가하는 '선행 지표'를 포착할 것.

[P5] 단지 규모와 브랜드 (Weight: 10%)
Definition: 세대수 규모와 1군 건설사 브랜드 여부.

AI Logic:

대단지(1,000세대 이상): 관리비 절감, 우수한 커뮤니티, 높은 환금성으로 인해 '대장주' 역할.

Tier-1 Brands: 래미안, 자이, 힐스테이트, 아크로 등 브랜드 프리미엄 및 선호도 반영.

[P6] 상품성: 신축 프리미엄 및 재건축 잠재력 (Weight: 10%)
Definition: 연식에 따른 주거 쾌적성 또는 미래 지분 가치.

AI Logic:

신축(5년 내): 최신 커뮤니티 및 평면 설계로 인한 높은 선호도(얼죽신 현상).

재건축(30년 이상): 용적률이 낮고 대지지분이 넓은 경우 '미래 자산'으로 평가.

[P7] 심리 지표: 미분양 추이 (Weight: 5%)
Definition: 지역 내 미분양 주택의 증감 추세.

AI Logic:

미분양이 정점(Peak)을 찍고 감소하기 시작하는 지점을 '시장 바닥' 시그널로 인식.

Jeonse Mechanism: AI는 '전세'를 세입자가 집주인에게 제공하는 무이자 대출이자, 매수자가 사용하는 레버리지 수단으로 완벽히 이해해야 함.

Supply Cliff: 2026년 한국 시장은 인허가 감소로 인한 신축 공급 부족이 핵심 변수임을 인지할 것.

### 고려 요소
- [ ] TODO: 가격
- [ ] TODO: 위치
- [ ] TODO: 수익률
- [ ] TODO: 기타...
가격 : 입력된 자금 내외
위치 : 입력된 직장 위치를 고려

### 계산 공식
```javascript
// TODO: ROI 계산 공식 예시
// ROI = (예상 수익 - 투자 비용) / 투자 비용 * 100
```
ROI = (예상 수익 - 투자 비용) / 투자 비용 * 100
---

## 참고 사항
<!-- 추가로 AI에게 알려줄 정보 -->

- 이 프로젝트는 학습용입니다
- 실제 투자 조언이 아닌 시뮬레이션입니다
- TODO: 기타 참고사항 추가
