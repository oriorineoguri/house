/**
 * 국토교통부 공공데이터 API 서비스
 */

'use strict';

const axios = require('axios');
const xml2js = require('xml2js');

const API_KEY = process.env.MOLIT_API_KEY;
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT) || 10000;

// API 기본 URL (새로운 엔드포인트)
const BASE_URLS = {
    // 아파트 매매 실거래가
    transaction: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade',
    // 아파트 전월세 실거래가
    rent: 'https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent'
};

/**
 * XML을 JSON으로 변환
 * @param {string} xml - XML 문자열
 * @returns {Promise<Object>} JSON 객체
 */
async function parseXML(xml) {
    const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: true,
        trim: true
    });
    return await parser.parseStringPromise(xml);
}

/**
 * API 응답 검증
 * @param {Object} response - API 응답
 * @throws {Error} API 에러
 */
function validateResponse(response) {
    if (!response || !response.response) {
        throw new Error('잘못된 API 응답 형식');
    }

    const { header, body } = response.response;

    if (!header) {
        throw new Error('API 응답에 헤더가 없습니다.');
    }

    const resultCode = header.resultCode;
    const resultMsg = header.resultMsg;

    // 성공 코드: "00" 또는 "000"
    if (resultCode !== '00' && resultCode !== '000') {
        throw new Error(`API 오류 (코드: ${resultCode}): ${resultMsg}`);
    }

    if (!body || !body.items) {
        return [];
    }

    // items.item이 단일 객체일 경우 배열로 변환
    const items = body.items.item;
    if (!items) {
        return [];
    }
    return Array.isArray(items) ? items : [items];
}

/**
 * 아파트 매매 실거래가 조회
 * @param {string} lawdCd - 법정동코드 (5자리)
 * @param {string} dealYmd - 계약년월 (YYYYMM)
 * @returns {Promise<Array>} 실거래가 목록
 */
async function getApartmentTransaction(lawdCd, dealYmd) {
    try {
        if (!API_KEY) {
            throw new Error('API 키가 설정되지 않았습니다. .env 파일을 확인하세요.');
        }

        const url = BASE_URLS.transaction;
        const params = {
            serviceKey: API_KEY,
            LAWD_CD: lawdCd,
            DEAL_YMD: dealYmd,
            numOfRows: 100,
            pageNo: 1
        };

        console.log(`API 요청: ${url}`);
        console.log(`파라미터:`, params);

        const response = await axios.get(url, {
            params,
            timeout: API_TIMEOUT,
            headers: {
                'Accept': 'application/xml',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const json = await parseXML(response.data);
        const items = validateResponse(json);

        console.log(`API 응답: ${items.length}건의 데이터`);

        return items.map(item => ({
            // 기본 정보
            aptName: item.aptNm || '',
            dong: item.umdNm || '',
            jibun: item.jibun || '',

            // 거래 정보
            dealAmount: parseInt((item.dealAmount || '').replace(/,/g, '').trim()),
            dealYear: item.dealYear || '',
            dealMonth: item.dealMonth || '',
            dealDay: item.dealDay || '',

            // 물건 정보
            buildYear: item.buildYear || '',
            area: parseFloat(item.excluUseAr || 0),
            floor: parseInt(item.floor || 0),

            // 기타
            aptDong: item.aptDong || '',
            dealingGbn: item.dealingGbn || ''
        }));

    } catch (error) {
        console.error('아파트 매매 실거래가 조회 오류:', error);

        if (error.response) {
            console.error('응답 상태:', error.response.status);
            console.error('응답 데이터:', error.response.data);
        }

        throw new Error(`아파트 매매 실거래가 조회 실패: ${error.message}`);
    }
}

/**
 * 아파트 전월세 실거래가 조회
 * @param {string} lawdCd - 법정동코드 (5자리)
 * @param {string} dealYmd - 계약년월 (YYYYMM)
 * @returns {Promise<Array>} 전월세 실거래가 목록
 */
async function getApartmentRent(lawdCd, dealYmd) {
    try {
        if (!API_KEY) {
            throw new Error('API 키가 설정되지 않았습니다.');
        }

        const url = BASE_URLS.rent;
        const params = {
            serviceKey: API_KEY,
            LAWD_CD: lawdCd,
            DEAL_YMD: dealYmd,
            numOfRows: 100,
            pageNo: 1
        };

        const response = await axios.get(url, {
            params,
            timeout: API_TIMEOUT,
            headers: {
                'Accept': 'application/xml',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const json = await parseXML(response.data);
        const items = validateResponse(json);

        return items.map(item => ({
            aptName: item.aptNm || '',
            dong: item.umdNm || '',
            jibun: item.jibun || '',

            // 전월세 정보
            deposit: parseInt((item.deposit || '').replace(/,/g, '').trim()),
            monthlyRent: parseInt((item.monthlyRent || '0').replace(/,/g, '').trim()),
            contractType: item.contractType || '', // 전세 or 월세

            contractYear: item.contractYear || '',
            contractMonth: item.contractMonth || '',
            contractDay: item.contractDay || '',

            buildYear: item.buildYear || '',
            area: parseFloat(item.excluUseAr || 0),
            floor: parseInt(item.floor || 0)
        }));

    } catch (error) {
        console.error('아파트 전월세 조회 오류:', error);
        throw new Error(`아파트 전월세 조회 실패: ${error.message}`);
    }
}

module.exports = {
    getApartmentTransaction,
    getApartmentRent
};
