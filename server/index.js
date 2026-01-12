/**
 * 부동산 투자 분석 대시보드 - Express 백엔드 서버
 */

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const propertyRoutes = require('./routes/property');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 로깅 미들웨어
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// API Routes
app.use('/api/property', propertyRoutes);

// 정적 파일 서빙 (프로젝트 루트 디렉토리)
app.use(express.static(path.join(__dirname, '..')));

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
    console.error('서버 에러:', err);
    res.status(500).json({
        error: '서버 내부 오류가 발생했습니다.',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 핸들러
app.use((req, res) => {
    res.status(404).json({
        error: '요청한 리소스를 찾을 수 없습니다.'
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🏢 부동산 투자 분석 서버 시작`);
    console.log(`========================================`);
    console.log(`포트: ${PORT}`);
    console.log(`환경: ${process.env.NODE_ENV || 'development'}`);
    console.log(`웹 접속: http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api/property`);
    console.log(`========================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM 신호 수신, 서버 종료 중...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT 신호 수신, 서버 종료 중...');
    process.exit(0);
});
