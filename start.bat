@echo off
echo ========================================
echo  부동산 투자 분석 도구 시작
echo ========================================
echo.

REM node_modules 확인
if not exist "node_modules" (
    echo 패키지가 설치되어 있지 않습니다.
    echo.
    echo install.bat를 먼저 실행해주세요.
    echo.
    pause
    exit /b 1
)

echo 서버를 시작합니다...
echo.
echo 서버가 시작되면 브라우저가 자동으로 열립니다.
echo 종료하려면 Ctrl+C를 누르세요.
echo.

REM 3초 후 브라우저 자동 실행
start /B timeout /t 3 /nobreak >nul ^&^& start http://localhost:3000

REM 서버 시작
call npm start
