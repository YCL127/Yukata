// script.js

// --- 遊戲狀態變數（這些變數不直接操作 DOM，因此可以保留在全局範圍）---
let players = [];
let currentPlayerIndex = 0;
let currentQuestions = [];
let answeredQuestions = new Set();
let allQuizzes = {};
let selectedQuizId = 'default';
let currentQuiz = { name: '預設題庫', questions: [] }; // 初始化一個預設題庫物件

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
    {
        question: "香蕉是什麼顏色？",
        options: ["紅色", "綠色", "黃色", "藍色"],
        correct_answer_index: 2,
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

// Fisher-Yates (Knuth) shuffle algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}

function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// 將所有DOM操作和事件綁定放在DOMContentLoaded內部
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 元素獲取 (全部放在這裡面，確保在DOM載入後可用) ---
    const startGameButton = document.getElementById('start-game-button');
    const numPlayersInput = document.getElementById('num-players');
    const numQuestionsInput = document.getElementById('num-questions');
    const gameSettings = document.getElementById('game-settings');
    const gameContainer = document.getElementById('game-container');
    const currentPlayerDisplay = document.getElementById('current-player-display');
    const playerScoresContainer = document.getElementById('player-scores');
    const gameBoard = document.getElementById('game-board');
    const questionModal = document.getElementById('question-modal');
    const closeButton = document.querySelector('#question-modal .close-button'); // 確保選擇的是問題模態框的關閉按鈕
    const questionTextElement = document.getElementById('question-text');
    const showAnswerButton = document.getElementById('show-answer-button');
    const correctAnswerDisplay = document.getElementById('correct-answer-display');
    const judgmentButtons = document.querySelector('.judgment-buttons');
    const markCorrectButton = document.getElementById('mark-correct-button');
    const markIncorrectButton = document.getElementById('mark-incorrect-button');
    const feedbackElement = document.getElementById('feedback');
    const multipleChoiceOptionsContainer = document.getElementById('multiple-choice-options'); // 選擇題選項按鈕容器

    const finalScoreModal = document.getElementById('final-score-modal');
    const closeFinalScoreModalButton = document.getElementById('close-final-score-modal');
    const finalScoresDisplay = document.getElementById('final-scores-display');
    const restartGameButton = document.getElementById('restart-game-button');

    // --- 題庫管理 DOM 元素 ---
    const quizSelect = document.getElementById('quiz-select');
    const addQuizButton = document.getElementById('add-quiz-button');
    const deleteQuizButton = document.getElementById('delete-quiz-button');
    const importQuizButton = document.getElementById('import-quiz-button');
    const exportQuizButton = document.getElementById('export-quiz-button');
    const quizQuestionList = document.getElementById('quiz-question-list'); // 題庫問題列表容器

    // 新增題目區塊相關
    const addQuestionToQuizSection = document.getElementById('add-question-to-quiz-section');
    const showAddQuestionSectionButton = document.getElementById('show-add-question-section-button');
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
    const pointsInput = document.getElementById('points-input'); // 所有題目類型共用的分數輸入
    const saveQuestionButton = document.getElementById('save-question-button');
    const cancelAddQuestionButton = document.getElementById('cancel-add-question-button');

    // 用於編輯模式下保存題目索引，-1 表示新增模式
    let editingQuestionIndex = -1;

    // --- 輔助函數 (現在這些函數內部會直接使用上述獲取的 DOM 變數) ---

    function saveQuizzes() {
        localStorage.setItem('allQuizzes', JSON.stringify(allQuizzes));
    }

    function loadQuizzes() {
        const storedQuizzes = localStorage.getItem('allQuizzes');
        if (storedQuizzes) {
            allQuizzes = JSON.parse(storedQuizzes);
        } else {
            // 如果沒有儲存的題庫，則創建一個預設題庫
            allQuizzes = {
                'default': {
                    id: 'default',
                    name: '預設題庫',
                    questions: defaultQuestions
                }
            };
            saveQuizzes();
        }
        // 確保 currentQuiz 總是有效的，並且與 selectedQuizId 匹配
        if (allQuizzes[selectedQuizId]) {
            currentQuiz = allQuizzes[selectedQuizId];
        } else {
            // 如果當前選中的ID無效，則重設為預設
            selectedQuizId = 'default';
            currentQuiz = allQuizzes['default'];
        }
    }

    function populateQuizSelect() {
        quizSelect.innerHTML = ''; // 清空現有選項
        for (const quizId in allQuizzes) {
            const option = document.createElement('option');
            option.value = quizId;
            option.textContent = allQuizzes[quizId].name;
            quizSelect.appendChild(option);
        }
        quizSelect.value = selectedQuizId; // 確保選中當前題庫
    }

    function renderQuizList() {
        quizQuestionList.innerHTML = ''; // 清空現有列表
        if (currentQuiz && currentQuiz.questions.length > 0) {
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
                        <button class="edit-question-btn" data-index="${index}">編輯</button>
                        <button class="delete-question-btn" data-index="${index}">刪除</button>
                    </div>
                `;
                quizQuestionList.appendChild(item);
            });
        } else {
            quizQuestionList.innerHTML = '<li>此題庫中沒有題目。</li>';
        }
    }

    // 顯示/隱藏新增題目區塊並重置表單
    function showAddQuestionSection(type = 'normal_question', questionToEdit = null, index = -1) {
        addQuestionToQuizSection.style.display = 'block';
        editingQuestionIndex = index; // 設置編輯模式索引

        // 重置所有輸入框狀態
        questionInput.value = '';
        answerInput.value = '';
        mcQuestionInput.value = '';
        option1Input.value = '';
        option2Input.value = '';
        option3Input.value = '';
        option4Input.value = '';
        correctOptionSelect.value = '0';
        eventDescriptionInput.value = '';
        eventPointsInput.value = '0';
        pointsInput.value = '10';

        // 隱藏所有題目類型輸入
        normalQuestionInputs.style.display = 'none';
        multipleChoiceInputs.style.display = 'none';
        eventCardInputs.style.display = 'none';
        multipleChoiceOptionsContainer.style.display = 'none'; // 隱藏問題模態框的選項容器

        // 根據類型填充表單或預設為標準題
        if (questionToEdit) {
            questionTypeSelect.value = questionToEdit.type;
            if (questionToEdit.points) pointsInput.value = questionToEdit.points;
            else pointsInput.value = '10'; // 編輯事件卡時分數可能為undefined
        } else {
            questionTypeSelect.value = type;
        }

        // 顯示對應的輸入框並填充數據（如果是編輯模式）
        switch (questionTypeSelect.value) {
            case 'normal_question':
                normalQuestionInputs.style.display = 'block';
                pointsInput.parentElement.style.display = 'flex';
                if (questionToEdit) {
                    questionInput.value = questionToEdit.question;
                    answerInput.value = questionToEdit.answer;
                }
                break;
            case 'multiple_choice':
                multipleChoiceInputs.style.display = 'block';
                pointsInput.parentElement.style.display = 'flex';
                if (questionToEdit) {
                    mcQuestionInput.value = questionToEdit.question;
                    option1Input.value = questionToEdit.options[0];
                    option2Input.value = questionToEdit.options[1];
                    option3Input.value = questionToEdit.options[2];
                    option4Input.value = questionToEdit.options[3];
                    correctOptionSelect.value = questionToEdit.correct_answer_index;
                }
                break;
            case 'event_card':
                eventCardInputs.style.display = 'block';
                pointsInput.parentElement.style.display = 'none'; // 事件卡不需要分數
                if (questionToEdit) {
                    eventDescriptionInput.value = questionToEdit.event_description;
                    eventPointsInput.value = questionToEdit.event_points;
                }
                break;
        }

        // 調整儲存按鈕的文字
        saveQuestionButton.textContent = editingQuestionIndex !== -1 ? '更新題目' : '儲存題目';
    }

    function cancelAddQuestion() {
        addQuestionToQuizSection.style.display = 'none';
        editingQuestionIndex = -1; // 退出編輯模式
        saveQuestionButton.textContent = '儲存題目'; // 恢復按鈕文本
        // 完全重置表單狀態
        questionInput.value = '';
        answerInput.value = '';
        mcQuestionInput.value = '';
        option1Input.value = '';
        option2Input.value = '';
        option3Input.value = '';
        option4Input.value = '';
        correctOptionSelect.value = '0';
        eventDescriptionInput.value = '';
        eventPointsInput.value = '0';
        pointsInput.value = '10';
        questionTypeSelect.value = 'normal_question'; // 恢復預設選擇

        normalQuestionInputs.style.display = 'none';
        multipleChoiceInputs.style.display = 'none';
        eventCardInputs.style.display = 'none';
        multipleChoiceOptionsContainer.style.display = 'none';
    }

    function saveOrUpdateQuestion() {
        const currentSelectedQuiz = allQuizzes[selectedQuizId];
        if (!currentSelectedQuiz) {
            alert("無選中題庫，無法儲存題目。");
            return;
        }

        let newQuestion = editingQuestionIndex !== -1 ? currentQuiz.questions[editingQuestionIndex] : {};
        const type = questionTypeSelect.value;
        newQuestion.type = type;

        // 獲取分數，事件卡除外
        if (type !== 'event_card') {
            const points = parseInt(pointsInput.value);
            if (isNaN(points) || points <= 0) {
                alert("請輸入有效的題目分數 (大於 0)。");
                return;
            }
            newQuestion.points = points;
        } else {
            delete newQuestion.points; // 確保事件卡沒有 points 屬性
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
            // 清理其他類型的屬性
            delete newQuestion.options;
            delete newQuestion.correct_answer_index;
            delete newQuestion.event_description;
            delete newQuestion.event_points;
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
            // 清理其他類型的屬性
            delete newQuestion.answer;
            delete newQuestion.event_description;
            delete newQuestion.event_points;
        } else if (type === 'event_card') {
            const eventDescription = eventDescriptionInput.value.trim();
            const eventPoints = parseInt(eventPointsInput.value);
            if (!eventDescription || isNaN(eventPoints)) {
                alert("事件卡描述不能為空，點數必須是有效數字。");
                return;
            }
            newQuestion.event_description = eventDescription;
            newQuestion.event_points = eventPoints;
            // 清理其他類型的屬性
            delete newQuestion.question;
            delete newQuestion.answer;
            delete newQuestion.options;
            delete newQuestion.correct_answer_index;
        }

        if (editingQuestionIndex === -1) {
            // 新增題目
            currentQuiz.questions.push(newQuestion);
        } else {
            // 更新題目（已經在 newQuestion 變數中更新了）
            currentQuiz.questions[editingQuestionIndex] = newQuestion;
        }

        saveQuizzes();
        renderQuizList();
        cancelAddQuestion(); // 清空表單並隱藏
    }

    function editQuestion(index) {
        const question = currentQuiz.questions[index];
        if (!question) return;
        showAddQuestionSection(question.type, question, index);
    }

    function deleteQuestion(index) {
        if (confirm('確定要刪除這道題目嗎？')) {
            currentQuiz.questions.splice(index, 1);
            saveQuizzes();
            renderQuizList();
        }
    }

    function initializeGame() {
        if (!currentQuiz || currentQuiz.questions.length === 0) {
            alert('請選擇一個包含題目的題庫！');
            return;
        }

        const numPlayers = parseInt(numPlayersInput.value);
        const numQuestions = parseInt(numQuestionsInput.value);

        players = [];
        for (let i = 0; i < numPlayers; i++) {
            players.push({ id: i, score: 0 });
        }
        currentPlayerIndex = 0;
        answeredQuestions.clear();

        const shuffledQuestions = shuffleArray([...currentQuiz.questions]);
        currentQuestions = shuffledQuestions.slice(0, Math.min(numQuestions, shuffledQuestions.length));

        if (currentQuestions.length < numQuestions) {
            alert(`題庫中只有 ${currentQuestions.length} 題，將以此數量進行遊戲。`);
        }

        gameSettings.style.display = 'none';
        gameContainer.style.display = 'flex';

        updatePlayerInfo();
        renderGameBoard(currentQuestions.length);
    }

    function resetGame() {
        players = [];
        currentPlayerIndex = 0;
        currentQuestions = [];
        answeredQuestions.clear();

        gameSettings.style.display = 'block';
        gameContainer.style.display = 'none';

        gameBoard.innerHTML = ''; // 清空遊戲板

        populateQuizSelect();
        renderQuizList();
    }

    function updatePlayerInfo() {
        currentPlayerDisplay.textContent = `當前玩家: 玩家 ${currentPlayerIndex + 1}`;
        playerScoresContainer.innerHTML = players.map((player, index) =>
            `<div class="player-score" id="player-score-${index}">玩家 ${index + 1}: ${player.score} 點</div>`
        ).join('');
    }

    function renderGameBoard(numCards) {
        gameBoard.innerHTML = '';
        for (let i = 0; i < numCards; i++) {
            const card = document.createElement('div');
            card.classList.add('question-card');
            card.dataset.index = i;
            card.textContent = i + 1;
            card.addEventListener('click', handleCardClick);
            gameBoard.appendChild(card);
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
        // 重置模態框內容
        questionTextElement.textContent = '';
        correctAnswerDisplay.style.display = 'none';
        judgmentButtons.style.display = 'none';
        feedbackElement.textContent = '';
        showAnswerButton.style.display = 'block';
        multipleChoiceOptionsContainer.innerHTML = '';
        multipleChoiceOptionsContainer.style.display = 'none';

        questionModal.style.display = 'block';
        questionModal.classList.add('show-modal'); // 為了動畫效果

        if (question.type === 'normal_question') {
            questionTextElement.textContent = question.question;
            showAnswerButton.onclick = () => {
                correctAnswerDisplay.textContent = `答案：${question.answer}`;
                correctAnswerDisplay.style.display = 'block';
                judgmentButtons.style.display = 'flex';
                showAnswerButton.style.display = 'none';
            };
            markCorrectButton.onclick = () => markAnswer(true, question.points, cardIndex);
            markIncorrectButton.onclick = () => markAnswer(false, 0, cardIndex);

        } else if (question.type === 'multiple_choice') {
            questionTextElement.textContent = question.question;
            showAnswerButton.style.display = 'none'; // 選擇題直接顯示選項
            renderMultipleChoiceOptions(question.options, question.correct_answer_index, question.points, cardIndex);

        } else if (question.type === 'event_card') {
            questionTextElement.textContent = `事件卡：${question.event_description}`;
            showAnswerButton.style.display = 'none'; // 事件卡沒有答案
            judgmentButtons.style.display = 'none'; // 事件卡沒有判斷按鈕
            applyEventCardEffect(question);
            markCardAsAnswered(cardIndex); // 事件卡直接標記為已回答
            setTimeout(() => {
                hideQuestionModal();
                nextTurn();
            }, 2000); // 2秒後自動關閉模態框並進入下一回合
        }
    }

    function renderMultipleChoiceOptions(options, correctIndex, points, cardIndex) {
        multipleChoiceOptionsContainer.innerHTML = '';
        multipleChoiceOptionsContainer.style.display = 'flex';

        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.classList.add('mc-option-button');
            button.textContent = `${String.fromCharCode(65 + index)}. ${option}`; // A, B, C, D
            button.dataset.optionIndex = index;
            button.addEventListener('click', (event) => handleOptionClick(event, correctIndex, points, cardIndex));
            multipleChoiceOptionsContainer.appendChild(button);
        });
    }

    function handleOptionClick(event, correctIndex, points, cardIndex) {
        const selectedOptionIndex = parseInt(event.target.dataset.optionIndex);

        // 禁用所有選項按鈕，防止重複點擊
        const optionButtons = multipleChoiceOptionsContainer.querySelectorAll('.mc-option-button');
        optionButtons.forEach(btn => btn.disabled = true);

        if (selectedOptionIndex === correctIndex) {
            feedbackElement.textContent = '正確！';
            feedbackElement.style.color = 'green';
            markAnswer(true, points, cardIndex);
        } else {
            feedbackElement.textContent = `錯誤。正確答案是 ${String.fromCharCode(65 + correctIndex)}.`;
            feedbackElement.style.color = 'red';
            markAnswer(false, 0, cardIndex);
        }
        setTimeout(() => {
            hideQuestionModal();
            nextTurn();
        }, 1500);
    }

    function markAnswer(isCorrect, points, cardIndex) {
        if (isCorrect) {
            players[currentPlayerIndex].score += points;
            feedbackElement.textContent = `正確！獲得 ${points} 點。`;
            feedbackElement.style.color = 'green';
        } else {
            feedbackElement.textContent = '錯誤。';
            feedbackElement.style.color = 'red';
        }
        updatePlayerInfo();
        markCardAsAnswered(cardIndex);
        setTimeout(() => {
            hideQuestionModal();
            nextTurn();
        }, 1500);
    }

    function applyEventCardEffect(eventCard) {
        players[currentPlayerIndex].score += eventCard.event_points;
        feedbackElement.textContent = `${eventCard.event_description} 點數變化：${eventCard.event_points}`;
        feedbackElement.style.color = eventCard.event_points > 0 ? 'green' : 'red';
        updatePlayerInfo();
    }

    function hideQuestionModal() {
        questionModal.classList.remove('show-modal');
        setTimeout(() => {
            questionModal.style.display = 'none';
        }, 300);
    }

    function markCardAsAnswered(index) {
        answeredQuestions.add(index);
        const card = document.querySelector(`.question-card[data-index="${index}"]`);
        if (card) {
            card.classList.add('answered');
            card.removeEventListener('click', handleCardClick);
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
        finalScoreModal.style.display = 'block';
        finalScoreModal.classList.add('show-modal');

        finalScoresDisplay.innerHTML = '';
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        sortedPlayers.forEach((player, index) => {
            const playerFinalScoreDiv = document.createElement('div');
            playerFinalScoreDiv.classList.add('player-final-score');
            playerFinalScoreDiv.textContent = `玩家 ${player.id + 1}: ${player.score} 點`;
            if (index === 0) {
                playerFinalScoreDiv.classList.add('winner');
            }
            finalScoresDisplay.appendChild(playerFinalScoreDiv);
        });
    }

    // --- 事件監聽器 (全部放在這裡面) ---

    startGameButton.addEventListener('click', initializeGame);
    closeButton.addEventListener('click', hideQuestionModal);
    questionModal.addEventListener('click', (event) => {
        if (event.target === questionModal) {
            hideQuestionModal();
        }
    });

    quizSelect.addEventListener('change', (event) => {
        selectedQuizId = event.target.value;
        currentQuiz = allQuizzes[selectedQuizId];
        renderQuizList();
        saveQuizzes();
    });

    addQuizButton.addEventListener('click', () => {
        const quizName = prompt('請輸入新題庫的名稱:');
        if (quizName && quizName.trim() !== '') {
            const newQuizId = generateUniqueId();
            allQuizzes[newQuizId] = {
                id: newQuizId,
                name: quizName.trim(),
                questions: []
            };
            selectedQuizId = newQuizId;
            saveQuizzes();
            populateQuizSelect();
            renderQuizList();
        }
    });

    deleteQuizButton.addEventListener('click', () => {
        if (selectedQuizId === 'default') {
            alert('不能刪除預設題庫！');
            return;
        }
        if (confirm(`確定要刪除題庫 "${allQuizzes[selectedQuizId].name}" 嗎？`)) {
            delete allQuizzes[selectedQuizId];
            selectedQuizId = 'default';
            currentQuiz = allQuizzes['default']; // 回歸預設題庫
            saveQuizzes();
            populateQuizSelect();
            renderQuizList();
        }
    });

    exportQuizButton.addEventListener('click', () => {
        if (!currentQuiz) {
            alert('沒有可匯出的題庫！');
            return;
        }
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentQuiz, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${currentQuiz.name}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

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
                                selectedQuizId = newQuizId; // 自動選中新匯入的題庫
                                quizSelect.value = newQuizId; // 更新下拉菜單顯示
                                renderQuizList(); // 渲染新題庫的題目
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

    closeFinalScoreModalButton.addEventListener('click', () => {
        finalScoreModal.classList.remove('show-modal');
        setTimeout(() => {
            finalScoreModal.style.display = 'none';
            resetGame();
        }, 300);
    });

    restartGameButton.addEventListener('click', () => {
        finalScoreModal.classList.remove('show-modal');
        setTimeout(() => {
            finalScoreModal.style.display = 'none';
            resetGame();
        }, 300);
    });

    // 題目類型選擇變化時，調用 showAddQuestionSection 調整輸入框顯示
    questionTypeSelect.addEventListener('change', (event) => {
        // 在編輯模式下，切換類型時需要清空內容
        if (editingQuestionIndex !== -1) {
            questionInput.value = '';
            answerInput.value = '';
            mcQuestionInput.value = '';
            option1Input.value = '';
            option2Input.value = '';
            option3Input.value = '';
            option4Input.value = '';
            correctOptionSelect.value = '0';
            eventDescriptionInput.value = '';
            eventPointsInput.value = '0';
            pointsInput.value = '10';
        }
        showAddQuestionSection(event.target.value);
    });

    saveQuestionButton.addEventListener('click', saveOrUpdateQuestion);
    cancelAddQuestionButton.addEventListener('click', cancelAddQuestion);
    showAddQuestionSectionButton.addEventListener('click', () => showAddQuestionSection('normal_question')); // 預設顯示標準題目

    // 為動態生成的編輯/刪除按鈕添加事件委派
    quizQuestionList.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-question-btn')) {
            const index = parseInt(event.target.dataset.index);
            editQuestion(index);
        } else if (event.target.classList.contains('delete-question-btn')) {
            const index = parseInt(event.target.dataset.index);
            deleteQuestion(index);
        }
    });

    // --- 初始化調用 (確保在所有 DOM 元素和函數定義完成後執行) ---
    loadQuizzes();
    populateQuizSelect();
    renderQuizList();
});
