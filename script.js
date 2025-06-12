// script.js

// 預設的遊戲題目數據（僅用於首次載入或沒有任何本地題庫時）
const defaultQuestions = [
    {
        question: "哪種動物以其長脖子而聞名？",
        answer: "長頸鹿",
        points: 100,
        type: 'normal_question'
    },
    {
        question: "地球上最大的海洋是什麼？",
        answer: "太平洋",
        points: 200,
        type: 'normal_question'
    },
    {
        question: "哪個國家有金字塔？",
        answer: "埃及",
        points: 150,
        type: 'normal_question'
    },
    {
        question: "水的化學式是什麼？",
        answer: "H2O",
        points: 250,
        type: 'normal_question'
    },
    {
        question: "太陽系的第四顆行星是什麼？",
        answer: "火星",
        points: 100,
        type: 'normal_question'
    },
    {
        question: "誰畫了蒙娜麗莎？",
        answer: "達文西",
        points: 200,
        type: 'normal_question'
    },
    {
        question: "世界上最高的山是哪座？",
        answer: "珠穆朗瑪峰",
        points: 300,
        type: 'normal_question'
    },
    {
        question: "什麼是光合作用的產物？",
        answer: "氧氣",
        points: 150,
        type: 'normal_question'
    },
    {
        question: "哪種水果是紅色的，有一個綠色的莖？",
        answer: "蘋果",
        points: 100,
        type: 'normal_question'
    },
    {
        question: "鳥類有骨頭嗎？",
        answer: "是",
        points: 50,
        type: 'normal_question'
    },
    {
        question: "貓是哺乳動物嗎？",
        answer: "是",
        points: 50,
        type: 'normal_question'
    },
    {
        question: "所有植物都開花嗎？",
        answer: "否",
        points: 50,
        type: 'normal_question'
    },
    {
        question: "企鵝會飛嗎？",
        answer: "否",
        points: 50,
        type: 'normal_question'
    },
    // 事件卡範例，確保 points 屬性正確，即使為 0
    {
        question: "事件卡", // 統一事件卡在遊戲板上顯示的標題
        event_description: "全體玩家各加 50 分",
        event_type: "add_score_all_players",
        points: 50, // 這裡設定分數
        type: 'event_card'
    },
    {
        question: "事件卡",
        event_description: "當前玩家失去 100 分",
        event_type: "deduct_score",
        points: -100, // 這裡設定分數，為負數
        type: 'event_card'
    },
    {
        question: "事件卡",
        event_description: "下一回合由你指定任意玩家回答問題",
        event_type: "assign_player",
        points: 0, // 無分數變動
        type: 'event_card'
    },
    {
        question: "事件卡",
        event_description: "換邊！你的所有分數轉移給下一位玩家",
        event_type: "score_transfer",
        points: 0, // 無分數變動，但有分數操作
        type: 'event_card'
    },
    {
        question: "事件卡",
        event_description: "獲得隨機獎勵",
        event_type: "random_bonus",
        points: 0, // 分數隨機產生
        type: 'event_card'
    },
    {
        question: "事件卡",
        event_description: "受到隨機懲罰",
        event_type: "random_penalty",
        points: 0, // 分數隨機產生
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
let closeButton; // 雖然 closeButton 可以在外部獲取，但為了統一管理模態框相關元素，移入內部
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
let newQuestionTextNormal;
let newAnswerText;
let newPoints;
let eventQuestionText;
let eventTypeSelect;
let addQuestionToQuizButton;

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
let activeQuestionData = null;
let currentQuestionCard = null;
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
    // 確保 eventTypeSelect 已經被初始化
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
        // 如果沒有本地題庫，則初始化一個預設題庫
        quizSets = {
            'default': defaultQuestions
        };
    }

    // 確保 quizSelect 已經被初始化
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
        // 無法繼續，不返回，讓代碼繼續執行，但會導致後續錯誤如果其他地方依賴 quizSelect
    }


    // 設置當前選中的題庫
    const savedCurrentQuizName = localStorage.getItem('currentQuizName');
    if (savedCurrentQuizName && quizSets[savedCurrentQuizName]) {
        currentQuizName = savedCurrentQuizName;
        if (quizSelect) quizSelect.value = currentQuizName; // 檢查 quizSelect
    } else {
        currentQuizName = Object.keys(quizSets)[0] || 'default';
        if (quizSelect) quizSelect.value = currentQuizName; // 檢查 quizSelect
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
            // 讓所有卡片都顯示編號
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

    // 重置彈窗狀態
    if (showAnswerButton) showAnswerButton.style.display = 'none';
    if (correctAnswerDisplay) correctAnswerDisplay.style.display = 'none';
    if (judgmentButtonsDiv) judgmentButtonsDiv.style.display = 'none';
    if (feedbackDiv) {
        feedbackDiv.textContent = '';
    }

    // 首先打開模態框
    if (questionModal) {
        questionModal.style.display = 'flex';
        setTimeout(() => {
            questionModal.classList.add('show-modal');
        }, 10);
    }


    // 獲取或創建事件確認按鈕
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
            markCardAsAnswered(card); // 事件卡也需要標記為已回答
            closeQuestionModal(); // 事件卡確認後直接關閉
            moveToNextPlayer(); // 事件卡處理完畢直接切換玩家
        };

    } else { // 普通問題
        if (questionText) {
            questionText.textContent = question.question;
        }
        if (showAnswerButton) showAnswerButton.style.display = 'block';
        confirmEventButton.style.display = 'none'; // 確保普通問題不顯示事件按鈕
        if (confirmEventButton) { // 安全檢查
            confirmEventButton.onclick = null; // 清除事件監聽器，避免殘留
        }
    }
}

// 顯示答案
function showAnswer(question) {
    if (showAnswerButton) showAnswerButton.style.display = 'none';
    if (correctAnswerDisplay) correctAnswerDisplay.textContent = `答案：${question.answer}`;
    if (correctAnswerDisplay) correctAnswerDisplay.style.display = 'block';
    if (judgmentButtonsDiv) judgmentButtonsDiv.style.display = 'flex';
    if (feedbackDiv) {
        feedbackDiv.textContent = '';
    }
}

// 處理正確/錯誤判斷
function handlePlayerJudgment(isCorrect) {
    let scoreChange = 0;
    let feedbackMessage = '';

    if (activeQuestionData.type === 'normal_question') {
        if (isCorrect) {
            scoreChange = activeQuestionData.points;
            feedbackMessage = `答對了！獲得 ${scoreChange} 分！`;
            if (feedbackDiv) { feedbackDiv.style.color = 'green'; }
        } else {
            // 答錯不加分也不扣分
            scoreChange = 0;
            feedbackMessage = `答錯了！`;
            if (feedbackDiv) { feedbackDiv.style.color = 'red'; }
        }
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
    // 在這裡再次檢查 feedbackDiv
    if (!feedbackDiv) {
        console.error("handleEventCard: 檢測到 feedbackDiv 為 null！無法更新 UI。");
        return; // 如果為 null，則直接返回，避免後續錯誤
    }
    let eventFeedback = '';
    feedbackDiv.style.color = '#ff9800'; // 給事件結果一個醒目的顏色


    console.log("處理事件卡:", eventCard);
    console.log("當前玩家分數 (處理前):", players[currentPlayerIndex].score);

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
                // 確保 eventCard.points 是負值或會被當作負值處理
                const deduction = Math.abs(eventCard.points) * -1;
                players[currentPlayerIndex].score += deduction;
                eventFeedback = `事件！${eventCard.event_description}，${players[currentPlayerIndex].name} 失去 ${Math.abs(deduction)} 分！`;
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
            // 這裡可以加入一個彈窗讓當前玩家選擇下一位玩家
            // 為了簡化，目前只是顯示訊息，實際指定邏輯需要額外UI/互動
            break;
        case 'score_transfer':
            const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
            const transferredScore = players[currentPlayerIndex].score;
            players[nextPlayerIndex].score += transferredScore;
            players[currentPlayerIndex].score = 0; // 當前玩家分數歸零
            eventFeedback = `事件！${eventCard.event_description}，${players[currentPlayerIndex].name} 的 ${transferredScore} 分轉移給 ${players[nextPlayerIndex].name}！`;
            break;
        case 'random_bonus':
            const bonusPoints = Math.floor(Math.random() * 200) + 50; // 50 到 249
            players[currentPlayerIndex].score += bonusPoints;
            eventFeedback = `事件！${eventCard.event_description}，${players[currentPlayerIndex].name} 獲得隨機獎勵 ${bonusPoints} 分！`;
            break;
        case 'random_penalty':
            const penaltyPoints = Math.floor(Math.random() * 100) + 20; // 20 到 119
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
    console.log("當前玩家分數 (處理後):", players[currentPlayerIndex].score);
    // 注意：這裡不關閉模態框也不切換玩家，這些動作由 confirmEventButton 的 onclick 或 closeQuestionModalWithDelay 負責
}


// 標記卡片為已回答
function markCardAsAnswered(card) {
    card.classList.add('answered');
    answeredQuestionsCount++;
    checkGameOver();
}

// 延遲關閉問題彈窗並切換玩家 (用於普通題目)
function closeQuestionModalWithDelay() {
    setTimeout(() => {
        closeQuestionModal();
        moveToNextPlayer();
    }, 1500); // 延遲 1.5 秒
}

// 立即關閉問題彈窗 (用於事件卡或通用關閉)
function closeQuestionModal() {
    if (questionModal) {
        questionModal.classList.remove('show-modal');
        setTimeout(() => {
            questionModal.style.display = 'none';
            if (correctAnswerDisplay) correctAnswerDisplay.style.display = 'none';
            if (judgmentButtonsDiv) judgmentButtonsDiv.style.display = 'none';
            if (feedbackDiv) {
                feedbackDiv.textContent = '';
            }

            // 隱藏事件確認按鈕 (如果存在)
            let confirmEventButton = document.getElementById('confirm-event-button');
            if (confirmEventButton) {
                confirmEventButton.style.display = 'none';
                confirmEventButton.onclick = null; // 清除事件監聽器
                // 移除按鈕，避免重複添加
                if (confirmEventButton.parentNode) {
                    confirmEventButton.parentNode.removeChild(confirmEventButton);
                }
            }
        }, 300); // 動畫延遲 0.3 秒
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

    // 確保輸入框在 DOMContentLoaded 之後可用
    if (numPlayersInput) numPlayersInput.value = 2;
    if (numQuestionsInput) numQuestionsInput.value = 10;

    players = [];
    currentPlayerIndex = 0;
    answeredQuestionsCount = 0;
    activeQuestionData = null;
    currentQuestionCard = null;

    loadQuizSets(); // 重新載入題庫
    questions = quizSets[currentQuizName]; // 確保 questions 變數指向當前題庫的內容

    if (addQuestionToQuizSection) {
        addQuestionToQuizSection.style.display = 'block';
    }
    toggleQuestionFields(); // 重置新增題目表單

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

    // 隱藏事件確認按鈕 (如果存在)
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
// 這個函數本身不會導致 undefined 錯誤，因為它是被事件監聽器觸發的
// 它的綁定需要在 DOMContentLoaded 內部完成
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

function toggleQuestionFields() {
    // 確保這些元素已經被獲取
    if (!questionTypeSelect || !normalQuestionFields || !eventCardFields) {
        console.error("toggleQuestionFields: 部分題目類型相關的 UI 元素未找到。");
        return;
    }

    const selectedType = questionTypeSelect.value;
    if (selectedType === 'normal_question') {
        normalQuestionFields.style.display = 'block';
        eventCardFields.style.display = 'none';
    } else if (selectedType === 'event_card') {
        normalQuestionFields.style.display = 'none';
        eventCardFields.style.display = 'block';
    }
    // 重置新增題目表單的輸入框
    if (newQuestionTextNormal) newQuestionTextNormal.value = '';
    if (newAnswerText) newAnswerText.value = '';
    if (newPoints) newPoints.value = 100;
    if (eventQuestionText) eventQuestionText.value = '';
    // eventTypeSelect.value = eventTypes[0].value; // 可以選擇重置為第一個事件類型
}

// 將 addQuestionToQuizButton 的邏輯抽離成一個獨立的函數，以避免重複代碼和更好的組織
function addQuestionToQuizButtonClickHandler() {
    // 再次檢查所有必要的 UI 元素是否已獲取
    if (!questionTypeSelect || !newQuestionTextNormal || !newAnswerText || !newPoints || !eventQuestionText || !eventTypeSelect) {
        console.error("addQuestionToQuizButtonClickHandler: 新增題目所需的 UI 元素未完全初始化。");
        return;
    }

    const selectedType = questionTypeSelect.value;
    let qText = '';
    let newQuestion = { type: selectedType };

    if (selectedType === 'normal_question') {
        qText = newQuestionTextNormal.value.trim();
        const answerText = newAnswerText.value.trim();
        const points = parseInt(newPoints.value);

        if (!qText) {
            alert('請輸入問題內容。');
            return;
        }
        if (!answerText) {
            alert('請輸入答案。');
            return;
        }
        if (isNaN(points) || points <= 0) {
            alert('請輸入有效的題目分數（正數）。');
            return;
        }
        newQuestion.question = qText;
        newQuestion.answer = answerText;
        newQuestion.points = points;
    } else { // event_card
        qText = eventQuestionText.value.trim();
        const eventType = eventTypeSelect.value;

        if (!qText) {
            alert('請輸入事件描述。');
            return;
        }
        if (!eventType) {
            alert('請選擇事件類型。');
            return;
        }
        // 統一事件卡在遊戲板上顯示的文本，實際描述放在 event_description
        newQuestion.question = "事件卡";
        newQuestion.event_type = eventType;
        newQuestion.event_description = qText;

        let points = 0;
        if (eventType === 'add_score_current_player' || eventType === 'add_score_all_players') {
             const eventPointsInput = prompt(`請輸入此事件卡加分的分數 (請輸入正數):`, 50);
             if (eventPointsInput === null || isNaN(parseInt(eventPointsInput)) || parseInt(eventPointsInput) <= 0) {
                 alert('請輸入有效的正數分數。');
                 return;
             }
             points = parseInt(eventPointsInput);
        } else if (eventType === 'deduct_score') {
             const eventPointsInput = prompt(`請輸入此事件卡扣分的分數 (請輸入正數，將自動轉為負數):`, 50);
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
    if (newQuestionTextNormal) newQuestionTextNormal.value = '';
    if (newAnswerText) newAnswerText.value = '';
    if (newPoints) newPoints.value = 100;
    if (eventQuestionText) eventQuestionText.value = '';
    questions = quizSets[currentQuizName];
}

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    // 增加一個調試訊息，確認 DOMContentLoaded 事件被觸發
    console.log("DOMContentLoaded 事件觸發！");
    console.log("script.js 文件已成功加載！");

    // 將所有需要等待 DOM 加載完成後才能獲取的元素放在這裡
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
    closeButton = document.querySelector('.close-button'); // 由於這個 closeButton 是通用的，所以在這裡獲取
    playerScoresDiv = document.getElementById('player-scores');
    currentPlayerDisplay = document.getElementById('current-player-display');

    // 題庫管理相關元素獲取
    quizSelect = document.getElementById('quiz-select');
    addQuizButton = document.getElementById('add-quiz-button');
    deleteQuizButton = document.getElementById('delete-quiz-button');
    addQuestionToQuizSection = document.getElementById('add-question-to-quiz-section');
    currentQuizNameSpan = document.getElementById('current-quiz-name');
    questionTypeSelect = document.getElementById('question-type-select');
    normalQuestionFields = document.getElementById('normal-question-fields');
    eventCardFields = document.getElementById('event-card-fields');
    newQuestionTextNormal = document.getElementById('new-question-text-normal');
    newAnswerText = document.getElementById('new-answer-text');
    newPoints = document.getElementById('new-points');
    eventQuestionText = document.getElementById('new-question-text-event');
    eventTypeSelect = document.getElementById('event-type-select');
    addQuestionToQuizButton = document.getElementById('add-question-to-quiz-button');

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
    if (!startGameButton) {
        console.error("嚴重錯誤: DOMContentLoaded 內 startGameButton 元素為 null！請檢查 index.html 中的 ID。");
    }
    console.log("DOMContentLoaded 內初始化 feedbackDiv:", feedbackDiv);
    if (!feedbackDiv) {
        console.error("嚴重錯誤: DOMContentLoaded 內 feedbackDiv 元素為 null！請檢查 index.html 中的 ID。");
    }
    console.log("DOMContentLoaded 內初始化 addQuizButton:", addQuizButton);
    if (!addQuizButton) {
        console.error("嚴重錯誤: DOMContentLoaded 內 addQuizButton 元素為 null！請檢查 index.html 中的 ID。");
    }


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


    if (showAnswerButton) {
        showAnswerButton.addEventListener('click', () => {
            if (activeQuestionData) {
                showAnswer(activeQuestionData);
            }
        });
    }

    if (markCorrectButton) {
        markCorrectButton.addEventListener('click', () => {
            if (activeQuestionData && currentQuestionCard) {
                handlePlayerJudgment(true);
            }
        });
    }

    if (markIncorrectButton) {
        markIncorrectButton.addEventListener('click', () => {
            if (activeQuestionData && currentQuestionCard) { // 更正：這裡應該是 currentQuestionCard
                handlePlayerJudgment(false);
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            if (activeQuestionData && activeQuestionData.type === 'event_card') {
                alert('請點擊「確定」按鈕來處理事件卡效果。');
                return;
            } else {
                closeQuestionModal();
                if (activeQuestionData && activeQuestionData.type === 'normal_question') {
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

    if (addQuizButton) { // 再次檢查 addQuizButton
        addQuizButton.addEventListener('click', handleAddQuizButton); // 將函數調用綁定
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
        addQuestionToQuizButton.addEventListener('click', addQuestionToQuizButtonClickHandler); // 綁定到一個獨立的函數
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
                            if (Array.isArray(importedQuestions) && importedQuestions.every(q => typeof q === 'object' && (('question' in q && 'answer' in q && 'points' in q && 'type' in q) || ('event_description' in q && 'event_type' in q && 'type' in q)))) {
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
                                alert('匯入的 JSON 檔案格式不正確。請確保它是一個包含有效問題或事件卡物件的陣列。');
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
    resetGame(); // 確保遊戲在載入時始終處於重置狀態，並初始化相關UI
});