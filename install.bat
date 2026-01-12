@echo off
echo ========================================
echo  부동산 투자 분석 도구 설치
echo ========================================
echo.

REM Node.js 설치 확인
echo [1/3] Node.js 확인 중...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js가 설치되어 있지 않습니다.
    echo.
    echo Node.js를 설치해주세요: https://nodejs.org/
    echo LTS 버전을 권장합니다.
    pause
    exit /b 1
)
node --version
echo Node.js 설치 확인
echo.

REM npm 설치 확인
echo [2/3] npm 확인 중...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo npm이 설치되어 있지 않습니다.
    pause
    exit /b 1
)
npm --version
echo npm 설치 확인
echo.

REM 의존성 설치
echo [3/3] 필요한 패키지 설치 중...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo 패키지 설치 실패
    pause
    exit /b 1
)

echo.
echo ========================================
echo 설치 완료\!
echo ========================================
echo.
echo 이제 start.bat를 실행하여 서버를 시작하세요.
echo.
pause
