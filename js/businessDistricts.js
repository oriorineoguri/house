/**
 * 주요 업무지구 및 거점 좌표
 */

'use strict';

/**
 * 주요 업무지구 좌표
 */
const BUSINESS_DISTRICTS = {
    // 서울 강남권
    '강남역': { lat: 37.4979, lng: 127.0276, weight: 100 },
    '삼성역': { lat: 37.5087, lng: 127.0633, weight: 95 },
    '역삼역': { lat: 37.5003, lng: 127.0364, weight: 90 },
    '선릉역': { lat: 37.5045, lng: 127.0493, weight: 90 },

    // 서초권
    '서초역': { lat: 37.4837, lng: 127.0059, weight: 85 },
    '교대역': { lat: 37.4934, lng: 127.0143, weight: 85 },
    '양재역': { lat: 37.4844, lng: 127.0344, weight: 80 },

    // 판교
    '판교역': { lat: 37.3949, lng: 127.1111, weight: 90 },
    '판교테크노밸리': { lat: 37.4020, lng: 127.1070, weight: 90 },

    // 동탄
    '동탄역': { lat: 37.2015, lng: 127.0700, weight: 70 },

    // 여의도
    '여의도역': { lat: 37.5214, lng: 126.9245, weight: 90 },
    '여의도공원': { lat: 37.5282, lng: 126.9248, weight: 85 },

    // 마곡
    '마곡나루역': { lat: 37.5615, lng: 126.8245, weight: 85 },
    'LG사이언스파크': { lat: 37.5650, lng: 126.8130, weight: 85 },

    // 송파/잠실
    '잠실역': { lat: 37.5133, lng: 127.1000, weight: 85 },
    '석촌역': { lat: 37.5059, lng: 127.1058, weight: 80 },

    // 기타 주요 지점
    '광화문': { lat: 37.5720, lng: 126.9769, weight: 75 },
    '시청역': { lat: 37.5653, lng: 126.9770, weight: 75 }
};

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
 * 동 이름을 좌표로 변환 (간단한 매핑)
 * @param {string} dong - 동 이름
 * @returns {Object|null} 좌표 {lat, lng} 또는 null
 */
function getDongCoordinates(dong) {
    // 주요 동 좌표 (대략적인 중심 좌표)
    const dongCoordinates = {
        // 강남구
        '대치동': { lat: 37.4947, lng: 127.0626 },
        '개포동': { lat: 37.4787, lng: 127.0466 },
        '도곡동': { lat: 37.4893, lng: 127.0512 },
        '역삼동': { lat: 37.5004, lng: 127.0364 },
        '삼성동': { lat: 37.5087, lng: 127.0633 },
        '논현동': { lat: 37.5107, lng: 127.0275 },
        '압구정동': { lat: 37.5265, lng: 127.0280 },
        '청담동': { lat: 37.5225, lng: 127.0483 },

        // 서초구
        '서초동': { lat: 37.4838, lng: 127.0165 },
        '반포동': { lat: 37.5053, lng: 127.0040 },
        '잠원동': { lat: 37.5144, lng: 127.0120 },
        '방배동': { lat: 37.4790, lng: 126.9937 },

        // 송파구
        '잠실동': { lat: 37.5133, lng: 127.1000 },
        '문정동': { lat: 37.4857, lng: 127.1217 },
        '가락동': { lat: 37.4959, lng: 127.1182 },

        // 강동구
        '천호동': { lat: 37.5387, lng: 127.1238 },
        '둔촌동': { lat: 37.5270, lng: 127.1357 },

        // 분당
        '분당동': { lat: 37.3777, lng: 127.1178 },
        '정자동': { lat: 37.3603, lng: 127.1083 },
        '서현동': { lat: 37.3841, lng: 127.1214 },
        '이매동': { lat: 37.3905, lng: 127.1261 },
        '야탑동': { lat: 37.4112, lng: 127.1280 },
        '수내동': { lat: 37.3835, lng: 127.0964 },

        // 판교
        '판교동': { lat: 37.3949, lng: 127.1111 },
        '삼평동': { lat: 37.4020, lng: 127.1070 },
        '백현동': { lat: 37.3932, lng: 127.1023 },

        // 용인
        '수지구': { lat: 37.3236, lng: 127.0896 },
        '기흥구': { lat: 37.2760, lng: 127.1158 },
        '구미동': { lat: 37.2971, lng: 127.0846 },
        '운중동': { lat: 37.3126, lng: 127.0958 },

        // 화성/수원
        '화성시': { lat: 37.1996, lng: 126.8312 },
        '수원시': { lat: 37.2636, lng: 127.0286 },

        // 과천
        '과천시': { lat: 37.4292, lng: 126.9873 },
        '중앙동': { lat: 37.4331, lng: 126.9885 },
        '별양동': { lat: 37.4280, lng: 126.9790 },
        '부림동': { lat: 37.4370, lng: 126.9930 },

        // 안양
        '안양시': { lat: 37.3943, lng: 126.9568 },
        '평촌동': { lat: 37.3895, lng: 126.9513 },
        '범계동': { lat: 37.3895, lng: 126.9490 },

        // 영등포/마포
        '영등포구': { lat: 37.5264, lng: 126.8962 },
        '여의도동': { lat: 37.5214, lng: 126.9245 },
        '마포구': { lat: 37.5663, lng: 126.9015 },

        // 강서
        '강서구': { lat: 37.5509, lng: 126.8495 },
        '마곡동': { lat: 37.5650, lng: 126.8130 },

        // 화성 동탄
        '반송동': { lat: 37.1970, lng: 127.0755 }, // 동탄1신도시 중심
        '청계동': { lat: 37.2015, lng: 127.0700 }, // 동탄역 인근
        '오산동': { lat: 37.2070, lng: 127.0850 }, // 동탄역 북쪽
        '목동': { lat: 37.1920, lng: 127.0630 }, // 동탄2신도시
        '산척동': { lat: 37.1880, lng: 127.0520 }, // 동탄2신도시
        '능동': { lat: 37.1850, lng: 127.0720 }, // 동탄2신도시 서쪽
        '장지동': { lat: 37.1770, lng: 127.0580 }, // 동탄2신도시 남쪽
        '영천동': { lat: 37.2100, lng: 127.0780 }, // 동탄역 북동쪽
        '기산동': { lat: 37.1820, lng: 127.0680 } // 동탄1신도시 남쪽
    };

    // 정확한 매칭
    if (dongCoordinates[dong]) {
        return dongCoordinates[dong];
    }

    // 부분 매칭
    for (const [key, value] of Object.entries(dongCoordinates)) {
        if (dong.includes(key) || key.includes(dong)) {
            return value;
        }
    }

    return null;
}

/**
 * 단지에서 가장 가까운 주요 업무지구까지의 거리 계산
 * @param {string} dong - 동 이름
 * @returns {Object} {district: 업무지구명, distance: 거리(km), score: 점수}
 */
function getNearestBusinessDistrict(dong) {
    const dongCoord = getDongCoordinates(dong);

    if (!dongCoord) {
        return { district: '알 수 없음', distance: 999, score: 0 };
    }

    let nearestDistrict = '';
    let minDistance = Infinity;
    let weight = 0;

    for (const [districtName, districtData] of Object.entries(BUSINESS_DISTRICTS)) {
        const distance = calculateDistance(
            dongCoord.lat,
            dongCoord.lng,
            districtData.lat,
            districtData.lng
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestDistrict = districtName;
            weight = districtData.weight;
        }
    }

    const distanceKm = minDistance / 1000;

    // 거리에 따른 점수 계산 (가까울수록 높은 점수)
    let score = 0;
    if (distanceKm <= 2) score = weight;
    else if (distanceKm <= 5) score = weight * 0.9;
    else if (distanceKm <= 10) score = weight * 0.8;
    else if (distanceKm <= 15) score = weight * 0.7;
    else if (distanceKm <= 20) score = weight * 0.6;
    else if (distanceKm <= 30) score = weight * 0.5;
    else score = weight * 0.3;

    return {
        district: nearestDistrict,
        distance: distanceKm,
        score: Math.round(score)
    };
}

// Export (browser environment)
if (typeof window !== 'undefined') {
    window.getNearestBusinessDistrict = getNearestBusinessDistrict;
    window.BUSINESS_DISTRICTS = BUSINESS_DISTRICTS;
}
