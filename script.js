// script.js

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
        question: "2 + 2 等於多少？",
        options: ["3", "4", "5", "6"],
        correct_answer_index: 1, // 4 是選項 2
        points: 10,
        type: 'multiple_choice'
    },
    {
        question: "以下哪一個是水果？",
        options: ["胡蘿蔔", "馬鈴薯", "蘋果", "洋蔥"],
        correct_answer_index: 2, // 蘋果是選項 3
        points: 20,
        type: 'multiple_choice'
    },
    {
        question: "事件卡", // 統一事件卡在遊戲板上顯示的標題
        event_description: "全體玩家各加 5 分",
        event_type: "add_score_all_players",
        points: 5,
        type: 'event_card'
    },
    {
        question: "事件卡",
        event_description: "當前玩家失去 10 分",
        event_type: "deduct_score",
        points: -10,
        type: 'event_card'
    },
    {
        question: "事件卡",
        event_description: "獲得隨機獎勵",
        event_type: "random_bonus",
        points: 0,
        type: 'event_card'
    }
];

// UI 元素獲取 (這些在 DOMContentLoaded 外部聲明為 let，以便在內部賦值並在其他函數中使用)
let gameSettings;
let startGameButton;
let numPlayersInput;
let numQuestionsInput;
let gameContainer;
let gameBoard;
let questionModal;
let questionText;
let showAnswerButton;
let correctAnswerDisplay;
let judgmentButtonsDiv;
let markCorrectButton;
let markIncorrectButton;
let feedbackDiv;
let closeButton;
let playerScoresDiv;
let currentPlayerDisplay;

// 題庫管理相關元素
let quizSelect;
let addQuizButton;
let deleteQuizButton;
let addQuestionToQuizSection;
let currentQuizNameSpan;
let questionTypeSelect;
let normalQuestionFields;
let eventCardFields;
// 普通問題的輸入框 (答案輸入框已移除)
let newQuestionTextNormal;
let newPoints; // 普通問題的分數輸入框

// 選擇題相關輸入框
let multipleChoiceFields;
let newQuestionTextMC;
let mcOption1;
let mcOption2;
let mcOption3;
let mcOption4;
let mcCorrectAnswerIndex;
let newPointsMC; // 選擇題的分數輸入框

// 事件卡相關輸入框
let eventQuestionText;
let eventTypeSelect;
let addQuestionToQuizButton;

// 模態框內的選擇題選項按鈕容器
let multipleChoiceOptionsDiv;
let mcOptionButtons; // NodeList of option buttons

// 新增的匯入匯出按鈕
let importQuizButton;
let exportQuizButton;

// 最終得分彈窗元素
let finalScoreModal;
let closeFinalScoreModalButton;
let finalScoresDisplay;
let restartGameButton;


// 遊戲狀態變量
let players = [];
let questions = [];
let currentPlayerIndex = 0;
let answeredQuestionsCount = 0;
let activeQuestionData = null; // 當前打開的題目數據
let currentQuestionCard = null; // 當前點擊的題目卡片
let quizSets = {};
let currentQuizName = 'default';

// 事件卡類型配置
const eventTypes = [
    { value: 'add_score_current_player', text: '當前玩家加分' },
    { value: 'deduct_score', text: '當前玩家扣分' },
    { value: 'add_score_all_players', text: '全體玩家加分' },
    { value: 'assign_player', text: '指定下一位回答的玩家' },
    { value: 'score_transfer', text: '分數轉移給下一位玩家' },
    { value: 'random_bonus', text: '獲得隨機獎勵' },
    { value: 'random_penalty', text: '受到隨機懲罰' }
];

// 填充事件類型選擇器
function populateEventTypeSelect() {
    if (eventTypeSelect) {
        eventTypeSelect.innerHTML = '';
        eventTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.text;
            eventTypeSelect.appendChild(option);
        });
    } else {
        console.error("populateEventTypeSelect: eventTypeSelect 元素未找到，無法填充事件類型。");
    }
}

// 載入題庫
function loadQuizSets() {
    const savedQuizSets = localStorage.getItem('quizSets');
    if (savedQuizSets) {
        quizSets = JSON.parse(savedQuizSets);
    } else {
        quizSets = {
            'default': defaultQuestions
        };
    }

    if (quizSelect) {
        quizSelect.innerHTML = '';
        for (const name in quizSets) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            quizSelect.appendChild(option);
        }
    } else {
        console.error("loadQuizSets: quizSelect 元素未找到，無法載入題庫選項。");
    }

    const savedCurrentQuizName = localStorage.getItem('currentQuizName');
    if (savedCurrentQuizName && quizSets[savedCurrentQuizName]) {
        currentQuizName = savedCurrentQuizName;
        if (quizSelect) quizSelect.value = currentQuizName;
    } else {
        currentQuizName = Object.keys(quizSets)[0] || 'default';
        if (quizSelect) quizSelect.value = currentQuizName;
    }

    questions = quizSets[currentQuizName];
    if (currentQuizNameSpan) {
        currentQuizNameSpan.textContent = currentQuizName;
    }
}

// 保存題庫
function saveQuizSets() {
    localStorage.setItem('quizSets', JSON.stringify(quizSets));
    localStorage.setItem('currentQuizName', currentQuizName);
}

// 初始化遊戲
function initializeGame(numPlayers, numQuestions) {
    players = [];
    for (let i = 0; i < numPlayers; i++) {
        players.push({ name: `玩家 ${i + 1}`, score: 0 });
    }
    currentPlayerIndex = 0;
    answeredQuestionsCount = 0;
    updatePlayerScores();
    updateCurrentPlayerDisplay();
    createGameBoard(numQuestions);
}

// 更新得分板
function updatePlayerScores() {
    if (playerScoresDiv) {
        playerScoresDiv.innerHTML = '';
        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.classList.add('player-score');
            playerDiv.textContent = `${player.name}: ${player.score} 分`;
            playerScoresDiv.appendChild(playerDiv);
        });
    }
}

// 更新當前玩家顯示
function updateCurrentPlayerDisplay() {
    if (currentPlayerDisplay) {
        currentPlayerDisplay.textContent = `當前玩家: ${players[currentPlayerIndex].name}`;
    }
}

// 創建遊戲板
function createGameBoard(numQuestions) {
    if (gameBoard) {
        gameBoard.innerHTML = '';
        const selectedQuestions = getRandomQuestions(numQuestions);

        selectedQuestions.forEach((question, index) => {
            const card = document.createElement('div');
            card.classList.add('question-card');
            card.dataset.index = index;
            card.textContent = index + 1;
            card.addEventListener('click', () => openQuestionModal(card, question, index));
            gameBoard.appendChild(card);
        });
    }
}

// 隨機選擇題目
function getRandomQuestions(num) {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, num);
}

// 打開問題彈窗
function openQuestionModal(card, question, index) {
    if (card.classList.contains('answered')) {
        if (feedbackDiv) {
            feedbackDiv.textContent = '這張卡片已經被翻過了！';
        }
        return;
    }

    activeQuestionData = question;
    currentQuestionCard = card;

    // 重置彈窗狀態和隱藏所有不相關的元素
    if (showAnswerButton) showAnswerButton.style.display = 'none';
    if (correctAnswerDisplay) correctAnswerDisplay.style.display = 'none';
    if (judgmentButtonsDiv) judgmentButtonsDiv.style.display = 'none';
    if (multipleChoiceOptionsDiv) multipleChoiceOptionsDiv.style.display = 'none'; // 隱藏選擇題選項
    if (feedbackDiv) {
        feedbackDiv.textContent = '';
    }

    // 獲取或創建事件確認按鈕 (通用)
    let confirmEventButton = document.getElementById('confirm-event-button');
    if (!confirmEventButton) {
        confirmEventButton = document.createElement('button');
        confirmEventButton.id = 'confirm-event-button';
        confirmEventButton.textContent = '確定';
        confirmEventButton.classList.add('judgment-button');
        if (questionModal && questionModal.querySelector('.modal-content') && feedbackDiv) {
            questionModal.querySelector('.modal-content').insertBefore(confirmEventButton, feedbackDiv);
        } else {
            console.warn("openQuestionModal: 無法插入 confirmEventButton，modal-content 或 feedbackDiv 不存在。");
        }
    }
    confirmEventButton.style.display = 'none'; // 預設隱藏

    // 根據題目類型設置模態框內容
    if (question.type === 'event_card') {
        if (questionText) {
            questionText.textContent = `事件卡: ${question.event_description}`;
        }
        confirmEventButton.style.display = 'block';
        confirmEventButton.onclick = () => {
            handleEventCard(question);
            markCardAsAnswered(card);
            closeQuestionModal();
            moveToNextPlayer();
        };
    } else if (question.type === 'multiple_choice') {
        if (questionText) {
            questionText.textContent = question.question;
        }
        if (multipleChoiceOptionsDiv) {
            multipleChoiceOptionsDiv.style.display = 'flex'; // 顯示選項按鈕容器
            mcOptionButtons.forEach((button, index) => {
                button.textContent = question.options[index];
                button.style.display = 'block'; // 確保按鈕顯示
                button.classList.remove('selected'); // 清除上次的選中狀態
                button.onclick = () => selectMultipleChoiceOption(button, index); // 綁定點擊事件
            });
        }
        if (showAnswerButton) showAnswerButton.style.display = 'block'; // 選擇題依然可以顯示答案
        confirmEventButton.style.display = 'none';
        if (confirmEventButton) confirmEventButton.onclick = null;
    } else { // normal_question
        if (questionText) {
            questionText.textContent = question.question;
        }
        if (showAnswerButton) showAnswerButton.style.display = 'block';
        if (judgmentButtonsDiv) judgmentButtonsDiv.style.display = 'none'; // 普通問題的判斷按鈕在顯示答案後才顯示
        confirmEventButton.style.display = 'none';
        if (confirmEventButton) confirmEventButton.onclick = null;
    }

    // 最後才顯示模態框，確保內容已經設置好
    if (questionModal) {
        questionModal.style.display = 'flex';
        setTimeout(() => {
            questionModal.classList.add('show-modal');
        }, 10);
    }
}

// 選擇題選項點擊處理
function selectMultipleChoiceOption(button, selectedIndex) {
    if (!activeQuestionData || activeQuestionData.type !== 'multiple_choice') return;

    // 移除所有按鈕的選中狀態
    mcOptionButtons.forEach(btn => btn.classList.remove('selected'));
    // 為當前選中的按鈕添加選中狀態
    button.classList.add('selected');

    // 立即判斷，而不是等顯示答案後再判斷
    const isCorrect = (selectedIndex === activeQuestionData.correct_answer_index);
    handleMultipleChoiceJudgment(isCorrect, activeQuestionData.options[activeQuestionData.correct_answer_index]);
}

// 顯示答案 (對於普通問題和選擇題)
function showAnswer(question) {
    if (showAnswerButton) showAnswerButton.style.display = 'none';

    if (question.type === 'multiple_choice') {
        const correctOptionText = question.options[question.correct_answer_index];
        if (correctAnswerDisplay) correctAnswerDisplay.textContent = `正確答案：${correctOptionText}`;
        // 給正確選項按鈕添加視覺提示
        if (mcOptionButtons) {
            mcOptionButtons.forEach((button, index) => {
                if (index === question.correct_answer_index) {
                    button.classList.add('correct-option'); // 添加一個 CSS 類來標記正確答案
                }
                button.classList.add('answered-option'); // 標記為已回答，禁用點擊
                button.onclick = null; // 移除點擊事件
            });
        }
        // 選擇題顯示答案後不顯示「正確」「錯誤」按鈕，因為已經自動判斷
        if (judgmentButtonsDiv) judgmentButtonsDiv.style.display = 'none';

    } else { // normal_question
        if (correctAnswerDisplay) correctAnswerDisplay.textContent = `答案：${question.answer}`;
        if (judgmentButtonsDiv) judgmentButtonsDiv.style.display = 'flex'; // 普通問題顯示判斷按鈕
    }

    if (correctAnswerDisplay) correctAnswerDisplay.style.display = 'block';
    if (feedbackDiv) {
        feedbackDiv.textContent = ''; // 清除舊的提示
    }
}

// 處理普通問題的正確/錯誤判斷
function handlePlayerJudgment(isCorrect) {
    let scoreChange = 0;
    let feedbackMessage = '';

    if (isCorrect) {
        scoreChange = activeQuestionData.points;
        feedbackMessage = `答對了！獲得 ${scoreChange} 分！`;
        if (feedbackDiv) { feedbackDiv.style.color = 'green'; }
    } else {
        scoreChange = 0; // 普通問題答錯不扣分
        feedbackMessage = `答錯了！`;
        if (feedbackDiv) { feedbackDiv.style.color = 'red'; }
    }

    players[currentPlayerIndex].score += scoreChange;
    if (feedbackDiv) {
        feedbackDiv.textContent = feedbackMessage;
    }
    updatePlayerScores();
    markCardAsAnswered(currentQuestionCard);
    closeQuestionModalWithDelay();
}

// 處理選擇題的判斷 (自動判斷)
function handleMultipleChoiceJudgment(isCorrect, correctAnswerText) {
    let scoreChange = 0;
    let feedbackMessage = '';

    if (isCorrect) {
        scoreChange = activeQuestionData.points;
        feedbackMessage = `選擇正確！獲得 ${scoreChange} 分！`;
        if (feedbackDiv) { feedbackDiv.style.color = 'green'; }
    } else {
        scoreChange = 0; // 選擇題答錯不扣分
        feedbackMessage = `選擇錯誤！正確答案是：${correctAnswerText}`;
        if (feedbackDiv) { feedbackDiv.style.color = 'red'; }
    }

    players[currentPlayerIndex].score += scoreChange;
    if (feedbackDiv) {
        feedbackDiv.textContent = feedbackMessage;
    }
    updatePlayerScores();
    markCardAsAnswered(currentQuestionCard);
    closeQuestionModalWithDelay();
}


// 處理事件卡的核心邏輯
function handleEventCard(eventCard) {
    console.log("--- 進入 handleEventCard 函數 ---", eventCard);
    if (!feedbackDiv) {
        console.error("handleEventCard: 檢測到 feedbackDiv 為 null！無法更新 UI。");
        return;
    }
    let eventFeedback = '';
    feedbackDiv.style.color = '#ff9800'; // 給事件結果一個醒目的顏色

    switch (eventCard.event_type) {
        case 'add_score_current_player':
            if (typeof eventCard.points === 'number') {
                players[currentPlayerIndex].score += eventCard.points;
                eventFeedback = `事件！${eventCard.event_description}，${players[currentPlayerIndex].name} 獲得 ${eventCard.points} 分！`;
            } else {
                eventFeedback = `事件卡分數設定錯誤：${eventCard.event_description}`;
                console.error("事件卡分數設定錯誤:", eventCard);
            }
            break;
        case 'deduct_score':
            if (typeof eventCard.points === 'number') {
                const deduction = Math.abs(eventCard.points);
                players[currentPlayerIndex].score -= deduction;
                eventFeedback = `事件！${eventCard.event_description}，${players[currentPlayerIndex].name} 失去 ${deduction} 分！`;
            } else {
                eventFeedback = `事件卡分數設定錯誤：${eventCard.event_description}`;
                console.error("事件卡分數設定錯誤:", eventCard);
            }
            break;
        case 'add_score_all_players':
            if (typeof eventCard.points === 'number') {
                players.forEach(player => {
                    player.score += eventCard.points;
                });
                eventFeedback = `事件！${eventCard.event_description}，全體玩家各獲得 ${eventCard.points} 分！`;
            } else {
                eventFeedback = `事件卡分數設定錯誤：${eventCard.event_description}`;
                console.error("事件卡分數設定錯誤:", eventCard);
            }
            break;
        case 'assign_player':
            eventFeedback = `事件！${eventCard.event_description}，${players[currentPlayerIndex].name} 獲得指定下一位回答玩家的權力！`;
            break;
        case 'score_transfer':
            const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
            const transferredScore = players[currentPlayerIndex].score;
            players[nextPlayerIndex].score += transferredScore;
            players[currentPlayerIndex].score = 0;
            eventFeedback = `事件！${eventCard.event_description}，${players[currentPlayerIndex].name} 的 ${transferredScore} 分轉移給 ${players[nextPlayerIndex].name}！`;
            break;
        case 'random_bonus':
            const bonusPoints = Math.floor(Math.random() * 20) + 5;
            players[currentPlayerIndex].score += bonusPoints;
            eventFeedback = `事件！${eventCard.event_description}，${players[currentPlayerIndex].name} 獲得隨機獎勵 ${bonusPoints} 分！`;
            break;
        case 'random_penalty':
            const penaltyPoints = Math.floor(Math.random() * 10) + 2;
            players[currentPlayerIndex].score -= penaltyPoints;
            eventFeedback = `事件！${eventCard.event_description}，${players[currentPlayerIndex].name} 失去隨機懲罰 ${penaltyPoints} 分！`;
            break;
        default:
            eventFeedback = `事件卡類型未定義或未處理：${eventCard.event_type}`;
            console.error('Unknown event type:', eventCard.event_type, eventCard);
            break;
    }
    feedbackDiv.textContent = eventFeedback;
    updatePlayerScores();
}

// 標記卡片為已回答
function markCardAsAnswered(card) {
    card.classList.add('answered');
    answeredQuestionsCount++;
    checkGameOver();
}

// 延遲關閉問題彈窗並切換玩家 (用於普通題目和選擇題)
function closeQuestionModalWithDelay() {
    setTimeout(() => {
        closeQuestionModal();
        moveToNextPlayer();
    }, 1500);
}

// 立即關閉問題彈窗
function closeQuestionModal() {
    if (questionModal) {
        questionModal.classList.remove('show-modal');
        setTimeout(() => {
            questionModal.style.display = 'none';
            // 清理模態框內容
            if (correctAnswerDisplay) correctAnswerDisplay.style.display = 'none';
            if (judgmentButtonsDiv) judgmentButtonsDiv.style.display = 'none';
            if (feedbackDiv) {
                feedbackDiv.textContent = '';
            }
            if (multipleChoiceOptionsDiv) {
                multipleChoiceOptionsDiv.style.display = 'none';
                mcOptionButtons.forEach(button => {
                    button.classList.remove('selected', 'correct-option', 'answered-option');
                    button.textContent = ''; // 清空按鈕內容
                    button.onclick = null; // 移除事件監聽
                });
            }

            let confirmEventButton = document.getElementById('confirm-event-button');
            if (confirmEventButton) {
                confirmEventButton.style.display = 'none';
                confirmEventButton.onclick = null;
                if (confirmEventButton.parentNode) {
                    confirmEventButton.parentNode.removeChild(confirmEventButton);
                }
            }
        }, 300);
    }
}

// 切換到下一位玩家
function moveToNextPlayer() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    updateCurrentPlayerDisplay();
}

// 檢查遊戲是否結束
function checkGameOver() {
    if (answeredQuestionsCount >= parseInt(numQuestionsInput.value)) {
        setTimeout(() => {
            showFinalScores();
        }, 1000);
    }
}

// 顯示最終得分
function showFinalScores() {
    if (gameContainer) gameContainer.style.display = 'none';
    if (finalScoresDisplay) finalScoresDisplay.innerHTML = '';
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

    let maxScore = 0;
    if (sortedPlayers.length > 0) {
        maxScore = sortedPlayers[0].score;
    }

    sortedPlayers.forEach((player, index) => {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('player-final-score');
        playerDiv.textContent = `${index + 1}. ${player.name}: ${player.score} 分`;
        if (player.score === maxScore && maxScore > 0) {
            playerDiv.classList.add('winner');
        }
        if (finalScoresDisplay) finalScoresDisplay.appendChild(playerDiv);
    });

    if (finalScoreModal) {
        finalScoreModal.style.display = 'flex';
        setTimeout(() => {
            finalScoreModal.classList.add('show-modal');
        }, 10);
    }
}

// 重置遊戲
function resetGame() {
    if (gameSettings) gameSettings.style.display = 'block';
    if (gameContainer) gameContainer.style.display = 'none';

    if (gameBoard) gameBoard.innerHTML = '';
    if (playerScoresDiv) playerScoresDiv.innerHTML = '';
    if (currentPlayerDisplay) currentPlayerDisplay.textContent = '';

    if (numPlayersInput) numPlayersInput.value = 2;
    if (numQuestionsInput) numQuestionsInput.value = 10;

    players = [];
    currentPlayerIndex = 0;
    answeredQuestionsCount = 0;
    activeQuestionData = null;
    currentQuestionCard = null;

    loadQuizSets();
    questions = quizSets[currentQuizName];

    if (addQuestionToQuizSection) {
        addQuestionToQuizSection.style.display = 'block';
    }
    toggleQuestionFields(); // 重置新增題目表單的顯示

    // 清理模態框相關元素狀態
    if (questionModal) {
        questionModal.style.display = 'none';
        questionModal.classList.remove('show-modal');
    }
    if (questionText) questionText.textContent = '';
    if (showAnswerButton) showAnswerButton.style.display = 'block';
    if (correctAnswerDisplay) correctAnswerDisplay.style.display = 'none';
    if (judgmentButtonsDiv) judgmentButtonsDiv.style.display = 'none';
    if (feedbackDiv) {
        feedbackDiv.textContent = '';
    }
    if (multipleChoiceOptionsDiv) { // 重置選擇題選項按鈕
        multipleChoiceOptionsDiv.style.display = 'none';
        mcOptionButtons.forEach(button => {
            button.classList.remove('selected', 'correct-option', 'answered-option');
            button.textContent = '';
            button.onclick = null;
        });
    }

    let confirmEventButton = document.getElementById('confirm-event-button');
    if (confirmEventButton) {
        confirmEventButton.style.display = 'none';
        confirmEventButton.onclick = null;
        if (confirmEventButton.parentNode) {
            confirmEventButton.parentNode.removeChild(confirmEventButton);
        }
    }
}

// 題庫管理功能
function handleAddQuizButton() {
    const newQuizName = prompt('請輸入新題庫的名稱:');
    if (newQuizName && newQuizName.trim() !== '' && !quizSets[newQuizName]) {
        quizSets[newQuizName] = [];
        saveQuizSets();
        loadQuizSets();
        if (quizSelect) quizSelect.value = newQuizName;
        currentQuizName = newQuizName;
        questions = quizSets[currentQuizName];
        if (currentQuizNameSpan) currentQuizNameSpan.textContent = newQuizName;
        alert(`題庫 "${newQuizName}" 已創建！`);
    } else if (newQuizName && quizSets[newQuizName]) {
        alert('此題庫名稱已存在，請使用其他名稱。');
    }
}

// 根據選擇的題目類型顯示或隱藏相應的輸入字段
function toggleQuestionFields() {
    if (!questionTypeSelect || !normalQuestionFields || !multipleChoiceFields || !eventCardFields) {
        console.error("toggleQuestionFields: 部分題目類型相關的 UI 元素未找到。");
        return;
    }

    const selectedType = questionTypeSelect.value;
    normalQuestionFields.style.display = 'none';
    multipleChoiceFields.style.display = 'none';
    eventCardFields.style.display = 'none';

    // 重置所有新增題目表單的輸入框
    if (newQuestionTextNormal) newQuestionTextNormal.value = '';
    if (newPoints) newPoints.value = 10;
    if (newQuestionTextMC) newQuestionTextMC.value = '';
    if (mcOption1) mcOption1.value = '';
    if (mcOption2) mcOption2.value = '';
    if (mcOption3) mcOption3.value = '';
    if (mcOption4) mcOption4.value = '';
    if (mcCorrectAnswerIndex) mcCorrectAnswerIndex.value = 1;
    if (newPointsMC) newPointsMC.value = 10;
    if (eventQuestionText) eventQuestionText.value = '';
    // eventTypeSelect 的值可能不需要每次都重置

    if (selectedType === 'normal_question') {
        normalQuestionFields.style.display = 'block';
    } else if (selectedType === 'multiple_choice') {
        multipleChoiceFields.style.display = 'block';
    } else if (selectedType === 'event_card') {
        eventCardFields.style.display = 'block';
    }
}

// 處理新增題目按鈕點擊
function addQuestionToQuizButtonClickHandler() {
    // 再次檢查所有必要的 UI 元素是否已獲取
    if (!questionTypeSelect || !newPoints || !newPointsMC || !eventTypeSelect) {
        console.error("addQuestionToQuizButtonClickHandler: 新增題目所需的 UI 元素未完全初始化。");
        return;
    }

    const selectedType = questionTypeSelect.value;
    let newQuestion = { type: selectedType };

    if (selectedType === 'normal_question') {
        const qText = newQuestionTextNormal.value.trim();
        const points = parseInt(newPoints.value);

        if (!qText) {
            alert('請輸入普通問題內容。');
            return;
        }
        if (isNaN(points) || points <= 0) {
            alert('請輸入有效的普通問題分數（正數）。');
            return;
        }
        newQuestion.question = qText;
        // 普通問題不再有獨立的答案輸入框，答案在判斷時才處理
        newQuestion.answer = ""; // 或您可以彈出一個框讓用戶輸入標準答案以供顯示，但現在假定由判斷按鈕決定
        newQuestion.points = points;
    } else if (selectedType === 'multiple_choice') {
        const qText = newQuestionTextMC.value.trim();
        const options = [
            mcOption1.value.trim(),
            mcOption2.value.trim(),
            mcOption3.value.trim(),
            mcOption4.value.trim()
        ];
        const correctIndex = parseInt(mcCorrectAnswerIndex.value) - 1; // 轉為 0-based index
        const points = parseInt(newPointsMC.value);

        if (!qText) {
            alert('請輸入選擇題問題內容。');
            return;
        }
        if (options.some(opt => opt === '')) {
            alert('請輸入所有選項內容。');
            return;
        }
        if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
            alert('請輸入有效的正確答案選項編號 (1-4)。');
            return;
        }
        if (isNaN(points) || points <= 0) {
            alert('請輸入有效的選擇題分數（正數）。');
            return;
        }
        newQuestion.question = qText;
        newQuestion.options = options;
        newQuestion.correct_answer_index = correctIndex;
        newQuestion.points = points;
    } else { // event_card
        const qText = eventQuestionText.value.trim();
        const eventType = eventTypeSelect.value;

        if (!qText) {
            alert('請輸入事件描述。');
            return;
        }
        if (!eventType) {
            alert('請選擇事件類型。');
            return;
        }
        newQuestion.question = "事件卡";
        newQuestion.event_type = eventType;
        newQuestion.event_description = qText;

        let points = 0;
        if (eventType === 'add_score_current_player' || eventType === 'add_score_all_players') {
             const eventPointsInput = prompt(`請輸入此事件卡加分的分數 (請輸入正數):`, 5);
             if (eventPointsInput === null || isNaN(parseInt(eventPointsInput)) || parseInt(eventPointsInput) <= 0) {
                 alert('請輸入有效的正數分數。');
                 return;
             }
             points = parseInt(eventPointsInput);
        } else if (eventType === 'deduct_score') {
             const eventPointsInput = prompt(`請輸入此事件卡扣分的分數 (請輸入正數，將自動轉為負數):`, 5);
             if (eventPointsInput === null || isNaN(parseInt(eventPointsInput)) || parseInt(eventPointsInput) <= 0) {
                 alert('請輸入有效的正數分數。');
                 return;
             }
             points = -Math.abs(parseInt(eventPointsInput));
        }
        newQuestion.points = points;
    }

    if (!quizSets[currentQuizName]) {
        quizSets[currentQuizName] = [];
    }
    quizSets[currentQuizName].push(newQuestion);
    saveQuizSets();
    alert('題目已新增到當前題庫！');
    toggleQuestionFields(); // 清空表單並重置顯示
    questions = quizSets[currentQuizName]; // 更新當前使用的題目列表
}


// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded 事件觸發！");
    console.log("script.js 文件已成功加載！");

    // UI 元素獲取
    gameSettings = document.getElementById('game-settings');
    startGameButton = document.getElementById('start-game-button');
    numPlayersInput = document.getElementById('num-players');
    numQuestionsInput = document.getElementById('num-questions');
    gameContainer = document.getElementById('game-container');
    gameBoard = document.getElementById('game-board');
    questionModal = document.getElementById('question-modal');
    questionText = document.getElementById('question-text');
    showAnswerButton = document.getElementById('show-answer-button');
    correctAnswerDisplay = document.getElementById('correct-answer-display');
    judgmentButtonsDiv = document.querySelector('.judgment-buttons');
    markCorrectButton = document.getElementById('mark-correct-button');
    markIncorrectButton = document.getElementById('mark-incorrect-button');
    feedbackDiv = document.getElementById('feedback');
    closeButton = document.querySelector('.close-button');
    playerScoresDiv = document.getElementById('player-scores');
    currentPlayerDisplay = document.getElementById('current-player-display');

    // 題庫管理相關元素獲取
    quizSelect = document.getElementById('quiz-select');
    addQuizButton = document.getElementById('add-quiz-button');
    deleteQuizButton = document.getElementById('delete-quiz-button');
    addQuestionToQuizSection = document.getElementById('add-question-to-quiz-section');
    currentQuizNameSpan = document.getElementById('current-quiz-name');
    questionTypeSelect = document.getElementById('question-type-select');

    // 不同題目類型輸入框容器
    normalQuestionFields = document.getElementById('normal-question-fields');
    multipleChoiceFields = document.getElementById('multiple-choice-fields'); // 新增
    eventCardFields = document.getElementById('event-card-fields');

    // 普通問題輸入框
    newQuestionTextNormal = document.getElementById('new-question-text-normal');
    newPoints = document.getElementById('new-points');

    // 選擇題輸入框
    newQuestionTextMC = document.getElementById('new-question-text-mc');
    mcOption1 = document.getElementById('mc-option-1');
    mcOption2 = document.getElementById('mc-option-2');
    mcOption3 = document.getElementById('mc-option-3');
    mcOption4 = document.getElementById('mc-option-4');
    mcCorrectAnswerIndex = document.getElementById('mc-correct-answer-index');
    newPointsMC = document.getElementById('new-points-mc');

    // 事件卡輸入框
    eventQuestionText = document.getElementById('new-question-text-event');
    eventTypeSelect = document.getElementById('event-type-select');
    addQuestionToQuizButton = document.getElementById('add-question-to-quiz-button');

    // 模態框內的選擇題選項按鈕
    multipleChoiceOptionsDiv = document.getElementById('multiple-choice-options'); // 新增
    mcOptionButtons = document.querySelectorAll('.mc-option-button'); // 新增

    // 新增的匯入匯出按鈕獲取
    importQuizButton = document.getElementById('import-quiz-button');
    exportQuizButton = document.getElementById('export-quiz-button');

    // 最終得分彈窗元素獲取
    finalScoreModal = document.getElementById('final-score-modal');
    closeFinalScoreModalButton = document.getElementById('close-final-score-modal');
    finalScoresDisplay = document.getElementById('final-scores-display');
    restartGameButton = document.getElementById('restart-game-button');


    // 增加調試訊息，確認是否所有核心元素都已被正確獲取
    console.log("DOMContentLoaded 內初始化 startGameButton:", startGameButton);
    console.log("DOMContentLoaded 內初始化 feedbackDiv:", feedbackDiv);
    console.log("DOMContentLoaded 內初始化 addQuizButton:", addQuizButton);
    console.log("DOMContentLoaded 內初始化 multipleChoiceOptionsDiv:", multipleChoiceOptionsDiv);
    console.log("DOMContentLoaded 內初始化 mcOptionButtons:", mcOptionButtons);


    // 將所有事件監聽器放在這裡，確保相關元素已經被獲取
    if (startGameButton) {
        startGameButton.addEventListener('click', () => {
            const numPlayers = parseInt(numPlayersInput.value);
            const numQuestions = parseInt(numQuestionsInput.value);

            if (numPlayers < 2 || numQuestions < 5) {
                alert('玩家數量至少為 2，題目數量至少為 5！');
                return;
            }
            if (numQuestions > questions.length) {
                alert(`題目數量不能超過當前題庫中的總題目數 (${questions.length})！`);
                return;
            }
            initializeGame(numPlayers, numQuestions);
            if (gameSettings) gameSettings.style.display = 'none';
            if (gameContainer) gameContainer.style.display = 'flex';
        });
    }

    // 顯示答案按鈕，對於普通問題和選擇題都有效
    if (showAnswerButton) {
        showAnswerButton.addEventListener('click', () => {
            if (activeQuestionData) {
                showAnswer(activeQuestionData);
            }
        });
    }

    // 普通問題的正確/錯誤判斷按鈕
    if (markCorrectButton) {
        markCorrectButton.addEventListener('click', () => {
            if (activeQuestionData && activeQuestionData.type === 'normal_question') {
                handlePlayerJudgment(true);
            }
        });
    }

    if (markIncorrectButton) {
        markIncorrectButton.addEventListener('click', () => {
            if (activeQuestionData && activeQuestionData.type === 'normal_question') {
                handlePlayerJudgment(false);
            }
        });
    }

    // 模態框關閉按鈕
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            if (activeQuestionData && activeQuestionData.type === 'event_card') {
                alert('請點擊「確定」按鈕來處理事件卡效果。');
                return;
            } else {
                closeQuestionModal();
                if (activeQuestionData && (activeQuestionData.type === 'normal_question' || activeQuestionData.type === 'multiple_choice')) {
                    moveToNextPlayer();
                }
            }
        });
    }

    if (quizSelect) {
        quizSelect.addEventListener('change', () => {
            currentQuizName = quizSelect.value;
            localStorage.setItem('currentQuizName', currentQuizName);
            questions = quizSets[currentQuizName];
            if (currentQuizNameSpan) currentQuizNameSpan.textContent = currentQuizName;
        });
    }

    if (addQuizButton) {
        addQuizButton.addEventListener('click', handleAddQuizButton);
    }

    if (deleteQuizButton) {
        deleteQuizButton.addEventListener('click', () => {
            if (currentQuizName === 'default') {
                alert('不能刪除預設題庫。');
                return;
            }
            if (confirm(`確定要刪除題庫 "${currentQuizName}" 嗎？這將無法復原！`)) {
                delete quizSets[currentQuizName];
                saveQuizSets();
                currentQuizName = Object.keys(quizSets)[0] || 'default';
                loadQuizSets();
                alert(`題庫 "${currentQuizName}" 已刪除！`);
            }
        });
    }

    if (questionTypeSelect) {
        questionTypeSelect.addEventListener('change', toggleQuestionFields);
    }

    if (addQuestionToQuizButton) {
        addQuestionToQuizButton.addEventListener('click', addQuestionToQuizButtonClickHandler);
    }

    if (exportQuizButton) {
        exportQuizButton.addEventListener('click', () => {
            const quizData = JSON.stringify(quizSets[currentQuizName], null, 2);
            const blob = new Blob([quizData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${currentQuizName}_quiz.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert('題庫已匯出！');
        });
    }

    if (importQuizButton) {
        importQuizButton.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = e => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = event => {
                        try {
                            const importedQuestions = JSON.parse(event.target.result);
                            // 匯入時需要確認格式是否包含 multiple_choice 的結構
                            const isValidFormat = Array.isArray(importedQuestions) && importedQuestions.every(q => {
                                if (q.type === 'normal_question') {
                                    return 'question' in q && 'answer' in q && 'points' in q;
                                } else if (q.type === 'multiple_choice') {
                                    return 'question' in q && 'options' in q && Array.isArray(q.options) && q.options.length === 4 && 'correct_answer_index' in q && 'points' in q;
                                } else if (q.type === 'event_card') {
                                    return 'question' in q && 'event_description' in q && 'event_type' in q && 'points' in q;
                                }
                                return false;
                            });

                            if (isValidFormat) {
                                const newQuizName = prompt('請輸入匯入題庫的名稱：(如果名稱已存在將會覆蓋)', '新匯入題庫');
                                if (newQuizName && newQuizName.trim() !== '') {
                                    quizSets[newQuizName] = importedQuestions;
                                    saveQuizSets();
                                    loadQuizSets();
                                    if (quizSelect) quizSelect.value = newQuizName;
                                    currentQuizName = newQuizName;
                                    questions = quizSets[currentQuizName];
                                    if (currentQuizNameSpan) currentQuizNameSpan.textContent = newQuizName;
                                    alert(`題庫 \"${newQuizName}\" 已成功匯入！`);
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


    // 初始化時調用
    populateEventTypeSelect();
    loadQuizSets();
    resetGame();
});
