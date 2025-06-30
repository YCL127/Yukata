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
        question: "香蕉是什麼顏色？",
        options: ["紅色", "綠色", "黃色", "藍色"],
        correct_answer_index: 2,
        points: 15,
        type: 'multiple_choice'
    },
    {
        type: 'event_card',
        event_type: 'fixed_points',
        event_description: "恭喜！您獲得了額外點數！",
        event_points: 30
    },
    {
        type: 'event_card',
        event_type: 'fixed_points',
        event_description: "很可惜，您失去了部分點數。",
        event_points: -20
    },
    {
        type: 'event_card',
        event_type: 'random_score',
        event_description: "命運的時刻！隨機增減分數！"
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
    const closeButton = document.querySelector('#question-modal .close-button');
    const questionTextElement = document.getElementById('question-text');
    const showAnswerButton = document.getElementById('show-answer-button');
    const correctAnswerDisplay = document.getElementById('correct-answer-display');
    const judgmentButtons = document.querySelector('.judgment-buttons');
    const markCorrectButton = document.getElementById('mark-correct-button');
    const markIncorrectButton = document.getElementById('mark-incorrect-button');
    const feedbackElement = document.getElementById('feedback');
    const multipleChoiceOptionsContainer = document.getElementById('multiple-choice-options');

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
    const quizQuestionList = document.getElementById('quiz-question-list');

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
    const eventTypeSelect = document.getElementById('event-type-select'); // 新增的事件類型下拉選單
    const eventDescriptionContainer = document.getElementById('event-description-container');
    const eventPointsContainer = document.getElementById('event-points-container');
    const eventDescriptionInput = document.getElementById('event-description-input');
    const eventPointsInput = document.getElementById('event-points-input');
    const pointsInput = document.getElementById('points-input');
    const saveQuestionButton = document.getElementById('save-question-button');
    const cancelAddQuestionButton = document.getElementById('cancel-add-question-button');

    let editingQuestionIndex = -1;

    // --- 輔助函數 ---

    function saveQuizzes() {
        localStorage.setItem('allQuizzes', JSON.stringify(allQuizzes));
    }

    function loadQuizzes() {
        const storedQuizzes = localStorage.getItem('allQuizzes');
        if (storedQuizzes) {
            allQuizzes = JSON.parse(storedQuizzes);
        } else {
            allQuizzes = {
                'default': { id: 'default', name: '預設題庫', questions: defaultQuestions }
            };
            saveQuizzes();
        }
        if (allQuizzes[selectedQuizId]) {
            currentQuiz = allQuizzes[selectedQuizId];
        } else {
            selectedQuizId = 'default';
            currentQuiz = allQuizzes['default'];
        }
    }

    function populateQuizSelect() {
        quizSelect.innerHTML = '';
        for (const quizId in allQuizzes) {
            const option = document.createElement('option');
            option.value = quizId;
            option.textContent = allQuizzes[quizId].name;
            quizSelect.appendChild(option);
        }
        quizSelect.value = selectedQuizId;
    }

    function renderQuizList() {
        quizQuestionList.innerHTML = '';
        if (currentQuiz && currentQuiz.questions && currentQuiz.questions.length > 0) {
            currentQuiz.questions.forEach((q, index) => {
                const item = document.createElement('li');
                let displayContent = '';
                switch (q.type) {
                    case 'normal_question':
                        displayContent = `[標準題 ${q.points}點] Q: ${q.question}`;
                        break;
                    case 'multiple_choice':
                        displayContent = `[選擇題 ${q.points}點] Q: ${q.question}`;
                        break;
                    case 'event_card':
                        // 讓事件卡顯示更具體
                        let eventTitle = '';
                        switch(q.event_type) {
                            case 'double_score': eventTitle = '分數加倍'; break;
                            case 'swap_score': eventTitle = '分數交換'; break;
                            case 'random_score': eventTitle = '隨機分數'; break;
                            case 'fixed_points':
                            default:
                                eventTitle = `點數 ${q.event_points >= 0 ? '+' : ''}${q.event_points}`;
                                break;
                        }
                        displayContent = `[事件卡 - ${eventTitle}] 事件: ${q.event_description}`;
                        break;
                    default:
                        displayContent = `[未知類型]`;
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
    
    // 更新事件卡輸入框的顯示狀態
    function updateEventInputsVisibility() {
        const selectedEventType = eventTypeSelect.value;
        if (selectedEventType === 'fixed_points') {
            eventDescriptionContainer.style.display = 'block';
            eventPointsContainer.style.display = 'block';
        } else {
            eventDescriptionContainer.style.display = 'none';
            eventPointsContainer.style.display = 'none';
        }
    }


    function showAddQuestionSection(type = 'normal_question', questionToEdit = null, index = -1) {
        addQuestionToQuizSection.style.display = 'block';
        editingQuestionIndex = index;

        // 重置表單
        questionInput.value = '';
        answerInput.value = '';
        mcQuestionInput.value = '';
        [option1Input, option2Input, option3Input, option4Input].forEach(i => i.value = '');
        correctOptionSelect.value = '0';
        eventDescriptionInput.value = '';
        eventPointsInput.value = '0';
        pointsInput.value = '10';
        eventTypeSelect.value = 'fixed_points'; // 預設事件卡類型

        normalQuestionInputs.style.display = 'none';
        multipleChoiceInputs.style.display = 'none';
        eventCardInputs.style.display = 'none';
        pointsInput.parentElement.style.display = 'flex';

        questionTypeSelect.value = questionToEdit ? questionToEdit.type : type;
        
        // 根據題目類型顯示對應區塊
        switch (questionTypeSelect.value) {
            case 'normal_question':
                normalQuestionInputs.style.display = 'block';
                if (questionToEdit) {
                    questionInput.value = questionToEdit.question;
                    answerInput.value = questionToEdit.answer;
                    pointsInput.value = questionToEdit.points;
                }
                break;
            case 'multiple_choice':
                multipleChoiceInputs.style.display = 'block';
                if (questionToEdit) {
                    mcQuestionInput.value = questionToEdit.question;
                    [option1Input.value, option2Input.value, option3Input.value, option4Input.value] = questionToEdit.options;
                    correctOptionSelect.value = questionToEdit.correct_answer_index;
                    pointsInput.value = questionToEdit.points;
                }
                break;
            case 'event_card':
                eventCardInputs.style.display = 'block';
                pointsInput.parentElement.style.display = 'none';
                if (questionToEdit) {
                    eventTypeSelect.value = questionToEdit.event_type || 'fixed_points';
                    eventDescriptionInput.value = questionToEdit.event_description;
                    eventPointsInput.value = questionToEdit.event_points || 0;
                }
                updateEventInputsVisibility(); // 根據事件類型更新可見性
                break;
        }
        
        saveQuestionButton.textContent = editingQuestionIndex !== -1 ? '更新題目' : '儲存題目';
    }

    function cancelAddQuestion() {
        addQuestionToQuizSection.style.display = 'none';
        editingQuestionIndex = -1;
    }

    function saveOrUpdateQuestion() {
        const currentSelectedQuiz = allQuizzes[selectedQuizId];
        if (!currentSelectedQuiz) {
            alert("無選中題庫，無法儲存。");
            return;
        }

        let newQuestion;
        if (editingQuestionIndex !== -1) {
            newQuestion = currentQuiz.questions[editingQuestionIndex];
        } else {
            newQuestion = {};
        }

        const type = questionTypeSelect.value;
        newQuestion.type = type;

        if (type !== 'event_card') {
            const points = parseInt(pointsInput.value);
            if (isNaN(points) || points <= 0) {
                alert("請輸入有效的分數 (大於 0)。");
                return;
            }
            newQuestion.points = points;
        } else {
            delete newQuestion.points;
        }

        if (type === 'normal_question') {
            const questionText = questionInput.value.trim();
            const answerText = answerInput.value.trim();
            if (!questionText || !answerText) {
                alert("題目和答案不能為空。");
                return;
            }
            newQuestion.question = questionText;
            newQuestion.answer = answerText;
        } else if (type === 'multiple_choice') {
            const mcQuestionText = mcQuestionInput.value.trim();
            const options = [option1Input.value.trim(), option2Input.value.trim(), option3Input.value.trim(), option4Input.value.trim()];
            if (!mcQuestionText || options.some(opt => !opt)) {
                alert("選擇題的所有欄位都不能為空。");
                return;
            }
            newQuestion.question = mcQuestionText;
            newQuestion.options = options;
            newQuestion.correct_answer_index = parseInt(correctOptionSelect.value);
        } else if (type === 'event_card') {
            const eventType = eventTypeSelect.value;
            newQuestion.event_type = eventType;

            switch (eventType) {
                case 'fixed_points':
                    const eventDescription = eventDescriptionInput.value.trim();
                    const eventPoints = parseInt(eventPointsInput.value);
                    if (!eventDescription || isNaN(eventPoints)) {
                        alert("事件描述不能為空，點數必須是有效數字。");
                        return;
                    }
                    newQuestion.event_description = eventDescription;
                    newQuestion.event_points = eventPoints;
                    break;
                case 'double_score':
                    newQuestion.event_description = "天賜良機！分數加倍！";
                    delete newQuestion.event_points;
                    break;
                case 'swap_score':
                    newQuestion.event_description = "風水輪流轉！與一名玩家交換分數！";
                    delete newQuestion.event_points;
                    break;
                case 'random_score':
                    newQuestion.event_description = "命運的時刻！隨機增減分數！";
                    delete newQuestion.event_points;
                    break;
            }
        }
        
        // 清理不相關的屬性
        if (type !== 'normal_question') { delete newQuestion.answer; }
        if (type !== 'multiple_choice') { delete newQuestion.options; delete newQuestion.correct_answer_index; }
        if (type !== 'event_card') { delete newQuestion.event_type; delete newQuestion.event_description; delete newQuestion.event_points;}


        if (editingQuestionIndex === -1) {
            currentQuiz.questions.push(newQuestion);
        }

        saveQuizzes();
        renderQuizList();
        cancelAddQuestion();
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

        players = Array.from({ length: numPlayers }, (_, i) => ({ id: i, score: 0 }));
        currentPlayerIndex = 0;
        answeredQuestions.clear();

        const shuffledQuestions = shuffleArray([...currentQuiz.questions]);
        currentQuestions = shuffledQuestions.slice(0, Math.min(numQuestions, shuffledQuestions.length));

        if (currentQuestions.length === 0) {
            alert('題庫中沒有足夠的題目。');
            resetGame();
            return;
        }

        if (currentQuestions.length < numQuestions) {
            alert(`題庫中只有 ${currentQuestions.length} 題，將以此數量進行遊戲。`);
        }

        gameSettings.style.display = 'none';
        gameContainer.style.display = 'flex';
        updatePlayerInfo();
        renderGameBoard(currentQuestions.length);
    }

    function resetGame() {
        gameSettings.style.display = 'block';
        gameContainer.style.display = 'none';
        gameBoard.innerHTML = '';
        populateQuizSelect();
        renderQuizList();
    }

    function updatePlayerInfo() {
        currentPlayerDisplay.textContent = `當前玩家: 玩家 ${currentPlayerIndex + 1}`;
        playerScoresContainer.innerHTML = players.map((p, i) =>
            `<div class="player-score">玩家 ${i + 1}: ${p.score} 點</div>`
        ).join('');
    }

    function renderGameBoard(numCards) {
        gameBoard.innerHTML = '';
        for (let i = 0; i < numCards; i++) {
            const card = document.createElement('div');
            card.className = 'question-card';
            card.dataset.index = i;
            card.textContent = i + 1;
            card.addEventListener('click', handleCardClick);
            gameBoard.appendChild(card);
        }
    }

    function handleCardClick(event) {
        const cardIndex = parseInt(event.target.dataset.index);
        if (answeredQuestions.has(cardIndex)) {
            alert('這張卡片已經被翻過了！');
            return;
        }
        const question = currentQuestions[cardIndex];
        if (question) displayQuestion(question, cardIndex);
    }

    function displayQuestion(question, cardIndex) {
        questionTextElement.textContent = '';
        correctAnswerDisplay.style.display = 'none';
        judgmentButtons.style.display = 'none';
        feedbackElement.textContent = '';
        showAnswerButton.style.display = 'block';
        multipleChoiceOptionsContainer.innerHTML = '';
        multipleChoiceOptionsContainer.style.display = 'none';

        questionModal.style.display = 'block';
        questionModal.classList.add('show-modal');

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
            showAnswerButton.style.display = 'none';
            renderMultipleChoiceOptions(question.options, question.correct_answer_index, question.points, cardIndex);
        } else if (question.type === 'event_card') {
            questionTextElement.textContent = `事件卡：${question.event_description}`;
            showAnswerButton.style.display = 'none';
            judgmentButtons.style.display = 'none';
            applyEventCardEffect(question); // 執行事件效果
            markCardAsAnswered(cardIndex);
            setTimeout(() => {
                hideQuestionModal();
                nextTurn();
            }, 2500); // 延長顯示時間讓玩家看清楚效果
        }
    }
    
    function renderMultipleChoiceOptions(options, correctIndex, points, cardIndex) {
        multipleChoiceOptionsContainer.style.display = 'flex';
        options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'mc-option-button';
            button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
            button.dataset.optionIndex = index;
            button.onclick = (event) => handleOptionClick(event, correctIndex, points, cardIndex);
            multipleChoiceOptionsContainer.appendChild(button);
        });
    }

    function handleOptionClick(event, correctIndex, points, cardIndex) {
        const selectedOptionIndex = parseInt(event.target.dataset.optionIndex);
        multipleChoiceOptionsContainer.querySelectorAll('.mc-option-button').forEach(btn => btn.disabled = true);

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
        const player = players[currentPlayerIndex];
        let feedbackText = '';

        // 兼容舊格式的事件卡
        const eventType = eventCard.event_type || 'fixed_points';

        switch (eventType) {
            case 'double_score':
                const oldScore = player.score;
                player.score *= 2;
                feedbackText = `分數加倍！從 ${oldScore} 點變為 ${player.score} 點！`;
                break;

            case 'swap_score':
                const otherPlayers = players.filter((_, index) => index !== currentPlayerIndex);
                if (otherPlayers.length > 0) {
                    const targetPlayerIndex = players.indexOf(otherPlayers[Math.floor(Math.random() * otherPlayers.length)]);
                    const myOldScore = player.score;
                    const theirOldScore = players[targetPlayerIndex].score;
                    
                    player.score = theirOldScore;
                    players[targetPlayerIndex].score = myOldScore;

                    feedbackText = `與 玩家 ${targetPlayerIndex + 1} 交換了分數！你的分數從 ${myOldScore} 變為 ${player.score}。`;
                } else {
                    feedbackText = "場上沒有其他玩家可以交換分數！";
                }
                break;

            case 'random_score':
                const randomPoints = Math.floor(Math.random() * 61) - 30; // -30 to +30
                player.score += randomPoints;
                feedbackText = `隨機事件！分數 ${randomPoints >= 0 ? `增加 ${randomPoints}` : `減少 ${-randomPoints}`} 點！`;
                break;
            
            case 'fixed_points':
            default: // 處理舊版或未指定類型的卡片
                const points = eventCard.event_points || 0;
                player.score += points;
                feedbackText = `${eventCard.event_description} 點數變化：${points >= 0 ? '+' : ''}${points}`;
                break;
        }

        feedbackElement.textContent = feedbackText;
        feedbackElement.style.color = 'blue';
        updatePlayerInfo();
    }


    function hideQuestionModal() {
        questionModal.classList.remove('show-modal');
        setTimeout(() => { questionModal.style.display = 'none'; }, 300);
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
        sortedPlayers.forEach((p, index) => {
            const div = document.createElement('div');
            div.className = 'player-final-score';
            div.textContent = `玩家 ${p.id + 1}: ${p.score} 點`;
            if (index === 0) div.classList.add('winner');
            finalScoresDisplay.appendChild(div);
        });
    }

    // --- 事件監聽器 ---

    startGameButton.addEventListener('click', initializeGame);
    closeButton.addEventListener('click', hideQuestionModal);
    
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
            currentQuiz = allQuizzes['default'];
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
                        if (importedData && typeof importedData.name === 'string' && Array.isArray(importedData.questions)) {
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
                                selectedQuizId = newQuizId;
                                quizSelect.value = newQuizId;
                                currentQuiz = allQuizzes[selectedQuizId];
                                renderQuizList();
                                alert(`題庫 "${quizName.trim()}" 已成功匯入！`);
                            }
                        } else {
                            alert('匯入的 JSON 檔案格式不正確。');
                        }
                    } catch (error) {
                        alert('讀取檔案時發生錯誤。');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    });

    closeFinalScoreModalButton.addEventListener('click', () => {
        finalScoreModal.style.display = 'none';
        resetGame();
    });

    restartGameButton.addEventListener('click', () => {
        finalScoreModal.style.display = 'none';
        resetGame();
    });

    questionTypeSelect.addEventListener('change', (event) => {
        showAddQuestionSection(event.target.value);
    });
    
    // 新增：當事件類型改變時，更新輸入框的可見性
    eventTypeSelect.addEventListener('change', updateEventInputsVisibility);

    saveQuestionButton.addEventListener('click', saveOrUpdateQuestion);
    cancelAddQuestionButton.addEventListener('click', cancelAddQuestion);
    showAddQuestionSectionButton.addEventListener('click', () => showAddQuestionSection('normal_question'));

    quizQuestionList.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-question-btn')) {
            editQuestion(parseInt(event.target.dataset.index));
        } else if (event.target.classList.contains('delete-question-btn')) {
            deleteQuestion(parseInt(event.target.dataset.index));
        }
    });

    // --- 初始化調用 ---
    loadQuizzes();
    populateQuizSelect();
    renderQuizList();
});