/**
 * 추천 단지 생성 로직
 */

'use strict';

/**
 * 거래 데이터를 단지별로 그룹화
 * @param {Array} transactions - 실거래가 데이터
 * @returns {Array} 단지별 그룹화된 데이터
 */
function groupTransactionsByApartment(transactions) {
    const grouped = {};

    transactions.forEach(t => {
        const key = t.aptName;
        if (!grouped[key]) {
            grouped[key] = {
                aptName: key,
                dong: t.dong,
                jibun: t.jibun,
                buildYear: t.buildYear,
                transactions: [],
                avgPrice: 0,
                avgArea: 0,
                minPrice: Infinity,
                maxPrice: 0
            };
        }

        grouped[key].transactions.push(t);
        grouped[key].minPrice = Math.min(grouped[key].minPrice, t.dealAmount);
        grouped[key].maxPrice = Math.max(grouped[key].maxPrice, t.dealAmount);
    });

    // 평균 계산
    Object.values(grouped).forEach(apt => {
        const prices = apt.transactions.map(t => t.dealAmount);
        const areas = apt.transactions.map(t => t.area);

        apt.avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        apt.avgArea = Math.round(areas.reduce((a, b) => a + b, 0) / areas.length * 10) / 10;
        apt.transactionCount = apt.transactions.length;
    });

    return Object.values(grouped);
}

/**
 * 예산 범위 내 단지 필터링 (±10%, 없으면 예산 이하)
 * @param {Array} properties - 단지 목록
 * @param {number} budget - 예산 (만원)
 * @returns {Array} 필터링된 단지 목록
 */
function filterByBudgetRange(properties, budget, tolerance = 0.1) {
    const minPrice = budget * (1 - tolerance);
    const maxPrice = budget * (1 + tolerance);

    console.log(`💰 예산: ${budget.toLocaleString()}만원`);
    console.log(`   우선 검색: ${minPrice.toLocaleString()}~${maxPrice.toLocaleString()}만원 (±10%)`);

    // 1차: ±10% 범위 내 검색
    let filtered = properties.filter(prop =>
        prop.avgPrice >= minPrice && prop.avgPrice <= maxPrice
    );

    // 2차: ±10% 범위에 결과가 없으면 예산 이하 포함
    if (filtered.length === 0) {
        console.log(`   ⚠️ ±10% 범위 내 아파트 없음, 예산 이하 포함하여 재검색`);
        filtered = properties.filter(prop => prop.avgPrice <= budget);
        console.log(`   확장 검색: ~${budget.toLocaleString()}만원 (예산 이하)`);
    }

    console.log(`   필터 결과: ${filtered.length}개 단지`);

    return filtered;
}

/**
 * 대단지 필터링 (500세대 이상 추정)
 * @param {Array} properties - 단지 목록
 * @returns {Array} 필터링된 단지 목록
 */
function filterLargeComplexes(properties) {
    // 세대수 정보가 없으므로 거래량으로 추정
    // 500세대 이상 대단지는 최근 3개월간 거래가 5건 이상일 것으로 추정
    const MIN_TRANSACTIONS = 5;

    console.log(`🏘️ 대단지 필터링: 최근 3개월 거래 ${MIN_TRANSACTIONS}건 이상 (500세대 이상 추정)`);

    const filtered = properties.filter(prop => prop.transactionCount >= MIN_TRANSACTIONS);

    console.log(`   필터 전: ${properties.length}개 단지 → 필터 후: ${filtered.length}개 단지`);

    return filtered;
}

/**
 * 건축연도 필터링 (20년 이내)
 * @param {Array} properties - 단지 목록
 * @returns {Array} 필터링된 단지 목록
 */
function filterByBuildYear(properties) {
    const currentYear = new Date().getFullYear();
    const minBuildYear = currentYear - 20;

    console.log(`🏗️ 건축연도 필터링: ${minBuildYear}년 이후 (20년 이내)`);

    const filtered = properties.filter(prop => {
        const buildYear = parseInt(prop.buildYear);
        return !isNaN(buildYear) && buildYear >= minBuildYear;
    });

    console.log(`   필터 전: ${properties.length}개 단지 → 필터 후: ${filtered.length}개 단지`);

    return filtered;
}

/**
 * 단지별 점수 계산 (API 데이터 포함)
 * @param {Object} property - 단지 정보
 * @param {Object} userData - 사용자 입력 데이터
 * @param {Object} apiData - API에서 가져온 추가 데이터 (선택)
 * @returns {Object} 7가지 기준 점수
 */
function calculatePropertyScores(property, userData, apiData = {}) {
    // 전세가율 계산 (전월세 데이터가 있는 경우)
    const jeonseRatio = apiData.rentData ? calculateJeonseRatio(property, apiData.rentData) : null;

    const locationScore = calculateLocationScore(property, userData, apiData);
    const brandScore = calculateBrandScore(property.aptName);
    const householdScore = calculateHouseholdScore(property.transactionCount); // 세대수 점수 (신규)
    const supplyScore = calculateSupplyScore(property.transactionCount, apiData.unsoldData, apiData.constructionData);
    const educationScore = calculateEducationScore(property.dong);
    const ageScore = calculateAgeScore(property.buildYear);
    const marketScore = calculateMarketScore(property.transactionCount, property.avgPrice, jeonseRatio);
    const psychologyScore = calculatePsychologyScore(apiData.unsoldData); // 심리 지표

    // 디버깅: 첫 번째 단지만 상세 로그
    if (typeof window !== 'undefined' && !window._firstPropertyLogged) {
        console.log('\n🔍 점수 계산 상세 (첫 번째 단지):');
        console.log(`  아파트명: ${property.aptName}`);
        console.log(`  동: ${property.dong}`);
        console.log(`  건축연도: ${property.buildYear}`);
        console.log(`  평균가격: ${property.avgPrice}만원`);
        console.log(`  거래건수: ${property.transactionCount}건`);
        console.log(`  전세가율: ${jeonseRatio}%`);
        console.log(`  ---`);
        console.log(`  입지 점수: ${locationScore}점 (가중치 30%)`);
        console.log(`  세대수 점수: ${householdScore}점 (가중치 15%)`);
        console.log(`  공급 점수: ${supplyScore}점 (가중치 15%)`);
        console.log(`  학군 점수: ${educationScore}점 (가중치 10%)`);
        console.log(`  시장 점수: ${marketScore}점 (가중치 10%)`);
        console.log(`  브랜드 점수: ${brandScore}점 (가중치 10%)`);
        console.log(`  상품성 점수: ${ageScore}점 (가중치 10%)`);
        console.log(`  심리지표 점수: ${psychologyScore}점 (가중치 5%)`);
        window._firstPropertyLogged = true;
    }

    return {
        location: locationScore,
        household: householdScore, // 세대수 점수 (신규)
        brand: brandScore,
        supply: supplyScore,
        education: educationScore,
        age: ageScore,
        market: marketScore,
        psychology: psychologyScore,
        jeonseRatio: jeonseRatio // 전세가율 저장
    };
}

/**
 * 총점 계산 (가중평균) - CLAUDE.md 기준 적용
 * @param {Object} scores - 8가지 기준 점수
 * @returns {number} 총점 (100점 만점)
 */
function calculateTotalScore(scores) {
    const weights = {
        location: 0.30,      // 입지의 희소성 30%
        household: 0.15,     // 세대수 15% (신규)
        supply: 0.15,        // 공급과 수요 15% (감소)
        education: 0.10,     // 실거주 수요 (학군) 10% (감소)
        market: 0.10,        // 시장 신호 10%
        brand: 0.10,         // 브랜드 10%
        age: 0.10,           // 상품성 10%
        psychology: 0.05     // 심리 지표 (미분양) 5%
    };

    const total =
        scores.location * weights.location +
        scores.household * weights.household +
        scores.supply * weights.supply +
        scores.education * weights.education +
        scores.market * weights.market +
        scores.brand * weights.brand +
        scores.age * weights.age +
        scores.psychology * weights.psychology;

    return Math.round(total);
}

/**
 * 브랜드 점수 계산 (10대 브랜드 기준)
 * @param {string} aptName - 아파트명
 * @returns {number} 점수 (0-100)
 */
function calculateBrandScore(aptName) {
    // 10대 브랜드 (브랜드 가치 순)
    // 1군: 래미안, 자이, 힐스테이트, 더샵 (95점)
    const tier1Brands = ['래미안', '자이', '힐스테이트', '더샵'];

    // 2군: 아이파크, e편한세상, 푸르지오, 롯데캐슬 (90점)
    const tier2Brands = ['아이파크', 'e편한세상', '푸르지오', '롯데캐슬', '캐슬'];

    // 3군: 두산위브, 위브, 현대, 디에이치 (85점)
    const tier3Brands = ['두산위브', '위브', '디에이치', 'SK'];

    // 4군: 호반, 포스코, 한화, 대림, 금강, 반도 (80점)
    const tier4Brands = ['호반', '포레나', '포스코', '한화', '대림', '금강', '반도', '유보라'];

    // 기타: 중소 브랜드 (75점)
    const etcBrands = ['경남', '신동아', '삼성', '벽산', '쌍용', '진흥', '동원', '동남', '우미린', '코오롱'];

    let score = 65; // 기본 점수 (무명 브랜드)

    for (const brand of tier1Brands) {
        if (aptName.includes(brand)) {
            score = 95;
            break;
        }
    }

    if (score === 65) {
        for (const brand of tier2Brands) {
            if (aptName.includes(brand)) {
                score = 90;
                break;
            }
        }
    }

    if (score === 65) {
        for (const brand of tier3Brands) {
            if (aptName.includes(brand)) {
                score = 85;
                break;
            }
        }
    }

    if (score === 65) {
        for (const brand of tier4Brands) {
            if (aptName.includes(brand)) {
                score = 80;
                break;
            }
        }
    }

    if (score === 65) {
        for (const brand of etcBrands) {
            if (aptName.includes(brand)) {
                score = 75;
                break;
            }
        }
    }

    return score;
}

/**
 * 세대수 점수 계산 (거래량으로 추정)
 * @param {number} transactionCount - 거래 건수
 * @returns {number} 점수 (0-100)
 */
function calculateHouseholdScore(transactionCount) {
    let score = 50; // 기본 점수 (소규모 단지)

    // CLAUDE.md: 대단지(1,000세대 이상)는 관리비 절감, 우수한 커뮤니티, 높은 환금성
    if (transactionCount >= 10) {
        // 1000세대 이상 추정
        score = 100;
    } else if (transactionCount >= 5) {
        // 500세대 이상 추정
        score = 85;
    } else if (transactionCount >= 3) {
        // 300세대 이상 추정
        score = 70;
    }

    return score;
}

/**
 * 공급 점수 계산 (착공실적 기준)
 * @param {number} transactionCount - 거래 건수 (더 이상 사용하지 않음)
 * @param {Object} unsoldData - 미분양 데이터 (사용 안함)
 * @param {Object} constructionData - 착공실적 데이터 (선택)
 * @returns {number} 점수 (0-100)
 */
function calculateSupplyScore(transactionCount, unsoldData, constructionData) {
    let score = 75; // 기본 점수

    // 착공실적 (향후 3년 공급 예상)
    if (constructionData && constructionData.hasData) {
        const construction = constructionData.construction;
        // 최근 3개월 착공실적 기준
        if (construction === 0) {
            score += 25; // 착공 없음 = 공급 절벽, 매우 좋음
        } else if (construction < 1000) {
            score += 15; // 착공 적음 = 공급 부족, 좋음
        } else if (construction < 3000) {
            score += 5; // 착공 보통
        } else if (construction < 5000) {
            score -= 10; // 착공 많음 = 향후 공급 과잉 우려
        } else {
            score -= 25; // 착공 매우 많음 = 공급 과잉 위험
        }
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * 심리 지표 점수 계산 (미분양 추이)
 * @param {Object} unsoldData - 미분양 데이터 (선택)
 * @returns {number} 점수 (0-100)
 */
function calculatePsychologyScore(unsoldData) {
    let score = 50; // 기본 점수

    // 미분양 (현재 시장 심리)
    if (unsoldData && unsoldData.hasData) {
        const unsold = unsoldData.unsold;
        // 미분양이 없거나 적을수록 시장 심리가 좋음
        if (unsold === 0) {
            score += 50; // 미분양 없음 = 시장 심리 매우 좋음 (바닥 신호)
        } else if (unsold < 500) {
            score += 30; // 미분양 적음 = 시장 심리 좋음
        } else if (unsold < 1000) {
            score += 10; // 미분양 보통
        } else if (unsold < 2000) {
            score -= 20; // 미분양 많음 = 시장 심리 나쁨
        } else {
            score -= 40; // 미분양 매우 많음 = 시장 심리 매우 나쁨
        }
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * 상품성 점수 계산 (건축연도 기준)
 * @param {string|number} buildYear - 건축연도
 * @returns {number} 점수 (0-100)
 */
function calculateAgeScore(buildYear) {
    const year = parseInt(buildYear);
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (age <= 5) return 95;  // 신축
    if (age <= 10) return 90; // 준신축
    if (age <= 15) return 80;
    if (age <= 20) return 70;
    if (age >= 30) return 75; // 재건축 가능
    return 60;
}

/**
 * 입지 점수 계산 (실제 API 데이터 사용)
 * @param {Object} property - 단지 정보
 * @param {Object} userData - 사용자 입력 데이터
 * @param {Object} apiData - API 데이터 (지하철역, 출퇴근 시간 등)
 * @returns {number} 점수 (0-100)
 */
function calculateLocationScore(property, userData, apiData = {}) {
    let score = 50; // 기본 점수

    // 1. 주요 업무지구와의 거리 (최대 40점)
    if (typeof getNearestBusinessDistrict !== 'undefined') {
        const districtInfo = getNearestBusinessDistrict(property.dong);

        if (districtInfo.distance < 999) {
            score += districtInfo.score * 0.4; // 최대 40점 (100 * 0.4)
            // console.log(`${property.dong} → ${districtInfo.district}: ${districtInfo.distance.toFixed(1)}km (+${Math.round(districtInfo.score * 0.4)}점)`);
        } else {
            // 좌표 매핑 실패 시 지역명 기반 휴리스틱 (최대 30점)
            const dong = property.dong;

            if (dong.includes('대치동') || dong.includes('압구정동') || dong.includes('청담동')) score += 30;
            else if (dong.includes('삼성동') || dong.includes('역삼동') || dong.includes('논현동')) score += 28;
            else if (dong.includes('개포동') || dong.includes('도곡동') || dong.includes('세곡동')) score += 27;
            else if (dong.includes('서초동') || dong.includes('반포동') || dong.includes('잠원동')) score += 26;
            else if (dong.includes('판교') || dong.includes('삼평동') || dong.includes('백현동')) score += 25;
            else if (dong.includes('정자동') || dong.includes('서현동') || dong.includes('분당동')) score += 24;
            else if (dong.includes('이매동') || dong.includes('야탑동') || dong.includes('수내동')) score += 23;
            else if (dong.includes('마곡') || dong.includes('발산동') || dong.includes('여의도')) score += 24;
            else if (dong.includes('구미동') || dong.includes('운중동') || dong.includes('금곡동')) score += 22;
            else if (dong.includes('잠실') || dong.includes('송파') || dong.includes('문정동')) score += 21;
            else score += 15;
        }
    } else {
        // 스크립트 로드 실패 시 기본 휴리스틱
        const dong = property.dong;
        if (dong.includes('대치동') || dong.includes('압구정동') || dong.includes('청담동')) score += 30;
        else if (dong.includes('삼성동') || dong.includes('역삼동') || dong.includes('논현동')) score += 28;
        else if (dong.includes('판교') || dong.includes('분당')) score += 25;
        else score += 15;
    }

    // 2. 역세권 (지하철역 거리 기반 또는 지역명 휴리스틱)
    if (apiData.nearestStation && apiData.nearestStation.hasData) {
        const distance = apiData.nearestStation.distance;
        if (distance <= 300) score += 15;      // 300m 이내 - 초역세권
        else if (distance <= 500) score += 12;  // 500m 이내 - 역세권
        else if (distance <= 800) score += 8;  // 800m 이내 - 준역세권
        else if (distance <= 1000) score += 4; // 1km 이내
        else score += 0;                       // 1km 초과
    } else {
        // 역세권 지역 추정 (역 이름이 동 이름에 포함된 경우)
        const dong = property.dong;
        if (dong.includes('역삼') || dong.includes('강남') || dong.includes('삼성') ||
            dong.includes('판교') || dong.includes('정자') || dong.includes('야탑') ||
            dong.includes('서현') || dong.includes('수내') || dong.includes('잠실')) {
            score += 10; // 역세권 추정
        } else {
            score += 5; // 일반
        }
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * 학군 점수 계산
 * @param {string} dong - 동 이름
 * @returns {number} 점수 (0-100)
 */
function calculateEducationScore(dong) {
    // 8학군 및 최상위 명문 학군 지역
    const premiumSchoolAreas = ['대치동', '개포동', '도곡동', '수서동', '압구정동', '청담동'];

    // 우수 학군 지역
    const goodSchoolAreas = [
        '서초동', '반포동', '잠원동', '목동', '중계동', '노원구',
        '정자동', '서현동', '분당동', '수내동', '판교동', '삼평동', // 분당/판교 학군
        '이매동', '야탑동',  // 분당 학군
        '송파', '잠실', '문정동' // 강남권
    ];

    // 양호 학군 지역
    const decentSchoolAreas = [
        '구미동', '운중동', '백현동', '대장동',
        '마곡', '목동', '상암동',
        '가락동', '방이동'
    ];

    for (const area of premiumSchoolAreas) {
        if (dong.includes(area)) return 95; // 최고 학군
    }

    for (const area of goodSchoolAreas) {
        if (dong.includes(area)) return 85; // 우수 학군
    }

    for (const area of decentSchoolAreas) {
        if (dong.includes(area)) return 75; // 양호 학군
    }

    return 65; // 일반 학군
}

/**
 * 전월세 데이터를 매매 단지와 매칭하여 전세가율 계산
 * @param {Object} property - 단지 정보
 * @param {Array} rentData - 전월세 실거래가 데이터
 * @returns {number|null} 전세가율 (%) 또는 null
 */
function calculateJeonseRatio(property, rentData) {
    if (!rentData || rentData.length === 0) {
        return null;
    }

    // 같은 단지명, 비슷한 면적(±10%)의 전세 데이터 찾기
    const matchingRents = rentData.filter(rent => {
        const nameMatch = rent.aptName === property.aptName;
        const areaMatch = Math.abs(rent.area - property.avgArea) / property.avgArea <= 0.1;
        const isJeonse = rent.monthlyRent === 0; // 전세만 (월세 제외)

        return nameMatch && areaMatch && isJeonse;
    });

    if (matchingRents.length === 0) {
        return null;
    }

    // 전세가 평균 계산
    const avgJeonse = matchingRents.reduce((sum, rent) => sum + rent.deposit, 0) / matchingRents.length;

    // 전세가율 = (전세가 / 매매가) * 100
    const jeonseRatio = (avgJeonse / property.avgPrice) * 100;

    return Math.round(jeonseRatio * 10) / 10; // 소수점 1자리
}

/**
 * 시장 점수 계산 (거래량 + 전세가율)
 * @param {number} transactionCount - 거래 건수
 * @param {number} avgPrice - 평균 가격
 * @param {number|null} jeonseRatio - 전세가율 (선택)
 * @returns {number} 점수 (0-100)
 */
function calculateMarketScore(transactionCount, avgPrice, jeonseRatio = null) {
    let score = 45; // 기본 점수

    // 1. 거래량 (유동성 지표) - 최대 30점, 연속 함수로 차별화
    // 거래량이 많을수록 점수 증가, 1건당 1.5점, 최대 30점
    const liquidityScore = Math.min(30, transactionCount * 1.5);
    score += liquidityScore;

    // 2. 가격대 (안정성 지표) - 최대 10점
    if (avgPrice >= 80000 && avgPrice <= 200000) {
        score += 10; // 적정 가격대
    } else if (avgPrice >= 50000 && avgPrice < 80000) {
        score += 7; // 저가
    } else if (avgPrice > 200000 && avgPrice <= 300000) {
        score += 7; // 고가
    } else {
        score -= 5; // 극단적 가격대
    }

    // 3. 전세가율 (시장 신호) - 최대 15점
    // CLAUDE.md: 70% 이상일 경우 실거주 가치가 높고 Gap이 적어 반등 가능성 높음
    if (jeonseRatio !== null) {
        if (jeonseRatio >= 70 && jeonseRatio <= 80) {
            score += 15; // 최적 구간: 실수요 매수 타이밍 (Gap 투자 최적)
        } else if (jeonseRatio >= 65 && jeonseRatio < 70) {
            score += 11; // 양호: 매수 고려 시기
        } else if (jeonseRatio >= 80 && jeonseRatio < 85) {
            score += 10; // 주의: 갭투자 위험 증가하지만 수요 강함
        } else if (jeonseRatio >= 60 && jeonseRatio < 65) {
            score += 8; // 보통: 시장 안정
        } else if (jeonseRatio >= 85) {
            score += 5; // 위험: 전세가 역전 위험
        } else if (jeonseRatio < 60) {
            score += 3; // 약세: 시장 침체 신호
        }
    } else {
        // 전세가율 데이터 없으면 중립 점수
        score += 7;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * 단지별 추천 이유 생성
 * @param {Object} property - 단지 정보
 * @param {Object} scores - 점수 정보
 * @returns {string} 추천 이유 텍스트
 */
function generateRecommendationReason(property, scores) {
    const reasons = [];

    // 1. 브랜드 (95점 이상이면 1군)
    if (scores.brand >= 95) {
        reasons.push('1군 브랜드로 환금성 우수');
    } else if (scores.brand >= 90) {
        reasons.push('프리미엄 브랜드');
    }

    // 2. 상품성 (신축/준신축)
    const currentYear = new Date().getFullYear();
    const age = currentYear - parseInt(property.buildYear);
    if (age <= 5) {
        reasons.push('신축으로 상품성 최상');
    } else if (age <= 10) {
        reasons.push('준신축으로 시설 우수');
    } else if (age >= 30) {
        reasons.push('재건축 잠재력');
    }

    // 3. 입지
    if (scores.location >= 85) {
        reasons.push('핵심 입지로 직주근접 우수');
    } else if (scores.location >= 75) {
        reasons.push('우수한 입지');
    } else if (scores.location >= 65) {
        reasons.push('양호한 입지');
    }

    // 4. 학군
    if (scores.education >= 95) {
        reasons.push('최상위 학군(8학군/초품아)');
    } else if (scores.education >= 85) {
        reasons.push('우수 학군');
    }

    // 5. 전세가율 (시장 신호)
    if (scores.jeonseRatio !== null && scores.jeonseRatio !== undefined) {
        if (scores.jeonseRatio >= 70 && scores.jeonseRatio <= 80) {
            reasons.push(`전세가율 ${scores.jeonseRatio}%로 매수 적기`);
        } else if (scores.jeonseRatio >= 80) {
            reasons.push(`전세가율 ${scores.jeonseRatio}%로 갭투자 주의`);
        }
    }

    // 6. 거래량
    if (property.transactionCount >= 15) {
        reasons.push('거래 활발로 유동성 우수');
    }

    // 7. 공급
    if (scores.supply >= 85) {
        reasons.push('미분양 없어 수요 강함');
    }

    // 최대 3개만 선택 (점수 높은 순서)
    const sortedReasons = reasons.slice(0, 3);

    return sortedReasons.length > 0
        ? sortedReasons.join(', ') + '.'
        : '안정적인 투자처.';
}

/**
 * 더미 데이터로 추천 단지 생성
 * @param {Object} userData - 사용자 입력
 * @returns {Array} 추천 단지 Top 10
 */
function generateDummyRecommendations(userData) {
    // 더미 데이터 로드
    const dummyProperties = [
        {
            aptName: '래미안 강남포레스트',
            dong: '개포동',
            jibun: '123',
            buildYear: '2020',
            avgPrice: 158000,
            avgArea: 84.5,
            minPrice: 145000,
            maxPrice: 170000,
            transactionCount: 15
        },
        {
            aptName: '자이 마곡엠밸리',
            dong: '마곡동',
            jibun: '789',
            buildYear: '2021',
            avgPrice: 98000,
            avgArea: 84.0,
            minPrice: 92000,
            maxPrice: 105000,
            transactionCount: 22
        },
        {
            aptName: '힐스테이트 판교',
            dong: '판교동',
            jibun: '456',
            buildYear: '2019',
            avgPrice: 135000,
            avgArea: 99.2,
            minPrice: 128000,
            maxPrice: 142000,
            transactionCount: 18
        },
        {
            aptName: '푸르지오 위례',
            dong: '창곡동',
            jibun: '321',
            buildYear: '2018',
            avgPrice: 82000,
            avgArea: 84.9,
            minPrice: 78000,
            maxPrice: 88000,
            transactionCount: 12
        },
        {
            aptName: '아이파크 송도',
            dong: '송도동',
            jibun: '654',
            buildYear: '2017',
            avgPrice: 72000,
            avgArea: 84.7,
            minPrice: 68000,
            maxPrice: 76000,
            transactionCount: 25
        },
        {
            aptName: 'e편한세상 서초',
            dong: '서초동',
            jibun: '111',
            buildYear: '2022',
            avgPrice: 142000,
            avgArea: 74.3,
            minPrice: 135000,
            maxPrice: 150000,
            transactionCount: 8
        },
        {
            aptName: '롯데캐슬 분당',
            dong: '정자동',
            jibun: '222',
            buildYear: '2016',
            avgPrice: 95000,
            avgArea: 114.5,
            minPrice: 88000,
            maxPrice: 102000,
            transactionCount: 14
        },
        {
            aptName: '래미안 송파헬리오시티',
            dong: '문정동',
            jibun: '333',
            buildYear: '2020',
            avgPrice: 125000,
            avgArea: 84.2,
            minPrice: 118000,
            maxPrice: 132000,
            transactionCount: 20
        },
        {
            aptName: '자이 용산',
            dong: '한강로',
            jibun: '444',
            buildYear: '2023',
            avgPrice: 168000,
            avgArea: 59.9,
            minPrice: 160000,
            maxPrice: 175000,
            transactionCount: 6
        },
        {
            aptName: '힐스테이트 광교',
            dong: '광교동',
            jibun: '555',
            buildYear: '2018',
            avgPrice: 88000,
            avgArea: 84.0,
            minPrice: 82000,
            maxPrice: 94000,
            transactionCount: 16
        }
    ];

    // 예산 범위 내 필터링
    const affordableProperties = filterByBudgetRange(dummyProperties, userData.budget, 0.3);

    // 점수 계산
    const scoredProperties = affordableProperties.map(prop => {
        const scores = calculatePropertyScores(prop, userData);
        const totalScore = calculateTotalScore(scores);

        return {
            ...prop,
            scores: scores,
            totalScore: totalScore,
            verdict: getVerdict(totalScore)
        };
    });

    // Top 10 정렬
    return scoredProperties
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, 10);
}
