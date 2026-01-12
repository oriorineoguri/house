/**
 * 부동산 투자 분석 대시보드 - 메인 로직
 */

'use strict';

// DOM 요소
const form = document.getElementById('investmentForm');
const loadingState = document.getElementById('loadingState');
const resultsSection = document.getElementById('resultsSection');
const btnAnalyze = document.getElementById('btnAnalyze');

/**
 * 폼 제출 이벤트 핸들러
 */
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // 입력값 가져오기
  const formData = {
    budget: parseInt(document.getElementById('budget').value),
    myWorkplace: document.getElementById('myWorkplace').value,
    spouseWorkplace: document.getElementById('spouseWorkplace').value || null
  };

  // 입력값 검증
  if (!validateInput(formData)) {
    return;
  }

  // 분석 시작
  await analyzeProperty(formData);
});

/**
 * 입력값 검증
 */
function validateInput(data) {
  if (data.budget <= 0) {
    alert('예산은 0보다 커야 합니다.');
    return false;
  }

  if (data.budget > 1000000) {
    const confirm = window.confirm(
      '예산이 100억원을 초과합니다. 계속하시겠습니까?'
    );
    if (!confirm) return false;
  }

  return true;
}

/**
 * 부동산 분석 실행
 */
async function analyzeProperty(data) {
  try {
    // 로딩 상태 표시
    showLoading();

    // 실제 API 호출 (더미 데이터 폴백 없음)
    const analysisResult = await analyzeWithAPI(data);

    // 결과 표시
    displayResults(analysisResult);

  } catch (error) {
    console.error('분석 중 오류 발생:', error);

    // 에러 메시지 표시
    hideLoading();
    resultsSection.innerHTML = `
      <div class="card" style="text-align: center; padding: 40px; background: #ff4444; color: white;">
        <h2>❌ 데이터 조회 실패</h2>
        <p style="margin: 20px 0;">${error.message}</p>
        <p>API 연결에 문제가 있거나 해당 지역의 데이터가 없습니다.</p>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: white; color: #ff4444; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
          다시 시도
        </button>
      </div>
    `;
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * 실제 API를 사용한 분석
 */
async function analyzeWithAPI(data) {
  // 1. 직장 위치에 따른 추천 거주 지역 추출 (복수 지역)
  const myRegions = getRecommendedRegions(data.myWorkplace);

  console.log(`\n🏢 나의 직장: ${data.myWorkplace}`);
  console.log(`   추천 지역: ${myRegions.join(', ')}`);

  let regions = [...myRegions];

  // 배우자 직장이 있는 경우
  if (data.spouseWorkplace) {
    const spouseRegions = getRecommendedRegions(data.spouseWorkplace);
    console.log(`\n💼 배우자 직장: ${data.spouseWorkplace}`);
    console.log(`   추천 지역: ${spouseRegions.join(', ')}`);

    // 배우자 직장 지역 추가
    spouseRegions.forEach(region => {
      if (!regions.includes(region)) {
        regions.push(region);
      }
    });

    // 중간 지점 지역 추가
    const middleRegions = getMiddleRegions(data.myWorkplace, data.spouseWorkplace);
    console.log(`\n🏘️ 중간 지점 지역: ${middleRegions.join(', ')}`);
    middleRegions.forEach(region => {
      if (!regions.includes(region)) {
        regions.push(region);
      }
    });
  }

  console.log(`\n📍 최종 검색 지역 (${regions.length}곳): ${regions.join(', ')}`);

  // 2. 모든 지역의 최근 3개월 매매 및 전월세 실거래가 조회 (병렬 처리)
  const allTransactions = [];
  const allRentData = [];

  for (const region of regions) {
    try {
      // 매매 실거래가
      const regionTransactions = await getRegionTransactionHistory(region, 3);
      allTransactions.push(...regionTransactions);
      console.log(`  ✅ ${region} 매매: ${regionTransactions.length}건`);

      // 전월세 실거래가
      try {
        const regionRentData = await getRegionRentHistory(region, 3);
        allRentData.push(...regionRentData);
        console.log(`  ✅ ${region} 전월세: ${regionRentData.length}건`);
      } catch (error) {
        console.log(`  ⚠️ ${region} 전월세: 데이터 없음`);
      }
    } catch (error) {
      console.log(`  ⚠️ ${region}: 데이터 없음`);
    }
  }

  if (allTransactions.length === 0) {
    throw new Error(`검색한 지역(${regions.join(', ')})에서 실거래가 데이터를 찾을 수 없습니다.`);
  }

  console.log(`✅ 총 매매 ${allTransactions.length}건, 전월세 ${allRentData.length}건 조회`);

  // 초기화
  if (typeof window !== 'undefined') {
    window._firstPropertyLogged = false;
  }

  // 3. 단지별로 그룹화 및 평균 가격 계산
  const propertiesByApt = groupTransactionsByApartment(allTransactions);

  // 4. 예산에 맞는 단지 필터링
  const affordableProperties = filterByBudgetRange(propertiesByApt, data.budget);

  if (affordableProperties.length === 0) {
    throw new Error('예산 범위 내 아파트를 찾을 수 없습니다. 예산을 조정해보세요.');
  }

  // 5. 건축연도 필터링 (20년 이내)
  const recentBuildings = filterByBuildYear(affordableProperties);

  if (recentBuildings.length === 0) {
    throw new Error('예산 범위 내 20년 이내 아파트를 찾을 수 없습니다. 검색 조건을 조정해보세요.');
  }

  console.log(`\n✅ 필터링 완료: ${recentBuildings.length}개 단지`);
  console.log(`   (세대수는 독립 점수로 평가: 1000세대+ 100점, 500세대+ 85점, 300세대+ 70점)`);

  // 6. 각 단지별 점수 계산 (추가 API 데이터 포함)
  const scoredProperties = await Promise.all(
    recentBuildings.map(async prop => {
      // 추가 API 데이터 수집 (전월세 데이터 전달)
      const apiData = await collectAPIData(prop, data, allRentData);

      // 점수 계산 (API 데이터 포함)
      const scores = calculatePropertyScores(prop, data, apiData);
      const totalScore = calculateTotalScore(scores);

      // 추천 이유 생성
      const recommendationReason = generateRecommendationReason(prop, scores);

      return {
        ...prop,
        scores: scores,
        totalScore: totalScore,
        verdict: getVerdict(totalScore),
        recommendationReason: recommendationReason
      };
    })
  );

  // 7. 점수순으로 정렬하고 Top 10 추출
  const top10 = scoredProperties
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10);

  // 디버깅: Top 10 로그 출력
  console.log('\n========== TOP 10 추천 단지 ==========');
  top10.forEach((prop, index) => {
    console.log(`\n${index + 1}위. ${prop.aptName} (${prop.dong}, ${prop.buildYear}년) - ⭐${prop.totalScore}점`);
    console.log(`     가격: ${prop.avgPrice.toLocaleString()}만원 | 거래: ${prop.transactionCount}건`);
    console.log(`     [입지:${prop.scores.location}(30%) 공급:${prop.scores.supply}(20%) 학군:${prop.scores.education}(15%) 시장:${prop.scores.market}(10%) 브랜드:${prop.scores.brand}(10%) 상품성:${prop.scores.age}(10%) 심리:${prop.scores.psychology}(5%)]`);
    if (prop.scores.jeonseRatio) {
      console.log(`     전세가율: ${prop.scores.jeonseRatio}%`);
    }
  });

  // 점수 분포 확인
  const allScores = scoredProperties.map(p => p.totalScore);
  const uniqueScores = [...new Set(allScores)];
  console.log(`\n📊 점수 분포: 최고 ${Math.max(...allScores)}점, 최저 ${Math.min(...allScores)}점`);
  console.log(`   고유 점수 개수: ${uniqueScores.length}개 (전체 ${scoredProperties.length}개 단지 중)`);

  if (uniqueScores.length < 5) {
    console.warn('⚠️ 경고: 점수 차별화가 부족합니다!');
  }

  return top10;
}

/**
 * 추가 API 데이터 수집
 * @param {Object} property - 단지 정보
 * @param {Object} userData - 사용자 입력 데이터
 * @returns {Promise<Object>} API 데이터
 */
async function collectAPIData(property, userData, allRentData = []) {
  try {
    // 단지 주소 생성
    const address = `서울시 ${property.dong} ${property.jibun || ''}`;

    // 병렬로 API 호출 (성능 최적화)
    const [nearestStation, unsoldData, constructionData, commuteTime] = await Promise.all([
      getNearestStation(address),
      getUnsoldData('서울'), // 서울 전체 미분양 데이터
      getConstructionData('서울'), // 서울 전체 착공실적 데이터
      getCommuteTime(address, userData.myWorkplace)
    ]);

    // 해당 단지의 전월세 데이터 필터링
    const propertyRentData = allRentData.filter(rent => rent.aptName === property.aptName);

    return {
      nearestStation: nearestStation,
      unsoldData: unsoldData,
      constructionData: constructionData,
      commuteTime: commuteTime,
      rentData: propertyRentData // 전월세 데이터 추가
    };
  } catch (error) {
    console.warn('API 데이터 수집 실패:', error);
    // 에러 발생 시 기본값 반환
    return {
      nearestStation: { nearestStation: '알 수 없음', distance: 999, hasData: false },
      unsoldData: { unsold: 0, hasData: false },
      constructionData: { construction: 0, hasData: false },
      commuteTime: 60,
      rentData: [] // 빈 전월세 데이터
    };
  }
}

/**
 * 실제 데이터 기반 분석 결과 생성
 */
function generateAnalysisFromRealData(inputData, priceInfo, transactions) {
  // 기본 점수 계산 (휴리스틱)
  const scores = {
    location: calculateLocationScore(inputData.myWorkplace),
    brand: 85, // 브랜드 점수는 별도 로직 필요
    supply: 75,
    education: calculateEducationScore(inputData.myWorkplace),
    age: 80,
    market: calculateMarketScore(priceInfo)
  };

  // 가중평균 계산 (7가지 기준)
  const weights = {
    location: 0.30,
    brand: 0.20,
    supply: 0.15,
    education: 0.15,
    age: 0.10,
    market: 0.10
  };

  const totalScore = Math.round(
    scores.location * weights.location +
    scores.brand * weights.brand +
    scores.supply * weights.supply +
    scores.education * weights.education +
    scores.age * weights.age +
    scores.market * weights.market
  );

  const verdict = getVerdict(totalScore);

  return {
    totalScore: totalScore,
    rating: getScoreRating(totalScore),
    verdict: verdict.text,
    verdictDesc: verdict.desc,
    scores: scores,
    details: {
      location: `${inputData.myWorkplace} 인근, 직주근접 ${scores.location >= 80 ? '우수' : '보통'}`,
      brand: '브랜드 평가 데이터 연동 필요',
      supply: '공급 물량 데이터 연동 필요',
      education: `학군 점수: ${scores.education}/100`,
      age: '건축연도 데이터 연동 필요',
      market: `실거래 ${priceInfo.count}건, 평균 ${formatNumber(priceInfo.average)}만원`
    },
    pros: [
      `실거래 평균가: ${formatNumber(priceInfo.average)}만원`,
      `최근 거래 건수: ${priceInfo.count}건`,
      `직장 위치: ${inputData.myWorkplace}`,
      scores.location >= 80 ? '입지 우수' : '입지 양호'
    ],
    cons: [
      priceInfo.average > inputData.budget ? '예산 초과 가능성' : '예산 내 적정',
      '세부 분석을 위해 추가 데이터 필요'
    ],
    opinion: `실거래가 기준 평균 ${formatNumber(priceInfo.average)}만원으로, 예산 ${formatNumber(inputData.budget)}만원과 ${Math.abs(priceInfo.average - inputData.budget) <= inputData.budget * 0.1 ? '비슷한' : priceInfo.average > inputData.budget ? '높은' : '낮은'} 수준입니다. 최근 ${priceInfo.count}건의 거래가 확인되었습니다.`
  };
}

/**
 * 두 직장 위치의 중간 지점 지역 조회
 */
function getMiddleRegions(workplace1, workplace2) {
  // 두 직장 사이의 중간 지점 지역 매핑
  const middleRegionMap = {
    // 화성 - 과천 중간
    '화성-과천': ['의왕시', '수원시', '군포시', '안양시'],
    '과천-화성': ['의왕시', '수원시', '군포시', '안양시'],

    // 화성 - 서울 강남권 중간
    '화성-강남': ['수원시', '용인시', '성남시', '분당구'],
    '강남-화성': ['수원시', '용인시', '성남시', '분당구'],
    '화성-서초': ['수원시', '용인시', '성남시', '과천시'],
    '서초-화성': ['수원시', '용인시', '성남시', '과천시'],

    // 과천 - 서울 강남권 중간
    '과천-강남': ['서초구', '강남구', '관악구'],
    '강남-과천': ['서초구', '강남구', '관악구'],
    '과천-서초': ['서초구', '강남구', '관악구'],
    '서초-과천': ['서초구', '강남구', '관악구'],

    // 판교 - 강남 중간
    '판교-강남': ['분당구', '성남시', '서초구'],
    '강남-판교': ['분당구', '성남시', '서초구'],
    '판교-서초': ['분당구', '성남시', '서초구'],
    '서초-판교': ['분당구', '성남시', '서초구'],

    // 여의도 - 강남 중간
    '여의도-강남': ['영등포구', '동작구', '서초구'],
    '강남-여의도': ['영등포구', '동작구', '서초구'],
    '여의도-서초': ['영등포구', '동작구', '서초구'],
    '서초-여의도': ['영등포구', '동작구', '서초구'],

    // 마곡 - 강남 중간
    '마곡-강남': ['영등포구', '양천구', '강서구'],
    '강남-마곡': ['영등포구', '양천구', '강서구'],

    // 수원 - 서울 중간
    '수원-강남': ['용인시', '성남시', '분당구'],
    '강남-수원': ['용인시', '성남시', '분당구'],
    '수원-서초': ['용인시', '성남시', '과천시'],
    '서초-수원': ['용인시', '성남시', '과천시'],

    // 용인 - 서울 중간
    '용인-강남': ['성남시', '분당구'],
    '강남-용인': ['성남시', '분당구'],
    '용인-서초': ['성남시', '분당구', '과천시'],
    '서초-용인': ['성남시', '분당구', '과천시'],

    // 평택 - 과천 중간
    '평택-과천': ['화성시', '수원시', '의왕시'],
    '과천-평택': ['화성시', '수원시', '의왕시'],

    // 평택 - 서울 중간
    '평택-강남': ['화성시', '수원시', '용인시'],
    '강남-평택': ['화성시', '수원시', '용인시']
  };

  // 정확한 매칭
  const key = `${workplace1}-${workplace2}`;
  if (middleRegionMap[key]) {
    return middleRegionMap[key];
  }

  // 부분 매칭 시도
  for (const [mapKey, regions] of Object.entries(middleRegionMap)) {
    const [w1, w2] = mapKey.split('-');
    if ((workplace1.includes(w1) && workplace2.includes(w2)) ||
        (workplace1.includes(w2) && workplace2.includes(w1))) {
      return regions;
    }
  }

  // 매칭 실패 시 빈 배열
  return [];
}

/**
 * 직장 위치에 따른 추천 거주 지역 조회
 */
function getRecommendedRegions(workplace) {
  const workplaceRegionMap = {
    // 서울 강남권
    '강남': ['강남구', '서초구', '송파구', '강동구', '분당구', '수지구'],
    '강남구': ['강남구', '서초구', '송파구', '강동구', '분당구'],
    '서초': ['서초구', '강남구', '송파구', '관악구', '동작구', '과천시'],
    '서초구': ['서초구', '강남구', '송파구', '관악구', '과천시'],
    '송파': ['송파구', '강남구', '강동구', '하남시', '분당구'],
    '송파구': ['송파구', '강남구', '강동구', '하남시'],

    // 판교/분당권
    '판교': ['분당구', '수지구', '기흥구', '용인시', '성남시'],
    '분당': ['분당구', '수지구', '용인시', '성남시'],
    '분당구': ['분당구', '수지구', '용인시', '성남시'],
    '성남': ['성남시', '분당구', '수지구', '하남시'],

    // 여의도/영등포권
    '여의도': ['영등포구', '마포구', '양천구', '강서구', '광명시'],
    '영등포': ['영등포구', '마포구', '양천구', '광명시'],

    // 강서/마곡권
    '마곡': ['강서구', '양천구', '김포시', '부천시'],
    '강서': ['강서구', '양천구', '김포시', '부천시'],

    // 수원/화성/동탄권
    '수원': ['수원시', '용인시', '화성시', '오산시'],
    '화성': ['화성시', '수원시', '용인시', '오산시', '평택시'],
    '동탄': ['화성시', '수원시', '용인시', '오산시'],
    '평택': ['평택시', '화성시', '오산시'],

    // 과천/안양권
    '과천': ['과천시', '안양시', '군포시', '의왕시', '서초구'],
    '안양': ['안양시', '과천시', '군포시', '의왕시'],

    // 용인권
    '용인': ['용인시', '수지구', '기흥구', '성남시', '화성시'],
    '수지': ['수지구', '용인시', '분당구'],
    '기흥': ['기흥구', '용인시', '수원시']
  };

  if (!workplace) {
    return ['강남구']; // 기본값
  }

  // 복수 직장 위치 처리 (예: "화성/과천")
  const workplaces = workplace.split('/').map(w => w.trim());
  const allRegions = new Set();

  for (const work of workplaces) {
    if (workplaceRegionMap[work]) {
      workplaceRegionMap[work].forEach(region => allRegions.add(region));
    } else {
      // 매칭 실패 시 부분 매칭 시도
      const matchedKey = Object.keys(workplaceRegionMap).find(key =>
        work.includes(key) || key.includes(work)
      );

      if (matchedKey) {
        workplaceRegionMap[matchedKey].forEach(region => allRegions.add(region));
      } else {
        // 그래도 실패하면 입력값 그대로 사용
        allRegions.add(work);
      }
    }
  }

  return Array.from(allRegions);
}

/**
 * 직장 위치에서 지역명 추출 (레거시, 사용 안 함)
 */
function extractRegionFromWorkplace(workplace) {
  const regionMap = {
    '강남': '강남구',
    '서초': '서초구',
    '송파': '송파구',
    '판교': '판교',
    '분당': '분당구',
    '마곡': '강서구'
  };

  for (const [key, value] of Object.entries(regionMap)) {
    if (workplace.includes(key)) {
      return value;
    }
  }

  return '강남구'; // 기본값
}

/**
 * 알림 표시
 */
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'warning' ? '#ff9800' : '#4caf50'};
    color: white;
    border-radius: 8px;
    z-index: 9999;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 5000);
}

/**
 * 더미 분석 결과 생성 (Top 10 리스트)
 */
function generateDummyAnalysis(data) {
  // recommendation.js의 함수 사용
  return generateDummyRecommendations(data);
}

/**
 * 결과 표시 (Top 10 리스트)
 */
function displayResults(recommendations) {
  // 결과 섹션 초기화
  resultsSection.innerHTML = '';

  if (!recommendations || recommendations.length === 0) {
    resultsSection.innerHTML = `
      <div class="card" style="text-align: center; padding: 40px;">
        <h2>😢 추천 단지를 찾을 수 없습니다</h2>
        <p>입력한 조건에 맞는 단지가 없습니다. 예산이나 지역을 조정해보세요.</p>
      </div>
    `;
    resultsSection.style.display = 'block';
    hideLoading();
    return;
  }

  // 헤더
  const header = document.createElement('div');
  header.className = 'card';
  header.style.cssText = 'margin-bottom: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;';
  header.innerHTML = `
    <h2 style="margin: 0 0 10px 0;">🏆 추천 단지 Top ${recommendations.length}</h2>
    <p style="margin: 0; opacity: 0.9;">7가지 투자 기준으로 분석한 최적의 단지입니다</p>
  `;
  resultsSection.appendChild(header);

  // 각 단지 카드 생성
  recommendations.forEach((property, index) => {
    const card = createPropertyCard(property, index + 1);
    resultsSection.appendChild(card);
  });

  // 결과 섹션 표시
  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  hideLoading();
}

/**
 * 단지 카드 생성
 */
function createPropertyCard(property, rank) {
  const card = document.createElement('div');
  card.className = 'card property-card';
  card.style.cssText = 'margin-bottom: 20px; position: relative;';

  const rankBadge = rank <= 3 ? `<div class="rank-badge rank-${rank}">${rank}</div>` : `<div class="rank-badge">${rank}</div>`;
  const rating = getScoreRating(property.totalScore);
  const verdict = property.verdict || getVerdict(property.totalScore);

  card.innerHTML = `
    ${rankBadge}
    <div style="display: grid; grid-template-columns: 1fr 200px; gap: 30px; align-items: start;">
      <!-- 왼쪽: 기본 정보 -->
      <div>
        <h3 style="margin: 0 0 10px 0; font-size: 1.5rem;">${property.aptName}</h3>
        <p style="margin: 0 0 5px 0; color: #666;">📍 ${property.dong} ${property.jibun || ''}</p>
        <p style="margin: 0 0 10px 0; color: #666;">🏗️ ${property.buildYear}년 준공</p>

        <!-- 추천 이유 -->
        ${property.recommendationReason ? `
        <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 12px 15px; border-radius: 8px; margin-bottom: 15px; border-left: 3px solid #667eea;">
          <div style="font-size: 0.85rem; color: #667eea; font-weight: bold; margin-bottom: 3px;">💡 추천 이유</div>
          <div style="font-size: 0.95rem; color: white; line-height: 1.5;">${property.recommendationReason}</div>
        </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">
          <div style="background: #f5f5f5; padding: 10px; border-radius: 8px;">
            <div style="font-size: 0.85rem; color: #666;">평균 가격</div>
            <div style="font-size: 1.3rem; font-weight: bold; color: #667eea;">${formatNumber(property.avgPrice)}만원</div>
          </div>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 8px;">
            <div style="font-size: 0.85rem; color: #666;">평균 면적</div>
            <div style="font-size: 1.3rem; font-weight: bold;">${property.avgArea}㎡</div>
          </div>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 8px;">
            <div style="font-size: 0.85rem; color: #666;">최저 ~ 최고가</div>
            <div style="font-size: 1rem; font-weight: bold;">${formatNumber(property.minPrice)} ~ ${formatNumber(property.maxPrice)}만</div>
          </div>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 8px;">
            <div style="font-size: 0.85rem; color: #666;">최근 거래</div>
            <div style="font-size: 1.3rem; font-weight: bold;">${property.transactionCount}건</div>
          </div>
          ${property.scores.jeonseRatio ? `
          <div style="background: #f5f5f5; padding: 10px; border-radius: 8px; grid-column: span 2;">
            <div style="font-size: 0.85rem; color: #666;">전세가율</div>
            <div style="font-size: 1.3rem; font-weight: bold; color: ${property.scores.jeonseRatio >= 70 && property.scores.jeonseRatio <= 80 ? '#4caf50' : property.scores.jeonseRatio >= 80 ? '#ff9800' : '#666'};">${property.scores.jeonseRatio}%</div>
          </div>
          ` : ''}
        </div>

        <!-- 세부 점수 -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
          ${createScoreItem('📍 입지 (30%)', property.scores.location)}
          ${createScoreItem('🏢 세대수 (15%)', property.scores.household)}
          ${createScoreItem('📊 공급 (15%)', property.scores.supply)}
          ${createScoreItem('🎓 학군 (10%)', property.scores.education)}
          ${createScoreItem('📈 시장 (10%)', property.scores.market)}
          ${createScoreItem('🏗️ 브랜드 (10%)', property.scores.brand)}
          ${createScoreItem('🏠 상품성 (10%)', property.scores.age)}
          ${createScoreItem('🧠 심리 (5%)', property.scores.psychology)}
        </div>
      </div>

      <!-- 오른쪽: 종합 점수 -->
      <div style="text-align: center;">
        <div style="font-size: 3rem; font-weight: 900; color: #667eea; line-height: 1;">${property.totalScore}</div>
        <div style="font-size: 1rem; color: #666; margin-bottom: 10px;">/ 100점</div>
        <div style="font-size: 1.5rem; margin-bottom: 5px;">${rating}</div>
        <div style="background: ${property.totalScore >= 80 ? '#4caf50' : property.totalScore >= 70 ? '#ff9800' : '#999'}; color: white; padding: 8px 12px; border-radius: 20px; font-size: 0.9rem; font-weight: bold;">
          ${verdict.text}
        </div>
      </div>
    </div>
  `;

  return card;
}

/**
 * 점수 항목 생성
 */
function createScoreItem(label, score) {
  const color = score >= 85 ? '#4caf50' : score >= 70 ? '#ff9800' : '#999';
  return `
    <div style="text-align: center;">
      <div style="font-size: 0.85rem; color: #666; margin-bottom: 5px;">${label}</div>
      <div style="font-size: 1.5rem; font-weight: bold; color: ${color};">${score}</div>
    </div>
  `;
}

/**
 * 세부 점수 업데이트
 */
function updateDetailedScores(scores, details) {
  const categories = [
    { id: 'location', score: scores.location, detail: details.location },
    { id: 'brand', score: scores.brand, detail: details.brand },
    { id: 'supply', score: scores.supply, detail: details.supply },
    { id: 'education', score: scores.education, detail: details.education },
    { id: 'age', score: scores.age, detail: details.age },
    { id: 'market', score: scores.market, detail: details.market }
  ];

  // 실제로는 동적으로 카드를 생성하거나 업데이트해야 함
  // 현재는 HTML에 하드코딩되어 있음
}

/**
 * 장단점 업데이트
 */
function updateProsCons(pros, cons) {
  const prosList = document.getElementById('prosList');
  const consList = document.getElementById('consList');

  prosList.innerHTML = pros.map(item => `<li>${item}</li>`).join('');
  consList.innerHTML = cons.map(item => `<li>${item}</li>`).join('');
}

/**
 * 로딩 상태 표시
 */
function showLoading() {
  loadingState.style.display = 'flex';
  resultsSection.style.display = 'none';
  btnAnalyze.disabled = true;
  btnAnalyze.style.opacity = '0.5';
}

/**
 * 로딩 상태 숨김
 */
function hideLoading() {
  loadingState.style.display = 'none';
  btnAnalyze.disabled = false;
  btnAnalyze.style.opacity = '1';
}

/**
 * 숫자 포맷팅 (천 단위 콤마)
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 점수에 따른 등급 반환
 */
function getScoreRating(score) {
  if (score >= 80) return '⭐⭐⭐';
  if (score >= 70) return '⭐⭐';
  if (score >= 60) return '⭐';
  return '❌';
}

/**
 * 점수에 따른 판정 반환
 */
function getVerdict(score) {
  if (score >= 80) {
    return {
      text: '강력 추천',
      desc: '투자 가치 매우 높음'
    };
  }
  if (score >= 70) {
    return {
      text: '추천',
      desc: '투자 가치 있음'
    };
  }
  if (score >= 60) {
    return {
      text: '보통',
      desc: '신중히 검토 필요'
    };
  }
  return {
    text: '비추천',
    desc: '투자 재고 권장'
  };
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  console.log('부동산 투자 분석 대시보드 초기화 완료');
});
