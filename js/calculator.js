/**
 * 부동산 투자 분석 계산기
 * 7가지 기준에 따라 투자 가치를 계산합니다.
 */

'use strict';

/**
 * 투자 가치 종합 점수 계산
 * @param {Object} scores - 각 항목별 점수 (0-100)
 * @returns {number} 종합 점수 (0-100)
 */
function calculateTotalScore(scores) {
  const weights = {
    location: 0.30,      // 입지의 희소성 30%
    brand: 0.20,         // 단지 규모와 브랜드 20%
    supply: 0.15,        // 공급과 수요 15%
    education: 0.15,     // 학군 15%
    age: 0.10,           // 상품성 10%
    market: 0.10         // 시장 신호 10%
  };

  const totalScore = (
    scores.location * weights.location +
    scores.brand * weights.brand +
    scores.supply * weights.supply +
    scores.education * weights.education +
    scores.age * weights.age +
    scores.market * weights.market
  );

  return Math.round(totalScore);
}

/**
 * 1. 입지의 희소성 점수 계산
 * @param {Object} data - 입지 관련 데이터
 * @returns {number} 점수 (0-100)
 */
function calculateLocationScore(data) {
  let score = 0;

  // 직주근접 (0-40점)
  const commuteTime = data.commuteTime || 60;
  if (commuteTime <= 30) {
    score += 40;
  } else if (commuteTime <= 45) {
    score += 30;
  } else if (commuteTime <= 60) {
    score += 20;
  } else {
    score += 10;
  }

  // 역세권 (0-30점)
  const stationDistance = data.stationDistance || 1000;
  if (stationDistance <= 300) {
    score += 30;
  } else if (stationDistance <= 500) {
    score += 20;
  } else if (stationDistance <= 1000) {
    score += 10;
  }

  // 신규 노선 (0-30점)
  if (data.newSubwayLine) {
    score += 30;
  }

  return Math.min(score, 100);
}

/**
 * 2. 단지 규모와 브랜드 점수 계산
 * @param {Object} data - 단지 관련 데이터
 * @returns {number} 점수 (0-100)
 */
function calculateBrandScore(data) {
  let score = 0;

  // 세대수 (0-50점)
  const households = data.households || 0;
  if (households >= 1000) {
    score += 50;
  } else if (households >= 500) {
    score += 35;
  } else if (households >= 300) {
    score += 20;
  } else {
    score += 10;
  }

  // 브랜드 (0-50점)
  const tier1Brands = ['자이', '래미안', '힐스테이트', '푸르지오', '아이파크'];
  const brandName = data.brandName || '';

  if (tier1Brands.some(brand => brandName.includes(brand))) {
    score += 50;
  } else {
    score += 25;
  }

  return Math.min(score, 100);
}

/**
 * 3. 공급과 수요 점수 계산
 * @param {Object} data - 공급/수요 관련 데이터
 * @returns {number} 점수 (0-100)
 */
function calculateSupplyScore(data) {
  let score = 50; // 기본 점수

  // 향후 3년 입주 물량 (감점 요인)
  const futureSupply = data.futureSupply || 0;
  if (futureSupply < 1000) {
    score += 30;
  } else if (futureSupply < 3000) {
    score += 15;
  } else if (futureSupply > 5000) {
    score -= 20;
  }

  // 미분양 (가점 요인)
  const unsold = data.unsold || 0;
  if (unsold === 0) {
    score += 20;
  } else if (unsold < 100) {
    score += 10;
  } else {
    score -= 10;
  }

  return Math.max(0, Math.min(score, 100));
}

/**
 * 4. 학군 점수 계산
 * @param {Object} data - 학군 관련 데이터
 * @returns {number} 점수 (0-100)
 */
function calculateEducationScore(data) {
  let score = 0;

  // 초품아 (0-40점)
  if (data.hasElementarySchool) {
    score += 40;
  }

  // 학원가 인접 (0-30점)
  if (data.nearAcademyDistrict) {
    score += 30;
  }

  // 학군 평판 (0-30점)
  const schoolDistrict = data.schoolDistrict || 0;
  if (schoolDistrict >= 8) {
    score += 30;
  } else if (schoolDistrict >= 5) {
    score += 20;
  } else {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * 5. 상품성 점수 계산
 * @param {Object} data - 건물 연식 관련 데이터
 * @returns {number} 점수 (0-100)
 */
function calculateAgeScore(data) {
  const buildYear = data.buildYear || new Date().getFullYear();
  const currentYear = new Date().getFullYear();
  const age = currentYear - buildYear;

  let score = 0;

  if (age <= 5) {
    score = 95;
  } else if (age <= 10) {
    score = 80;
  } else if (age <= 15) {
    score = 65;
  } else if (age <= 20) {
    score = 50;
  } else if (age <= 30) {
    // 재건축 가능성 체크
    if (data.reconstructionPotential) {
      score = 60;
    } else {
      score = 30;
    }
  } else {
    score = 20;
  }

  return score;
}

/**
 * 6. 시장 신호 점수 계산
 * @param {Object} data - 시장 관련 데이터
 * @returns {number} 점수 (0-100)
 */
function calculateMarketScore(data) {
  let score = 0;

  // 전세가율 (0-60점)
  const jeonseRatio = data.jeonseRatio || 50;
  if (jeonseRatio >= 70 && jeonseRatio <= 80) {
    score += 60;
  } else if (jeonseRatio >= 60 && jeonseRatio < 70) {
    score += 45;
  } else if (jeonseRatio >= 50 && jeonseRatio < 60) {
    score += 30;
  } else {
    score += 15;
  }

  // 거래량 추이 (0-40점)
  const transactionTrend = data.transactionTrend || 'stable';
  if (transactionTrend === 'increasing') {
    score += 40;
  } else if (transactionTrend === 'stable') {
    score += 25;
  } else {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * ROI (투자수익률) 계산
 * @param {number} investmentCost - 투자 비용 (만원)
 * @param {number} expectedReturn - 예상 수익 (만원)
 * @returns {number} ROI (%)
 */
function calculateROI(investmentCost, expectedReturn) {
  if (investmentCost === 0) return 0;
  return ((expectedReturn - investmentCost) / investmentCost) * 100;
}

/**
 * 전세가율 계산
 * @param {number} jeonsePrice - 전세가 (만원)
 * @param {number} salePrice - 매매가 (만원)
 * @returns {number} 전세가율 (%)
 */
function calculateJeonseRatio(jeonsePrice, salePrice) {
  if (salePrice === 0) return 0;
  return (jeonsePrice / salePrice) * 100;
}

/**
 * 대출 가능 금액 계산 (DSR 기준)
 * @param {number} annualIncome - 연소득 (만원)
 * @param {number} dsr - DSR 비율 (기본 40%)
 * @returns {number} 대출 가능 금액 (만원)
 */
function calculateLoanAmount(annualIncome, dsr = 40) {
  const maxAnnualPayment = annualIncome * (dsr / 100);
  const interestRate = 4.5; // 가정: 연 4.5%
  const loanPeriod = 30; // 30년

  // 원리금균등상환 방식
  const monthlyRate = interestRate / 100 / 12;
  const months = loanPeriod * 12;

  const loanAmount = (maxAnnualPayment / 12) *
    ((Math.pow(1 + monthlyRate, months) - 1) /
     (monthlyRate * Math.pow(1 + monthlyRate, months)));

  return Math.round(loanAmount);
}

// Export functions (for module usage)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateTotalScore,
    calculateLocationScore,
    calculateBrandScore,
    calculateSupplyScore,
    calculateEducationScore,
    calculateAgeScore,
    calculateMarketScore,
    calculateROI,
    calculateJeonseRatio,
    calculateLoanAmount
  };
}
