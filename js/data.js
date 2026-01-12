/**
 * 부동산 데이터 처리 모듈
 */

'use strict';

/**
 * 부동산 데이터 로드
 * @returns {Promise<Array>} 부동산 목록
 */
async function loadProperties() {
  try {
    const response = await fetch('data/properties.json');
    const data = await response.json();
    return data.properties;
  } catch (error) {
    console.error('데이터 로드 실패:', error);
    return [];
  }
}

/**
 * 예산에 맞는 부동산 필터링
 * @param {Array} properties - 전체 부동산 목록
 * @param {number} budget - 예산 (만원)
 * @param {number} tolerance - 허용 오차 (기본 20%)
 * @returns {Array} 필터링된 부동산 목록
 */
function filterByBudget(properties, budget, tolerance = 0.2) {
  const minPrice = budget * (1 - tolerance);
  const maxPrice = budget * (1 + tolerance);

  return properties.filter(prop =>
    prop.price >= minPrice && prop.price <= maxPrice
  );
}

/**
 * 점수 기준으로 정렬
 * @param {Array} properties - 부동산 목록
 * @param {string} sortBy - 정렬 기준 ('total' | 'location' | 'education' 등)
 * @param {string} order - 정렬 순서 ('desc' | 'asc')
 * @returns {Array} 정렬된 부동산 목록
 */
function sortByScore(properties, sortBy = 'total', order = 'desc') {
  return [...properties].sort((a, b) => {
    const scoreA = a.scores[sortBy] || 0;
    const scoreB = b.scores[sortBy] || 0;

    if (order === 'desc') {
      return scoreB - scoreA;
    }
    return scoreA - scoreB;
  });
}

/**
 * 점수 임계값으로 필터링
 * @param {Array} properties - 부동산 목록
 * @param {number} minScore - 최소 점수
 * @returns {Array} 필터링된 부동산 목록
 */
function filterByMinScore(properties, minScore = 70) {
  return properties.filter(prop => prop.scores.total >= minScore);
}

/**
 * 지역으로 필터링
 * @param {Array} properties - 부동산 목록
 * @param {string} district - 지역구
 * @returns {Array} 필터링된 부동산 목록
 */
function filterByDistrict(properties, district) {
  if (!district) return properties;

  return properties.filter(prop =>
    prop.location.district.includes(district)
  );
}

/**
 * 출퇴근 시간으로 필터링
 * @param {Array} properties - 부동산 목록
 * @param {string} workplace - 직장 위치 ('강남' | '판교')
 * @param {number} maxCommuteTime - 최대 출퇴근 시간 (분)
 * @returns {Array} 필터링된 부동산 목록
 */
function filterByCommuteTime(properties, workplace, maxCommuteTime = 60) {
  return properties.filter(prop => {
    let commuteTime = 999;

    if (workplace.includes('강남')) {
      commuteTime = prop.location.commuteTimeGangnam;
    } else if (workplace.includes('판교')) {
      commuteTime = prop.location.commuteTimePangyo;
    }

    return commuteTime <= maxCommuteTime;
  });
}

/**
 * 학군으로 필터링
 * @param {Array} properties - 부동산 목록
 * @param {number} minSchoolDistrict - 최소 학군 점수
 * @returns {Array} 필터링된 부동산 목록
 */
function filterByEducation(properties, minSchoolDistrict = 5) {
  return properties.filter(prop =>
    prop.education.schoolDistrict >= minSchoolDistrict
  );
}

/**
 * 종합 추천 부동산 찾기
 * @param {Object} criteria - 검색 조건
 * @returns {Promise<Array>} 추천 부동산 목록
 */
async function getRecommendations(criteria) {
  // 1. 데이터 로드
  let properties = await loadProperties();

  // 2. 예산으로 필터링
  if (criteria.budget) {
    properties = filterByBudget(properties, criteria.budget);
  }

  // 3. 출퇴근 시간으로 필터링
  if (criteria.myWorkplace) {
    properties = filterByCommuteTime(properties, criteria.myWorkplace);
  }

  // 4. 최소 점수로 필터링
  properties = filterByMinScore(properties, 60);

  // 5. 점수순으로 정렬
  properties = sortByScore(properties, 'total', 'desc');

  // 6. 상위 5개만 반환
  return properties.slice(0, 5);
}

/**
 * 특정 부동산 상세 정보 가져오기
 * @param {number} id - 부동산 ID
 * @returns {Promise<Object>} 부동산 상세 정보
 */
async function getPropertyById(id) {
  const properties = await loadProperties();
  return properties.find(prop => prop.id === id);
}

/**
 * 부동산 비교
 * @param {Array<number>} ids - 비교할 부동산 ID 배열
 * @returns {Promise<Array>} 비교 대상 부동산 목록
 */
async function compareProperties(ids) {
  const properties = await loadProperties();
  return properties.filter(prop => ids.includes(prop.id));
}

// Export functions (for module usage)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    loadProperties,
    filterByBudget,
    sortByScore,
    filterByMinScore,
    filterByDistrict,
    filterByCommuteTime,
    filterByEducation,
    getRecommendations,
    getPropertyById,
    compareProperties
  };
}
