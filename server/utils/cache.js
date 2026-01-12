/**
 * 캐싱 유틸리티
 * node-cache를 사용한 인메모리 캐시
 */

'use strict';

const NodeCache = require('node-cache');

// 캐시 TTL (초 단위)
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 3600; // 기본 1시간

// 캐시 인스턴스 생성
const cache = new NodeCache({
    stdTTL: CACHE_TTL,
    checkperiod: CACHE_TTL * 0.2, // TTL의 20%마다 만료된 키 자동 삭제
    useClones: false // 성능 향상을 위해 복제 비활성화
});

/**
 * 캐시에서 데이터 조회
 * @param {string} key - 캐시 키
 * @returns {any} 캐시된 데이터 또는 undefined
 */
function get(key) {
    try {
        return cache.get(key);
    } catch (error) {
        console.error('캐시 조회 실패:', error);
        return undefined;
    }
}

/**
 * 캐시에 데이터 저장
 * @param {string} key - 캐시 키
 * @param {any} value - 저장할 데이터
 * @param {number} ttl - TTL (초 단위, 선택)
 * @returns {boolean} 성공 여부
 */
function set(key, value, ttl) {
    try {
        return cache.set(key, value, ttl || CACHE_TTL);
    } catch (error) {
        console.error('캐시 저장 실패:', error);
        return false;
    }
}

/**
 * 캐시에서 데이터 삭제
 * @param {string} key - 캐시 키
 * @returns {number} 삭제된 항목 수
 */
function del(key) {
    try {
        return cache.del(key);
    } catch (error) {
        console.error('캐시 삭제 실패:', error);
        return 0;
    }
}

/**
 * 특정 패턴의 캐시 삭제
 * @param {string} pattern - 검색 패턴 (예: 'transaction_*')
 * @returns {number} 삭제된 항목 수
 */
function delPattern(pattern) {
    try {
        const keys = cache.keys();
        const regex = new RegExp(pattern.replace('*', '.*'));
        const matchedKeys = keys.filter(key => regex.test(key));

        return cache.del(matchedKeys);
    } catch (error) {
        console.error('패턴 캐시 삭제 실패:', error);
        return 0;
    }
}

/**
 * 모든 캐시 삭제
 */
function flush() {
    try {
        cache.flushAll();
        console.log('모든 캐시 삭제 완료');
    } catch (error) {
        console.error('캐시 전체 삭제 실패:', error);
    }
}

/**
 * 캐시 통계 조회
 * @returns {Object} 캐시 통계
 */
function stats() {
    return cache.getStats();
}

/**
 * 캐시 키 목록 조회
 * @returns {Array<string>} 캐시 키 배열
 */
function keys() {
    return cache.keys();
}

// 캐시 이벤트 리스너
cache.on('set', (key, value) => {
    console.log(`캐시 저장: ${key}`);
});

cache.on('expired', (key, value) => {
    console.log(`캐시 만료: ${key}`);
});

module.exports = {
    get,
    set,
    del,
    delPattern,
    flush,
    stats,
    keys
};
