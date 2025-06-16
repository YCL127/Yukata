// script.js

// --- 遊戲狀態變數（這些變數不直接操作 DOM，因此可以保留在全局範圍）---
let players = [];
let currentPlayerIndex = 0;
let currentQuestions = [];
let answeredQuestions = new Set();
let allQuizzes = {};
let selectedQuizId = 'default';
let currentQuiz = { name: '預設題庫', questions: [] };

// 預設的遊戲題目數據（僅用於首次載入或沒有任何本地題庫時）
const defaultQuestions = [
    {
        question: "哪種動物以其長脖子而聞名？",
        answer: "長頸鹿",
        points: 10,
        type: 'normal_question'
    },
    {
        question: "地球上最大的海洋是什麼？",
        answer: "太平洋",
        points: 20,
        type: 'normal_question'
    },
    {
        question: "哪個國家有金字塔？",
        answer: "埃及",
        points: 15,
        type: 'normal_question'
    },
    {
        question: "水的化學式是什麼？",
        answer: "H2O",
        points: 25,
        type: 'normal_question'
    },
    {
        question: "太陽系的第四顆行星是什麼？",
        answer: "火星",
        points: 10,
        type: 'normal_question'
    },
    // 新增選擇題範例
    {
        question: "香蕉是什麼顏色？",
        options: ["紅色", "綠色", "黃色", "藍色"],
        correct_answer_index: 2, // 0-based index, 黃色是選項 3
        points: 15,
        type: 'multiple_choice'
    },
    {
        question: "請問台灣的首都在哪裡？",
        options: ["台中", "台南", "台北", "高雄"],
        correct_answer_index: 2,
        points: 20,
        type: 'multiple_choice'
    },
    // 新增事件卡範例
    {
        type: 'event_card',
        event_description: "恭喜！您獲得了額外點數！",
        event_points: 30
    },
    {
        type: 'event_card',
        event_description: "很可惜，您失去了部分點數。",
        event_points: -20
    }
];


// --- 輔助函數 (這些函數不直接操作 DOM，或者它們的 DOM 操作會通過參數傳遞或在 DOMContentLoaded 內部調用) ---

function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function saveQuizzes() {
    localStorage.setItem('allQuizzes', JSON.stringify(allQuizzes));
}

function loadQuizzes() {
    const storedQuizzes = localStorage.getItem('allQuizzes');
    if (storedQuizzes) {
        allQuizzes = JSON.parse(storedQuizzes);
    } else {
        allQuizzes = {
            'default': {
                id: 'default',
                name: '預設題庫',
                questions: defaultQuestions
            }
        };
        saveQuizzes();
    }
    // 確保 currentQuiz 總是有效的
    if (allQuizzes[selectedQuizId]) {
        currentQuiz = allQuizzes[selectedQuizId];
    } else {
        selectedQuizId = 'default';
        currentQuiz = allQuizzes['default'];
    }
}

// 注意：populateQuizSelect, renderQuizList, initializeGame, resetGame, updatePlayerInfo,
// renderGameBoard, handleCardClick, displayQuestion 等函數內部會使用 DOM 元素。
// 因此，它們需要在 DOM 元素獲取之後才能被調用。
// 如果這些函數是在 DOMContentLoaded 之外定義的，當它們被調用時，
// 需要確保其內部使用的 DOM 變數（如 questionModal, gameBoard 等）是正確的。
// 最好的方法是將它們定義在 DOMContentLoaded 內部，或確保 DOM 變數是全局可訪問的。
// 在此提供版本中，這些函數仍保留在外部，但它們的 DOM 互動會依賴於 DOMContentLoaded 內部獲取的變數，
// 因此這些變數需要在函數內部再次獲取，或者通過參數傳遞。
// 為了簡潔和避免重複獲取，更常見的做法是將這些函數也移動到 DOMContentLoaded 內部。
// 但由於這些函數較長，為避免一次性改動過大，我們將它們保留在外部，並在需要時確保 DOM 元素被正確引用。


function initializeGame() {
    // 確保有選中的題庫且題庫中有題目
    if (!currentQuiz || currentQuiz.questions.length === 0) {
        alert('請選擇一個包含題目的題庫！');
        return;
    }

    const numPlayersInput = document.getElementById('num-players');
    const numQuestionsInput = document.getElementById('num-questions');
    const gameSettings = document.getElementById('game-settings');
    const gameContainer = document.getElementById('game-container');

    const numPlayers = parseInt(numPlayersInput.value);
    const numQuestions = parseInt(numQuestionsInput.value);

    players = [];
    for (let i = 0; i < numPlayers; i++) {
        players.push({ id: i, score: 0 });
    }
    currentPlayerIndex = 0;
    answeredQuestions.clear();

    // 隨機選取題目，並確保有足夠的題目
    const shuffledQuestions = shuffleArray([...currentQuiz.questions]);
    currentQuestions = shuffledQuestions.slice(0, Math.min(numQuestions, shuffledQuestions.length));

    // 如果選出的題目不足，提醒用戶
    if (currentQuestions.length < numQuestions) {
        alert(`題庫中只有 ${currentQuestions.length} 題，將以此數量進行遊戲。`);
    }

    // 隱藏設定並顯示遊戲區
    if (gameSettings) gameSettings.style.display = 'none';
    if (gameContainer) gameContainer.style.display = 'flex'; // 使用 flex 來保持內容置中

    updatePlayerInfo();
    renderGameBoard(currentQuestions.length);
}

function resetGame() {
    players = [];
    currentPlayerIndex = 0;
    currentQuestions = [];
    answeredQuestions.clear();

    const gameSettings = document.getElementById('game-settings');
    const gameContainer = document.getElementById('game-container');
    const gameBoard = document.getElementById('game-board');

    if (gameSettings) gameSettings.style.display = 'block';
    if (gameContainer) gameContainer.style.display = 'none';

    // 清空遊戲板
    if (gameBoard) gameBoard.innerHTML = '';

    // 重新填充題庫下拉選單和題目列表
    populateQuizSelect();
    renderQuizList();
}


function updatePlayerInfo() {
    const currentPlayerDisplay = document.getElementById('current-player-display');
    const playerScoresContainer = document.getElementById('player-scores');

    if (currentPlayerDisplay) currentPlayerDisplay.textContent = `當前玩家: 玩家 ${currentPlayerIndex + 1}`;

    if (playerScoresContainer) {
        playerScoresContainer.innerHTML = players.map((player, index) =>
            `<div class="player-score" id="player-score-${index}">玩家 ${index + 1}: ${player.score} 點</div>`
        ).join('');
    }
}

function renderGameBoard(numCards) {
    const gameBoard = document.getElementById('game-board');
    if (gameBoard) {
        gameBoard.innerHTML = ''; // 清空現有卡片
        for (let i = 0; i < numCards; i++) {
            const card = document.createElement('div');
            card.classList.add('question-card');
            card.dataset.index = i;
            card.textContent = i + 1; // 卡片上的數字
            card.addEventListener('click', handleCardClick);
            gameBoard.appendChild(card);
        }
    }
}

function handleCardClick(event) {
    const card = event.target;
    const cardIndex = parseInt(card.dataset.index);

    if (answeredQuestions.has(cardIndex)) {
        alert('這張卡片已經被翻過了！');
        return;
    }

    const question = currentQuestions[cardIndex];
    if (question) {
        displayQuestion(question, cardIndex);
    }
}


function displayQuestion(question, cardIndex) {
    const questionModal = document.getElementById('question-modal');
    const questionTextElement = document.getElementById('question-text');
    const showAnswerButton = document.getElementById('show-answer-button');
    const correctAnswerDisplay = document.getElementById('correct-answer-display');
    const judgmentButtons = document.querySelector('.judgment-buttons');
    const markCorrectButton = document.getElementById('mark-correct-button');
    const markIncorrectButton = document.getElementById('mark-incorrect-button');
    const feedbackElement = document.getElementById('feedback');
    const multipleChoiceOptionsContainer = document.getElementById('multiple-choice-options');

    // 重置模態框內容
    if (questionTextElement) questionTextElement.textContent = '';
    if (correctAnswerDisplay) correctAnswerDisplay.style.display = 'none';
    if (judgmentButtons) judgmentButtons.style.display = 'none';
    if (feedbackElement) feedbackElement.textContent = '';
    if (showAnswerButton) showAnswerButton.style.display = 'block';
    if (multipleChoiceOptionsContainer) multipleChoiceOptionsContainer.innerHTML = '';
    if (multipleChoiceOptionsContainer) multipleChoiceOptionsContainer.style.display = 'none';

    if (questionModal) questionModal.style.display = 'block';
    if (questionModal) questionModal.classList.add('show-modal'); // 為了動畫效果

    if (question.type === 'normal_question') {
        if (questionTextElement) questionTextElement.textContent = question.question;
        if (showAnswerButton) {
            showAnswerButton.onclick = () => {
                if (correctAnswerDisplay) {
                    correctAnswerDisplay.textContent = `答案：${question.answer}`;
                    correctAnswerDisplay.style.display = 'block';
                }
                if (judgmentButtons) judgmentButtons.style.display = 'flex';
                if (showAnswerButton) showAnswerButton.style.display = 'none';
            };
        }
        if (markCorrectButton) markCorrectButton.onclick = () => markAnswer(true, question.points, cardIndex);
        if (markIncorrectButton) markIncorrectButton.onclick = () => markAnswer(false, 0, cardIndex);

    } else if (question.type === 'multiple_choice') {
        if (questionTextElement) questionTextElement.textContent = question.question;
        if (showAnswerButton) showAnswerButton.style.display = 'none'; // 選擇題直接顯示選項
        renderMultipleChoiceOptions(question.options, question.correct_answer_index, question.points, cardIndex);

    } else if (question.type === 'event_card') {
        if (questionTextElement) questionTextElement.textContent = `事件卡：${question.event_description}`;
        if (showAnswerButton) showAnswerButton.style.display = 'none'; // 事件卡沒有答案
        if (judgmentButtons) judgmentButtons.style.display = 'none'; // 事件卡沒有判斷按鈕
        applyEventCardEffect(question);
        markCardAsAnswered(cardIndex); // 事件卡直接標記為已回答
        setTimeout(() => {
            hideQuestionModal();
            nextTurn();
        }, 2000); // 2秒後自動關閉模態框並進入下一回合
    }
}


function renderMultipleChoiceOptions(options, correctIndex, points, cardIndex) {
    const multipleChoiceOptionsContainer = document.getElementById('multiple-choice-options');
    if (multipleChoiceOptionsContainer) {
        multipleChoiceOptionsContainer.innerHTML = '';
        multipleChoiceOptionsContainer.style.display = 'flex'; // 顯示容器

        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.classList.add('mc-option-button');
            button.textContent = `${String.fromCharCode(65 + index)}. ${option}`; // A, B, C, D
            button.dataset.optionIndex = index;
            button.addEventListener('click', (event) => handleOptionClick(event, correctIndex, points, cardIndex));
            multipleChoiceOptionsContainer.appendChild(button);
        });
    }
}

function handleOptionClick(event, correctIndex, points, cardIndex) {
    const selectedOptionIndex = parseInt(event.target.dataset.optionIndex);
    const feedbackElement = document.getElementById('feedback');

    // 禁用所有選項按鈕，防止重複點擊
    const optionButtons = document.querySelectorAll('.mc-option-button');
    optionButtons.forEach(btn => btn.disabled = true);

    if (selectedOptionIndex === correctIndex) {
        if (feedbackElement) {
            feedbackElement.textContent = '正確！';
            feedbackElement.style.color = 'green';
        }
        markAnswer(true, points, cardIndex);
    } else {
        if (feedbackElement) {
            feedbackElement.textContent = `錯誤。正確答案是 ${String.fromCharCode(65 + correctIndex)}.`;
            feedbackElement.style.color = 'red';
        }
        markAnswer(false, 0, cardIndex);
    }
    // 等待一段時間後關閉模態框並進入下一回合
    setTimeout(() => {
        hideQuestionModal();
        nextTurn();
    }, 1500); // 1.5秒後自動關閉
}


function markAnswer(isCorrect, points, cardIndex) {
    const feedbackElement = document.getElementById('feedback');
    if (isCorrect) {
        players[currentPlayerIndex].score += points;
        if (feedbackElement) {
            feedbackElement.textContent = `正確！獲得 ${points} 點。`;
            feedbackElement.style.color = 'green';
        }
    } else {
        if (feedbackElement) {
            feedbackElement.textContent = '錯誤。';
            feedbackElement.style.color = 'red';
        }
    }
    updatePlayerInfo();
    markCardAsAnswered(cardIndex);
    // 等待一段時間後關閉模態框並進入下一回合
    setTimeout(() => {
        hideQuestionModal();
        nextTurn();
    }, 1500); // 1.5秒後自動關閉
}

function applyEventCardEffect(eventCard) {
    const feedbackElement = document.getElementById('feedback');
    players[currentPlayerIndex].score += eventCard.event_points;
    if (feedbackElement) {
        feedbackElement.textContent = `${eventCard.event_description} 點數變化：${eventCard.event_points}`;
        feedbackElement.style.color = eventCard.event_points > 0 ? 'green' : 'red';
    }
    updatePlayerInfo();
}

function hideQuestionModal() {
    const questionModal = document.getElementById('question-modal');
    if (questionModal) {
        questionModal.classList.remove('show-modal');
        setTimeout(() => {
            questionModal.style.display = 'none';
        }, 300); // 與 CSS 過渡時間匹配
    }
}

function updatePlayerScores() {
    const playerScoresContainer = document.getElementById('player-scores');
    if (playerScoresContainer) {
        playerScoresContainer.innerHTML = '';
        players.forEach((player, index) => {
            const playerScoreDiv = document.createElement('div');
            playerScoreDiv.classList.add('player-score');
            playerScoreDiv.textContent = `玩家 ${index + 1}: ${player.score} 點`;
            playerScoresContainer.appendChild(playerScoreDiv);
        });
    }
}

function markCardAsAnswered(index) {
    answeredQuestions.add(index);
    const card = document.querySelector(`.question-card[data-index="${index}"]`);
    if (card) {
        card.classList.add('answered');
        card.removeEventListener('click', handleCardClick); // 移除事件監聽器防止再次點擊
    }
}

function nextTurn() {
    if (answeredQuestions.size === currentQuestions.length) {
        endGame();
        return;
    }

    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    updatePlayerInfo();
}

function endGame() {
    const finalScoreModal = document.getElementById('final-score-modal');
    const finalScoresDisplay = document.getElementById('final-scores-display');
    if (finalScoreModal) {
        finalScoreModal.style.display = 'block';
        finalScoreModal.classList.add('show-modal');
    }

    if (finalScoresDisplay) {
        finalScoresDisplay.innerHTML = '';
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        sortedPlayers.forEach((player, index) => {
            const playerFinalScoreDiv = document.createElement('div');
            playerFinalScoreDiv.classList.add('player-final-score');
            playerFinalScoreDiv.textContent = `玩家 ${player.id + 1}: ${player.score} 點`;
            if (index === 0) { // 最高分玩家
                playerFinalScoreDiv.classList.add('winner');
            }
            finalScoresDisplay.appendChild(playerFinalScoreDiv);
        });
    }
}

function saveQuestion() {
    const currentSelectedQuiz = allQuizzes[selectedQuizId];
    if (!currentSelectedQuiz) {
        alert("無選中題庫，無法儲存題目。");
        return;
    }

    let newQuestion = {};
    const type = document.getElementById('question-type-select').value;
    newQuestion.type = type;

    const questionInput = document.getElementById('question-input');
    const answerInput = document.getElementById('answer-input');
    const mcQuestionInput = document.getElementById('mc-question-input');
    const option1Input = document.getElementById('option1-input');
    const option2Input = document.getElementById('option2-input');
    const option3Input = document.getElementById('option3-input');
    const option4Input = document.getElementById('option4-input');
    const correctOptionSelect = document.getElementById('correct-option-select');
    const eventDescriptionInput = document.getElementById('event-description-input');
    const eventPointsInput = document.getElementById('event-points-input');
    const pointsInput = document.getElementById('points-input');


    // 獲取分數，事件卡除外
    if (type !== 'event_card') {
        const points = parseInt(pointsInput.value);
        if (isNaN(points) || points <= 0) {
            alert("請輸入有效的題目分數 (大於 0)。");
            return;
        }
        newQuestion.points = points;
    }

    if (type === 'normal_question') {
        const questionText = questionInput.value.trim();
        const answerText = answerInput.value.trim();
        if (!questionText || !answerText) {
            alert("標準題目的題目和答案不能為空。");
            return;
        }
        newQuestion.question = questionText;
        newQuestion.answer = answerText;
    } else if (type === 'multiple_choice') {
        const mcQuestionText = mcQuestionInput.value.trim();
        const option1 = option1Input.value.trim();
        const option2 = option2Input.value.trim();
        const option3 = option3Input.value.trim();
        const option4 = option4Input.value.trim();
        const correctOptionIndex = parseInt(correctOptionSelect.value);

        if (!mcQuestionText || !option1 || !option2 || !option3 || !option4) {
            alert("選擇題的所有欄位都不能為空。");
            return;
        }
        newQuestion.question = mcQuestionText;
        newQuestion.options = [option1, option2, option3, option4];
        newQuestion.correct_answer_index = correctOptionIndex;
    } else if (type === 'event_card') {
        const eventDescription = eventDescriptionInput.value.trim();
        const eventPoints = parseInt(eventPointsInput.value);
        if (!eventDescription || isNaN(eventPoints)) {
            alert("事件卡描述不能為空，點數必須是有效數字。");
            return;
        }
        newQuestion.event_description = eventDescription;
        newQuestion.event_points = eventPoints;
    }

    currentQuiz.questions.push(newQuestion);
    saveQuizzes();
    renderQuizList();
    cancelAddQuestion(); // 清空表單並隱藏
}


function cancelAddQuestion() {
    const addQuestionToQuizSection = document.getElementById('add-question-to-quiz-section');
    const questionInput = document.getElementById('question-input');
    const answerInput = document.getElementById('answer-input');
    const mcQuestionInput = document.getElementById('mc-question-input');
    const option1Input = document.getElementById('option1-input');
    const option2Input = document.getElementById('option2-input');
    const option3Input = document.getElementById('option3-input');
    const option4Input = document.getElementById('option4-input');
    const eventDescriptionInput = document.getElementById('event-description-input');
    const eventPointsInput = document.getElementById('event-points-input');
    const pointsInput = document.getElementById('points-input');
    const questionTypeSelect = document.getElementById('question-type-select');
    const normalQuestionInputs = document.getElementById('normal-question-inputs');
    const multipleChoiceInputs = document.getElementById('multiple-choice-inputs');
    const eventCardInputs = document.getElementById('event-card-inputs');
    const multipleChoiceOptionsContainer = document.getElementById('multiple-choice-options');

    if (addQuestionToQuizSection) {
        addQuestionToQuizSection.style.display = 'none';
    }
    // 清空所有輸入框
    if (questionInput) questionInput.value = '';
    if (answerInput) answerInput.value = '';
    if (mcQuestionInput) mcQuestionInput.value = '';
    if (option1Input) option1Input.value = '';
    if (option2Input) option2Input.value = '';
    if (option3Input) option3Input.value = '';
    if (option4Input) option4Input.value = '';
    if (eventDescriptionInput) eventDescriptionInput.value = '';
    if (eventPointsInput) eventPointsInput.value = '0';
    if (pointsInput) pointsInput.value = '10';
    if (questionTypeSelect) questionTypeSelect.value = 'normal_question';

    // 隱藏所有題目類型輸入框
    if (normalQuestionInputs) normalQuestionInputs.style.display = 'none';
    if (multipleChoiceInputs) multipleChoiceInputs.style.display = 'none';
    if (eventCardInputs) eventCardInputs.style.display = 'none';
    if (multipleChoiceOptionsContainer) multipleChoiceOptionsContainer.style.display = 'none'; // 隱藏選擇題按鈕容器
}

function renderQuizList() {
    const quizQuestionList = document.getElementById('quiz-question-list');
    if (quizQuestionList) {
        quizQuestionList.innerHTML = '';
        currentQuiz.questions.forEach((q, index) => {
            const item = document.createElement('li');
            let displayContent = '';
            switch (q.type) {
                case 'normal_question':
                    displayContent = `[標準題 ${q.points}點] Q: ${q.question}`;
                    break;
                case 'multiple_choice':
                    displayContent = `[選擇題 ${q.points}點] Q: ${q.question} (A:${q.options[0]} B:${q.options[1]} C:${q.options[2]} D:${q.options[3]} 答:${String.fromCharCode(65 + q.correct_answer_index)})`;
                    break;
                case 'event_card':
                    displayContent = `[事件卡 ${q.event_points >= 0 ? '+' : ''}${q.event_points}點] 事件: ${q.event_description}`;
                    break;
            }
            item.innerHTML = `
                ${displayContent}
                <div class="item-actions">
                    <button onclick="editQuestion(${index})">編輯</button>
                    <button onclick="deleteQuestion(${index})">刪除</button>
                </div>
            `;
            quizQuestionList.appendChild(item);
        });
    }
}

function editQuestion(index) {
    const question = currentQuiz.questions[index];
    if (!question) return;

    // 顯示新增題目區塊
    const addQuestionToQuizSection = document.getElementById('add-question-to-quiz-section');
    if (addQuestionToQuizSection) {
        addQuestionToQuizSection.style.display = 'block';
    }

    // 獲取所有輸入元素
    const questionTypeSelect = document.getElementById('question-type-select');
    const normalQuestionInputs = document.getElementById('normal-question-inputs');
    const questionInput = document.getElementById('question-input');
    const answerInput = document.getElementById('answer-input');
    const multipleChoiceInputs = document.getElementById('multiple-choice-inputs');
    const mcQuestionInput = document.getElementById('mc-question-input');
    const option1Input = document.getElementById('option1-input');
    const option2Input = document.getElementById('option2-input');
    const option3Input = document.getElementById('option3-input');
    const option4Input = document.getElementById('option4-input');
    const correctOptionSelect = document.getElementById('correct-option-select');
    const eventCardInputs = document.getElementById('event-card-inputs');
    const eventDescriptionInput = document.getElementById('event-description-input');
    const eventPointsInput = document.getElementById('event-points-input');
    const pointsInput = document.getElementById('points-input');
    const buttonGroup = addQuestionToQuizSection ? addQuestionToQuizSection.querySelector('.button-group') : null;
    const saveQuestionButton = document.getElementById('save-question-button');

    // 隱藏所有輸入框
    if (normalQuestionInputs) normalQuestionInputs.style.display = 'none';
    if (multipleChoiceInputs) multipleChoiceInputs.style.display = 'none';
    if (eventCardInputs) eventCardInputs.style.display = 'none';

    // 填充並顯示對應的輸入框
    if (questionTypeSelect) questionTypeSelect.value = question.type;
    if (pointsInput) pointsInput.value = question.points || 10; // 預設值

    switch (question.type) {
        case 'normal_question':
            if (normalQuestionInputs) normalQuestionInputs.style.display = 'block';
            if (questionInput) questionInput.value = question.question;
            if (answerInput) answerInput.value = question.answer;
            if (pointsInput && pointsInput.parentElement) pointsInput.parentElement.style.display = 'flex';
            break;
        case 'multiple_choice':
            if (multipleChoiceInputs) multipleChoiceInputs.style.display = 'block';
            if (mcQuestionInput) mcQuestionInput.value = question.question;
            if (option1Input) option1Input.value = question.options[0];
            if (option2Input) option2Input.value = question.options[1];
            if (option3Input) option3Input.value = question.options[2];
            if (option4Input) option4Input.value = question.options[3];
            if (correctOptionSelect) correctOptionSelect.value = question.correct_answer_index;
            if (pointsInput && pointsInput.parentElement) pointsInput.parentElement.style.display = 'flex';
            break;
        case 'event_card':
            if (eventCardInputs) eventCardInputs.style.display = 'block';
            if (eventDescriptionInput) eventDescriptionInput.value = question.event_description;
            if (eventPointsInput) eventPointsInput.value = question.event_points;
            if (pointsInput && pointsInput.parentElement) pointsInput.parentElement.style.display = 'none'; // 事件卡不需要分數
            break;
    }

    if (buttonGroup) buttonGroup.style.display = 'flex';
    if (saveQuestionButton) {
        // 修改儲存按鈕的行為，使其能更新題目而不是新增
        // 臨時移除舊的事件監聽器以避免重複觸發
        saveQuestionButton.removeEventListener('click', saveQuestion);
        saveQuestionButton.onclick = () => { // 使用 onclick 直接覆蓋
            updateQuestion(index);
        };
    }
}

function updateQuestion(index) {
    const currentSelectedQuiz = allQuizzes[selectedQuizId];
    if (!currentSelectedQuiz) {
        alert("無選中題庫，無法更新題目。");
        return;
    }

    const question = currentQuiz.questions[index];
    const type = document.getElementById('question-type-select').value;
    question.type = type;

    const questionInput = document.getElementById('question-input');
    const answerInput = document.getElementById('answer-input');
    const mcQuestionInput = document.getElementById('mc-question-input');
    const option1Input = document.getElementById('option1-input');
    const option2Input = document.getElementById('option2-input');
    const option3Input = document.getElementById('option3-input');
    const option4Input = document.getElementById('option4-input');
    const correctOptionSelect = document.getElementById('correct-option-select');
    const eventDescriptionInput = document.getElementById('event-description-input');
    const eventPointsInput = document.getElementById('event-points-input');
    const pointsInput = document.getElementById('points-input');
    const saveQuestionButton = document.getElementById('save-question-button');


    if (type !== 'event_card') {
        const points = parseInt(pointsInput.value);
        if (isNaN(points) || points <= 0) {
            alert("請輸入有效的題目分數 (大於 0)。");
            return;
        }
        question.points = points;
    } else {
        delete question.points; // 事件卡移除分數屬性
    }

    if (type === 'normal_question') {
        const questionText = questionInput.value.trim();
        const answerText = answerInput.value.trim();
        if (!questionText || !answerText) {
            alert("標準題目的題目和答案不能為空。");
            return;
        }
        question.question = questionText;
        question.answer = answerText;
        // 清除選擇題和事件卡的特有屬性
        delete question.options;
        delete question.correct_answer_index;
        delete question.event_description;
        delete question.event_points;
    } else if (type === 'multiple_choice') {
        const mcQuestionText = mcQuestionInput.value.trim();
        const option1 = option1Input.value.trim();
        const option2 = option2Input.value.trim();
        const option3 = document.getElementById('option3-input').value.trim();
        const option4 = document.getElementById('option4-input').value.trim();
        const correctOptionIndex = parseInt(correctOptionSelect.value);

        if (!mcQuestionText || !option1 || !option2 || !option3 || !option4) {
            alert("選擇題的所有欄位都不能為空。");
            return;
        }
        question.question = mcQuestionText;
        question.options = [option1, option2, option3, option4];
        question.correct_answer_index = correctOptionIndex;
        // 清除普通題和事件卡的特有屬性
        delete question.answer;
        delete question.event_description;
        delete question.event_points;
    } else if (type === 'event_card') {
        const eventDescription = eventDescriptionInput.value.trim();
        const eventPoints = parseInt(eventPointsInput.value);
        if (!eventDescription || isNaN(eventPoints)) {
            alert("事件卡描述不能為空，點數必須是有效數字。");
            return;
        }
        question.event_description = eventDescription;
        question.event_points = eventPoints;
        // 清除普通題和選擇題的特有屬性
        delete question.question;
        delete question.answer;
        delete question.options;
        delete question.correct_answer_index;
    }

    saveQuizzes();
    renderQuizList();
    cancelAddQuestion(); // 清空表單並隱藏

    // 恢復儲存按鈕的行為為新增題目
    if (saveQuestionButton) {
        saveQuestionButton.onclick = null; // 移除臨時的 onclick
        saveQuestionButton.addEventListener('click', saveQuestion);
    }
}


function deleteQuestion(index) {
    if (confirm('確定要刪除這道題目嗎？')) {
        currentQuiz.questions.splice(index, 1);
        saveQuizzes();
        renderQuizList();
    }
}

// Fisher-Yates (Knuth) shuffle algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}


// --- DOMContentLoaded 事件監聽器：確保 DOM 元素已完全載入後才執行相關操作 ---
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM 元素獲取 ---
    // 將所有 document.getElementById 或 querySelector 的呼叫都放在這裡面
    const startGameButton = document.getElementById('start-game-button');
    const numPlayersInput = document.getElementById('num-players');
    const numQuestionsInput = document.getElementById('num-questions');
    const gameSettings = document.getElementById('game-settings');
    const gameContainer = document.getElementById('game-container');
    const currentPlayerDisplay = document.getElementById('current-player-display');
    const playerScoresContainer = document.getElementById('player-scores');
    const gameBoard = document.getElementById('game-board');
    const questionModal = document.getElementById('question-modal');
    const closeButton = document.querySelector('.close-button');
    const questionTextElement = document.getElementById('question-text');
    const showAnswerButton = document.getElementById('show-answer-button');
    const correctAnswerDisplay = document.getElementById('correct-answer-display');
    const judgmentButtons = document.querySelector('.judgment-buttons');
    const markCorrectButton = document.getElementById('mark-correct-button');
    const markIncorrectButton = document.getElementById('mark-incorrect-button');
    const feedbackElement = document.getElementById('feedback');
    const finalScoreModal = document.getElementById('final-score-modal');
    const closeFinalScoreModalButton = document.getElementById('close-final-score-modal');
    const finalScoresDisplay = document.getElementById('final-scores-display');
    const restartGameButton = document.getElementById('restart-game-button');

    // --- 題庫管理 DOM 元素 ---
    const quizManagementSection = document.getElementById('quiz-management-section');
    const quizSelect = document.getElementById('quiz-select');
    const addQuizButton = document.getElementById('add-quiz-button');
    const deleteQuizButton = document.getElementById('delete-quiz-button');
    const importQuizButton = document.getElementById('import-quiz-button');
    const exportQuizButton = document.getElementById('export-quiz-button');
    const addQuestionToQuizSection = document.getElementById('add-question-to-quiz-section');
    const showAddQuestionSectionButton = document.getElementById('show-add-question-section-button');
    const questionTypeSelect = document.getElementById('question-type-select');

    // 新增題目相關的輸入框們
    const normalQuestionInputs = document.getElementById('normal-question-inputs');
    const questionInput = document.getElementById('question-input');
    const answerInput = document.getElementById('answer-input');

    const multipleChoiceInputs = document.getElementById('multiple-choice-inputs');
    const mcQuestionInput = document.getElementById('mc-question-input');
    const option1Input = document.getElementById('option1-input');
    const option2Input = document.getElementById('option2-input');
    const option3Input = document.getElementById('option3-input');
    const option4Input = document.getElementById('option4-input');
    const correctOptionSelect = document.getElementById('correct-option-select');
    const multipleChoiceOptionsContainer = document.getElementById('multiple-choice-options'); // 這個元素在 question-modal 裡

    const eventCardInputs = document.getElementById('event-card-inputs');
    const eventDescriptionInput = document.getElementById('event-description-input');
    const eventPointsInput = document.getElementById('event-points-input');

    const pointsInput = document.getElementById('points-input');
    const saveQuestionButton = document.getElementById('save-question-button');
    const cancelAddQuestionButton = document.getElementById('cancel-add-question-button');

    // 按鈕群組 (用於新增題目區塊的儲存/取消)
    const buttonGroup = addQuestionToQuizSection ? addQuestionToQuizSection.querySelector('.button-group') : null;


    // --- 函數定義：這些函數會直接操作到 DOM 元素，因此將它們定義在 DOMContentLoaded 內部 ---

    // 填充題目類型選擇器（如果有需要，或者只是用於初始化）
    function populateEventTypeSelect() {
        // 此函數目前似乎沒有在代碼中被調用或實現具體邏輯，如果需要可以添加。
        // 如果只是用 HTML 的 select options，則不需要此 JS 函數。
    }

    function populateQuizSelect() {
        if (quizSelect) {
            quizSelect.innerHTML = ''; // 清空現有選項
            for (const quizId in allQuizzes) {
                const option = document.createElement('option');
                option.value = quizId;
                option.textContent = allQuizzes[quizId].name;
                quizSelect.appendChild(option);
            }
            quizSelect.value = selectedQuizId; // 確保選中當前題庫
        }
    }

    function loadQuiz(quizId) {
        selectedQuizId = quizId;
        currentQuiz = allQuizzes[selectedQuizId];
        renderQuizList(); // 重新渲染題目列表
        saveQuizzes(); // 保存當前選中的題庫 ID
    }


    // 顯示新增題目區塊
    function showAddQuestionSection(type) {
        const currentSelectedQuiz = allQuizzes[selectedQuizId];
        if (!currentSelectedQuiz) {
            console.error("No quiz selected or quiz not found.");
            return;
        }

        if (addQuestionToQuizSection) {
            addQuestionToQuizSection.style.display = 'block';
        }
        // 清空所有輸入框並設置預設值
        if (questionInput) questionInput.value = '';
        if (answerInput) answerInput.value = '';
        if (mcQuestionInput) mcQuestionInput.value = '';
        if (option1Input) option1Input.value = '';
        if (option2Input) option2Input.value = '';
        if (option3Input) option3Input.value = '';
        if (option4Input) option4Input.value = '';
        if (correctOptionSelect) correctOptionSelect.value = '0';
        if (eventDescriptionInput) eventDescriptionInput.value = '';
        if (eventPointsInput) eventPointsInput.value = '0';
        if (pointsInput) pointsInput.value = '10';

        // 隱藏所有題目類型輸入
        if (normalQuestionInputs) normalQuestionInputs.style.display = 'none';
        if (multipleChoiceInputs) multipleChoiceInputs.style.display = 'none';
        if (eventCardInputs) eventCardInputs.style.display = 'none';
        if (multipleChoiceOptionsContainer) multipleChoiceOptionsContainer.style.display = 'none'; // 隱藏選擇題按鈕容器

        // 顯示正確的輸入框
        switch (type) {
            case 'normal_question':
                if (normalQuestionInputs) normalQuestionInputs.style.display = 'block';
                if (pointsInput) pointsInput.style.display = 'block'; // 標準題目顯示分數輸入
                if (pointsInput.parentElement) pointsInput.parentElement.style.display = 'flex'; // 確保父元素顯示
                break;
            case 'multiple_choice':
                if (multipleChoiceInputs) multipleChoiceInputs.style.display = 'block';
                if (pointsInput) pointsInput.style.display = 'block'; // 選擇題顯示分數輸入
                if (pointsInput.parentElement) pointsInput.parentElement.style.display = 'flex'; // 確保父元素顯示
                break;
            case 'event_card':
                if (eventCardInputs) eventCardInputs.style.display = 'block'; // 修正了 .inputs 錯誤
                if (pointsInput) pointsInput.style.display = 'none'; // 事件卡不顯示分數輸入
                if (pointsInput.parentElement) pointsInput.parentElement.style.display = 'none'; // 隱藏父元素
                break;
        }

        // 這就是之前出錯的行，現在 buttonGroup 在此作用域內可以正確訪問
        if (buttonGroup) buttonGroup.style.display = 'flex';

        // 更新選擇器
        if (questionTypeSelect) questionTypeSelect.value = type;
    }


    // --- 事件監聽器 (全部放在這裡面) ---

    if (startGameButton) { startGameButton.addEventListener('click', initializeGame); }

    if (closeButton) { closeButton.addEventListener('click', hideQuestionModal); }

    if (questionModal) {
        // 點擊模態框外部關閉
        questionModal.addEventListener('click', (event) => {
            if (event.target === questionModal) {
                hideQuestionModal();
            }
        });
    }

    // 題庫選擇
    if (quizSelect) {
        quizSelect.addEventListener('change', (event) => {
            loadQuiz(event.target.value);
        });
    }

    // 新增題庫
    if (addQuizButton) {
        addQuizButton.addEventListener('click', () => {
            const quizName = prompt('請輸入新題庫的名稱:');
            if (quizName && quizName.trim() !== '') {
                const newQuizId = generateUniqueId();
                allQuizzes[newQuizId] = {
                    id: newQuizId,
                    name: quizName.trim(),
                    questions: []
                };
                selectedQuizId = newQuizId; // 將新題庫設為當前選中
                saveQuizzes();
                populateQuizSelect(); // 更新下拉選單
                renderQuizList(); // 渲染新題庫的題目列表
            }
        });
    }

    // 刪除題庫
    if (deleteQuizButton) {
        deleteQuizButton.addEventListener('click', () => {
            if (selectedQuizId === 'default') {
                alert('不能刪除預設題庫！');
                return;
            }
            if (confirm(`確定要刪除題庫 "${allQuizzes[selectedQuizId].name}" 嗎？`)) {
                delete allQuizzes[selectedQuizId];
                selectedQuizId = 'default'; // 回歸預設題庫
                saveQuizzes();
                populateQuizSelect();
                renderQuizList();
            }
        });
    }

    // 匯出題庫
    if (exportQuizButton) {
        exportQuizButton.addEventListener('click', () => {
            if (!currentQuiz) {
                alert('沒有可匯出的題庫！');
                return;
            }
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentQuiz, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `${currentQuiz.name}.json`);
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });
    }

    // 匯入題庫
    if (importQuizButton) {
        importQuizButton.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const importedData = JSON.parse(e.target.result);
                            // 簡單驗證匯入數據結構
                            if (importedData && Array.isArray(importedData.questions) && typeof importedData.name === 'string') {
                                const quizName = prompt('請輸入匯入題庫的名稱:', importedData.name);
                                if (quizName && quizName.trim() !== '') {
                                    const newQuizId = generateUniqueId();
                                    allQuizzes[newQuizId] = {
                                        id: newQuizId,
                                        name: quizName.trim(),
                                        questions: importedData.questions
                                    };
                                    saveQuizzes();
                                    populateQuizSelect();
                                    renderQuizList();
                                    selectedQuizId = newQuizId; // 自動選中新匯入的題庫
                                    quizSelect.value = newQuizId; // 更新下拉菜單顯示
                                    alert(`題庫 "${quizName.trim()}" 已成功匯入！`);
                                } else {
                                    alert('題庫名稱無效，匯入已取消。');
                                }
                            } else {
                                alert('匯入的 JSON 檔案格式不正確。請確保它包含有效的 name 和 questions 陣列。');
                            }
                        } catch (error) {
                            alert('讀取檔案時發生錯誤或檔案不是有效的 JSON 格式。');
                            console.error('Error importing quiz:', error);
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        });
    }

    if (closeFinalScoreModalButton) {
        closeFinalScoreModalButton.addEventListener('click', () => {
            if (finalScoreModal) finalScoreModal.classList.remove('show-modal');
            setTimeout(() => {
                if (finalScoreModal) finalScoreModal.style.display = 'none';
                resetGame();
            }, 300);
        });
    }

    if (restartGameButton) {
        restartGameButton.addEventListener('click', () => {
            if (finalScoreModal) finalScoreModal.classList.remove('show-modal');
            setTimeout(() => {
                if (finalScoreModal) finalScoreModal.style.display = 'none';
                resetGame();
            }, 300);
        });
    }

    // 題目類型選擇變化時
    if (questionTypeSelect) {
        questionTypeSelect.addEventListener('change', (event) => {
            showAddQuestionSection(event.target.value);
        });
    }

    // 儲存題目按鈕
    if (saveQuestionButton) {
        saveQuestionButton.addEventListener('click', saveQuestion);
    }

    // 取消新增題目按鈕
    if (cancelAddQuestionButton) {
        cancelAddQuestionButton.addEventListener('click', cancelAddQuestion);
    }

    // 顯示新增題目區塊的按鈕
    if (showAddQuestionSectionButton) {
        showAddQuestionSectionButton.addEventListener('click', () => showAddQuestionSection('normal_question')); // 預設顯示標準題目
    }

    // --- 初始化調用 (確保在所有 DOM 元素和函數定義完成後執行) ---
    loadQuizzes(); // 載入所有題庫
    populateQuizSelect(); // 載入時填充下拉選單
    renderQuizList(); // 渲染當前選中題庫的題目列表
});


// 由於 editQuestion 和 deleteQuestion 函數是通過 HTML 元素的 onclick 屬性直接調用的，
// 它們必須是全局可訪問的。因此，它們保留在 DOMContentLoaded 外部。
// 但它們內部會獲取 DOM 元素，所以其內部需要再次獲取這些元素，或者確保這些元素是全局變數。
// 在本修正中，我已在這些函數內部重新獲取了必要的 DOM 元素，確保它們能正常工作。
// 理想情況下，所有 DOM 相關的操作都應在 DOMContentLoaded 內通過事件監聽器綁定。
// 但為了兼容現有的 onclick 結構，這是一種折衷方案。

// 如果您想要更嚴格的結構，可以考慮移除 HTML 中的 onclick 屬性，
// 改為在 DOMContentLoaded 內部為每個「編輯」和「刪除」按鈕動態添加事件監聽器。
// 例如：
/*
    // 在 renderQuizList() 函數中：
    item.innerHTML = `
        ${displayContent}
        <div class="item-actions">
            <button class="edit-btn" data-index="${index}">編輯</button>
            <button class="delete-btn" data-index="${index}">刪除</button>
        </div>
    `;
    // 在 DOMContentLoaded 內部：
    quizQuestionList.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-btn')) {
            editQuestion(parseInt(event.target.dataset.index));
        } else if (event.target.classList.contains('delete-btn')) {
            deleteQuestion(parseInt(event.target.dataset.index));
        }
    });
*/
// 這會是一個更健壯的事件處理方式。但目前為了解決當前問題，保留 onclick 並在函數內部獲取 DOM 元素。
