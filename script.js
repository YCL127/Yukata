// script.js

// --- 遊戲狀態變數 ---
let players = [];
let currentPlayerIndex = 0;
let allQuizzes = {};
let selectedQuizId = 'default';
let currentQuiz = { name: '預設題庫', questions: [] };
let lifelineTargetPlayerId = null; // 用於記錄被求救的玩家ID

// 【擴充】預設題庫，增加到10題
const defaultQuestions = [
    { type: 'multiple_choice', question: "哪個不是黃色的水果？", options: ["香蕉", "檸檬", "芒果", "藍莓"], correct_answer_index: 3, points: 10 },
    { type: 'true_false', question: "太陽是從東邊升起的。", correct_answer: 'true', points: 10 },
    { type: 'multiple_choice', question: "OOGON 在日文中是『黃金』的意思。", options: ["是", "否", "不確定", "以上皆非"], correct_answer_index: 0, points: 15 },
    { type: 'true_false', question: "CSS的全名是 Cascading Style Sheets。", correct_answer: 'true', points: 15 },
    { type: 'multiple_choice', question: "在 RGB 色彩模型中，黃色的代碼是？", options: ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"], correct_answer_index: 3, points: 20 },
    { type: 'true_false', question: "JavaScript 是一種靜態類型的程式語言。", correct_answer: 'false', points: 20 },
    { type: 'multiple_choice', question: "化學元素『金』的符號是什麼？", options: ["Ag", "Go", "Au", "Gd"], correct_answer_index: 2, points: 15 },
    { type: 'true_false', question: "在中國古代，黃色是平民可以隨意使用的顏色。", correct_answer: 'false', points: 10 },
    { type: 'multiple_choice', question: "在CMYK印刷四分色模型中，Y代表什麼顏色？", options: ["藍色 (Cyan)", "洋紅色 (Magenta)", "黑色 (Black)", "黃色 (Yellow)"], correct_answer_index: 3, points: 15 },
    { type: 'true_false', question: "美國校車的標準顏色是『校車黃』，是為了安全醒目。", correct_answer: 'true', points: 10 }
];


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateUniqueId() { return '_' + Math.random().toString(36).substr(2, 9); }

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM 元素獲取 ---
    const header = document.querySelector('header');
    const startGameButton = document.getElementById('start-game-button');
    const numPlayersInput = document.getElementById('num-players');
    const numQuestionsInput = document.getElementById('num-questions');
    const gameSettings = document.getElementById('game-settings');
    const gameContainer = document.getElementById('game-container');
    const currentPlayerDisplay = document.getElementById('current-player-display');
    const playerScoresContainer = document.getElementById('player-scores');
    const abortGameButton = document.getElementById('abort-game-button');
    const turnTransitionDisplay = document.getElementById('turn-transition-display');
    const turnTransitionText = document.getElementById('turn-transition-text');
    const nextPlayerButton = document.getElementById('next-player-button');
    const questionDisplayArea = document.getElementById('question-display-area');
    const questionTextElement = document.getElementById('question-text');
    const answerOptionsContainer = document.getElementById('answer-options-container');
    const correctAnswerDisplay = document.getElementById('correct-answer-display');
    const feedbackElement = document.getElementById('feedback');
    const questionProgressDisplay = document.getElementById('question-progress-display');
    const lifelineButtons = document.getElementById('lifeline-buttons');
    const askTeacherButton = document.getElementById('ask-teacher-button');
    const askClassmateButton = document.getElementById('ask-classmate-button');
    const finalScoreModal = document.getElementById('final-score-modal');
    const closeFinalScoreModalButton = document.getElementById('close-final-score-modal');
    const finalScoresDisplay = document.getElementById('final-scores-display');
    const restartGameButton = document.getElementById('restart-game-button');
    const selectPlayerModal = document.getElementById('select-player-modal');
    const playerSelectionList = document.getElementById('player-selection-list');
    const cancelPlayerSelectionButton = document.getElementById('cancel-player-selection-button');
    const nextActionButton = document.getElementById('next-action-button');

    // 題庫管理相關DOM
    const quizSelect = document.getElementById('quiz-select');
    const addQuizButton = document.getElementById('add-quiz-button');
    const deleteQuizButton = document.getElementById('delete-quiz-button');
    const importQuizButton = document.getElementById('import-quiz-button');
    const exportQuizButton = document.getElementById('export-quiz-button');
    const quizQuestionList = document.getElementById('quiz-question-list');
    const addQuestionToQuizSection = document.getElementById('add-question-to-quiz-section');
    const showAddQuestionSectionButton = document.getElementById('show-add-question-section-button');
    const questionTypeSelect = document.getElementById('question-type-select');
    const multipleChoiceInputs = document.getElementById('multiple-choice-inputs');
    const mcQuestionInput = document.getElementById('mc-question-input');
    const optionInputs = [document.getElementById('option1-input'), document.getElementById('option2-input'), document.getElementById('option3-input'), document.getElementById('option4-input')];
    const correctOptionSelect = document.getElementById('correct-option-select');
    const trueFalseInputs = document.getElementById('true-false-inputs');
    const tfQuestionInput = document.getElementById('tf-question-input');
    const tfCorrectAnswerSelect = document.getElementById('tf-correct-answer-select');
    const pointsInput = document.getElementById('points-input');
    const saveQuestionButton = document.getElementById('save-question-button');
    const cancelAddQuestionButton = document.getElementById('cancel-add-question-button');
    let editingQuestionIndex = -1;


    // --- 題庫管理相關函數 ---
    function saveQuizzes() { localStorage.setItem('allQuizzes_OOGON', JSON.stringify(allQuizzes)); }

    function loadQuizzes() {
        const storedQuizzes = localStorage.getItem('allQuizzes_OOGON');
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
                    case 'multiple_choice': displayContent = `[選擇題 ${q.points}點] Q: ${q.question}`; break;
                    case 'true_false': displayContent = `[是非題 ${q.points}點] Q: ${q.correct_answer === 'true' ? '(O)' : '(X)'} ${q.question}`; break;
                    default: displayContent = `[未知類型]`; break;
                }
                item.innerHTML = `<span>${displayContent}</span><div class="item-actions"><button class="edit-question-btn" data-index="${index}">編輯</button><button class="delete-question-btn" data-index="${index}">刪除</button></div>`;
                quizQuestionList.appendChild(item);
            });
        } else {
            quizQuestionList.innerHTML = '<li>此題庫中沒有題目。</li>';
        }
    }

    function showAddQuestionSection(type = 'multiple_choice', questionToEdit = null, index = -1) {
        addQuestionToQuizSection.style.display = 'block';
        editingQuestionIndex = index;
        [mcQuestionInput, tfQuestionInput, ...optionInputs].forEach(i => i.value = '');
        pointsInput.value = '10';
        [multipleChoiceInputs, trueFalseInputs].forEach(d => d.style.display = 'none');
        questionTypeSelect.value = questionToEdit ? questionToEdit.type : type;
        
        switch (questionTypeSelect.value) {
            case 'multiple_choice':
                multipleChoiceInputs.style.display = 'block';
                if (questionToEdit) {
                    mcQuestionInput.value = questionToEdit.question;
                    optionInputs.forEach((input, i) => input.value = questionToEdit.options[i]);
                    correctOptionSelect.value = questionToEdit.correct_answer_index;
                    pointsInput.value = questionToEdit.points;
                }
                break;
            case 'true_false':
                trueFalseInputs.style.display = 'block';
                if (questionToEdit) {
                    tfQuestionInput.value = questionToEdit.question;
                    tfCorrectAnswerSelect.value = questionToEdit.correct_answer;
                    pointsInput.value = questionToEdit.points;
                }
                break;
        }
        saveQuestionButton.textContent = editingQuestionIndex !== -1 ? '更新題目' : '儲存題目';
    }
    
    function cancelAddQuestion() { addQuestionToQuizSection.style.display = 'none'; editingQuestionIndex = -1; }
    
    function saveOrUpdateQuestion() {
        if (!currentQuiz) { alert("無選中題庫，無法儲存。"); return; }
        const type = questionTypeSelect.value;
        const points = parseInt(pointsInput.value);
        if (isNaN(points) || points <= 0) { alert("請輸入有效的分數。"); return; }
        const questionData = { type, points };

        if (type === 'multiple_choice') {
            const q = mcQuestionInput.value.trim();
            const opts = optionInputs.map(i => i.value.trim());
            if (!q || opts.some(o => !o)) { alert("選擇題所有欄位不能為空。"); return; }
            questionData.question = q;
            questionData.options = opts;
            questionData.correct_answer_index = parseInt(correctOptionSelect.value);
        } else if (type === 'true_false') {
            const q = tfQuestionInput.value.trim();
            if (!q) { alert("題目不能為空。"); return; }
            questionData.question = q;
            questionData.correct_answer = tfCorrectAnswerSelect.value;
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


    // --- 遊戲流程 ---

    // 【主要修改處】
    function initializeGame() {
        const numPlayers = parseInt(numPlayersInput.value);
        const numQuestionsPerPlayer = parseInt(numQuestionsInput.value);

        // 【新增】檢查題庫題目數量是否足夠
        const totalQuestionsNeeded = numPlayers * numQuestionsPerPlayer;
        if (currentQuiz.questions.length < totalQuestionsNeeded) {
            const maxQuestionsPossible = Math.floor(currentQuiz.questions.length / numPlayers);
            alert(
`題庫題目不足！

總共需要 ${totalQuestionsNeeded} 題 ( ${numPlayers} 人 × 每人 ${numQuestionsPerPlayer} 題)，
但題庫中只有 ${currentQuiz.questions.length} 題。

建議每位玩家的題目數量可設定為 ${maxQuestionsPossible > 0 ? maxQuestionsPossible : 0} 題或更少。`
            );
            return; // 終止遊戲開始
        }
        
        // 【修改】先將所有題目洗牌一次，再依序不重複地分配給玩家
        const allAvailableQuestions = shuffleArray([...currentQuiz.questions]);
        let questionPointer = 0;

        players = Array.from({ length: numPlayers }, (_, i) => {
            const playerQuestions = allAvailableQuestions.slice(questionPointer, questionPointer + numQuestionsPerPlayer);
            questionPointer += numQuestionsPerPlayer;
            
            return {
                id: i,
                score: 0,
                questions: playerQuestions,
                currentQuestionIndex: 0,
                lifelines: { askTeacher: true, askClassmate: true }
            };
        });
        
        currentPlayerIndex = 0;
        gameSettings.style.display = 'none';
        header.style.display = 'none';
        gameContainer.style.display = 'flex';
        updatePlayerInfo();
        startPlayerTurn();
    }
    // 【主要修改結束】
    
    function startPlayerTurn() {
        updatePlayerInfo();
        questionDisplayArea.style.display = 'none';
        turnTransitionDisplay.style.display = 'block';
        turnTransitionText.textContent = `輪到玩家 ${currentPlayerIndex + 1}！`;
    }

    function displayNextQuestionForPlayer() {
        lifelineTargetPlayerId = null; 
        
        turnTransitionDisplay.style.display = 'none';
        questionDisplayArea.style.display = 'flex';
        feedbackElement.innerHTML = '';
        correctAnswerDisplay.style.display = 'none';
        nextActionButton.style.display = 'none';
        
        const player = players[currentPlayerIndex];
        const question = player.questions[player.currentQuestionIndex];
        
        questionProgressDisplay.textContent = `第 ${player.currentQuestionIndex + 1} / ${player.questions.length} 題`;
        questionTextElement.textContent = question.question;

        askTeacherButton.disabled = !player.lifelines.askTeacher;
        askTeacherButton.classList.toggle('used', !player.lifelines.askTeacher);
        
        const canAskClassmate = player.lifelines.askClassmate && players.length > 1;
        askClassmateButton.disabled = !canAskClassmate;
        askClassmateButton.classList.toggle('used', !canAskClassmate);
        
        lifelineButtons.querySelectorAll('button').forEach(b => {
             if (!b.disabled) b.style.opacity = '1';
        });

        renderAnswerOptions(question);
    }
    
    function renderAnswerOptions(question) {
        answerOptionsContainer.innerHTML = '';
        if (question.type === 'multiple_choice') {
            question.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'answer-option-button';
                button.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
                button.onclick = () => handleAnswer(index === question.correct_answer_index, question);
                answerOptionsContainer.appendChild(button);
            });
        } else if (question.type === 'true_false') {
            const trueButton = document.createElement('button');
            trueButton.className = 'answer-option-button';
            trueButton.textContent = 'O (是)';
            trueButton.onclick = () => handleAnswer(question.correct_answer === 'true', question);
            answerOptionsContainer.appendChild(trueButton);
            
            const falseButton = document.createElement('button');
            falseButton.className = 'answer-option-button';
            falseButton.textContent = 'X (非)';
            falseButton.onclick = () => handleAnswer(question.correct_answer === 'false', question);
            answerOptionsContainer.appendChild(falseButton);
        }
    }
    
    function handleAnswer(isCorrect, question) {
        answerOptionsContainer.querySelectorAll('button').forEach(b => b.disabled = true);
        lifelineButtons.querySelectorAll('button').forEach(b => b.disabled = true);
        
        if (isCorrect) {
            if (lifelineTargetPlayerId !== null) {
                const halfPoints = Math.floor(question.points / 2);
                const targetPlayer = players.find(p => p.id === lifelineTargetPlayerId);
                
                players[currentPlayerIndex].score += halfPoints;
                if (targetPlayer) {
                    targetPlayer.score += halfPoints;
                }
                
                feedbackElement.innerHTML = `<span style="color: green; font-weight: bold;">回答正確！你和玩家 ${targetPlayer.id + 1} 各獲得 ${halfPoints} 點！</span>`;

            } else {
                players[currentPlayerIndex].score += question.points;
                feedbackElement.innerHTML = `<span style="color: green; font-weight: bold;">正確！獲得 ${question.points} 點。</span>`;
            }
        } else {
            let correctAnswerText = '';
            if (question.type === 'multiple_choice') {
                correctAnswerText = `${String.fromCharCode(65 + question.correct_answer_index)}. ${question.options[question.correct_answer_index]}`;
            } else {
                correctAnswerText = question.correct_answer === 'true' ? 'O (是)' : 'X (非)';
            }
            feedbackElement.innerHTML = `<div style="color: red; font-weight: bold; margin-bottom: 8px;">答錯了！</div><div>正確答案是： <strong>${correctAnswerText}</strong></div>`;
        }
        
        updatePlayerInfo();

        const isLastQuestionForPlayer = players[currentPlayerIndex].currentQuestionIndex + 1 >= players[currentPlayerIndex].questions.length;
        const isLastPlayer = currentPlayerIndex + 1 >= players.length;

        if (isLastQuestionForPlayer && isLastPlayer) {
            nextActionButton.textContent = "遊戲結束";
        } else if (isLastQuestionForPlayer) {
            nextActionButton.textContent = "下一位";
        } else {
            nextActionButton.textContent = "下一題";
        }
        
        nextActionButton.style.display = 'block';
        
        nextActionButton.onclick = () => {
            nextActionButton.style.display = 'none';
            
            players[currentPlayerIndex].currentQuestionIndex++;
            if (players[currentPlayerIndex].currentQuestionIndex >= players[currentPlayerIndex].questions.length) {
                moveToNextPlayer();
            } else {
                displayNextQuestionForPlayer();
            }
        };
    }
    
    function moveToNextPlayer() {
        if (currentPlayerIndex < players.length - 1) {
            currentPlayerIndex++;
            startPlayerTurn();
        } else {
            endGame();
        }
    }
    
    function resetGame() {
        gameSettings.style.display = 'block';
        gameContainer.style.display = 'none';
        header.style.display = '';
        finalScoreModal.classList.remove('show-modal');
        loadQuizzes();
        populateQuizSelect();
        renderQuizList();
    }

    function updatePlayerInfo() {
        currentPlayerDisplay.textContent = `當前玩家: 玩家 ${currentPlayerIndex + 1}`;
        playerScoresContainer.innerHTML = players.map((p, i) =>
            `<div class="player-score ${i === currentPlayerIndex ? 'current' : ''}">玩家 ${i + 1}: ${p.score} 點</div>`
        ).join('');
    }

    function endGame() {
        questionDisplayArea.style.display = 'none';
        turnTransitionDisplay.style.display = 'none';
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

    // --- 求救功能 ---
    function handleAskTeacher() {
        const player = players[currentPlayerIndex];
        if (!player.lifelines.askTeacher) return;

        player.lifelines.askTeacher = false;
        askTeacherButton.disabled = true;
        askTeacherButton.classList.add('used');
        
        const question = player.questions[player.currentQuestionIndex];
        
        if (question.type === 'multiple_choice') {
            const correctIndex = question.correct_answer_index;
            const incorrectIndices = [0, 1, 2, 3].filter(i => i !== correctIndex);
            shuffleArray(incorrectIndices);
            const indicesToDisable = incorrectIndices.slice(0, 2);
            
            answerOptionsContainer.querySelectorAll('button').forEach((button, index) => {
                if (indicesToDisable.includes(index)) {
                    button.disabled = true;
                    button.style.opacity = '0.3';
                }
            });
        } else if (question.type === 'true_false') {
            const incorrectAnswer = question.correct_answer === 'true' ? 'X (非)' : 'O (是)';
            answerOptionsContainer.querySelectorAll('button').forEach(button => {
                if (button.textContent === incorrectAnswer) {
                    button.disabled = true;
                    button.style.opacity = '0.3';
                }
            });
        }
    }

    function handleAskClassmate() {
        const player = players[currentPlayerIndex];
        if (!player.lifelines.askClassmate || players.length <= 1) return;

        playerSelectionList.innerHTML = ''; 

        players.forEach(p => {
            if (p.id !== player.id) {
                const button = document.createElement('button');
                button.textContent = `玩家 ${p.id + 1}`;
                button.onclick = () => {
                    selectPlayerForHelp(p.id);
                };
                playerSelectionList.appendChild(button);
            }
        });
        
        selectPlayerModal.classList.add('show-modal');
    }

    function selectPlayerForHelp(selectedPlayerId) {
        lifelineTargetPlayerId = selectedPlayerId;
        
        const player = players[currentPlayerIndex];
        player.lifelines.askClassmate = false;
        askClassmateButton.disabled = true;
        askClassmateButton.classList.add('used');
        
        selectPlayerModal.classList.remove('show-modal');
    }


    // --- 事件監聽器 ---
    startGameButton.addEventListener('click', initializeGame);
    nextPlayerButton.addEventListener('click', displayNextQuestionForPlayer);
    abortGameButton.addEventListener('click', () => { if(confirm('確定要結束目前的遊戲嗎？')) { resetGame(); } });
    
    askTeacherButton.addEventListener('click', handleAskTeacher);
    askClassmateButton.addEventListener('click', handleAskClassmate);
    
    cancelPlayerSelectionButton.addEventListener('click', () => {
        selectPlayerModal.classList.remove('show-modal');
    });

    closeFinalScoreModalButton.addEventListener('click', resetGame);
    restartGameButton.addEventListener('click', resetGame);
    
    questionTypeSelect.addEventListener('change', (e) => showAddQuestionSection(e.target.value));
    saveQuestionButton.addEventListener('click', saveOrUpdateQuestion);
    cancelAddQuestionButton.addEventListener('click', cancelAddQuestion);
    showAddQuestionSectionButton.addEventListener('click', () => showAddQuestionSection('multiple_choice'));
    
    quizQuestionList.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const index = parseInt(target.dataset.index);
        if (target.classList.contains('edit-question-btn')) {
            showAddQuestionSection(currentQuiz.questions[index].type, currentQuiz.questions[index], index);
        }
        if (target.classList.contains('delete-question-btn')) {
            if (confirm('確定要刪除這道題目嗎？')) {
                currentQuiz.questions.splice(index, 1);
                saveQuizzes();
                renderQuizList();
            }
        }
    });
    
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
                        saveQuizzes(); populateQuizSelect(); renderQuizList();
                        alert(`題庫 "${data.name}" 已成功匯入！`);
                    } else { alert('檔案格式不正確。'); }
                } catch (err) { alert('讀取檔案時發生錯誤。'); }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    quizSelect.addEventListener('change', (e) => { 
        selectedQuizId = e.target.value; 
        currentQuiz = allQuizzes[selectedQuizId]; 
        renderQuizList(); 
    });

    // --- 初始化調用 ---
    loadQuizzes();
    populateQuizSelect();
    renderQuizList();
});