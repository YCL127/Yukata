// script.js

// --- DOM 元素獲取 ---
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
const multipleChoiceOptionsContainer = document.getElementById('multiple-choice-options'); // 用於顯示選擇題選項

const eventCardInputs = document.getElementById('event-card-inputs');
const eventDescriptionInput = document.getElementById('event-description-input');
const eventPointsInput = document.getElementById('event-points-input');

const pointsInput = document.getElementById('points-input');
const saveQuestionButton = document.getElementById('save-question-button');
const cancelAddQuestionButton = document.getElementById('cancel-add-question-button');

// 按鈕群組 (用於新增題目區塊的儲存/取消) - 這裡現在應該能找到元素了
const buttonGroup = addQuestionToQuizSection ? addQuestionToQuizSection.querySelector('.button-group') : null;

// --- 遊戲狀態變數 ---
let players = [];
let currentPlayerIndex = 0;
let currentQuestions = []; // 遊戲中使用的題目列表
let answeredQuestions = new Set(); // 追蹤已回答的題目卡片索引

// --- 題庫管理變數 ---
let allQuizzes = {}; // 儲存所有題庫 { quizId: { name: '...', questions: [...] } }
let selectedQuizId = 'default'; // 當前選擇的題庫ID
let currentQuiz = { name: '預設題庫', questions: [] }; // 當前編輯或使用的題庫

// --- 預設的遊戲題目數據（僅用於首次載入或沒有任何本地題庫時） ---
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
        question: "哪種交通工具通常在空中飛行？",
        options: ["火車", "汽車", "飛機", "船"],
        correct_answer_index: 2,
        points: 20,
        type: 'multiple_choice'
    },
    // 新增事件卡範例
    {
        description: "獲得一次額外答題機會！",
        points_change: 0, // 事件卡可能沒有點數變化，或點數變化為0
        type: 'event_card'
    },
    {
        description: "本回合分數加倍！",
        points_change: 0,
        type: 'event_card'
    },
    {
        description: "扣除 5 點分數。",
        points_change: -5,
        type: 'event_card'
    }
];

// --- 輔助函數 ---

// 生成唯一 ID
function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// 保存題庫到 LocalStorage
function saveQuizzes() {
    localStorage.setItem('allQuizzes', JSON.stringify(allQuizzes));
}

// 從 LocalStorage 載入題庫
function loadQuizzes() {
    const storedQuizzes = localStorage.getItem('allQuizzes');
    if (storedQuizzes) {
        allQuizzes = JSON.parse(storedQuizzes);
    } else {
        // 如果沒有任何題庫，則創建一個預設題庫
        const defaultQuizId = 'default';
        allQuizzes[defaultQuizId] = {
            id: defaultQuizId,
            name: '預設題庫',
            questions: defaultQuestions
        };
        saveQuizzes();
    }
    // 確保 currentQuiz 總是指向一個有效的題庫
    if (!allQuizzes[selectedQuizId]) {
        selectedQuizId = Object.keys(allQuizzes)[0] || 'default'; // 選擇第一個或預設
    }
    currentQuiz = allQuizzes[selectedQuizId];
    populateQuizSelect();
}

// 填充題庫選擇下拉菜單
function populateQuizSelect() {
    quizSelect.innerHTML = ''; // 清空現有選項
    for (const quizId in allQuizzes) {
        const option = document.createElement('option');
        option.value = quizId;
        option.textContent = allQuizzes[quizId].name;
        quizSelect.appendChild(option);
    }
    quizSelect.value = selectedQuizId; // 設置當前選中的題庫
}

// 載入指定題庫
function loadQuiz(quizId) {
    if (allQuizzes[quizId]) {
        currentQuiz = allQuizzes[quizId];
        selectedQuizId = quizId;
        saveQuizzes(); // 保存選中的題庫ID
        console.log(`題庫 "${currentQuiz.name}" 已載入。題目數量: ${currentQuiz.questions.length}`);
    } else {
        console.warn(`找不到題庫 ID: ${quizId}`);
    }
}

// --- 遊戲邏輯 ---

// 初始化遊戲
function initializeGame() {
    const numPlayers = parseInt(numPlayersInput.value);
    const numQuestions = parseInt(numQuestionsInput.value);

    if (isNaN(numPlayers) || numPlayers < 2) {
        alert('玩家數量至少為 2！');
        return;
    }
    if (isNaN(numQuestions) || numQuestions < 5 || numQuestions > 20) {
        alert('題目數量必須在 5 到 20 之間！');
        return;
    }
    if (currentQuiz.questions.length === 0) {
        alert('當前題庫中沒有題目，請新增題目或選擇其他題庫！');
        return;
    }
    if (currentQuiz.questions.length < numQuestions) {
        alert(`當前題庫只有 ${currentQuiz.questions.length} 題，無法達到您設定的 ${numQuestions} 題。請減少題目數量或增加題庫題目。`);
        return;
    }

    players = Array.from({ length: numPlayers }, (_, i) => ({
        id: i,
        name: `玩家 ${i + 1}`,
        score: 0
    }));
    currentPlayerIndex = 0;
    answeredQuestions.clear();

    // 從當前題庫中隨機選取指定數量的題目
    currentQuestions = shuffleArray([...currentQuiz.questions]).slice(0, numQuestions);

    updatePlayerInfo();
    renderGameBoard(numQuestions);
    gameSettings.style.display = 'none';
    quizManagementSection.style.display = 'none'; // 隱藏題庫管理
    addQuestionToQuizSection.style.display = 'none'; // 隱藏新增題目區塊
    gameContainer.style.display = 'block';
}

// 重置遊戲
function resetGame() {
    players = [];
    currentPlayerIndex = 0;
    currentQuestions = [];
    answeredQuestions.clear();
    gameContainer.style.display = 'none';
    gameSettings.style.display = 'block';
    quizManagementSection.style.display = 'block'; // 顯示題庫管理
    addQuestionToQuizSection.style.display = 'none'; // 隱藏新增題目區塊
    hideQuestionModal(); // 確保問題模態框關閉
}


// 更新玩家資訊顯示
function updatePlayerInfo() {
    currentPlayerDisplay.textContent = `當前玩家: ${players[currentPlayerIndex].name}`;
    playerScoresContainer.innerHTML = players.map(player => `
        <div class="player-score" id="player-${player.id}-score">
            ${player.name}: ${player.score}
        </div>
    `).join('');
}

// 渲染遊戲板
function renderGameBoard(numCards) {
    gameBoard.innerHTML = '';
    for (let i = 0; i < numCards; i++) {
        const card = document.createElement('div');
        card.classList.add('question-card');
        card.dataset.index = i; // 將題目索引存儲在數據屬性中
        card.textContent = i + 1; // 顯示卡片編號
        card.addEventListener('click', handleCardClick);
        gameBoard.appendChild(card);
    }
}

// 處理卡片點擊事件
function handleCardClick(event) {
    const card = event.target;
    const index = parseInt(card.dataset.index);

    if (answeredQuestions.has(index)) {
        return; // 如果已經回答過，則不做任何事情
    }

    const question = currentQuestions[index];

    displayQuestion(question, index);
}

// 顯示問題模態框
function displayQuestion(question, cardIndex) {
    questionModal.classList.add('show-modal'); // 添加 class 控制顯示動畫
    questionModal.style.display = 'flex'; // 確保模態框是 flex 容器以便置中

    // 重置模態框內容
    showAnswerButton.style.display = 'block';
    correctAnswerDisplay.style.display = 'none';
    judgmentButtons.style.display = 'none';
    feedbackElement.textContent = '';
    multipleChoiceOptionsContainer.innerHTML = ''; // 清空選擇題選項

    questionModal.dataset.cardIndex = cardIndex; // 存儲當前問題的卡片索引

    if (question.type === 'normal_question' || question.type === 'multiple_choice') {
        questionTextElement.textContent = question.question;
        // 隱藏事件卡點數顯示（如果存在）
        document.getElementById('event-card-points-display') && (document.getElementById('event-card-points-display').style.display = 'none');
        if (question.type === 'normal_question') {
            showAnswerButton.style.display = 'block'; // 普通問題顯示"顯示答案"按鈕
            multipleChoiceOptionsContainer.style.display = 'none'; // 隱藏選擇題選項容器
        } else { // multiple_choice
            showAnswerButton.style.display = 'none'; // 選擇題不顯示"顯示答案"按鈕
            multipleChoiceOptionsContainer.style.display = 'flex'; // 顯示選擇題選項容器
            renderMultipleChoiceOptions(question.options, question.correct_answer_index);
        }
    } else if (question.type === 'event_card') {
        questionTextElement.textContent = question.description;
        showAnswerButton.style.display = 'none'; // 事件卡沒有答案按鈕
        judgmentButtons.style.display = 'none'; // 事件卡沒有判斷按鈕
        multipleChoiceOptionsContainer.style.display = 'none'; // 事件卡沒有選擇題選項

        // 顯示事件卡點數影響
        correctAnswerDisplay.textContent = `點數影響: ${question.points_change}`;
        correctAnswerDisplay.style.display = 'block';
        feedbackElement.textContent = ''; // 清空反饋

        // 直接處理事件卡邏輯，然後關閉模態框
        applyEventCardEffect(question);
        markCardAsAnswered(cardIndex);
        setTimeout(() => {
            hideQuestionModal();
            nextTurn();
        }, 3000); // 3秒後自動關閉並換下一位玩家
    }
}

// 渲染選擇題選項
function renderMultipleChoiceOptions(options, correctIndex) {
    multipleChoiceOptionsContainer.innerHTML = '';
    options.forEach((optionText, index) => {
        const button = document.createElement('button');
        button.classList.add('mc-option-button');
        button.textContent = optionText;
        button.dataset.optionIndex = index;
        button.addEventListener('click', (e) => handleOptionClick(e, correctIndex));
        multipleChoiceOptionsContainer.appendChild(button);
    });
}

// 處理選擇題選項點擊
function handleOptionClick(event, correctIndex) {
    const selectedButton = event.target;
    const selectedIndex = parseInt(selectedButton.dataset.optionIndex);
    const cardIndex = parseInt(questionModal.dataset.cardIndex);
    const question = currentQuestions[cardIndex];

    // 禁用所有選項按鈕
    Array.from(multipleChoiceOptionsContainer.children).forEach(button => {
        button.classList.add('answered-option');
        button.removeEventListener('click', handleOptionClick);
    });

    if (selectedIndex === correctIndex) {
        selectedButton.classList.add('correct-option');
        feedbackElement.textContent = '恭喜！回答正確！';
        feedbackElement.style.color = '#4CAF50';
        players[currentPlayerIndex].score += question.points;
        updatePlayerScores();
    } else {
        selectedButton.classList.add('incorrect-option');
        feedbackElement.textContent = '很可惜，回答錯誤。';
        feedbackElement.style.color = '#F44336';
        // 顯示正確答案
        const correctOptionButton = multipleChoiceOptionsContainer.querySelector(`[data-option-index="${correctIndex}"]`);
        if (correctOptionButton) {
            correctOptionButton.classList.add('correct-option');
        }
    }
    markCardAsAnswered(cardIndex);
    setTimeout(() => {
        hideQuestionModal();
        nextTurn();
    }, 2000); // 2秒後自動關閉並換下一位玩家
}


// 應用事件卡效果
function applyEventCardEffect(eventCard) {
    let message = eventCard.description;
    if (eventCard.points_change !== 0) {
        players[currentPlayerIndex].score += eventCard.points_change;
        updatePlayerScores();
        message += ` (點數變化: ${eventCard.points_change})`;
    }
    feedbackElement.textContent = message;
    feedbackElement.style.color = '#FF9800'; // 事件卡使用橘色反饋
}


// 隱藏問題模態框
function hideQuestionModal() {
    questionModal.classList.remove('show-modal'); // 移除 class 控制顯示動畫
    setTimeout(() => {
        questionModal.style.display = 'none'; // 延遲隱藏，確保動畫完成
    }, 300); // 應與 CSS 轉場時間匹配
}

// 更新玩家分數顯示
function updatePlayerScores() {
    players.forEach(player => {
        const playerScoreElement = document.getElementById(`player-${player.id}-score`);
        if (playerScoreElement) {
            playerScoreElement.textContent = `${player.name}: ${player.score}`;
        }
    });
}

// 標記卡片為已回答
function markCardAsAnswered(index) {
    answeredQuestions.add(index);
    const card = gameBoard.querySelector(`.question-card[data-index="${index}"]`);
    if (card) {
        card.classList.add('answered');
        card.removeEventListener('click', handleCardClick); // 移除點擊事件
    }
}

// 換下一位玩家
function nextTurn() {
    // 檢查遊戲是否結束
    if (answeredQuestions.size === currentQuestions.length) {
        endGame();
        return;
    }

    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    updatePlayerInfo();
}

// 結束遊戲
function endGame() {
    let finalScoresHtml = '<h3>最終得分</h3>';
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score); // 依分數排序

    // 找出最高分
    const maxScore = sortedPlayers[0].score;

    sortedPlayers.forEach(player => {
        const isWinner = player.score === maxScore && maxScore > 0; // 如果有多個最高分，都是贏家
        finalScoresHtml += `
            <p class="player-final-score ${isWinner ? 'winner' : ''}">
                ${player.name}: ${player.score} ${isWinner ? '🏆' : ''}
            </p>
        `;
    });
    finalScoreModal.innerHTML = `
        <div class="modal-content">
            <span class="close-button" id="close-final-score-modal">&times;</span>
            <h2>遊戲結束！最終得分</h2>
            <div id="final-scores-display">
                ${finalScoresHtml}
            </div>
            <button id="restart-game-button">重新開始</button>
        </div>
    `;
    // 重新獲取新的關閉和重啟按鈕，因為內容被替換了
    document.getElementById('close-final-score-modal').addEventListener('click', () => {
        finalScoreModal.classList.remove('show-modal');
        setTimeout(() => {
            finalScoreModal.style.display = 'none';
            resetGame();
        }, 300);
    });
    document.getElementById('restart-game-button').addEventListener('click', () => {
        finalScoreModal.classList.remove('show-modal');
        setTimeout(() => {
            finalScoreModal.style.display = 'none';
            resetGame();
        }, 300);
    });

    finalScoreModal.classList.add('show-modal');
    finalScoreModal.style.display = 'flex';
}

// --- 題庫管理函數 ---

// 顯示新增題目區塊
function showAddQuestionSection(type) {
    // 重置所有輸入框和選項的顯示狀態
    // 這裡增加了對元素是否存在的檢查，以避免 null 錯誤
    if (normalQuestionInputs) normalQuestionInputs.style.display = 'none';
    if (questionInput) questionInput.value = ''; // 清空標準題目內容
    if (answerInput) answerInput.value = ''; // 清空標準答案

    if (multipleChoiceInputs) multipleChoiceInputs.style.display = 'none';
    if (mcQuestionInput) mcQuestionInput.value = ''; // 清空選擇題內容
    if (option1Input) option1Input.value = '';
    if (option2Input) option2Input.value = '';
    if (option3Input) option3Input.value = '';
    if (option4Input) option4Input.value = '';
    if (correctOptionSelect) correctOptionSelect.value = '0'; // 重置正確選項

    if (eventCardInputs) eventCardInputs.style.display = 'none';
    if (eventDescriptionInput) eventDescriptionInput.value = ''; // 清空事件描述
    if (eventPointsInput) eventPointsInput.value = 0; // 重置事件點數

    if (pointsInput) pointsInput.value = 10; // 重置分數

    // 根據類型顯示對應的輸入區塊
    switch (type) {
        case 'normal_question':
            if (normalQuestionInputs) normalQuestionInputs.style.display = 'block';
            if (pointsInput) pointsInput.closest('.setting-item').style.display = 'flex'; // 顯示分數輸入框
            if (buttonGroup) buttonGroup.style.display = 'flex'; // 確保按鈕群組顯示為 flex
            break;
        case 'multiple_choice':
            if (multipleChoiceInputs) multipleChoiceInputs.style.display = 'block';
            if (pointsInput) pointsInput.closest('.setting-item').style.display = 'flex'; // 顯示分數輸入框
            if (buttonGroup) buttonGroup.style.display = 'flex'; // 確保按鈕群組顯示為 flex
            break;
        case 'event_card':
            if (eventCardInputs) eventCardInputs.style.display = 'block';
            if (pointsInput) pointsInput.closest('.setting-item').style.display = 'none'; // 事件卡不需要分數輸入框
            if (buttonGroup) buttonGroup.style.display = 'flex'; // 確保按鈕群組顯示為 flex
            break;
    }

    if (addQuestionToQuizSection) addQuestionToQuizSection.style.display = 'block'; // 顯示整個新增題目區塊
    if (quizManagementSection) quizManagementSection.style.display = 'none'; // 隱藏題庫管理區塊
    if (gameSettings) gameSettings.style.display = 'none'; // 隱藏遊戲設定，只顯示新增題目
}


// 保存題目到當前題庫
function saveQuestion() {
    const type = questionTypeSelect.value;
    let newQuestion = {};

    if (type === 'normal_question') {
        const questionText = questionInput.value.trim();
        const answerText = answerInput.value.trim();
        const points = parseInt(pointsInput.value);

        if (!questionText || !answerText || isNaN(points) || points <= 0) {
            alert('請填寫完整題目、答案和有效的分數！');
            return;
        }
        newQuestion = {
            question: questionText,
            answer: answerText,
            points: points,
            type: 'normal_question'
        };
    } else if (type === 'multiple_choice') {
        const mcQuestionText = mcQuestionInput.value.trim();
        const options = [
            option1Input.value.trim(),
            option2Input.value.trim(),
            option3Input.value.trim(),
            option4Input.value.trim()
        ];
        const correctOptionIndex = parseInt(correctOptionSelect.value);
        const points = parseInt(pointsInput.value);

        if (!mcQuestionText || options.some(opt => !opt) || isNaN(points) || points <= 0) {
            alert('請填寫完整選擇題題目、所有選項和有效的分數！');
            return;
        }
        newQuestion = {
            question: mcQuestionText,
            options: options,
            correct_answer_index: correctOptionIndex,
            points: points,
            type: 'multiple_choice'
        };
    } else if (type === 'event_card') {
        const eventDescription = eventDescriptionInput.value.trim();
        const eventPoints = parseInt(eventPointsInput.value);

        if (!eventDescription) {
            alert('請填寫事件描述！');
            return;
        }
        newQuestion = {
            description: eventDescription,
            points_change: eventPoints, // 這裡使用 points_change 與其他題目區分
            type: 'event_card'
        };
    } else {
        alert('請選擇一個題目類型。');
        return;
    }

    currentQuiz.questions.push(newQuestion);
    saveQuizzes();
    renderQuizList();
    loadQuiz(selectedQuizId); // 重新載入當前題庫以刷新顯示
    cancelAddQuestion(); // 關閉新增題目區塊
    alert('題目已成功保存！');
}


// 取消新增題目
function cancelAddQuestion() {
    if (addQuestionToQuizSection) addQuestionToQuizSection.style.display = 'none';
    if (quizManagementSection) quizManagementSection.style.display = 'block'; // 返回題庫管理
    if (gameSettings) gameSettings.style.display = 'block'; // 確保遊戲設定也顯示
    // 清空所有輸入框
    if (questionInput) questionInput.value = '';
    if (answerInput) answerInput.value = '';
    if (mcQuestionInput) mcQuestionInput.value = '';
    if (option1Input) option1Input.value = '';
    if (option2Input) option2Input.value = '';
    if (option3Input) option3Input.value = '';
    if (option4Input) option4Input.value = '';
    if (eventDescriptionInput) eventDescriptionInput.value = '';
    if (eventPointsInput) eventPointsInput.value = 0;
    if (pointsInput) pointsInput.value = 10; // 重置分數

    // 重置題目類型選擇
    if (questionTypeSelect) questionTypeSelect.value = 'normal_question';
    // 取消後直接回到題庫管理介面，不需要再顯示新增題目區塊
}

// 渲染題庫列表 (用於管理介面)
function renderQuizList() {
    const quizListContainer = document.getElementById('quiz-list-container');
    if (!quizListContainer) {
        console.warn('quiz-list-container not found.');
        return;
    }
    quizListContainer.innerHTML = '';

    if (currentQuiz.questions.length === 0) {
        quizListContainer.innerHTML = '<p>當前題庫中沒有題目。</p>';
        return;
    }

    currentQuiz.questions.forEach((q, index) => {
        const item = document.createElement('div');
        item.classList.add('quiz-list-item');
        let displayText = '';
        if (q.type === 'normal_question') {
            displayText = `標準題: ${q.question} (答: ${q.answer})`;
        } else if (q.type === 'multiple_choice') {
            displayText = `選擇題: ${q.question} (正確選項: ${q.options[q.correct_answer_index]})`;
        } else if (q.type === 'event_card') {
            displayText = `事件卡: ${q.description} (點數變化: ${q.points_change})`;
        }

        item.innerHTML = `
            <span>${index + 1}. ${displayText}</span>
            <div class="item-actions">
                <button class="edit-question-button" data-index="${index}">編輯</button>
                <button class="delete-question-button" data-index="${index}">刪除</button>
            </div>
        `;
        quizListContainer.appendChild(item);
    });

    // 為編輯和刪除按鈕添加事件監聽器
    quizListContainer.querySelectorAll('.edit-question-button').forEach(button => {
        button.addEventListener('click', (e) => editQuestion(parseInt(e.target.dataset.index)));
    });
    quizListContainer.querySelectorAll('.delete-question-button').forEach(button => {
        button.addEventListener('click', (e) => deleteQuestion(parseInt(e.target.dataset.index)));
    });
}

// 編輯題目（目前僅為提示）
function editQuestion(index) {
    alert(`編輯題目功能尚未實作，正在編輯第 ${index + 1} 題。`);
    // 未來可以讀取題目數據並填充到新增題目表單中進行編輯
    // const questionToEdit = currentQuiz.questions[index];
    // // 這裡可以填寫邏輯來填充表單並切換到編輯模式
    // showAddQuestionSection(questionToEdit.type);
    // // 填充輸入框
    // if (questionToEdit.type === 'normal_question') {
    //     questionInput.value = questionToEdit.question;
    //     answerInput.value = questionToEdit.answer;
    // } else if (questionToEdit.type === 'multiple_choice') {
    //     mcQuestionInput.value = questionToEdit.question;
    //     option1Input.value = questionToEdit.options[0];
    //     option2Input.value = questionToEdit.options[1];
    //     option3Input.value = questionToEdit.options[2];
    //     option4Input.value = questionToEdit.options[3];
    //     correctOptionSelect.value = questionToEdit.correct_answer_index;
    // } else if (questionToEdit.type === 'event_card') {
    //     eventDescriptionInput.value = questionToEdit.description;
    //     eventPointsInput.value = questionToEdit.points_change;
    // }
    // pointsInput.value = questionToEdit.points || 0; // 事件卡可能沒有 points
    // // 可以添加一個隱藏的 input 來保存當前編輯的索引
    // // 或者修改 saveQuestion 邏輯來判斷是新增還是更新
}

// 刪除題目
function deleteQuestion(index) {
    if (confirm(`確定要刪除第 ${index + 1} 題嗎？`)) {
        currentQuiz.questions.splice(index, 1);
        saveQuizzes();
        renderQuizList(); // 重新渲染列表
        alert('題目已刪除！');
    }
}


// --- 事件監聽器 ---

// 開始遊戲按鈕
if (startGameButton) {
    startGameButton.addEventListener('click', initializeGame);
}

// 顯示答案按鈕
if (showAnswerButton) {
    showAnswerButton.addEventListener('click', () => {
        const cardIndex = parseInt(questionModal.dataset.cardIndex);
        const question = currentQuestions[cardIndex];

        if (question.type === 'normal_question') {
            correctAnswerDisplay.textContent = `正確答案: ${question.answer}`;
        }
        // 對於選擇題，正確答案已經在 handleOptionClick 處理過了
        correctAnswerDisplay.style.display = 'block';
        showAnswerButton.style.display = 'none'; // 隱藏顯示答案按鈕
        judgmentButtons.style.display = 'flex'; // 顯示判斷按鈕
    });
}

// 標記正確按鈕
if (markCorrectButton) {
    markCorrectButton.addEventListener('click', () => {
        const cardIndex = parseInt(questionModal.dataset.cardIndex);
        const question = currentQuestions[cardIndex];
        players[currentPlayerIndex].score += question.points;
        updatePlayerScores();
        feedbackElement.textContent = '分數已增加！';
        feedbackElement.style.color = '#4CAF50';
        markCardAsAnswered(cardIndex);
        setTimeout(() => {
            hideQuestionModal();
            nextTurn();
        }, 1500); // 1.5秒後關閉並換下一位玩家
    });
}

// 標記錯誤按鈕
if (markIncorrectButton) {
    markIncorrectButton.addEventListener('click', () => {
        const cardIndex = parseInt(questionModal.dataset.cardIndex);
        // 不扣分，只是標記為錯誤
        feedbackElement.textContent = '回答錯誤，不加分。';
        feedbackElement.style.color = '#F44336';
        markCardAsAnswered(cardIndex);
        setTimeout(() => {
            hideQuestionModal();
            nextTurn();
        }, 1500); // 1.5秒後關閉並換下一位玩家
    });
}

// 關閉問題模態框
if (closeButton) {
    closeButton.addEventListener('click', hideQuestionModal);
}

// 點擊模態框外部關閉 (可以選擇性啟用)
if (questionModal) {
    questionModal.addEventListener('click', (e) => {
        if (e.target === questionModal) {
            hideQuestionModal();
        }
    });
}

// --- 題庫管理事件監聽器 ---

// 選擇題庫時觸發載入
if (quizSelect) {
    quizSelect.addEventListener('change', (event) => {
        loadQuiz(event.target.value);
        renderQuizList(); // 重新渲染題目列表
    });
}

// 新增題庫按鈕
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
            selectedQuizId = newQuizId; // 自動選擇新創建的題庫
            saveQuizzes();
            populateQuizSelect();
            loadQuiz(newQuizId); // 載入新題庫
            renderQuizList(); // 渲染空題庫列表
            alert(`題庫 "${quizName.trim()}" 已創建！`);
        } else {
            alert('題庫名稱不能為空。');
        }
    });
}

// 刪除題庫按鈕
if (deleteQuizButton) {
    deleteQuizButton.addEventListener('click', () => {
        if (Object.keys(allQuizzes).length === 1) {
            alert('至少需要保留一個題庫！');
            return;
        }
        if (confirm(`確定要刪除題庫 "${currentQuiz.name}" 嗎？所有題目將會遺失！`)) {
            delete allQuizzes[selectedQuizId];
            // 重新選擇第一個題庫作為當前題庫
            selectedQuizId = Object.keys(allQuizzes)[0];
            loadQuiz(selectedQuizId);
            saveQuizzes();
            populateQuizSelect();
            renderQuizList();
            alert('題庫已刪除！');
        }
    });
}

// 匯出題庫按鈕
if (exportQuizButton) {
    exportQuizButton.addEventListener('click', () => {
        if (currentQuiz.questions.length === 0) {
            alert('當前題庫中沒有題目可以匯出。');
            return;
        }
        const quizData = JSON.stringify(currentQuiz.questions, null, 2); // 格式化 JSON
        const blob = new Blob([quizData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentQuiz.name}_quiz.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert(`題庫 "${currentQuiz.name}" 已匯出！`);
    });
}

// 匯入題庫按鈕
if (importQuizButton) {
    importQuizButton.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const importedQuestions = JSON.parse(event.target.result);
                        // 簡單驗證匯入的數據是否為陣列
                        if (Array.isArray(importedQuestions) && importedQuestions.every(q => typeof q === 'object' && q !== null && q.type)) {
                            const quizName = prompt('請輸入匯入題庫的名稱:');
                            if (quizName && quizName.trim() !== '') {
                                const newQuizId = generateUniqueId();
                                allQuizzes[newQuizId] = {
                                    id: newQuizId,
                                    name: quizName.trim(),
                                    questions: importedQuestions
                                };
                                selectedQuizId = newQuizId; // 自動選擇匯入的題庫
                                saveQuizzes();
                                populateQuizSelect();
                                loadQuiz(newQuizId);
                                renderQuizList();
                                alert(`題庫 "${quizName.trim()}" 已成功匯入！`);
                            } else {
                                alert('題庫名稱無效，匯入已取消。');
                            }
                        } else {
                            alert('匯入的 JSON 檔案格式不正確。請確保它包含有效的普通問題、選擇題或事件卡物件的陣列。');
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

// --- 初始化 ---

// 頁面載入完成時
document.addEventListener('DOMContentLoaded', () => {
    loadQuizzes(); // 載入所有題庫
    populateQuizSelect(); // 載入時填充下拉選單
    renderQuizList(); // 渲染當前選中題庫的題目列表
    // 移除這裡的 showAddQuestionSection 調用，改為透過按鈕觸發
});


// Fisher-Yates (Knuth) shuffle algorithm
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}


// --- 新增題目區塊的事件監聽器 ---

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

// 處理點擊「新增題目」按鈕顯示新增題目區塊
// 必須確保這個按鈕的監聽器在 DOMContentLoaded 後被設定
// 且在 DOM 元素 showAddQuestionSectionButton 宣告之後
if (showAddQuestionSectionButton) {
    showAddQuestionSectionButton.addEventListener('click', () => {
        showAddQuestionSection('normal_question'); // 點擊新增題目時，預設顯示標準題目類型
    });
}
