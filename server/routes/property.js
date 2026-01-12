/**
 * 부동산 API 라우트
 */

'use strict';

const express = require('express');
const router = express.Router();
const molitsAPI = require('../services/molitsAPI');
const kosisAPI = require('../services/kosisAPI');
const naverAPI = require('../services/naverAPI');
const cache = require('../utils/cache');

/**
 * GET /api/property/transaction
 * 아파트 매매 실거래가 조회
 *
 * Query Parameters:
 * - lawdCd: 법정동코드 (5자리, 필수)
 * - dealYmd: 계약년월 (YYYYMM, 필수)
 */
router.get('/transaction', async (req, res) => {
    try {
        const { lawdCd, dealYmd } = req.query;

        // 입력값 검증
        if (!lawdCd || !dealYmd) {
            return res.status(400).json({
                error: '필수 파라미터 누락',
                message: 'lawdCd(법정동코드)와 dealYmd(계약년월)는 필수입니다.'
            });
        }

        if (lawdCd.length !== 5) {
            return res.status(400).json({
                error: '잘못된 법정동코드',
                message: '법정동코드는 5자리여야 합니다.'
            });
        }

        if (!/^\d{6}$/.test(dealYmd)) {
            return res.status(400).json({
                error: '잘못된 계약년월',
                message: '계약년월은 YYYYMM 형식(6자리)이어야 합니다.'
            });
        }

        // 캐시 확인
        const cacheKey = `transaction_${lawdCd}_${dealYmd}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            console.log(`캐시 히트: ${cacheKey}`);
            return res.json({
                cached: true,
                data: cachedData
            });
        }

        // API 호출
        console.log(`API 호출: lawdCd=${lawdCd}, dealYmd=${dealYmd}`);
        const data = await molitsAPI.getApartmentTransaction(lawdCd, dealYmd);

        // 캐시 저장
        cache.set(cacheKey, data);

        res.json({
            cached: false,
            data: data
        });

    } catch (error) {
        console.error('아파트 실거래가 조회 실패:', error);
        res.status(500).json({
            error: 'API 호출 실패',
            message: error.message
        });
    }
});

/**
 * GET /api/property/rent
 * 아파트 전월세 실거래가 조회
 *
 * Query Parameters:
 * - lawdCd: 법정동코드 (5자리, 필수)
 * - dealYmd: 계약년월 (YYYYMM, 필수)
 */
router.get('/rent', async (req, res) => {
    try {
        const { lawdCd, dealYmd } = req.query;

        if (!lawdCd || !dealYmd) {
            return res.status(400).json({
                error: '필수 파라미터 누락',
                message: 'lawdCd(법정동코드)와 dealYmd(계약년월)는 필수입니다.'
            });
        }

        // 캐시 확인
        const cacheKey = `rent_${lawdCd}_${dealYmd}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            console.log(`캐시 히트: ${cacheKey}`);
            return res.json({
                cached: true,
                data: cachedData
            });
        }

        // API 호출
        const data = await molitsAPI.getApartmentRent(lawdCd, dealYmd);

        // 캐시 저장
        cache.set(cacheKey, data);

        res.json({
            cached: false,
            data: data
        });

    } catch (error) {
        console.error('아파트 전월세 조회 실패:', error);
        res.status(500).json({
            error: 'API 호출 실패',
            message: error.message
        });
    }
});

/**
 * GET /api/property/search
 * 지역명으로 법정동코드 검색
 *
 * Query Parameters:
 * - region: 지역명 (예: 강남구, 서초구)
 */
router.get('/search', async (req, res) => {
    try {
        const { region } = req.query;

        if (!region) {
            return res.status(400).json({
                error: '필수 파라미터 누락',
                message: 'region(지역명)은 필수입니다.'
            });
        }

        // 법정동코드 매핑 (서울 전 구 + 경기 주요 시)
        const regionCodeMap = {
            // 서울 25개 구
            '강남구': '11680',
            '강동구': '11740',
            '강북구': '11305',
            '강서구': '11500',
            '관악구': '11620',
            '광진구': '11215',
            '구로구': '11530',
            '금천구': '11545',
            '노원구': '11350',
            '도봉구': '11320',
            '동대문구': '11230',
            '동작구': '11590',
            '마포구': '11440',
            '서대문구': '11410',
            '서초구': '11650',
            '성동구': '11200',
            '성북구': '11290',
            '송파구': '11710',
            '양천구': '11470',
            '영등포구': '11560',
            '용산구': '11170',
            '은평구': '11380',
            '종로구': '11110',
            '중구': '11140',
            '중랑구': '11260',

            // 경기도 주요 시
            '수원시': '41110',
            '성남시': '41130',
            '분당구': '41135',
            '수정구': '41131',
            '중원구': '41133',
            '고양시': '41280',
            '용인시': '41460',
            '수지구': '41465',
            '기흥구': '41463',
            '처인구': '41461',
            '부천시': '41190',
            '안산시': '41270',
            '안양시': '41170',
            '만안구': '41171',
            '동안구': '41173',
            '남양주시': '41360',
            '화성시': '41590',
            '평택시': '41220',
            '의정부시': '41150',
            '시흥시': '41390',
            '파주시': '41480',
            '김포시': '41570',
            '광명시': '41210',
            '광주시': '41610',
            '군포시': '41410',
            '오산시': '41370',
            '이천시': '41500',
            '양주시': '41630',
            '안성시': '41550',
            '구리시': '41310',
            '포천시': '41650',
            '의왕시': '41430',
            '하남시': '41450',
            '여주시': '41670',
            '과천시': '41290',

            // 주요 지역/동 별칭
            '판교': '41135',
            '판교동': '41135',
            '삼평동': '41135',
            '백현동': '41135',
            '마곡': '11500',
            '마곡동': '11500',
            '여의도': '11560',
            '목동': '11470',
            '잠실': '11710',
            '강남': '11680',
            '서초': '11650',
            '송파': '11710',
            '화성': '41590',
            '수원': '41110',
            '용인': '41460',
            '과천': '41290',
            '안양': '41170',
            '평택': '41220',
            '군포': '41410',
            '의왕': '41430',
            '하남': '41450',
            '광주': '41610'
        };

        const code = regionCodeMap[region];

        if (!code) {
            return res.status(404).json({
                error: '지역을 찾을 수 없습니다.',
                message: `'${region}'에 대한 법정동코드가 등록되지 않았습니다.`
            });
        }

        res.json({
            region: region,
            lawdCd: code
        });

    } catch (error) {
        console.error('지역 검색 실패:', error);
        res.status(500).json({
            error: '검색 실패',
            message: error.message
        });
    }
});

/**
 * GET /api/property/unsold
 * 미분양 현황 조회 (KOSIS API)
 *
 * Query Parameters:
 * - region: 지역명 (예: 서울, 경기)
 */
router.get('/unsold', async (req, res) => {
    try {
        const { region } = req.query;

        if (!region) {
            return res.status(400).json({
                error: '필수 파라미터 누락',
                message: 'region(지역명)은 필수입니다.'
            });
        }

        // 캐시 확인
        const cacheKey = `unsold_${region}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            console.log(`캐시 히트: ${cacheKey}`);
            return res.json({
                cached: true,
                data: cachedData
            });
        }

        // KOSIS API 호출
        console.log(`KOSIS API 호출: region=${region}`);
        const data = await kosisAPI.getUnsoldData(region);

        // 캐시 저장 (미분양 데이터는 자주 변하지 않으므로 캐시)
        cache.set(cacheKey, data);

        res.json({
            cached: false,
            data: data
        });

    } catch (error) {
        console.error('미분양 데이터 조회 실패:', error);
        res.status(500).json({
            error: 'API 호출 실패',
            message: error.message
        });
    }
});

/**
 * GET /api/property/nearest-station
 * 가장 가까운 지하철역 찾기 (네이버 지도 API)
 *
 * Query Parameters:
 * - address: 주소 (예: 서울시 강남구 개포동)
 */
router.get('/nearest-station', async (req, res) => {
    try {
        const { address } = req.query;

        if (!address) {
            return res.status(400).json({
                error: '필수 파라미터 누락',
                message: 'address(주소)는 필수입니다.'
            });
        }

        // 캐시 확인
        const cacheKey = `station_${address}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            console.log(`캐시 히트: ${cacheKey}`);
            return res.json({
                cached: true,
                data: cachedData
            });
        }

        // 네이버 API 호출
        console.log(`네이버 지도 API 호출: address=${address}`);
        const data = await naverAPI.getNearestStation(address);

        // 캐시 저장
        cache.set(cacheKey, data);

        res.json({
            cached: false,
            data: data
        });

    } catch (error) {
        console.error('지하철역 조회 실패:', error);
        res.status(500).json({
            error: 'API 호출 실패',
            message: error.message
        });
    }
});

/**
 * GET /api/property/commute-time
 * 출퇴근 시간 계산 (네이버 지도 API)
 *
 * Query Parameters:
 * - home: 집 주소
 * - workplace: 직장 주소
 */
router.get('/commute-time', async (req, res) => {
    try {
        const { home, workplace } = req.query;

        if (!home || !workplace) {
            return res.status(400).json({
                error: '필수 파라미터 누락',
                message: 'home(집 주소)과 workplace(직장 주소)는 필수입니다.'
            });
        }

        // 캐시 확인
        const cacheKey = `commute_${home}_${workplace}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            console.log(`캐시 히트: ${cacheKey}`);
            return res.json({
                cached: true,
                data: cachedData
            });
        }

        // 네이버 API 호출
        console.log(`출퇴근 시간 계산: home=${home}, workplace=${workplace}`);
        const commuteTime = await naverAPI.getCommuteTime(home, workplace);

        const data = {
            home: home,
            workplace: workplace,
            estimatedTime: commuteTime
        };

        // 캐시 저장
        cache.set(cacheKey, data);

        res.json({
            cached: false,
            data: data
        });

    } catch (error) {
        console.error('출퇴근 시간 계산 실패:', error);
        res.status(500).json({
            error: 'API 호출 실패',
            message: error.message
        });
    }
});

/**
 * GET /api/property/construction
 * 주택건설착공실적 조회 (KOSIS API, 아파트만)
 *
 * Query Parameters:
 * - region: 지역명 (예: 서울, 경기)
 */
router.get('/construction', async (req, res) => {
    try {
        const { region } = req.query;

        if (!region) {
            return res.status(400).json({
                error: '필수 파라미터 누락',
                message: 'region(지역명)은 필수입니다.'
            });
        }

        // 캐시 확인
        const cacheKey = `construction_${region}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            console.log(`캐시 히트: ${cacheKey}`);
            return res.json({
                cached: true,
                data: cachedData
            });
        }

        // KOSIS API 호출
        console.log(`KOSIS 착공실적 API 호출: region=${region}`);
        const data = await kosisAPI.getConstructionData(region);

        // 캐시 저장
        cache.set(cacheKey, data);

        res.json({
            cached: false,
            data: data
        });

    } catch (error) {
        console.error('착공실적 데이터 조회 실패:', error);
        res.status(500).json({
            error: 'API 호출 실패',
            message: error.message
        });
    }
});

module.exports = router;
