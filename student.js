// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, push, update, get, set, off, onValue } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCth_mCwqvCe73o4SplkaBXBqThF2aALkQ",
    authDomain: "psychology-69d67.firebaseapp.com",
    databaseURL: "https://psychology-69d67-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "psychology-69d67",
    storageBucket: "psychology-69d67.appspot.com",
    messagingSenderId: "1050457404307",
    appId: "1:1050457404307:web:ef66b1a1a40449e926ee66",
    measurementId: "G-XKB0EWCBP8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let emotionId = null; // 所選練習的情緒ID
let currentConversationId = null;  // 用於儲存當前對話的ID
let currentStuConversationId = null;
let conversationHistory = [];
let selectedDeadline = '無期限'; // 存儲選擇的練習的 deadline

// Function to get current timestamp in yyyy-mm-dd hh:mm:ss format
function getFormattedTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份從0開始
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

document.addEventListener('DOMContentLoaded', function () {
    // 取得漢堡圖標和menu
    const toggle = document.getElementById('toggle');
    const slidemenu = document.getElementById('slidemenu');
    const homeLink = document.querySelector('a[href="#home"]');
    const resultLink = document.querySelector('a[href="#result"]');
    const homeSection = document.querySelector('.home');
    const practiceSection = document.querySelector('.practice');
    const resultSection = document.querySelector('.result');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const endButton = document.getElementById('endButton');
    const teacherchatboxMessages = document.getElementById('teacherchatboxMessages');
    const emotionSelectionSection = document.getElementById('emotion-selection');
    const emotionSubmitButton = document.getElementById('submitEmotion');
    const teacherPagination = document.getElementById('teacherPagination');

    // 確保元素存在
    if (toggle && slidemenu) {
        // 初始狀態下menu顯示在漢堡圖標旁
        let menuVisible = false;

        // 添加點擊事件來切換menu的顯示狀態
        toggle.addEventListener('click', function () {
            if (!menuVisible) {
                // 隱藏原始menu並使其從下方升起
                slidemenu.classList.remove('original');
                slidemenu.classList.add('show');
                setTimeout(() => {
                    slidemenu.classList.add('visible');
                }, 10); // 確保menu從下方出現
            } else {
                // 隱藏上滑menu並恢復原始顯示
                slidemenu.classList.remove('visible');
                setTimeout(() => {
                    slidemenu.classList.remove('show');
                    slidemenu.classList.add('original');
                }, 500); // 等待動畫完成後恢復原始狀態
            }

            // 切換狀態
            menuVisible = !menuVisible;
        });
    } else {
        console.error('Toggle or SlideMenu element not found!');
    }

    // 主頁
    if (homeLink && homeSection && practiceSection && resultSection) {
        homeLink.addEventListener('click', function (e) {
            e.preventDefault();
            homeSection.style.display = 'flex';  // 顯示主頁
            teacherpracticeSection.style.display = 'none';  // 隱藏老師出題區域
            studentpracticeSection.style.display = 'none';
            resultSection.style.display = 'none';  // 隱藏查詢紀錄區域
            emotionSelectionSection.style.display = 'none';  // 隱藏情緒選擇區域
        });
    } else {
        console.error('Required elements not found!');
    }

    const recordList = document.getElementById('record-list');
    const resultchatbox = document.getElementById('resultchatbox');
    const resultchatboxMessages = document.getElementById('resultchatboxMessages');
    let currentMode = ''; // 用來追蹤目前的模式

    // 查詢練習紀錄
    if (resultLink) {
        resultLink.addEventListener('click', async function (e) {
            e.preventDefault(); // 防止默認的跳轉行為
            //currentMode = 'view-report';

            // 重置頁面狀態
            homeSection.style.display = 'none';  // 隱藏主頁
            teacherpracticeSection.style.display = 'none';  // 隱藏老師出題區域
            studentpracticeSection.style.display = 'none';
            resultSection.style.display = 'flex';  // 顯示查詢紀錄區域
            resultchatbox.style.display = 'none';  // 隱藏對話框
            recordList.style.display = 'flex';
            document.getElementById('result-pagination').style.display = 'flex';

            // 清空之前的紀錄列表和對話框
            recordList.innerHTML = '';
            clearResultChatMessages();

            // 抓取目前登入的使用者 ID
            const userID = auth.currentUser.uid;
            console.log("Current User ID:", userID);  // 偵錯：檢查使用者 ID 是否正確

            try {
                // 從 Firebase 資料庫中抓取該使用者的報告
                const conversationsRef = ref(db, 'conversations');
                const snapshot = await get(conversationsRef);

                if (snapshot.exists()) {
                    const conversations = snapshot.val();
                    console.log("Conversations fetched:", conversations);  // 偵錯：查看抓取到的報告資料

                    let filteredRecords = [];

                    // 過濾出屬於該使用者的報告
                    for (const conversationId in conversations) {
                        const conversation = conversations[conversationId];

                        if (conversation.userId === userID && conversation.state === 'teacher-practice') {
                            filteredRecords.push({ id: conversationId, ...conversation });
                        }
                    }

                    console.log("Filtered Records for User:", filteredRecords);  // 偵錯：查看過濾後的報告列表
                    records = filteredRecords;
                    currentPage = 1; // 重置當前頁面為 1

                    const reviewStatus = document.getElementById('reviewStatus');
                    reviewStatus.value = 'reviewed';
                    const dropdown = document.getElementById('practiceType');
                    dropdown.value = 'teacher-practice';
                    //displayFilteredRecords(filteredRecords);
                    //displayRecords(currentPage); // 顯示紀錄
                    filterRecords();
                    setupPagination(); // 設定翻頁
                } else {
                    console.error('No conversation records found.');
                    // 顯示沒有報告的訊息
                    const noRecordsMessage = document.createElement('div');
                    noRecordsMessage.classList.add('no-records-message');
                    noRecordsMessage.innerText = '目前沒有報告。';
                    recordList.appendChild(noRecordsMessage);
                }
            } catch (error) {
                console.error('Error fetching conversation records:', error);
            }
        });
    }

    const resultPagination = document.getElementById('result-pagination');
    // 顯示對話內容
    async function displayConversationMessages(conversationId) {
        // 顯示聊天對話框，不包括輸入區域
        resultchatbox.style.display = 'flex';
        recordList.style.display = 'none';
        resultPagination.style.display = 'none';
        resultchatboxMessages.innerHTML = '';

        try {
            // 從 Firebase 資料庫中抓取該對話的所有訊息
            const messagesRef = ref(db, `conversations/${conversationId}/messages`);
            const snapshot = await get(messagesRef);

            if (snapshot.exists()) {
                const messages = snapshot.val();
                console.log("Messages retrieved: ", messages); // 用於檢查抓取到的資料

                // 清空對話框中的所有訊息
                clearResultChatMessages();

                // 顯示該對話的所有訊息
                for (const messageId in messages) {
                    const message = messages[messageId];

                    const messageElement = document.createElement('div');
                    messageElement.classList.add('message', message.sender); // 根據 sender 決定訊息樣式
                    messageElement.innerText = message.content;
                    resultchatboxMessages.appendChild(messageElement);

                    // 動態生成評語輸入框
                    const feedbackInput = document.createElement('textarea');
                    feedbackInput.rows = 2;
                    feedbackInput.placeholder = '請填寫此訊息的評語...';
                    feedbackInput.classList.add('message-feedback');
                    feedbackInput.id = `feedback-${messageId}`;
                    feedbackInput.readOnly = true;
                    if (message.feedback) {
                        feedbackInput.value = message.feedback;
                    } else {
                        feedbackInput.value = '無評語。';
                    }
                    resultchatboxMessages.appendChild(feedbackInput);
                }

                resultchatboxMessages.scrollTop = 0;

                const totalFeedbackElement = document.getElementById('total-feedback');
                totalFeedbackElement.innerText = '';
                const conversationRef = ref(db, `conversations/${conversationId}`);
                const conversationsnapshot = await get(conversationRef);
                if (conversationsnapshot.exists()) {
                    const conversations = conversationsnapshot.val();

                    if (conversations.summary) {
                        totalFeedbackElement.innerText = `${conversations.summary}`;
                    } else {
                        totalFeedbackElement.innerText = '無評語。';
                    }
                }
            } else {
                console.error(`No messages found for this conversation with ID: ${conversationId}.`);
            }
        } catch (error) {
            console.error('Error fetching conversation messages:', error);
        }


    }

    // 清空查看報告對話框中的所有訊息
    function clearResultChatMessages() {
        resultchatboxMessages.innerHTML = '';
    }

    // 顯示訊息在查看報告對話框
    function appendResultMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.innerText = text;
        resultchatboxMessages.appendChild(messageElement);
        resultchatboxMessages.scrollTop = resultchatboxMessages.scrollHeight;
    }

    const recordsPerPage = 2;
    let currentPage = 1;
    //模擬練習報告
    let records = [];

    const dropdown = document.getElementById('practiceType'); // 假設這是下拉選單的 ID
    const reviewStatus = document.getElementById('reviewStatus'); // 評分狀態下拉選單

    async function filterRecords() {
        const selectedPracticeType = dropdown.value; // 選中的練習類型
        const selectedReviewStatus = reviewStatus.value; // 選中的評分狀態
        recordList.innerHTML = ''; // 清空舊的結果

        let filterState = ''; // 練習類型篩選條件
        let filterReviewed = ''; // 評分狀態篩選條件

        // 根據選中的練習類型設定篩選條件
        if (selectedPracticeType === 'teacher-practice') {
            filterState = 'teacher-practice'; // 老師出題
        } else if (selectedPracticeType === 'self-practice') {
            filterState = 'self-practice'; // 自行練習
        }

        // 根據選中的評分狀態設定篩選條件
        if (selectedReviewStatus === 'reviewed') {
            filterReviewed = "true"; // 已評分
        } else if (selectedReviewStatus === 'unreviewed') {
            filterReviewed = "false"; // 未評分
        }

        currentPage = 1;

        // 從資料庫抓取對話資料，並進行篩選
        const conversationsRef = ref(db, 'conversations');
        off(conversationsRef);
        onValue(conversationsRef, (snapshot) => {
            const conversations = snapshot.val();
            let filteredRecords = [];

            // 根據 userId、state 和 isReviewed 進行篩選
            for (const conversationId in conversations) {
                const conversation = conversations[conversationId];
                if (conversation.userId === auth.currentUser.uid &&
                    conversation.state === filterState &&
                    conversation.isReviewed === filterReviewed) {
                    filteredRecords.push({ id: conversationId, ...conversation });
                }
            }

            // 更新全局的篩選後紀錄
            records = filteredRecords;
            displayRecords(currentPage); // 顯示篩選後的結果
            setupPagination(); // 設置翻頁按鈕
        }), (error) => {
            console.error('error:', error);
        }

    }

    dropdown.addEventListener('change', async function () {
        const selectedOption = dropdown.value;
        recordList.innerHTML = '';
        let filterState = '';
        if (selectedOption === 'teacher-practice') {
            filterState = 'teacher-practice';  // 選擇老師出題時的篩選條件
        } else if (selectedOption === 'self-practice') {
            filterState = 'self-practice';  // 選擇自行練習時的篩選條件
        }

        const reviewStatus = document.getElementById('reviewStatus');
        reviewStatus.value = 'reviewed';
        currentPage = 1;

        // 開始根據 state 欄位篩選資料
        try {
            const conversationsRef = ref(db, 'conversations');
            const snapshot = await get(conversationsRef);

            if (snapshot.exists()) {
                const conversations = snapshot.val();
                let filteredRecords = [];

                // 遍歷 conversations 來篩選符合條件的對話
                for (const conversationId in conversations) {
                    if (conversations[conversationId].userId === auth.currentUser.uid && conversations[conversationId].state === filterState) {
                        filteredRecords.push({ id: conversationId, ...conversations[conversationId] });
                    }
                }

                // 顯示篩選後的結果
                records = filteredRecords; // 更新全局的紀錄變數
                //displayRecords(currentPage); // 顯示新的篩選結果
                filterRecords();
                setupPagination(); // 重新設置分頁按鈕
            } else {
                console.log('No conversation records found.');
            }
        } catch (error) {
            console.error('Error fetching conversation records:', error);
        }
    });

    reviewStatus.addEventListener('change', async function () {
        const reviewedOption = reviewStatus.value;
        recordList.innerHTML = '';
        let filterState = '';

        if (reviewedOption === 'reviewed') {
            filterState = 'true';
        } else if (reviewedOption === 'unreviewed') {
            filterState = 'false';
        }

        currentPage = 1;

        // 開始根據 state 欄位篩選資料
        try {
            const conversationsRef = ref(db, 'conversations');
            const snapshot = await get(conversationsRef);

            if (snapshot.exists()) {
                const conversations = snapshot.val();
                let filteredRecords = [];

                // 遍歷 conversations 來篩選符合條件的對話
                for (const conversationId in conversations) {
                    if (conversations[conversationId].userId === auth.currentUser.uid && conversations[conversationId].isReviewed === filterState) {
                        filteredRecords.push({ id: conversationId, ...conversations[conversationId] });
                    }
                }

                // 顯示篩選後的結果
                records = filteredRecords; // 更新全局的紀錄變數
                filterRecords();
                //displayRecords(currentPage); // 顯示新的篩選結果
                setupPagination(); // 重新設置分頁按鈕
            } else {
                console.log('No conversation records found.');
            }
        } catch (error) {
            console.error('Error fetching conversation records:', error);
        }
    });

    // 函數用於顯示篩選後的對話記錄
    function displayFilteredRecords(records) {
        const recordList = document.getElementById('record-list'); // 顯示記錄的容器
        recordList.innerHTML = ''; // 清空之前的記錄

        if (records.length > 0) {
            records.forEach((record, index) => {
                const recordBox = document.createElement('div');
                recordBox.classList.add('record-box');
                recordBox.innerText = `紀錄 ${index + 1}: ${record.timestamp}`;

                // 你可以在這裡定義點擊記錄後的行為
                recordBox.onclick = function () {
                    displayConversationMessages(record.id);
                };

                recordList.appendChild(recordBox);
            });
        } else {
            const noRecordsMessage = document.createElement('div');
            noRecordsMessage.classList.add('no-records-message');
            noRecordsMessage.innerText = '目前沒有符合條件的對話記錄。';
            recordList.appendChild(noRecordsMessage);
        }
    }

    function displayRecords(page) {
        const recordList = document.getElementById('record-list');
        recordList.innerHTML = '';

        if (records.length === 0) {
            // 顯示「目前沒有報告」的訊息
            const noRecordsMessage = document.createElement('div');
            noRecordsMessage.classList.add('no-records-message');
            noRecordsMessage.innerText = '目前沒有報告。';
            recordList.appendChild(noRecordsMessage);
            return; // 結束函式，避免後續程式執行
        }

        const start = (page - 1) * recordsPerPage;
        const end = start + recordsPerPage;
        const recordsToShow = records.slice(start, end);

        recordsToShow.forEach((record, index) => {
            const recordBox = document.createElement('div');
            recordBox.classList.add('record-box');
            recordBox.innerText = `紀錄 ${start + index + 1}: ${record.timestamp}`;

            const statusText = document.createElement('span');
            statusText.style.fontWeight = 'bold'; // 加粗字體
            statusText.style.marginLeft = '10px'; // 在文本和標籤之間添加間距

            if (record.isReviewed === "true") {
                statusText.innerText = '已評分';
                statusText.style.color = 'gray';  // 已評分，灰色
            } else {
                statusText.innerText = '未評分';
                statusText.style.color = 'red';   // 未評分，紅色
            }
            recordBox.appendChild(statusText);

            // 點擊紀錄後顯示聊天內容
            recordBox.onclick = async function () {
                /*if (currentMode === 'view-report') {
                    // 查看練習報告模式：顯示聊天訊息
                    await displayConversationMessages(record.id);
                } else if (currentMode === 'teacher-practice') {
                    // 老師出題模式：顯示對話頁面
                    await displayTeacherRecords(page, records);
                }*/
                await displayConversationMessages(record.id);
            };
            recordList.appendChild(recordBox);
        });

        document.getElementById('page-info').innerText = `第 ${page} 頁，共 ${Math.ceil(records.length / recordsPerPage)} 頁`;
        // 確保報告列表被顯示
        recordList.style.display = 'block';
        resultchatbox.style.display = 'none'; // 確保對話框被隱藏
        resultPagination.style.display = 'flex';
    }

    function setupPagination() {
        document.getElementById('prev-btn').onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                displayRecords(currentPage);
            }
        };

        document.getElementById('next-btn').onclick = () => {
            if (currentPage < Math.ceil(records.length / recordsPerPage)) {
                currentPage++;
                displayRecords(currentPage);
            }
        };
    }

    //查詢練習紀錄的返回
    const returnbtn = document.getElementById('return-btn');
    returnbtn.addEventListener('click', async function () {
        resultPagination.style.display = 'flex';
        resultchatbox.style.display = 'none'; // 確保對話框被隱藏
        recordList.style.display = 'block';  // 顯示練習紀錄方框
        displayRecords(currentPage); // 重新顯示當前頁面的紀錄
    })

    displayRecords(currentPage);
    setupPagination();

    // 老師出題練習
    const teacherModeLink = document.getElementById('teacherMode');
    const teacherpracticeSection = document.querySelector('.practice');
    const practiceSelectionContainer = document.getElementById('practiceSelectionContainer'); // 用來顯示練習選項
    const teacherchatbox = document.getElementById('teacherchatbox') // 聊天框

    const teacherRecordsPerPage = 2; // 每頁顯示兩個題目
    let currentTeacherPage = 1; // 初始化當前頁面
    let totalTeacherRecords = 0; // 記錄總數

    document.getElementById("all-emotion").addEventListener("change", function () {
        // 取得 emotion-selection 區域的所有 checkbox（不包括全選）
        const checkboxes = document.querySelectorAll('#emotion-selection input[type="checkbox"]:not(#all-emotion)');
        checkboxes.forEach(function (checkbox) {
            checkbox.checked = document.getElementById("all-emotion").checked;
        });
    });

    document.getElementById("all-student").addEventListener("change", function () {
        // 取得 studentpractice 區域的所有 checkbox（不包括全選）
        const checkboxes = document.querySelectorAll('.studentpractice-content input[type="checkbox"]:not(#all-student)');
        checkboxes.forEach(function (checkbox) {
            checkbox.checked = document.getElementById("all-student").checked;
        });
    });

    if (teacherModeLink) {
        teacherModeLink.addEventListener('click', async function (e) {
            e.preventDefault();
            currentMode = 'teacher-practice';
            currentTeacherPage = 1;
            // 顯示自我練習對話框並顯示「正在載入」訊息
            homeSection.style.display = 'none';
            resultSection.style.display = 'none';
            studentpracticeSection.style.display = 'none';
            teacherpracticeSection.style.display = 'flex';
            practiceSelectionContainer.style.display = 'flex';
            teacherPagination.style.display = 'flex';
            teacherchatbox.style.display = 'none'; // 隱藏聊天框

            // 清空之前的選題
            practiceSelectionContainer.innerHTML = '';

            // 從 Firebase 資料庫抓取練習選項
            const emotionsRef = ref(db, 'emotions/Wx4ZIQxVMnYbiI2vP3H6grYWiVE3');
            const emotionsSnapshot = await get(emotionsRef);

            if (emotionsSnapshot.exists()) {
                const emotionsData = emotionsSnapshot.val();
                const currentUserId = auth.currentUser.uid;

                const practiceList = Object.keys(emotionsData).map(key => {
                    const practice = emotionsData[key];

                    // 確認該練習是否包含當前學生的學號
                    if (practice.students && Array.isArray(practice.students)) {
                        const studentIds = practice.students.map(student => student.id.trim()); // 去掉學生 ID 的多餘空格

                        if (studentIds.includes(currentUserId)) {
                            console.log(`Practice ${key} matched for current user.`);
                            return { id: key, ...practice };
                        }
                    } else {
                        console.log(`Practice ${key} has no students array.`);
                    }
                    return null;
                }).filter(practice => practice !== null);

                console.log("Filtered Practice List for Current User:", practiceList); // 調試訊息

                // 過濾未截止的練習
                const currentTime = new Date();
                const unexpiredPracticeList = practiceList.filter(practice => {
                    if (practice.deadline && practice.deadline !== '無期限') {
                        const deadlineTime = new Date(practice.deadline);
                        return deadlineTime > currentTime;
                    }
                    return true; // 沒有截止時間或者是 "無期限" 的練習
                });

                totalTeacherRecords = unexpiredPracticeList.length;

                displayTeacherRecords(currentTeacherPage, unexpiredPracticeList);

                // 設置分頁按鈕
                setupTeacherPagination(unexpiredPracticeList);
            } else {
                console.error('No available practice records.');
            }

        });
    }

    // 顯示特定頁面的老師出題紀錄
    function displayTeacherRecords(page, practiceList) {
        practiceSelectionContainer.innerHTML = '';

        if (!practiceList || practiceList.length === 0) {
            const noRecordsMessage = document.createElement('div');
            noRecordsMessage.classList.add('no-records-message');
            noRecordsMessage.innerText = '目前沒有可供顯示的練習。';
            practiceSelectionContainer.appendChild(noRecordsMessage);
            console.log('No practices to display.'); // 調試日誌
            return;
        }

        const start = (page - 1) * teacherRecordsPerPage;
        const end = start + teacherRecordsPerPage;
        const recordsToShow = practiceList.slice(start, end);

        recordsToShow.forEach((practice, index) => {
            const practiceBox = document.createElement('div');
            practiceBox.classList.add('practice-box');

            // 格式化截止時間為 yyyy-mm-dd hh:mm:ss
            let formattedDeadline = '無期限';
            if (practice.deadline && practice.deadline !== '無期限') {
                const deadlineDate = new Date(practice.deadline);
                const year = deadlineDate.getFullYear();
                const month = String(deadlineDate.getMonth() + 1).padStart(2, '0');
                const day = String(deadlineDate.getDate()).padStart(2, '0');
                const hours = String(deadlineDate.getHours()).padStart(2, '0');
                const minutes = String(deadlineDate.getMinutes()).padStart(2, '0');
                const seconds = String(deadlineDate.getSeconds()).padStart(2, '0');
                formattedDeadline = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            }

            // 顯示練習描述和截止時間
            practiceBox.innerText = `練習 ${start + index + 1}:\n ${practice.aiGeneratedCase.substring(0, 80)}...`;
            practiceBox.innerText += `\n\n截止時間: ${formattedDeadline}`;

            // 點擊後進入聊天界面並顯示該練習的描述
            practiceBox.onclick = async function () {
                practiceSection.style.display = 'flex';  // 隱藏選題區域
                practiceSelectionContainer.style.display = 'none';
                teacherPagination.style.display = 'none';
                teacherchatbox.style.display = 'flex';  // 顯示聊天對話框

                emotionId = practice.id;
                selectedDeadline = practice.deadline || '無期限'; // 儲存該練習的 deadline
                console.log(`practice id: ${emotionId}, deadline: ${selectedDeadline}`);

                // 在對話框中顯示「正在載入」
                appendMessage('ai', '正在生成個案，請稍候...');

                // 從Firebase資料庫抓取description生成個案
                const aiGeneratedCase = await getCaseDescription(emotionId);

                if (aiGeneratedCase) {
                    // 使用生成的案例來設定角色背景
                    conversationHistory.push({
                        role: 'system',
                        content: `你現在是一名需要接受心理諮商的患者，根據以下的描述，你將扮演這個角色，並根據這個背景與用戶進行對話：${aiGeneratedCase}。你的目標是尋找解決方法，並表達你的感受。請以你的角色背景，與用戶進行對話，並真實地反映你的情緒和困境。`
                    });

                    // 把description添加到對話歷史中
                    conversationHistory.push({ role: 'assistant', content: aiGeneratedCase });
                    console.log(conversationHistory);

                    // 清除「正在載入」的訊息
                    clearChatMessages();
                    appendMessage('ai', `${aiGeneratedCase}`);

                    // 初始化新的對話
                    currentConversationId = await startNewConversation(aiGeneratedCase);
                } else {
                    appendMessage('ai', '抱歉，無法抓取心理學個案資料。');
                }
            };

            practiceSelectionContainer.appendChild(practiceBox);
        });

        document.getElementById('teacher-page-info').innerText = `第 ${page} 頁，共 ${Math.ceil(totalTeacherRecords / teacherRecordsPerPage)} 頁`;
        // 檢查是否已經正確將練習方塊添加到容器
        console.log('Number of practice boxes added:', practiceSelectionContainer.childElementCount);
    }

    // 設置老師出題分頁按鈕
    function setupTeacherPagination(practiceList) {
        document.getElementById('teacher-prev-btn').onclick = () => {
            if (currentTeacherPage > 1) {
                currentTeacherPage--;
                displayTeacherRecords(currentTeacherPage, practiceList);
            }
        };

        document.getElementById('teacher-next-btn').onclick = () => {
            if (currentTeacherPage < Math.ceil(totalTeacherRecords / teacherRecordsPerPage)) {
                currentTeacherPage++;
                displayTeacherRecords(currentTeacherPage, practiceList);
            }
        };
    }

    // 清空對話框中的所有訊息
    function clearChatMessages() {
        teacherchatboxMessages.innerHTML = '';
    }

    // 從 Firebase 資料庫抓取 description
    async function getCaseDescription(emotionId) {
        try {
            const caseRef = ref(db, `emotions/Wx4ZIQxVMnYbiI2vP3H6grYWiVE3/${emotionId}`);
            const snapshot = await get(caseRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                return data.aiGeneratedCase;  // 回傳描述
            } else {
                console.log('No case data available for the selected emotion.');
                return null;
            }
        } catch (error) {
            console.error('Error fetching case description:', error);
            return null;
        }
    }

    // 生成個案並顯示
    async function generateCaseFromAI(conversationHistory) {
        console.log('Sending conversationHistory to AI:', conversationHistory);
        const apiKey = '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';
        const apiURL = 'https://api.openai.com/v1/chat/completions';

        try {
            const response = await fetch(apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: conversationHistory
                })
            });

            const data = await response.json();
            if (data && data.choices && data.choices.length > 0) {
                const aiResponse = data.choices[0].message.content.trim();
                return aiResponse;
            } else {
                console.error('無效的 AI 回應:', data);
                return null;
            }
        } catch (error) {
            console.error('Error generating case from AI:', error);
            return null;
        }
    }

    // 顯示訊息在聊天框
    function appendMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.innerText = text;
        teacherchatboxMessages.appendChild(messageElement);
        teacherchatboxMessages.scrollTop = 0;
    }

    // 讓使用者與 AI 進行對話
    sendButton.addEventListener('click', async function () {
        const userText = userInput.value.trim();
        if (userText) {
            appendMessage('user', userText);
            userInput.value = '';

            // 將使用者的訊息加入對話歷史
            conversationHistory.push({ role: 'user', content: userText });
            console.log(conversationHistory);

            // Save user's message to Firebase
            if (currentConversationId) {
                saveMessageToConversation(currentConversationId, userText, 'user');
            }

            // 在對話框中顯示「正在生成回應...」
            appendMessage('ai', '正在生成回應，請稍候...');

            const aiResponse = await generateCaseFromAI(conversationHistory);

            // 清除「正在載入」的訊息
            clearLastMessage();

            if (aiResponse) {
                appendMessage('ai', aiResponse);

                conversationHistory.push({ role: 'assistant', content: aiResponse });
                // Save AI's response to Firebase
                if (currentConversationId) {
                    saveMessageToConversation(currentConversationId, aiResponse, 'ai');
                }
            } else {
                appendMessage('ai', '抱歉，我無法生成回應。');
            }
        }
    });

    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });

    // 清除最後一條訊息（用於清除「正在生成回應」的訊息）
    function clearLastMessage() {
        const lastMessage = teacherchatboxMessages.lastChild;
        if (lastMessage) {
            teacherchatboxMessages.removeChild(lastMessage);
        }
    }

    // 建立新的對話
    async function startNewConversation(aiGeneratedCase) {
        const userID = auth.currentUser.uid;
        const username = auth.currentUser.email.split('@')[0];

        const newConversationRef = push(ref(db, 'conversations'));
        const conversationData = {
            userId: userID,
            username: username,
            timestamp: getFormattedTimestamp(),
            deadline: selectedDeadline
        };

        try {
            await set(newConversationRef, conversationData);
            console.log('Conversation initialized with ID:', newConversationRef.key);

            // 儲存 AI 的個案描述作為對話的第一條訊息
            await saveMessageToConversation(newConversationRef.key, aiGeneratedCase, 'ai');

            return newConversationRef.key;
        } catch (error) {
            console.error('Error initializing conversation:', error);
            return null;
        }
    }

    // Function to save each message to the conversation
    function saveMessageToConversation(conversationId, message, sender) {
        const messageRef = push(ref(db, `conversations/${conversationId}/messages`));
        const messageData = {
            content: message,
            sender: sender, // 'user' or 'ai'
            timestamp: getFormattedTimestamp()
        };

        set(messageRef, messageData)
            .then(() => {
                console.log('Message has been saved to the conversation.');
            })
            .catch((error) => {
                console.error('Error saving message:', error);
            });
    }

    // 點擊「結束」按鈕後，儲存整個對話紀錄
    endButton.addEventListener('click', async function () {
        const userID = auth.currentUser.uid;
        const username = auth.currentUser.email.split('@')[0];

        // 判斷當前的練習模式，根據情況設置 state
        let state;
        if (practiceSection.style.display === 'flex') {
            state = 'teacher-practice';  // 老師練習
        } else {
            state = 'self-practice';  // 學生出題
        }

        const conversationData = {
            userId: userID,
            username: username,
            timestamp: getFormattedTimestamp(),
            isReviewed: "false",
            state: state,
            emotionId: emotionId
        };

        const practiceStudent = {
            userId: userID,
            username: username
        }

        const practiceStudentRef = push(ref(db, `emotions/Wx4ZIQxVMnYbiI2vP3H6grYWiVE3/${emotionId}/practiceStudents`));
        set(practiceStudentRef, practiceStudent)
            .then(() => {
                console.log('save');
            })
            .catch((error) => {
                console.error('Error saving message:', error);
            });

        // Save conversation details
        update(ref(db, `conversations/${currentConversationId}`), conversationData)
            .then(() => {
                alert('對話已結束，所有對話紀錄已儲存');

                if (practiceSection && emotionSelectionSection) {
                    practiceSection.style.display = 'none';  // 隱藏練習畫面
                    emotionSelectionSection.style.display = 'flex';  // 顯示選擇情緒畫面
                } else {
                    console.error('Required sections not found!');
                }

            })
            .catch((error) => {
                console.error('Error saving conversation data:', error);
            });
    });

    // 提交情緒選擇並計算分數
    emotionSubmitButton.addEventListener('click', async function () {
        let correctEmotions = [];

        try {
            const emotionsRef = ref(db, `emotions/Wx4ZIQxVMnYbiI2vP3H6grYWiVE3/${emotionId}/emotions`); // 假設情緒儲存在這個路徑
            const emotionsSnapshot = await get(emotionsRef);

            if (emotionsSnapshot.exists()) {
                const emotionsData = emotionsSnapshot.val();
                correctEmotions = emotionsData; // 抓取資料庫中的正確情緒
                console.log("正確的情緒: ", correctEmotions);
            } else {
                console.error("無法從資料庫抓取情緒。");
                return;
            }
        } catch (error) {
            console.error('Error fetching emotions from database:', error);
            return;
        }

        const selectedEmotions = [];
        const emotionInputs = document.querySelectorAll('input[type="checkbox"]:checked');

        // 檢查選中的選項是否存在
        if (emotionInputs.length === 0) {
            alert('請選擇至少一個情緒');
            return;  // 如果沒有選擇情緒，則不進行後續動作
        }

        emotionInputs.forEach(input => {
            selectedEmotions.push(input.value);  // 將選中的情緒推入陣列
        });

        // 假設 correctEmotions 是我們定義的正確情緒列表
        let correctCount = 0;

        selectedEmotions.forEach(emotion => {
            if (correctEmotions.includes(emotion)) {
                correctCount++;  // 如果學生選擇的情緒在正確列表內，則計數
            }
        });

        const totalEmotions = correctEmotions.length;  // 正確情緒的總數
        alert(`你選對了 ${correctCount} / ${totalEmotions} 個情緒`);

        // 存儲選擇的情緒和分數到資料庫
        if (currentConversationId) {
            const conversationRef = ref(db, `conversations/${currentConversationId}`);
            const updateData = {
                selectedEmotions: selectedEmotions,
                score: `${correctCount} / ${totalEmotions}`
            };

            try {
                await update(conversationRef, updateData);
                console.log('已成功儲存選擇的情緒和分數到資料庫。');
            } catch (error) {
                console.error('Error updating conversation data:', error);
            }
        }

        clearChatMessages();
        // 清空 emotion-selection 區域的所有 checkbox
        const checkboxes = document.querySelectorAll('#emotion-selection input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;  // 將所有 checkbox 設置為未選中
        });

        emotionSelectionSection.style.display = 'none';  // 隱藏選擇情緒頁面
        homeSection.style.display = 'flex';  // 顯示主頁
    });

    //學生自行出題
    const studentpracticeSection = document.querySelector('.studentpractice');
    const studentModeLink = document.getElementById('studentMode');
    const choice = document.querySelector('.choice');
    const smalltalk = document.querySelector('.smalltalk');
    const emotionCheckboxes = document.querySelectorAll('.studentpractice-content input[type="checkbox"]');
    const end = document.getElementById('end');
    let selectedStuEmotions = []; // 儲存選擇的情緒
    let StudentConversationHistory = [];
    const randomName = '某個名字';
    if (studentModeLink) {
        studentModeLink.addEventListener('click', function (e) {
            e.preventDefault();

            // 隱藏其他區域，顯示學生自我練習區域
            homeSection.style.display = 'none';
            teacherpracticeSection.style.display = 'none';
            resultSection.style.display = 'none';
            studentpracticeSection.style.display = 'flex';
            choice.style.display = 'block';
            smalltalk.style.display = 'none';

            clearStuChatMessages();

            const Checkboxes = document.querySelectorAll('.choice input[type="checkbox"]');
            Checkboxes.forEach(checkbox => {
                checkbox.checked = false;  // 取消選中
            });

            // 全選功能
            document.getElementById("all-student").addEventListener("change", function () {
                // 取得所有的 checkbox
                const checkboxes = document.querySelectorAll('.choice input[type="checkbox"]');
                // 根據 "全選" 的狀態設定所有 checkbox 的勾選狀態
                checkboxes.forEach(function (checkbox) {
                    if (checkbox.id !== "all-student") {
                        checkbox.checked = document.getElementById("all-student").checked;
                    }
                });
            });

            // 提交按鈕功能
            document.getElementById("submitbutton").addEventListener("click", async function (e) {
                e.preventDefault(); // 防止默認的跳轉行為

                // 清空先前的選擇
                selectedStuEmotions = [];

                // 取得勾選的情緒，排除「全選」選項
                emotionCheckboxes.forEach(checkbox => {
                    if (checkbox.checked && checkbox.id !== 'all-student') {
                        selectedStuEmotions.push(checkbox.value);
                    }
                });

                // 如果選擇的情緒少於三個，顯示警告，並不進行下一步
                if (selectedStuEmotions.length < 3) {
                    alert('請至少選擇三個以上的情緒');
                    return; // 中斷操作
                }

                // 顯示 smalltalk 區域，隱藏 choice 區域
                choice.style.display = 'none';
                smalltalk.style.display = 'flex';

                // 清空情緒選擇的 checkbox
                emotionCheckboxes.forEach(checkbox => {
                    checkbox.checked = false;  // 取消選中
                });

                StudentConversationHistory.push({
                    role: 'system',
                    content: `請你扮演一個需要心理諮商的患者，你的名字為 ${randomName}，情緒有 ${selectedStuEmotions.join('、')}，根據以上情緒生成一個個案，全程使用第一人稱描述，並且不要直接將情緒寫進個案中。你的目標是尋找解決方法，並表達你的感受。請以你的角色背景，與用戶進行對話，並真實地反映你的情緒和困境。`
                })

                // 開始與AI對話
                startConversationWithAI(StudentConversationHistory);
            })
        })
    }

    const chatboxMess = document.getElementById('chatboxMess');
    function clearStuChatMessages() {
        chatboxMess.innerHTML = '';
    }

    const studentInput = document.getElementById('user');
    const submitButton = document.getElementById('submitButton');

    function adjustTextareaHeight(element){
        element.style.height='auto';
        element.style.height=`${element.scrollHeight}px`;
    }

    studentInput.addEventListener('input',function(){
        adjustTextareaHeight(studentInput);
    })

    userInput.addEventListener('input',function(){
        adjustTextareaHeight(userInput);
    })

    //adjustTextareaHeight(studentInput);
    //adjustTextareaHeight(userInput);

    submitButton.addEventListener('click', async function () {
        const studentText = studentInput.value.trim();
        if (studentText) {
            StudentappendMessage('user', studentText);
            studentInput.value = '';

            StudentConversationHistory.push({ role: 'user', content: studentText });

            const conversationId = currentConversationId;
            await saveStuMessageToConversation(conversationId, studentText, 'user');

            StudentappendMessage('ai', '正在生成回應，請稍候...');

            const aiResponse = await StudentgenerateCaseFromAI(StudentConversationHistory);
            StudentclearLastMessage();
            if (aiResponse) {
                StudentappendMessage('ai', aiResponse);
                StudentConversationHistory.push({ role: 'assistant', content: aiResponse });
                await saveStuMessageToConversation(conversationId, aiResponse, 'ai');
            } else {
                StudentappendMessage('ai', '抱歉，我無法生成回應。');
            }
        }
    })

    // 與AI進行對話的邏輯
    async function startConversationWithAI(StudentConversationHistory) {

        // 顯示AI正在生成回應
        StudentappendMessage('ai', '正在生成個案，請稍候...');

        // 呼叫AI來生成回應
        const aiResponse = await StudentgenerateCaseFromAI(StudentConversationHistory);

        // 清除 "正在生成回應" 的提示
        StudentclearLastMessage();

        if (aiResponse) {
            // 顯示AI的回應
            StudentappendMessage('ai', aiResponse);
            StudentConversationHistory.push({ role: 'assistant', content: aiResponse });

            let StudentConversationId = await startNewStuConversation(aiResponse);
            currentConversationId = StudentConversationId;
        } else {
            StudentappendMessage('ai', '抱歉，我無法生成回應。');
        }
    }

    // 建立學生的對話
    async function startNewStuConversation(aiGeneratedCase) {
        const userID = auth.currentUser.uid;
        const username = auth.currentUser.email.split('@')[0];

        const newConversationRef = push(ref(db, 'conversations'));
        const conversationData = {
            userId: userID,
            username: username,
            timestamp: getFormattedTimestamp(),
        };

        try {
            await set(newConversationRef, conversationData);
            console.log('Student conversation initialized with ID:', newConversationRef.key);

            currentStuConversationId = newConversationRef.key;

            // 儲存 AI 的個案描述作為對話的第一條訊息
            await saveStuMessageToConversation(currentStuConversationId, aiGeneratedCase, 'ai');

            return currentStuConversationId;
        } catch (error) {
            console.error('Error initializing student conversation:', error);
            return null;
        }
    }

    // 儲存學生每條訊息到對話
    function saveStuMessageToConversation(conversationId, message, sender) {
        const messageRef = push(ref(db, `conversations/${conversationId}/messages`));
        const messageData = {
            content: message,
            sender: sender, // 'user' or 'ai'
            timestamp: getFormattedTimestamp()
        };

        set(messageRef, messageData)
            .then(() => {
                console.log('Message has been saved to the student conversation.');
            })
            .catch((error) => {
                console.error('Error saving student message:', error);
            });
    }

    // AI回應生成的邏輯
    async function StudentgenerateCaseFromAI(StudentconversationHistory) {
        const apiKey = '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';
        const apiURL = 'https://api.openai.com/v1/chat/completions';

        try {
            const response = await fetch(apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: StudentconversationHistory
                })
            });

            const data = await response.json();
            if (data && data.choices && data.choices.length > 0) {
                const aiResponse = data.choices[0].message.content.trim();
                return aiResponse;
            } else {
                console.error('無效的AI回應:', data);
                return null;
            }
        } catch (error) {
            console.error('生成AI回應時出錯:', error);
            return null;
        }
    }

    // 顯示和清除對話消息的函數
    function StudentappendMessage(sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);
        messageElement.innerText = text;
        document.getElementById('chatboxMess').appendChild(messageElement);
        document.getElementById('chatboxMess').scrollTop = document.getElementById('chatboxMess').scrollHeight;
    }

    function StudentclearLastMessage() {
        const chatbox = document.getElementById('chatboxMess');
        const lastMessage = chatbox.lastChild;
        if (lastMessage) {
            chatbox.removeChild(lastMessage);
        }
    }

    // 點擊「結束」按鈕後，儲存整個對話紀錄
    end.addEventListener('click', async function () {
        const userID = auth.currentUser.uid;
        const username = auth.currentUser.email.split('@')[0];

        // 使用 Firebase 的 push 方法自動生成唯一的對話 ID
        const conversationRef = ref(db, `conversations/${currentStuConversationId}`);
        //const newConversationRef = push(conversationRef);

        // 判斷當前的練習模式，根據情況設置 state
        let state;
        if (studentpracticeSection.style.display === 'flex') {
            state = 'self-practice';  // 學生出題
        } else {
            state = 'teacher-practice';  // 老師練習
        }
        const conversationData = {
            userId: userID,
            username: username,
            timestamp: getFormattedTimestamp(),
            state: state,
            isReviewed: "false",
            selectedEmotions: selectedStuEmotions //儲存用戶選擇的情緒
        };

        // Save conversation details
        update(conversationRef, conversationData)
            .then(() => {
                alert('對話已結束，所有對話紀錄已儲存');
                homeSection.style.display = 'flex';
                practiceSection.style.display = 'none';
                resultSection.style.display = 'none';
                studentpracticeSection.style.display = 'none';
            })
            .catch((error) => {
                console.error('Error saving conversation data:', error);
            });
    });
    //登出
    var btnLogOut = document.querySelector('a[href="#leave"]');
    btnLogOut.addEventListener('click', function () {
        const userCredential = signOut(auth).then(() => {
            alert('登出成功');
            console.log(userCredential.user);
            window.location.replace('login.html');
        }).catch((error) => {
            alert('登出失敗');
        })
    });
})