/**
 * terms_search_common.js
 * 用語検索ページ (Mahler, Wagner, Strauss) 共通のクライアントサイドロジック
 * 
 * - ページ読み込み時に用語リストを取得 (オートコンプリート用)
 * - 用語検索の実行
 * - サーバーAPI (GAS) との通信
 */

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxWl-KLwo8SnOyqQT84gJyrofRQnIp_GBv8Pg0N5athPAoxp9LBuwj0HDTXkFqh0xiGsw/exec';

let currentSearchId = 0;

// ページの種類を判定
function getPageType() {
    const title = document.title;
    if (title.includes('(RW)')) return 'RW';
    if (title.includes('(RS)')) return 'RS';
    return 'GM'; // Default to Mahler
}

document.addEventListener('DOMContentLoaded', () => {
    // 用語リストを取得してdatalistにセット
    fetchTerms();

    // 検索ボックスでEnterキーが押されたら検索実行
    const input = document.getElementById('search-input');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                search();
            }
        });
    }
});

/**
 * 用語リストを取得
 */
async function fetchTerms() {
    const type = getPageType();
    let action = 'getGMTermsForClient';
    if (type === 'RW') action = 'getRWTermsForClient';
    if (type === 'RS') action = 'getRSTermsForClient';

    try {
        const params = new URLSearchParams({ action: action });
        const response = await fetch(`${GAS_API_URL}?${params.toString()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const terms = await response.json();

        const datalist = document.getElementById('terms-list');
        if (datalist && Array.isArray(terms)) {
            let optionsHtml = '';
            terms.forEach(term => {
                // term is an object { original: "...", normalized: "..." }
                const val = term.original || term; // fallback if it's a string
                optionsHtml += `<option value="${val}"></option>`;
            });
            datalist.innerHTML = optionsHtml;
        }
    } catch (error) {
        console.error('Error fetching terms:', error);
    }
}

/**
 * 検索実行
 */
async function search() {
    const input = document.getElementById('search-input');
    const query = input.value.trim();

    if (!query) {
        alert('検索語を入力してください。');
        return;
    }

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p class="loading">検索中...</p>';

    // 検索ボタン無効化
    const searchBtn = document.querySelector('.btn-search');
    if (searchBtn) searchBtn.disabled = true;

    currentSearchId++;
    const thisSearchId = currentSearchId;

    const type = getPageType();
    let action = 'searchByTerm'; // GM
    if (type === 'RW') action = 'searchRWTerms';
    if (type === 'RS') action = 'searchRSTerms';

    try {
        const params = new URLSearchParams({
            action: action,
            query: query
        });

        const response = await fetch(`${GAS_API_URL}?${params.toString()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const html = await response.json();

        if (thisSearchId === currentSearchId) {
            resultsDiv.innerHTML = html;
            if (searchBtn) searchBtn.disabled = false;
        }
    } catch (error) {
        console.error('Search error:', error);
        if (thisSearchId === currentSearchId) {
            resultsDiv.innerHTML = '<p class="result-message">エラーが発生しました。</p>';
            if (searchBtn) searchBtn.disabled = false;
        }
    }
}

/**
 * 入力クリア
 */
function clearInput() {
    const input = document.getElementById('search-input');
    input.value = '';
    input.focus();
}
