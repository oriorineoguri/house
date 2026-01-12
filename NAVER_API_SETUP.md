# 네이버 Maps API 활성화 가이드

## 현재 상황
- API 키: 정상 설정됨 ✅
- 헤더 형식: 올바름 ✅
- 오류: `210 Permission Denied - A subscription to the API is required`

**원인**: Maps Geocoding 서비스가 활성화되지 않음

## 해결 방법

### 1. 네이버 클라우드 플랫폼 콘솔 접속
```
https://console.ncloud.com/
```

### 2. AI·Application Service > Maps 메뉴로 이동
1. 왼쪽 메뉴에서 **AI·Application Service** 클릭
2. **Maps** 선택

### 3. Maps Geocoding 서비스 활성화
1. **Maps** 페이지에서 **Geocoding** 찾기
2. **이용 신청하기** 또는 **서비스 활성화** 버튼 클릭
3. 약관 동의 및 신청 완료

### 4. 필요한 서비스 목록
현재 프로젝트에서 사용하는 API:
- ✅ **Maps Geocoding** (필수) - 주소를 좌표로 변환
- ⬜ Maps Directions (선택) - 경로 탐색 (현재 미사용)

### 5. 활성화 확인
서비스 활성화 후 약 5~10분 정도 소요될 수 있습니다.

다음 명령으로 테스트:
```bash
curl -X GET "https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=서울시 강남구 개포동" \
  -H "X-NCP-APIGW-API-KEY-ID: 6c7tv4x702" \
  -H "X-NCP-APIGW-API-KEY: wDr81GcQ0K6ImJ4V3RWJ1UI25f7K03oACzxNPcKb"
```

성공 응답 예시:
```json
{
  "status": "OK",
  "addresses": [
    {
      "roadAddress": "서울특별시 강남구 개포로 ...",
      "jibunAddress": "서울특별시 강남구 개포동 ...",
      "x": "127.0xxxxx",
      "y": "37.4xxxxx"
    }
  ]
}
```

## 참고사항

### Fallback 시스템
현재 코드는 네이버 API가 실패해도 다음과 같이 작동합니다:

1. **역세권 계산**: 주요 지하철역 좌표 데이터베이스 사용
2. **출퇴근 시간**: 직선 거리 기반 추정 (평균 30km/h)
3. **입지 점수**: 지역명 기반 휴리스틱 사용

따라서 **API 없이도 추천 시스템은 정상 작동**하지만, API를 활성화하면 더 정확한 결과를 얻을 수 있습니다.

### 무료 사용량
네이버 Maps API 무료 사용량:
- Geocoding: 월 30,000건
- 이 프로젝트는 월 100~200건 정도 사용 예상 (충분함)

### 문제 해결
API 활성화 후에도 401 오류가 발생한다면:
1. API 키 재생성
2. 콘솔에서 서비스 활성화 상태 재확인
3. 5~10분 대기 후 재시도
