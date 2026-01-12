# Property Investment Tool

부동산 투자 분석 웹 애플리케이션

## 🚀 빠른 시작 (초간단!)

### Windows 사용자

1. **프로젝트 다운로드**
   ```bash
   git clone https://github.com/oriorineoguri/house.git
   cd house
   ```

2. **Node.js 설치** (아직 설치 안 한 경우)
   - [Node.js 다운로드](https://nodejs.org/) - LTS 버전 권장

3. **설치 및 실행**
   - `install.bat` 더블클릭 (처음 한 번만)
   - `start.bat` 더블클릭 (실행할 때마다)
   - 브라우저가 자동으로 열립니다! 🎉

### Mac / Linux 사용자

1. **프로젝트 다운로드**
   ```bash
   git clone https://github.com/oriorineoguri/house.git
   cd house
   ```

2. **Node.js 설치** (아직 설치 안 한 경우)
   - [Node.js 다운로드](https://nodejs.org/) - LTS 버전 권장

3. **설치 및 실행**
   ```bash
   chmod +x install.sh start.sh  # 실행 권한 부여 (처음 한 번만)
   ./install.sh                   # 설치 (처음 한 번만)
   ./start.sh                     # 실행
   ```

4. **브라우저에서 접속**
   ```
   http://localhost:3000
   ```

---

## 📖 수동 실행 방법

스크립트를 사용하지 않고 직접 실행하려면:

```bash
# 1. 의존성 설치 (처음 한 번만)
npm install

# 2. 서버 실행
npm start

# 3. 브라우저에서 http://localhost:3000 접속
```

**주의:** Python은 더 이상 필요하지 않습니다!

---

## ✨ 주요 기능

- 자금 및 직장 위치 입력
- 배우자 직장 고려한 중간지점 검색
- **8가지 투자 기준**으로 부동산 분석
  - 📍 입지 (30%)
  - 🏢 세대수 (15%)
  - 📊 공급 (15%)
  - 🎓 학군 (10%)
  - 📈 시장 (10%)
  - 🏗️ 브랜드 (10%)
  - 🏠 상품성 (10%)
  - 🧠 심리지표 (5%)
- TOP 10 추천 단지 제공

---

## 🛠️ 기술 스택

- **프론트엔드**: HTML5, CSS3, Vanilla JavaScript
- **백엔드**: Node.js, Express
- **API**: 국토교통부 공공데이터 API, 통계청 KOSIS API

---

## 🔧 문제 해결

### 포트가 이미 사용 중인 경우

**Windows:**
```bash
# 3000 포트 사용 프로세스 종료
netstat -ano | findstr :3000
taskkill /F /PID [PID번호]
```

**Mac/Linux:**
```bash
# 3000 포트 사용 프로세스 종료
lsof -ti:3000 | xargs kill -9
```

### Node.js가 설치되어 있는지 확인

```bash
node --version
npm --version
```

---

## 📁 프로젝트 구조

```
property-investment-tool/
├── index.html          # 메인 페이지
├── install.bat         # Windows 설치 스크립트
├── start.bat           # Windows 실행 스크립트
├── install.sh          # Mac/Linux 설치 스크립트
├── start.sh            # Mac/Linux 실행 스크립트
├── css/
│   └── style.css       # 스타일시트
├── js/
│   ├── main.js         # 메인 로직
│   ├── recommendation.js  # 점수 계산 로직
│   ├── api.js          # API 호출
│   └── businessDistricts.js  # 지역 데이터
├── server/
│   ├── index.js        # Express 서버
│   ├── routes/         # API 라우트
│   └── services/       # 외부 API 연동
├── package.json        # Node.js 의존성
└── CLAUDE.md          # 프로젝트 설계 문서
```

---

## 📝 라이선스

MIT License
