
let allQuizzes = {};
let currentQuiz = null;
let selectedQuizId = null;

function loadQuizzes() {
    try {
        allQuizzes = JSON.parse(localStorage.getItem('allQuizzes') || '{}');
    } catch (e) {
        console.warn("題庫讀取失敗，將重置為預設題庫。");
        allQuizzes = {};
    }

    if (!allQuizzes || Object.keys(allQuizzes).length === 0) {
        allQuizzes = {
            'default': {
                id: 'default',
                name: '預設題庫',
                questions: []
            }
        };
        saveQuizzes();
    }

    selectedQuizId = localStorage.getItem('selectedQuizId') || 'default';
    if (!allQuizzes[selectedQuizId]) selectedQuizId = 'default';
    currentQuiz = allQuizzes[selectedQuizId];
}

function saveQuizzes() {
    localStorage.setItem('allQuizzes', JSON.stringify(allQuizzes));
    localStorage.setItem('selectedQuizId', selectedQuizId);
}

// 基本初始化（實際應包含更多功能，但為示範修正重點）
document.addEventListener("DOMContentLoaded", () => {
    loadQuizzes();
});
