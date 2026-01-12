/**
 * 통계청 KOSIS API 서비스
 * 공급물량/미분양 데이터
 */

'use strict';

const axios = require('axios');

const API_KEY = process.env.KOSIS_API_KEY;
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT) || 10000;

// KOSIS API 기본 URL
const BASE_URL = 'https://kosis.kr/openapi/Param/statisticsParameterData.do';

/**
 * 미분양 현황 조회
 * @param {string} region - 지역명 (예: 서울)
 * @returns {Promise<Object>} 미분양 데이터
 */
async function getUnsoldData(region = '전국') {
    try {
        if (!API_KEY) {
            console.warn('KOSIS API 키가 설정되지 않았습니다.');
            return {
                unsold: 0,
                hasData: false
            };
        }

        const params = {
            method: 'getList',
            apiKey: API_KEY,
            itmId: '13103871087T1+', // 미분양현황 항목 ID
            objL1: 'ALL', // 전체 지역
            objL2: 'ALL', // 전체 시군구
            objL3: '',
            objL4: '',
            objL5: '',
            objL6: '',
            objL7: '',
            objL8: '',
            format: 'json',
            jsonVD: 'Y',
            prdSe: 'M', // 월별
            newEstPrdCnt: '3', // 최근 3개월
            orgId: '116', // 국토교통부
            tblId: 'DT_MLTM_2082' // 시·군·구별 미분양현황
        };

        console.log('KOSIS API 요청:', params);

        const response = await axios.get(BASE_URL, {
            params,
            timeout: API_TIMEOUT,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        console.log('KOSIS API 응답: 데이터', response.data ? response.data.length + '건' : '없음');

        // 데이터 파싱
        if (response.data && Array.isArray(response.data)) {
            // 지역별 필터링 (C1_NM: 지역명, C2_NM: "계" = 전체 합계)
            const regionData = response.data.find(item =>
                item.C1_NM && item.C1_NM.includes(region) &&
                item.C2_NM === '계' // 전체 합계 데이터
            );

            if (regionData && regionData.DT) {
                const unsoldCount = parseInt(regionData.DT) || 0;
                console.log(`${region} 미분양: ${unsoldCount}호 (${regionData.PRD_DE})`);

                return {
                    unsold: unsoldCount,
                    hasData: true,
                    lastUpdate: regionData.PRD_DE || '',
                    region: regionData.C1_NM
                };
            }
        }

        console.warn(`${region} 미분양 데이터 없음`);
        return {
            unsold: 0,
            hasData: false
        };

    } catch (error) {
        console.error('KOSIS API 오류:', error.message);
        // 에러 발생 시에도 기본값 반환
        return {
            unsold: 0,
            hasData: false,
            error: error.message
        };
    }
}

/**
 * 주택건설착공실적 조회 (아파트만)
 * @param {string} region - 지역명 (예: 서울)
 * @returns {Promise<Object>} 착공실적 데이터
 */
async function getConstructionData(region = '전국') {
    try {
        if (!API_KEY) {
            console.warn('KOSIS API 키가 설정되지 않았습니다.');
            return {
                construction: 0,
                hasData: false
            };
        }

        const params = {
            method: 'getList',
            apiKey: API_KEY,
            itmId: '13103766971T1+', // 착공실적 항목 ID
            objL1: 'ALL', // 전체 구분
            objL2: 'ALL', // 전체 부문
            objL3: 'ALL', // 전체 지역
            objL4: '',
            objL5: '',
            objL6: '',
            objL7: '',
            objL8: '',
            format: 'json',
            jsonVD: 'Y',
            prdSe: 'M', // 월별
            newEstPrdCnt: '3', // 최근 3개월
            orgId: '116', // 국토교통부
            tblId: 'DT_MLTM_5386' // 주택건설 착공실적
        };

        console.log('KOSIS 착공실적 API 호출:', region);

        const response = await axios.get(BASE_URL, {
            params,
            timeout: API_TIMEOUT,
            headers: {
                'User-Agent': 'Mozilla/5.0'
            }
        });

        console.log('KOSIS 착공실적 응답: 데이터', response.data ? response.data.length + '건' : '없음');

        // 데이터 파싱 (아파트만 필터링)
        if (response.data && Array.isArray(response.data)) {
            // C1_NM: "총계" (이 테이블은 이미 아파트만 다룸)
            // C2_NM: "총계" (부문별 총계)
            // C3_NM: 지역명 (서울, 경기 등)
            const constructionData = response.data.filter(item =>
                item.C1_NM === '총계' &&
                item.C2_NM === '총계' &&
                item.C3_NM && item.C3_NM.includes(region)
            );

            if (constructionData.length > 0) {
                // 최근 3개월 합계 계산
                const totalConstruction = constructionData.reduce((sum, item) => {
                    return sum + (parseInt(item.DT) || 0);
                }, 0);

                console.log(`${region} 아파트 착공실적: ${totalConstruction}호 (최근 3개월)`);

                return {
                    construction: totalConstruction,
                    hasData: true,
                    months: constructionData.length,
                    lastUpdate: constructionData[0]?.PRD_DE || '',
                    region: region
                };
            }
        }

        console.warn(`${region} 착공실적 데이터 없음`);
        return {
            construction: 0,
            hasData: false
        };

    } catch (error) {
        console.error('KOSIS 착공실적 API 오류:', error.message);
        return {
            construction: 0,
            hasData: false,
            error: error.message
        };
    }
}

/**
 * 입주 예정 물량 조회 (추정)
 * @param {string} region - 지역명
 * @returns {Promise<number>} 입주 예정 물량
 */
async function getFutureSupply(region) {
    try {
        // KOSIS API로 입주 예정 물량 조회
        // 실제 데이터가 없으면 기본값 반환
        console.warn('입주 예정 물량 API는 아직 구현되지 않았습니다.');

        return 0;
    } catch (error) {
        console.error('입주 물량 조회 오류:', error);
        return 0;
    }
}

module.exports = {
    getUnsoldData,
    getConstructionData,
    getFutureSupply
};
