#!/bin/bash

echo "========================================"
echo " 부동산 투자 분석 도구 시작"
echo "========================================"
echo ""

# node_modules 확인
if [ ! -d "node_modules" ]; then
    echo "❌ 패키지가 설치되어 있지 않습니다."
    echo ""
    echo "./install.sh를 먼저 실행해주세요."
    echo ""
    exit 1
fi

echo "🚀 서버를 시작합니다..."
echo ""
echo "서버가 시작되면 브라우저를 열어 http://localhost:3000 에 접속하세요."
echo "종료하려면 Ctrl+C를 누르세요."
echo ""

# 서버 시작
npm start
