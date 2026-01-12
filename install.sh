#!/bin/bash

echo "========================================"
echo " 부동산 투자 분석 도구 설치"
echo "========================================"
echo ""

# Node.js 설치 확인
echo "[1/3] Node.js 확인 중..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo ""
    echo "Node.js를 설치해주세요: https://nodejs.org/"
    echo "LTS 버전을 권장합니다."
    exit 1
fi
node --version
echo "✅ Node.js 설치 확인"
echo ""

# npm 설치 확인
echo "[2/3] npm 확인 중..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm이 설치되어 있지 않습니다."
    exit 1
fi
npm --version
echo "✅ npm 설치 확인"
echo ""

# 의존성 설치
echo "[3/3] 필요한 패키지 설치 중..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ 패키지 설치 실패"
    exit 1
fi

echo ""
echo "========================================"
echo "✅ 설치 완료!"
echo "========================================"
echo ""
echo "이제 ./start.sh를 실행하여 서버를 시작하세요."
echo ""
