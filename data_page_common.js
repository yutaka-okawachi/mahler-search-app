<<<<<<< HEAD
/**
 * data_page_common.js
 * list.html, dic.html, notes.html 共通のクライアントサイドロジック
 * 
 * - ページ読み込み時にデータを取得
 * - データのレンダリング (ページごとに異なるロジックを分岐またはコールバックで処理)
 * - アルファベット順ソート
 */

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxWl-KLwo8SnOyqQT84gJyrofRQnIp_GBv8Pg0N5athPAoxp9LBuwj0HDTXkFqh0xiGsw/exec';

// カスタム順用アルファベット配列
const customOrder = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K",
    "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U",
    "V", "W", "X", "Y", "Z"
];

function getOrder(letter) {
    const idx = customOrder.indexOf(letter);
    return idx === -1 ? 999 : idx;
}

function normalizeGermanForSort(text) {
    if (typeof text !== "string") return "";
    const trimmed = text.trim();
    if (!trimmed) return "";
    const normalized = typeof trimmed.normalize === "function" ? trimmed.normalize("NFD") : trimmed;
    return normalized.replace(/[\u0300-\u036f]/g, "").replace(/ß/gi, "ss");
}

function getSortLetter(text) {
    return normalizeGermanForSort(text).charAt(0).toUpperCase();
}

function compareGermanStrings(a, b) {
    const letterA = getSortLetter(a);
    const letterB = getSortLetter(b);
    const orderDiff = getOrder(letterA) - getOrder(letterB);
    if (orderDiff !== 0) return orderDiff;

    const textA = (a || "").toString().trim();
    const textB = (b || "").toString().trim();
    if (typeof textA.localeCompare === "function") {
        return textA.localeCompare(textB, "de", { sensitivity: "base" });
    }
    if (textA === textB) return 0;
    return textA > textB ? 1 : -1;
}

document.addEventListener("DOMContentLoaded", function () {
    const pageType = getPageType();

    if (pageType === 'list') {
        fetchData('getListData', renderList);
        fetchData('getAbbrListData', renderAbbrList);
    } else if (pageType === 'dic') {
        fetchData('getDicData', renderList);
        fetchData('getAbbrListData', renderAbbrList);
    } else if (pageType === 'notes') {
        fetchData('getNotesData', renderNotes);
    }
});

function getPageType() {
    if (document.title.includes('訳出についての覚書')) return 'notes';
    if (document.title.includes('用語集')) return 'dic';
    return 'list'; // Default to list (マーラー以外のドイツ語)
}

async function fetchData(action, renderCallback) {
    try {
        const params = new URLSearchParams({ action: action });
        const response = await fetch(`${GAS_API_URL}?${params.toString()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        renderCallback(data);
    } catch (error) {
        console.error(`Error fetching data for ${action}:`, error);
        const loadingEl = document.getElementById("loadingMessage") || document.getElementById("abbrContent");
        if (loadingEl) {
            loadingEl.innerHTML = `<p class="error">データの取得に失敗しました。<br>${error.message}</p>`;
        }
    }
}

function renderList(data) {
    // 頭文字をカスタム順でソート
    data.sort((a, b) => compareGermanStrings(a[0], b[0]));

    const container = document.getElementById("listContainer");
    container.innerHTML = "";

    const anchorSet = {};
    data.forEach(row => {
        const [german, translation, source] = row;

        const rowDiv = document.createElement("div");
        rowDiv.classList.add("row");

        // アンカー割り当て (A, Ä, B...Z)
        if (german && typeof german === "string") {
            const anchorLetter = getSortLetter(german);
            if (anchorLetter && customOrder.includes(anchorLetter) && !anchorSet[anchorLetter]) {
                rowDiv.id = "letter-" + anchorLetter;
                anchorSet[anchorLetter] = true;
            }
        }

        // ドイツ語
        const germanWrapper = document.createElement("div");
        const germanSpan = document.createElement("span");
        germanSpan.classList.add("german");
        germanSpan.textContent = german;

        const sourceSpan = document.createElement("span");
        sourceSpan.classList.add("source");
        sourceSpan.textContent = source || ""; // source might be undefined in dic.html context if not present

        germanWrapper.appendChild(germanSpan);
        germanWrapper.appendChild(sourceSpan);
        rowDiv.appendChild(germanWrapper);

        // 日本語
        const translationDiv = document.createElement("div");
        translationDiv.classList.add("translation");
        translationDiv.textContent = translation;

        rowDiv.appendChild(translationDiv);
        container.appendChild(rowDiv);
    });

    if (data.length === 0) {
        container.innerHTML = '<div id="loadingMessage">データが存在しません。</div>';
    }
}

function renderAbbrList(data) {
    const contentContainer = document.getElementById("abbrContent");
    if (!contentContainer) return;

    contentContainer.innerHTML = "";

    if (data.length === 0) {
        contentContainer.innerHTML = '<p>（略記一覧のデータが存在しませんでした）</p>';
        return;
    }

    data.forEach(row => {
        const [colA, colB, colC] = row;

        if (colA && !isNaN(parseInt(colA))) {
            const titleDiv = document.createElement("div");
            titleDiv.classList.add("abbr-title");
            titleDiv.textContent = colB;
            contentContainer.appendChild(titleDiv);
        } else {
            const rowDiv = document.createElement("div");
            rowDiv.classList.add("abbr-row");

            const shortSpan = document.createElement("span");
            shortSpan.classList.add("abbr-short");
            shortSpan.textContent = colB;

            const longSpan = document.createElement("span");
            longSpan.classList.add("abbr-long");
            longSpan.textContent = colC;

            rowDiv.appendChild(shortSpan);
            rowDiv.appendChild(longSpan);
            contentContainer.appendChild(rowDiv);
        }
    });
}

function renderNotes(data) {
    // カスタム順でソート
    data.sort((a, b) => compareGermanStrings(a[0], b[0]));

    const container = document.getElementById("notesContainer");
    container.innerHTML = "";

    const anchorSet = {};

    data.forEach(row => {
        const [german, translation] = row;

        const rowDiv = document.createElement("div");
        rowDiv.classList.add("row");

        if (german && typeof german === "string") {
            const anchorLetter = getSortLetter(german);
            if (anchorLetter && customOrder.includes(anchorLetter) && !anchorSet[anchorLetter]) {
                rowDiv.id = "letter-" + anchorLetter;
                anchorSet[anchorLetter] = true;
            }
        }

        const germanDiv = document.createElement("div");
        germanDiv.classList.add("german");
        germanDiv.textContent = german;

        const translationDiv = document.createElement("div");
        translationDiv.classList.add("translation");
        translationDiv.textContent = translation;

        rowDiv.appendChild(germanDiv);
        rowDiv.appendChild(translationDiv);

        container.appendChild(rowDiv);
    });

    if (data.length === 0) {
        container.innerHTML = '<div class="result-message">データが存在しません。</div>';
    }
}
=======
/**
 * data_page_common.js
 * list.html, dic.html, notes.html 共通のクライアントサイドロジック
 * 
 * - ページ読み込み時にデータを取得
 * - データのレンダリング (ページごとに異なるロジックを分岐またはコールバックで処理)
 * - アルファベット順ソート
 */

const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxWl-KLwo8SnOyqQT84gJyrofRQnIp_GBv8Pg0N5athPAoxp9LBuwj0HDTXkFqh0xiGsw/exec';

// カスタム順用アルファベット配列
const customOrder = [
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K",
    "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U",
    "V", "W", "X", "Y", "Z"
];

function getOrder(letter) {
    const idx = customOrder.indexOf(letter);
    return idx === -1 ? 999 : idx;
}

function normalizeGermanForSort(text) {
    if (typeof text !== "string") return "";
    const trimmed = text.trim();
    if (!trimmed) return "";
    const normalized = typeof trimmed.normalize === "function" ? trimmed.normalize("NFD") : trimmed;
    return normalized.replace(/[\u0300-\u036f]/g, "").replace(/ß/gi, "ss");
}

function getSortLetter(text) {
    return normalizeGermanForSort(text).charAt(0).toUpperCase();
}

function compareGermanStrings(a, b) {
    const letterA = getSortLetter(a);
    const letterB = getSortLetter(b);
    const orderDiff = getOrder(letterA) - getOrder(letterB);
    if (orderDiff !== 0) return orderDiff;

    const textA = (a || "").toString().trim();
    const textB = (b || "").toString().trim();
    if (typeof textA.localeCompare === "function") {
        return textA.localeCompare(textB, "de", { sensitivity: "base" });
    }
    if (textA === textB) return 0;
    return textA > textB ? 1 : -1;
}

document.addEventListener("DOMContentLoaded", function () {
    const pageType = getPageType();

    if (pageType === 'list') {
        fetchData('getListData', renderList);
        fetchData('getAbbrListData', renderAbbrList);
    } else if (pageType === 'dic') {
        fetchData('getDicData', renderList);
        fetchData('getAbbrListData', renderAbbrList);
    } else if (pageType === 'notes') {
        fetchData('getNotesData', renderNotes);
    }
});

function getPageType() {
    if (document.title.includes('訳出についての覚書')) return 'notes';
    if (document.title.includes('用語集')) return 'dic';
    return 'list'; // Default to list (マーラー以外のドイツ語)
}

async function fetchData(action, renderCallback) {
    try {
        const params = new URLSearchParams({ action: action });
        const response = await fetch(`${GAS_API_URL}?${params.toString()}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        renderCallback(data);
    } catch (error) {
        console.error(`Error fetching data for ${action}:`, error);
        const loadingEl = document.getElementById("loadingMessage") || document.getElementById("abbrContent");
        if (loadingEl) {
            loadingEl.innerHTML = `<p class="error">データの取得に失敗しました。<br>${error.message}</p>`;
        }
    }
}

function renderList(data) {
    // 頭文字をカスタム順でソート
    data.sort((a, b) => compareGermanStrings(a[0], b[0]));

    const container = document.getElementById("listContainer");
    container.innerHTML = "";

    const anchorSet = {};
    data.forEach(row => {
        const [german, translation, source] = row;

        const rowDiv = document.createElement("div");
        rowDiv.classList.add("row");

        // アンカー割り当て (A, Ä, B...Z)
        if (german && typeof german === "string") {
            const anchorLetter = getSortLetter(german);
            if (anchorLetter && customOrder.includes(anchorLetter) && !anchorSet[anchorLetter]) {
                rowDiv.id = "letter-" + anchorLetter;
                anchorSet[anchorLetter] = true;
            }
        }

        // ドイツ語
        const germanWrapper = document.createElement("div");
        const germanSpan = document.createElement("span");
        germanSpan.classList.add("german");
        germanSpan.textContent = german;

        const sourceSpan = document.createElement("span");
        sourceSpan.classList.add("source");
        sourceSpan.textContent = source || ""; // source might be undefined in dic.html context if not present

        germanWrapper.appendChild(germanSpan);
        germanWrapper.appendChild(sourceSpan);
        rowDiv.appendChild(germanWrapper);

        // 日本語
        const translationDiv = document.createElement("div");
        translationDiv.classList.add("translation");
        translationDiv.textContent = translation;

        rowDiv.appendChild(translationDiv);
        container.appendChild(rowDiv);
    });

    if (data.length === 0) {
        container.innerHTML = '<div id="loadingMessage">データが存在しません。</div>';
    }
}

function renderAbbrList(data) {
    const contentContainer = document.getElementById("abbrContent");
    if (!contentContainer) return;

    contentContainer.innerHTML = "";

    if (data.length === 0) {
        contentContainer.innerHTML = '<p>（略記一覧のデータが存在しませんでした）</p>';
        return;
    }

    data.forEach(row => {
        const [colA, colB, colC] = row;

        if (colA && !isNaN(parseInt(colA))) {
            const titleDiv = document.createElement("div");
            titleDiv.classList.add("abbr-title");
            titleDiv.textContent = colB;
            contentContainer.appendChild(titleDiv);
        } else {
            const rowDiv = document.createElement("div");
            rowDiv.classList.add("abbr-row");

            const shortSpan = document.createElement("span");
            shortSpan.classList.add("abbr-short");
            shortSpan.textContent = colB;

            const longSpan = document.createElement("span");
            longSpan.classList.add("abbr-long");
            longSpan.textContent = colC;

            rowDiv.appendChild(shortSpan);
            rowDiv.appendChild(longSpan);
            contentContainer.appendChild(rowDiv);
        }
    });
}

function renderNotes(data) {
    // カスタム順でソート
    data.sort((a, b) => compareGermanStrings(a[0], b[0]));

    const container = document.getElementById("notesContainer");
    container.innerHTML = "";

    const anchorSet = {};

    data.forEach(row => {
        const [german, translation] = row;

        const rowDiv = document.createElement("div");
        rowDiv.classList.add("row");

        if (german && typeof german === "string") {
            const anchorLetter = getSortLetter(german);
            if (anchorLetter && customOrder.includes(anchorLetter) && !anchorSet[anchorLetter]) {
                rowDiv.id = "letter-" + anchorLetter;
                anchorSet[anchorLetter] = true;
            }
        }

        const germanDiv = document.createElement("div");
        germanDiv.classList.add("german");
        germanDiv.textContent = german;

        const translationDiv = document.createElement("div");
        translationDiv.classList.add("translation");
        translationDiv.textContent = translation;

        rowDiv.appendChild(germanDiv);
        rowDiv.appendChild(translationDiv);

        container.appendChild(rowDiv);
    });

    if (data.length === 0) {
        container.innerHTML = '<div class="result-message">データが存在しません。</div>';
    }
}
>>>>>>> c089ea6c48b46bfc5afc4ce2c6bc248243de0441
