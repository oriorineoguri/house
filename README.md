# Property Investment Tool

부동산 투자 분석 웹 애플리케이션

## 다른 PC에서 실행하는 방법

### 1. 프로젝트 클론

```bash
git clone https://github.com/oriorineoguri/house.git
cd house
```

### 2. 필수 프로그램 설치

**Node.js** (API 서버용)
- [Node.js 다운로드](https://nodejs.org/) (LTS 버전 권장)
- 설치 확인: `node --version`

**Python** (프론트엔드 서버용)
- [Python 다운로드](https://www.python.org/downloads/) (3.7 이상)
- 설치 확인: `python --version`

### 3. 의존성 설치

```bash
npm install
```

### 4. 서버 실행

**터미널 1: API 서버 (Node.js)**
```bash
npm start
```
→ http://localhost:3000 에서 실행됨

**터미널 2: 프론트엔드 서버 (Python)**
```bash
python -m http.server 8000
```
→ http://localhost:8000 에서 실행됨

### 5. 브라우저에서 접속

```
http://localhost:8000
```

## 주요 기능

- 자금 및 직장 위치 입력
- 8가지 투자 기준으로 부동산 분석
  - 입지 (30%)
  - 세대수 (15%)
  - 공급 (15%)
  - 학군 (10%)
  - 시장 (10%)
  - 브랜드 (10%)
  - 상품성 (10%)
  - 심리지표 (5%)
- TOP 10 추천 단지 제공

## 기술 스택

- **프론트엔드**: HTML5, CSS3, Vanilla JavaScript
- **백엔드**: Node.js, Express
- **API**: 국토교통부 공공데이터 API, 통계청 KOSIS API

## 문제 해결

### 포트가 이미 사용 중인 경우

**Windows:**
```bash
# 3000 포트 사용 프로세스 종료
netstat -ano | findstr :3000
taskkill /F /PID [PID번호]

# 8000 포트 사용 프로세스 종료
netstat -ano | findstr :8000
taskkill /F /PID [PID번호]
```

**Mac/Linux:**
```bash
# 3000 포트 사용 프로세스 종료
lsof -ti:3000 | xargs kill -9

# 8000 포트 사용 프로세스 종료
lsof -ti:8000 | xargs kill -9
```

## 프로젝트 구조

```
property-investment-tool/
├── index.html          # 메인 페이지
├── css/
│   └── style.css      # 스타일시트
├── js/
│   ├── main.js        # 메인 로직
│   ├── recommendation.js  # 점수 계산 로직
│   ├── api.js         # API 호출
│   └── businessDistricts.js  # 지역 데이터
├── server.js          # Node.js API 서버
├── package.json       # Node.js 의존성
└── CLAUDE.md         # 프로젝트 설계 문서
```

## 라이선스

MIT License
