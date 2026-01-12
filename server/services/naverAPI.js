/**
 * 네이버 지도 API 서비스
 * 지하철/교통망 데이터
 */

'use strict';

const axios = require('axios');

const CLIENT_ID = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT) || 10000;

// 네이버 API 기본 URL
const BASE_URLS = {
    geocode: 'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode',
    directions: 'https://naveropenapi.apigw.ntruss.com/map-direction/v1/driving',
    reverseGeocode: 'https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc'
};

/**
 * 주소를 좌표로 변환 (Geocoding)
 * @param {string} address - 주소 (예: 서울시 강남구 개포동 123)
 * @returns {Promise<Object>} 좌표 정보 {lat, lng}
 */
// 네이버 API 사용 가능 여부 (캐시)
let naverAPIAvailable = true;
let naverAPICheckTime = 0;

async function geocodeAddress(address) {
    try {
        if (!CLIENT_ID || !CLIENT_SECRET) {
            if (naverAPIAvailable) {
                console.log('[Fallback] 네이버 API 키 미설정 - fallback 모드 사용');
                naverAPIAvailable = false;
            }
            return null;
        }

        // 네이버 API가 비활성화 상태면 5분마다만 재시도
        const now = Date.now();
        if (!naverAPIAvailable && (now - naverAPICheckTime) < 300000) {
            return null;
        }

        const response = await axios.get(BASE_URLS.geocode, {
            params: {
                query: address
            },
            headers: {
                'X-NCP-APIGW-API-KEY-ID': CLIENT_ID,
                'X-NCP-APIGW-API-KEY': CLIENT_SECRET
            },
            timeout: API_TIMEOUT
        });

        if (response.data.addresses && response.data.addresses.length > 0) {
            // API 정상 작동
            if (!naverAPIAvailable) {
                console.log('[네이버 API] 서비스 활성화 확인');
                naverAPIAvailable = true;
            }

            const location = response.data.addresses[0];
            return {
                lat: parseFloat(location.y),
                lng: parseFloat(location.x),
                roadAddress: location.roadAddress || '',
                jibunAddress: location.jibunAddress || ''
            };
        }

        return null;

    } catch (error) {
        // 401/403 오류는 서비스 미활성화 - 로그 최소화
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            if (naverAPIAvailable) {
                console.log('[Fallback] 네이버 Maps API 미활성화 - fallback 모드로 전환');
                console.log('          (NAVER_API_SETUP.md 참고하여 활성화 가능)');
                naverAPIAvailable = false;
                naverAPICheckTime = Date.now();
            }
        } else {
            console.error('Geocoding 오류:', error.message);
        }
        return null;
    }
}

/**
 * 두 지점 간 거리 계산 (Haversine 공식)
 * @param {number} lat1 - 위도1
 * @param {number} lon1 - 경도1
 * @param {number} lat2 - 위도2
 * @param {number} lon2 - 경도2
 * @returns {number} 거리 (미터)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 지구 반경 (미터)
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // 미터 단위
}

/**
 * 주요 지하철역 좌표 (서울 주요역)
 */
const MAJOR_STATIONS = {
    '강남역': { lat: 37.4979, lng: 127.0276 },
    '역삼역': { lat: 37.5003, lng: 127.0364 },
    '선릉역': { lat: 37.5045, lng: 127.0493 },
    '삼성역': { lat: 37.5087, lng: 127.0633 },
    '교대역': { lat: 37.4934, lng: 127.0143 },
    '서초역': { lat: 37.4837, lng: 127.0059 },
    '판교역': { lat: 37.3949, lng: 127.1111 },
    '양재역': { lat: 37.4844, lng: 127.0344 },
    '잠실역': { lat: 37.5133, lng: 127.1000 },
    '종로3가역': { lat: 37.5712, lng: 126.9912 }
};

/**
 * 가장 가까운 지하철역 찾기
 * @param {string} address - 주소
 * @returns {Promise<Object>} 가장 가까운 역 정보
 */
async function getNearestStation(address) {
    try {
        // 주소를 좌표로 변환
        const location = await geocodeAddress(address);
        if (!location) {
            return {
                nearestStation: '알 수 없음',
                distance: 999,
                hasData: false
            };
        }

        // 모든 주요역까지의 거리 계산
        let nearestStation = '';
        let minDistance = Infinity;

        for (const [stationName, stationCoord] of Object.entries(MAJOR_STATIONS)) {
            const distance = calculateDistance(
                location.lat,
                location.lng,
                stationCoord.lat,
                stationCoord.lng
            );

            if (distance < minDistance) {
                minDistance = distance;
                nearestStation = stationName;
            }
        }

        return {
            nearestStation: nearestStation,
            distance: Math.round(minDistance), // 미터
            hasData: true,
            coordinates: location
        };

    } catch (error) {
        console.error('가장 가까운 역 찾기 오류:', error);
        return {
            nearestStation: '알 수 없음',
            distance: 999,
            hasData: false
        };
    }
}

/**
 * 직장까지 예상 출퇴근 시간 계산
 * @param {string} homeAddress - 집 주소
 * @param {string} workplaceAddress - 직장 주소
 * @returns {Promise<number>} 출퇴근 시간 (분)
 */
async function getCommuteTime(homeAddress, workplaceAddress) {
    try {
        const homeLocation = await geocodeAddress(homeAddress);
        const workLocation = await geocodeAddress(workplaceAddress);

        if (!homeLocation || !workLocation) {
            return 60; // 기본값 60분
        }

        // 직선 거리 계산
        const distance = calculateDistance(
            homeLocation.lat,
            homeLocation.lng,
            workLocation.lat,
            workLocation.lng
        );

        // 거리 기반 출퇴근 시간 추정 (평균 속도 30km/h)
        const estimatedTime = (distance / 1000) / 30 * 60; // 분

        return Math.round(estimatedTime);

    } catch (error) {
        console.error('출퇴근 시간 계산 오류:', error);
        return 60; // 기본값
    }
}

module.exports = {
    geocodeAddress,
    calculateDistance,
    getNearestStation,
    getCommuteTime
};
