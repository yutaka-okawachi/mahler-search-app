/**
 * composer_common.js
 * Richard Wagner / Richard Strauss ページ共通のクライアントサイドロジック
 * 
 * - オペラ選択時のシーン取得
 * - シーン検索 / ページ検索の実行
 * - サーバーAPI (GAS) との通信
 */

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxWl-KLwo8SnOyqQT84gJyrofRQnIp_GBv8Pg0N5athPAoxp9LBuwj0HDTXkFqh0xiGsw/exec';

let currentSearchId = 0;

document.addEventListener('DOMContentLoaded', () => {
    // オペラ選択ラジオボタンのイベントリスナー
    const operaRadios = document.querySelectorAll('input[name="opera"]');
    operaRadios.forEach(radio => {
        radio.addEventListener('change', handleOperaSelection);
    });

    // 検索方法ラジオボタンのイベントリスナー
    const searchTypeRadios = document.querySelectorAll('input[name="search-type"]');
    searchTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleSearchTypeChange);
    });
});

/**
 * オペラが選択されたときの処理
 */
async function handleOperaSelection(event) {
    const operaValue = event.target.value;
    const composer = document.title.includes('Wagner') ? 'Wagner' : 'Strauss';

    // 検索方法エリアを表示
    document.getElementById('search-method-container').style.display = 'block';

    // シーン選択エリアとページ選択エリアをリセット・非表示
    document.getElementById('scene-selection-container').style.display = 'none';
    document.getElementById('page-selection-container').style.display = 'none';

    // 検索方法のラジオボタンをリセット
    const searchTypeRadios = document.querySelectorAll('input[name="search-type"]');
    searchTypeRadios.forEach(r => r.checked = false);

    // シーンオプションをクリアして読み込み中表示
    const wrapper = document.getElementById('scene-options-wrapper');
    wrapper.innerHTML = '<p class="loading">シーン情報を取得中...</p>';

    try {
        // APIからシーン情報を取得
        const params = new URLSearchParams({
            action: 'getSceneOptionsForOpera',
            composer: composer
        });

        const response = await fetch(`${GAS_API_URL}?${params.toString()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const options = await response.json();

        // 選択されたオペラのシーンオプションのみを抽出して表示
        if (options[operaValue]) {
            let html = '<div class="checkbox-group">';
            options[operaValue].forEach(scene => {
                // scene は "Act I, Scene 1" のような文字列
                // 値としても表示名としても使用
                html += `<div class="checkbox-item">
                   <input type="checkbox" name="scene" value="${scene}" id="scene-${scene}">
                   <label for="scene-${scene}">${scene}</label>
                 </div>`;
            });
            html += '</div>';
            wrapper.innerHTML = html;
        } else {
            wrapper.innerHTML = '<p>シーン情報がありません。</p>';
        }

    } catch (error) {
        console.error('Error fetching scene options:', error);
        wrapper.innerHTML = '<p class="error">シーン情報の取得に失敗しました。</p>';
    }
}

/**
 * 検索方法（シーン/ページ）が変更されたときの処理
 */
function handleSearchTypeChange(event) {
    const type = event.target.value;
    const sceneContainer = document.getElementById('scene-selection-container');
    const pageContainer = document.getElementById('page-selection-container');

    if (type === 'scene') {
        sceneContainer.style.display = 'block';
        pageContainer.style.display = 'none';
    } else if (type === 'page') {
        sceneContainer.style.display = 'none';
        pageContainer.style.display = 'block';
    }
}

/**
 * シーン検索の実行
 */
async function searchByScene() {
    const operaRadio = document.querySelector('input[name="opera"]:checked');
    if (!operaRadio) {
        alert('オペラを選択してください。');
        return;
    }
    const operaValue = operaRadio.value;

    const sceneCheckboxes = document.querySelectorAll('input[name="scene"]:checked');
    if (sceneCheckboxes.length === 0) {
        alert('シーンを選択してください。');
        return;
    }
    const selectedScenes = Array.from(sceneCheckboxes).map(cb => cb.value);

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p class="loading">検索中...</p>';
    focusResultsPanel({ instant: true });

    // 検索ボタン無効化
    const searchBtn = document.querySelector('#scene-selection-container .btn-search');
    if (searchBtn) searchBtn.disabled = true;

    currentSearchId++;
    const thisSearchId = currentSearchId;

    const action = document.title.includes('Wagner') ? 'searchRichardWagnerByScene' : 'searchRichardStraussByScene';

    try {
        const params = new URLSearchParams({
            action: action,
            opera: operaValue,
            scenes: selectedScenes.join(',')
        });

        const response = await fetch(`${GAS_API_URL}?${params.toString()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const html = await response.json();

        if (thisSearchId === currentSearchId) {
            resultsDiv.innerHTML = html;
            focusResultsPanel({ instant: true });
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
 * ページ検索の実行
 */
async function searchByPage() {
    const operaRadio = document.querySelector('input[name="opera"]:checked');
    if (!operaRadio) {
        alert('オペラを選択してください。');
        return;
    }
    const operaValue = operaRadio.value;

    const pageInput = document.getElementById('page-input').value.trim();
    if (!pageInput) {
        alert('ページ番号を入力してください。');
        return;
    }

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p class="loading">検索中...</p>';
    focusResultsPanel({ instant: true });

    // 検索ボタン無効化
    const searchBtn = document.querySelector('#page-selection-container .btn-search');
    if (searchBtn) searchBtn.disabled = true;

    currentSearchId++;
    const thisSearchId = currentSearchId;

    const action = document.title.includes('Wagner') ? 'searchRichardWagnerByPage' : 'searchRichardStraussByPage';

    try {
        const params = new URLSearchParams({
            action: action,
            opera: operaValue,
            pageInput: pageInput
        });

        const response = await fetch(`${GAS_API_URL}?${params.toString()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const html = await response.json();

        if (thisSearchId === currentSearchId) {
            resultsDiv.innerHTML = html;
            focusResultsPanel({ instant: true });
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
 * 検索中止
 */
function cancelSearch() {
    currentSearchId++;
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p class="loading">検索を中止しました。</p>';

    // ボタン有効化
    document.querySelectorAll('.btn-search').forEach(btn => btn.disabled = false);
}

/**
 * シーン選択クリア
 */
function clearScenes() {
    const checkboxes = document.querySelectorAll('input[name="scene"]');
    checkboxes.forEach(cb => cb.checked = false);
}

/**
 * ページ入力クリア
 */
function clearPageInput() {
    document.getElementById('page-input').value = '';
}
