// script.js

// --- 遊戲狀態變數 ---
let players = [];
let currentPlayerIndex = 0;
let currentQuestions = [];
let answeredQuestions = new Set();
let allQuizzes = {};
let selectedQuizId = 'default';
let currentQuiz = { name: '預設題庫', questions: [] };

// 預設題庫... (此處省略，與您原檔案相同)
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


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

document.addEventListener('DOMContentLoaded', () => {
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
    const quizSelect = document.getElementById('quiz-select');
    const addQuizButton = document.getElementById('add-quiz-button');
    const deleteQuizButton = document.getElementById('delete-quiz-button');
    const importQuizButton = document.getElementById('import-quiz-button');
    const exportQuizButton = document.getElementById('export-quiz-button');
    const quizQuestionList = document.getElementById('quiz-question-list');
    
    // 【修改2】獲取編輯 Modal 相關元素
    const editQuizModal = document.getElementById('edit-quiz-modal');
    const closeEditModalButton = document.getElementById('close-edit-modal');
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
    const eventTypeSelect = document.getElementById('event-type-select');
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
            allQuizzes = { 'default': { id: 'default', name: '預設題庫', questions: defaultQuestions } };
            saveQuizzes();
        }
        currentQuiz = allQuizzes[selectedQuizId] || allQuizzes['default'];
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
        if (currentQuiz?.questions?.length > 0) {
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
                        let eventTitle = '';
                        switch (q.event_type) {
                            case 'double_score': eventTitle = '分數加倍'; break;
                            case 'swap_score': eventTitle = '分數交換'; break;
                            case 'random_score': eventTitle = '隨機分數'; break;
                            default: eventTitle = `點數 ${q.event_points >= 0 ? '+' : ''}${q.event_points}`; break;
                        }
                        displayContent = `[事件卡 - ${eventTitle}] ${q.event_description}`;
                        break;
                    default: displayContent = `[未知類型]`; break;
                }
                item.innerHTML = `
                    <span>${displayContent}</span>
                    <div class="item-actions">
                        <button class="edit-question-btn" data-index="${index}">編輯</button>
                        <button class="delete-question-btn" data-index="${index}">刪除</button>
                    </div>`;
                quizQuestionList.appendChild(item);
            });
        } else {
            quizQuestionList.innerHTML = '<li>此題庫中沒有題目。</li>';
        }
    }

    function updateEventInputsVisibility() {
        const selectedEventType = eventTypeSelect.value;
        const show = selectedEventType === 'fixed_points';
        eventDescriptionContainer.style.display = show ? 'flex' : 'none';
        eventPointsContainer.style.display = show ? 'flex' : 'none';
    }

    // 【修改2】改為顯示 Modal
    function showAddQuestionSection(type = 'normal_question', questionToEdit = null, index = -1) {
        editQuizModal.style.display = 'flex';
        editQuizModal.classList.add('show-modal');
        
        editingQuestionIndex = index;
        [questionInput, answerInput, mcQuestionInput, option1Input, option2Input, option3Input, option4Input, eventDescriptionInput].forEach(i => i.value = '');
        [correctOptionSelect, eventPointsInput].forEach(i => i.value = '0');
        pointsInput.value = '10';
        eventTypeSelect.value = 'fixed_points';
        [normalQuestionInputs, multipleChoiceInputs, eventCardInputs].forEach(d => d.style.display = 'none');
        pointsInput.parentElement.style.display = 'flex';
        questionTypeSelect.value = questionToEdit ? questionToEdit.type : type;
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
                    eventDescriptionInput.value = questionToEdit.event_description || '';
                    eventPointsInput.value = questionToEdit.event_points || 0;
                }
                updateEventInputsVisibility();
                break;
        }
        saveQuestionButton.textContent = editingQuestionIndex !== -1 ? '更新題目' : '儲存題目';
    }

    // 【修改2】改為關閉 Modal
    function cancelAddQuestion() {
        editQuizModal.classList.remove('show-modal');
        setTimeout(() => { editQuizModal.style.display = 'none'; }, 300);
        editingQuestionIndex = -1;
    }

    function saveOrUpdateQuestion() {
        if (!currentQuiz) { alert("無選中題庫，無法儲存。"); return; }
        const type = questionTypeSelect.value;
        const questionData = { type };
        if (type !== 'event_card') {
            const points = parseInt(pointsInput.value);
            if (isNaN(points) || points <= 0) { alert("請輸入有效的分數。"); return; }
            questionData.points = points;
        }
        if (type === 'normal_question') {
            const q = questionInput.value.trim();
            const a = answerInput.value.trim();
            if (!q || !a) { alert("題目和答案不能為空。"); return; }
            questionData.question = q;
            questionData.answer = a;
        } else if (type === 'multiple_choice') {
            const q = mcQuestionInput.value.trim();
            const opts = [option1Input, option2Input, option3Input, option4Input].map(i => i.value.trim());
            if (!q || opts.some(o => !o)) { alert("選擇題所有欄位不能為空。"); return; }
            questionData.question = q;
            questionData.options = opts;
            questionData.correct_answer_index = parseInt(correctOptionSelect.value);
        } else if (type === 'event_card') {
            const eventType = eventTypeSelect.value;
            questionData.event_type = eventType;
            switch (eventType) {
                case 'fixed_points':
                    const desc = eventDescriptionInput.value.trim();
                    const pts = parseInt(eventPointsInput.value);
                    if (!desc || isNaN(pts)) { alert("事件描述不能為空，點數必須是數字。"); return; }
                    questionData.event_description = desc;
                    questionData.event_points = pts;
                    break;
                case 'double_score': questionData.event_description = "天賜良機！分數加倍！"; break;
                case 'swap_score': questionData.event_description = "風水輪流轉！與一名玩家交換分數！"; break;
                case 'random_score': questionData.event_description = "命運的時刻！隨機增減分數！"; break;
            }
        }
        if (editingQuestionIndex === -1) {
            currentQuiz.questions.push(questionData);
        } else {
            currentQuiz.questions[editingQuestionIndex] = questionData;
        }
        saveQuizzes();
        renderQuizList();
        cancelAddQuestion();
    }

    function initializeGame() {
        if (!currentQuiz?.questions?.length) { alert('請選擇一個包含題目的題庫！'); return; }
        const numPlayers = parseInt(numPlayersInput.value);
        const numQuestions = parseInt(numQuestionsInput.value);
        players = Array.from({ length: numPlayers }, (_, i) => ({ id: i, score: 0 }));
        currentPlayerIndex = 0;
        answeredQuestions.clear();
        const shuffled = shuffleArray([...currentQuiz.questions]);
        currentQuestions = shuffled.slice(0, Math.min(numQuestions, shuffled.length));
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
        loadQuizzes();
        populateQuizSelect();
        renderQuizList();
    }

    function updatePlayerInfo() {
        currentPlayerDisplay.textContent = `當前玩家: 玩家 ${currentPlayerIndex + 1}`;
        playerScoresContainer.innerHTML = players.map((p, i) =>
            `<div class="player-score ${i === currentPlayerIndex ? 'current' : ''}">
                玩家 ${i + 1}: ${p.score} 點
             </div>`
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
        if (answeredQuestions.has(cardIndex)) { alert('這張卡片已經被翻過了！'); return; }
        displayQuestion(currentQuestions[cardIndex], cardIndex);
    }

    function displayQuestion(question, cardIndex) {
        [correctAnswerDisplay, judgmentButtons, multipleChoiceOptionsContainer].forEach(el => el.style.display = 'none');
        feedbackElement.innerHTML = '';
        showAnswerButton.style.display = 'block';
        questionModal.style.display = 'flex';
        questionModal.classList.add('show-modal');
        if (question.type === 'normal_question') {
            questionTextElement.textContent = question.question;
            showAnswerButton.onclick = () => {
                correctAnswerDisplay.textContent = `答案：${question.answer}`;
                correctAnswerDisplay.style.display = 'block';
                judgmentButtons.style.display = 'flex';
                showAnswerButton.style.display = 'none';
            };
            markCorrectButton.onclick = () => handleAnswer(true, question.points, cardIndex);
            markIncorrectButton.onclick = () => handleAnswer(false, 0, cardIndex);
        } else if (question.type === 'multiple_choice') {
            questionTextElement.textContent = question.question;
            showAnswerButton.style.display = 'none';
            renderMultipleChoiceOptions(question, cardIndex);
        } else if (question.type === 'event_card') {
            questionTextElement.textContent = `事件卡：${question.event_description}`;
            showAnswerButton.style.display = 'none';
            applyEventCardEffect(question);
            markCardAsAnswered(cardIndex);
            setTimeout(() => {
                hideQuestionModal();
                nextTurn();
            }, 2500);
        }
    }

    function renderMultipleChoiceOptions(question, cardIndex) {
        multipleChoiceOptionsContainer.innerHTML = '';
        multipleChoiceOptionsContainer.style.display = 'flex';
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'mc-option-button';
            button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
            button.onclick = () => {
                multipleChoiceOptionsContainer.querySelectorAll('button').forEach(b => b.disabled = true);
                const isCorrect = index === question.correct_answer_index;
                handleAnswer(isCorrect, isCorrect ? question.points : 0, cardIndex, question);
            };
            multipleChoiceOptionsContainer.appendChild(button);
        });
    }

    function handleAnswer(isCorrect, points, cardIndex, question = null) {
        if (isCorrect) {
            players[currentPlayerIndex].score += points;
            feedbackElement.innerHTML = `<span style="color: green; font-weight: bold;">正確！獲得 ${points} 點。</span>`;
        } else {
            if (question && question.type === 'multiple_choice') {
                const correctOptionLetter = String.fromCharCode(65 + question.correct_answer_index);
                const correctOptionText = question.options[question.correct_answer_index];
                feedbackElement.innerHTML = `
                    <div style="color: red; font-weight: bold; margin-bottom: 8px;">答錯了，再接再厲！</div>
                    <div>正確答案是： <strong>${correctOptionLetter}. ${correctOptionText}</strong></div>
                `;
            } else {
                feedbackElement.innerHTML = '<span style="color: red; font-weight: bold;">錯誤。</span>';
            }
        }
        updatePlayerInfo();
        markCardAsAnswered(cardIndex);
        setTimeout(() => {
            hideQuestionModal();
            nextTurn();
        }, 2000);
    }
    
    function applyEventCardEffect(eventCard) {
        const player = players[currentPlayerIndex];
        let feedbackText = '';
        const eventType = eventCard.event_type || 'fixed_points';
        switch (eventType) {
            case 'double_score':
                const oldScore = player.score;
                player.score *= 2;
                feedbackText = `玩家 ${currentPlayerIndex + 1} 分數加倍！從 ${oldScore} 點變為 ${player.score} 點！`;
                break;
            case 'swap_score':
                const otherPlayers = players.filter((_, i) => i !== currentPlayerIndex);
                if (otherPlayers.length > 0) {
                    const targetPlayer = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
                    const targetPlayerIndex = players.findIndex(p => p.id === targetPlayer.id);
                    [player.score, players[targetPlayerIndex].score] = [players[targetPlayerIndex].score, player.score];
                    feedbackText = `玩家 ${currentPlayerIndex + 1} 與 玩家 ${targetPlayerIndex + 1} 交換了分數！`;
                } else {
                    feedbackText = "場上沒有其他玩家可以交換分數！";
                }
                break;
            case 'random_score':
                const randomPoints = Math.floor(Math.random() * 61) - 30;
                player.score += randomPoints;
                feedbackText = `隨機事件！玩家 ${currentPlayerIndex + 1} 分數 ${randomPoints >= 0 ? `增加 ${randomPoints}` : `減少 ${-randomPoints}`} 點！`;
                break;
            default:
                const points = eventCard.event_points || 0;
                player.score += points;
                feedbackText = `${eventCard.event_description} 玩家 ${currentPlayerIndex + 1} 點數變化：${points >= 0 ? '+' : ''}${points}`;
                break;
        }
        feedbackElement.innerHTML = `<span style="color: #00008B; font-weight: bold;">${feedbackText}</span>`;
        updatePlayerInfo();
    }

    function hideQuestionModal() {
        questionModal.classList.remove('show-modal');
        setTimeout(() => { questionModal.style.display = 'none'; }, 300);
    }

    function markCardAsAnswered(index) {
        answeredQuestions.add(index);
        const card = document.querySelector(`.question-card[data-index="${index}"]`);
        if (card) { card.classList.add('answered'); }
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
        finalScoreModal.style.display = 'flex';
        finalScoreModal.classList.add('show-modal');
        finalScoresDisplay.innerHTML = '<h2>最終得分</h2>';
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        sortedPlayers.forEach((p, index) => {
            const div = document.createElement('div');
            div.className = 'player-final-score';
            div.textContent = `玩家 ${p.id + 1}: ${p.score} 點`;
            if (index === 0 && p.score > 0) div.classList.add('winner');
            finalScoresDisplay.appendChild(div);
        });
    }

    // --- 事件監聽器 ---
    startGameButton.addEventListener('click', initializeGame);
    closeButton.addEventListener('click', hideQuestionModal);
    quizSelect.addEventListener('change', (e) => { selectedQuizId = e.target.value; currentQuiz = allQuizzes[selectedQuizId]; renderQuizList(); });
    addQuizButton.addEventListener('click', () => {
        const name = prompt('請輸入新題庫的名稱:');
        if (name?.trim()) {
            const newId = generateUniqueId();
            allQuizzes[newId] = { id: newId, name: name.trim(), questions: [] };
            selectedQuizId = newId;
            saveQuizzes(); populateQuizSelect(); renderQuizList();
        }
    });
    deleteQuizButton.addEventListener('click', () => {
        if (selectedQuizId === 'default') { alert('不能刪除預設題庫！'); return; }
        if (confirm(`確定要刪除題庫 "${currentQuiz.name}" 嗎？`)) {
            delete allQuizzes[selectedQuizId];
            selectedQuizId = 'default';
            saveQuizzes(); resetGame();
        }
    });
    exportQuizButton.addEventListener('click', () => {
        if (!currentQuiz) { alert('沒有可匯出的題庫！'); return; }
        const a = document.createElement('a');
        a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentQuiz, null, 2));
        a.download = `${currentQuiz.name}.json`;
        a.click();
    });
    importQuizButton.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = re => {
                try {
                    const data = JSON.parse(re.target.result);
                    if (data?.name && Array.isArray(data.questions)) {
                        const newId = generateUniqueId();
                        allQuizzes[newId] = { ...data, id: newId, name: data.name };
                        selectedQuizId = newId;
                        // 【修改1】匯入後，更新 currentQuiz 變數以立即顯示
                        currentQuiz = allQuizzes[newId];
                        saveQuizzes();
                        populateQuizSelect();
                        renderQuizList();
                        alert(`題庫 "${data.name}" 已成功匯入！`);
                    } else { alert('檔案格式不正確。'); }
                } catch (err) { alert('讀取檔案時發生錯誤。'); }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    closeFinalScoreModalButton.addEventListener('click', () => { finalScoreModal.style.display = 'none'; resetGame(); });
    restartGameButton.addEventListener('click', () => { finalScoreModal.style.display = 'none'; resetGame(); });
    
    // 【修改2】為編輯 Modal 的關閉按鈕添加事件
    closeEditModalButton.addEventListener('click', cancelAddQuestion);

    questionTypeSelect.addEventListener('change', (e) => showAddQuestionSection(e.target.value));
    eventTypeSelect.addEventListener('change', updateEventInputsVisibility);
    saveQuestionButton.addEventListener('click', saveOrUpdateQuestion);
    cancelAddQuestionButton.addEventListener('click', cancelAddQuestion);
    showAddQuestionSectionButton.addEventListener('click', () => showAddQuestionSection('normal_question'));
    quizQuestionList.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const index = parseInt(target.dataset.index);
        if (target.classList.contains('edit-question-btn')) showAddQuestionSection(currentQuiz.questions[index].type, currentQuiz.questions[index], index);
        if (target.classList.contains('delete-question-btn')) {
            if (confirm('確定要刪除這道題目嗎？')) {
                currentQuiz.questions.splice(index, 1);
                saveQuizzes(); renderQuizList();
            }
        }
    });

    // --- 初始化調用 ---
    loadQuizzes();
    populateQuizSelect();
    renderQuizList();
});