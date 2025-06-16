
let allQuizzes = {};
let currentQuiz = null;
let selectedQuizId = null;
let currentPlayer = 0;
let playerScores = [];
let answeredQuestions = new Set();
let isTestMode = false;

function loadQuizzes() {
    try {
        allQuizzes = JSON.parse(localStorage.getItem('allQuizzes') || '{}');
    } catch (e) {
        console.warn("題庫讀取失敗，重置為預設。");
        allQuizzes = {};
    }

    if (Object.keys(allQuizzes).length === 0) {
        allQuizzes = {
            'default': {
                id: 'default',
                name: '預設題庫',
                questions: []
            }
        };
    }

    selectedQuizId = localStorage.getItem('selectedQuizId') || 'default';
    if (!allQuizzes[selectedQuizId]) selectedQuizId = 'default';
    currentQuiz = allQuizzes[selectedQuizId];
    saveQuizzes();
    populateQuizSelect();
    renderQuestionList();
}

function saveQuizzes() {
    localStorage.setItem('allQuizzes', JSON.stringify(allQuizzes));
    localStorage.setItem('selectedQuizId', selectedQuizId);
}

function populateQuizSelect() {
    const select = document.getElementById('quiz-select');
    select.innerHTML = '';
    Object.values(allQuizzes).forEach(q => {
        const opt = document.createElement('option');
        opt.value = q.id;
        opt.textContent = q.name;
        if (q.id === selectedQuizId) opt.selected = true;
        select.appendChild(opt);
    });
}

function renderQuestionList() {
    const list = document.getElementById('question-list');
    if (!list || !currentQuiz) return;
    list.innerHTML = '';
    currentQuiz.questions.forEach((q, i) => {
        const li = document.createElement('li');
        li.textContent = q.text;
        list.appendChild(li);
    });
}

function displayQuestion(question, cardIndex = -1) {
    const modal = document.getElementById('question-modal');
    const text = document.getElementById('question-text');
    const answerContainer = document.getElementById('answer-options');

    text.textContent = question.text;
    answerContainer.innerHTML = '';

    if (question.type === 'true_false') {
        ['是', '否'].forEach(opt => {
            const btn = document.createElement('button');
            btn.textContent = opt;
            btn.onclick = () => handleAnswer(opt === '是', question.answer, cardIndex);
            answerContainer.appendChild(btn);
        });
    } else if (question.type === 'multiple_choice') {
        question.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.textContent = opt;
            btn.onclick = () => handleAnswer(opt, question.answer, cardIndex);
            answerContainer.appendChild(btn);
        });
    } else {
        const input = document.createElement('input');
        const btn = document.createElement('button');
        btn.textContent = '送出';
        btn.onclick = () => handleAnswer(input.value, question.answer, cardIndex);
        answerContainer.appendChild(input);
        answerContainer.appendChild(btn);
    }

    modal.style.display = 'block';
}

function hideQuestionModal() {
    document.getElementById('question-modal').style.display = 'none';
}

function handleAnswer(given, correct, cardIndex) {
    const isCorrect = (typeof correct === 'boolean') ? (given === correct) : (given.toString().trim() === correct.toString().trim());
    if (!answeredQuestions.has(cardIndex) && cardIndex !== -1) {
        answeredQuestions.add(cardIndex);
        document.querySelector(`[data-index="${cardIndex}"]`).classList.add('answered');
    }

    if (isCorrect) playerScores[currentPlayer]++;
    updatePlayerInfo();

    setTimeout(() => {
        hideQuestionModal();
        nextTurn();
    }, 3000);
}

function startGame() {
    const numPlayers = parseInt(document.getElementById('num-players').value);
    const numQuestions = parseInt(document.getElementById('num-questions').value);
    currentPlayer = 0;
    playerScores = new Array(numPlayers).fill(0);
    answeredQuestions.clear();
    isTestMode = false;

    const board = document.getElementById('game-board');
    board.innerHTML = '';
    for (let i = 0; i < numQuestions; i++) {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.textContent = '?';
        card.dataset.index = i;
        card.onclick = () => {
            if (answeredQuestions.has(i)) return;
            const q = currentQuiz.questions[i % currentQuiz.questions.length];
            displayQuestion(q, i);
        };
        board.appendChild(card);
    }

    updatePlayerInfo();
}

function startTestMode() {
    isTestMode = true;
    currentPlayer = 0;
    playerScores = [0];
    const board = document.getElementById('game-board');
    board.innerHTML = '';

    const q = currentQuiz.questions[Math.floor(Math.random() * currentQuiz.questions.length)];
    displayQuestion(q, -1);
}

function updatePlayerInfo() {
    const info = document.getElementById('player-info');
    info.textContent = `目前是玩家 ${currentPlayer + 1} 回合，分數：${playerScores.join(' / ')}`;
}

function nextTurn() {
    if (!isTestMode) {
        currentPlayer = (currentPlayer + 1) % playerScores.length;
        updatePlayerInfo();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadQuizzes();
    document.getElementById('start-game-btn').onclick = startGame;
    document.getElementById('start-test-btn').onclick = startTestMode;
    document.getElementById('quiz-select').onchange = (e) => {
        selectedQuizId = e.target.value;
        currentQuiz = allQuizzes[selectedQuizId];
        saveQuizzes();
        renderQuestionList();
    };
});
