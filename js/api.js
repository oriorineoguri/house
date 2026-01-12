/**
 * 백엔드 API 통신 모듈
 */

'use strict';

// 상대 경로 사용 (같은 서버에서 정적 파일과 API를 함께 제공)
const API_BASE_URL = '/api';

/**
 * API 요청 헬퍼
 * @param {string} endpoint - API 엔드포인트
 * @param {Object} params - 쿼리 파라미터
 * @returns {Promise<Object>} API 응답
 */
async function apiRequest(endpoint, params = {}) {
    try {
        // 쿼리 파라미터 생성
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                queryParams.append(key, params[key]);
            }
        });

        const queryString = queryParams.toString();
        const url = `${API_BASE_URL}${endpoint}${queryString ? '?' + queryString : ''}`;

        console.log(`API 요청: ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error('API 요청 실패:', error);
        throw error;
    }
}

/**
 * 아파트 매매 실거래가 조회
 * @param {string} lawdCd - 법정동코드 (5자리)
 * @param {string} dealYmd - 계약년월 (YYYYMM)
 * @returns {Promise<Array>} 실거래가 목록
 */
async function getApartmentTransaction(lawdCd, dealYmd) {
    const response = await apiRequest('/property/transaction', {
        lawdCd,
        dealYmd
    });
    return response.data;
}

/**
 * 아파트 전월세 실거래가 조회
 * @param {string} lawdCd - 법정동코드 (5자리)
 * @param {string} dealYmd - 계약년월 (YYYYMM)
 * @returns {Promise<Array>} 전월세 목록
 */
async function getApartmentRent(lawdCd, dealYmd) {
    const response = await apiRequest('/property/rent', {
        lawdCd,
        dealYmd
    });
    return response.data;
}

/**
 * 지역명으로 법정동코드 검색
 * @param {string} region - 지역명
 * @returns {Promise<Object>} 법정동코드 정보
 */
async function searchRegionCode(region) {
    const response = await apiRequest('/property/search', {
        region
    });
    return response;
}

/**
 * 특정 지역의 최근 실거래가 데이터 조회
 * @param {string} region - 지역명 (예: 강남구)
 * @param {number} months - 조회할 개월 수 (기본 3개월)
 * @returns {Promise<Array>} 실거래가 데이터
 */
async function getRegionTransactionHistory(region, months = 3) {
    try {
        // 1. 지역명으로 법정동코드 조회
        const regionData = await searchRegionCode(region);
        const lawdCd = regionData.lawdCd;

        // 2. 최근 N개월 데이터 조회
        const today = new Date();
        const promises = [];

        for (let i = 0; i < months; i++) {
            const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const dealYmd = `${targetDate.getFullYear()}${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

            promises.push(
                getApartmentTransaction(lawdCd, dealYmd)
                    .catch(err => {
                        console.warn(`${dealYmd} 데이터 조회 실패:`, err.message);
                        return [];
                    })
            );
        }

        const results = await Promise.all(promises);

        // 3. 모든 데이터 병합
        const allTransactions = results.flat();

        console.log(`${region} 최근 ${months}개월 실거래가: ${allTransactions.length}건`);

        return allTransactions;

    } catch (error) {
        console.error('지역 실거래가 조회 실패:', error);
        throw error;
    }
}

/**
 * 지역별 전월세 실거래가 조회 (최근 N개월)
 * @param {string} region - 지역명 (예: 강남구, 서초구)
 * @param {number} months - 조회할 개월 수 (기본 3개월)
 * @returns {Promise<Array>} 전월세 거래 목록
 */
async function getRegionRentHistory(region, months = 3) {
    try {
        // 1. 지역명으로 법정동코드 조회
        const regionData = await searchRegionCode(region);
        const lawdCd = regionData.lawdCd;

        // 2. 최근 N개월 데이터 조회
        const today = new Date();
        const promises = [];

        for (let i = 0; i < months; i++) {
            const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const dealYmd = `${targetDate.getFullYear()}${String(targetDate.getMonth() + 1).padStart(2, '0')}`;

            promises.push(
                getApartmentRent(lawdCd, dealYmd)
                    .catch(err => {
                        console.warn(`${dealYmd} 전월세 데이터 조회 실패:`, err.message);
                        return [];
                    })
            );
        }

        const results = await Promise.all(promises);

        // 3. 모든 데이터 병합
        const allRents = results.flat();

        console.log(`${region} 최근 ${months}개월 전월세: ${allRents.length}건`);

        return allRents;

    } catch (error) {
        console.error('지역 전월세 조회 실패:', error);
        throw error;
    }
}

/**
 * 아파트 평균 가격 계산
 * @param {Array} transactions - 실거래가 목록
 * @param {string} aptName - 아파트명 (선택)
 * @returns {Object} 평균 가격 정보
 */
function calculateAveragePrice(transactions, aptName = null) {
    let filtered = transactions;

    // 특정 아파트로 필터링
    if (aptName) {
        filtered = transactions.filter(t => t.aptName.includes(aptName));
    }

    if (filtered.length === 0) {
        return {
            count: 0,
            average: 0,
            min: 0,
            max: 0
        };
    }

    const prices = filtered.map(t => t.dealAmount);
    const sum = prices.reduce((a, b) => a + b, 0);
    const average = Math.round(sum / prices.length);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return {
        count: filtered.length,
        average: average,
        min: min,
        max: max
    };
}

/**
 * 실거래가 데이터에서 전세가율 추정
 * (실제로는 전월세 API와 조합해야 정확함)
 * @param {number} salePrice - 매매가 (만원)
 * @param {number} rentPrice - 전세가 (만원)
 * @returns {number} 전세가율 (%)
 */
function calculateJeonseRatio(salePrice, rentPrice) {
    if (!salePrice || salePrice === 0) return 0;
    return Math.round((rentPrice / salePrice) * 100 * 10) / 10;
}

/**
 * 미분양 현황 조회 (KOSIS API)
 * @param {string} region - 지역명 (예: 서울, 경기)
 * @returns {Promise<Object>} 미분양 데이터
 */
async function getUnsoldData(region) {
    try {
        const response = await apiRequest('/property/unsold', { region });
        return response.data;
    } catch (error) {
        console.warn('미분양 데이터 조회 실패:', error.message);
        return { unsold: 0, hasData: false };
    }
}

/**
 * 가장 가까운 지하철역 찾기 (네이버 지도 API)
 * @param {string} address - 주소 (예: 서울시 강남구 개포동)
 * @returns {Promise<Object>} 지하철역 정보
 */
async function getNearestStation(address) {
    try {
        const response = await apiRequest('/property/nearest-station', { address });
        return response.data;
    } catch (error) {
        console.warn('지하철역 조회 실패:', error.message);
        return { nearestStation: '알 수 없음', distance: 999, hasData: false };
    }
}

/**
 * 출퇴근 시간 계산 (네이버 지도 API)
 * @param {string} home - 집 주소
 * @param {string} workplace - 직장 주소
 * @returns {Promise<number>} 출퇴근 시간 (분)
 */
async function getCommuteTime(home, workplace) {
    try {
        const response = await apiRequest('/property/commute-time', { home, workplace });
        return response.data.estimatedTime;
    } catch (error) {
        console.warn('출퇴근 시간 계산 실패:', error.message);
        return 60; // 기본값 60분
    }
}

/**
 * 주택건설착공실적 조회 (KOSIS API, 아파트만)
 * @param {string} region - 지역명 (예: 서울, 경기)
 * @returns {Promise<Object>} 착공실적 데이터
 */
async function getConstructionData(region) {
    try {
        const response = await apiRequest('/property/construction', { region });
        return response.data;
    } catch (error) {
        console.warn('착공실적 데이터 조회 실패:', error.message);
        return { construction: 0, hasData: false };
    }
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getApartmentTransaction,
        getApartmentRent,
        searchRegionCode,
        getRegionTransactionHistory,
        calculateAveragePrice,
        calculateJeonseRatio,
        getUnsoldData,
        getNearestStation,
        getCommuteTime,
        getConstructionData
    };
}
