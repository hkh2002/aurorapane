// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, set, update, push, onValue, get, off } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

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
const database = getDatabase(app);

// 從 Firebase 獲取學生數據並處理全選功能
function loadUsers() {
    const studentListDiv = document.getElementById('student-list');
    const selectAllCheckbox = document.getElementById('call'); // 全選按鈕
    const usersRef = ref(database, 'users');

    if (!selectAllCheckbox) {
        console.error("Select All checkbox not found!"); // 如果找不到全選按鈕
        return;
    }

    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();

        if (!users) {
            console.error("No users found in the database!");
            return;
        }

        // 將所有符合條件的學生提取出來，並根據 username 排序
        let students = [];
        for (const userId in users) {
            if (users.hasOwnProperty(userId)) {
                const userData = users[userId];

                // 只顯示 username 以數字開頭的使用者作為學生，並只取 email 的 @ 前部分
                if (/^\d/.test(userData.username)) {
                    const usernamePart = userData.username.split('@')[0]; // 取 @ 前的部分
                    students.push({ id: userId, username: usernamePart });
                }
            }
        }

        // 根據 username 進行升序排列
        students.sort((a, b) => a.username.localeCompare(b.username));

        // 清空學生列表
        studentListDiv.innerHTML = '';

        // 將排序後的學生列表顯示在網頁上
        students.forEach(student => {
            // 生成一個學生的 checkbox
            const studentCheckbox = document.createElement('input');
            studentCheckbox.type = 'checkbox';
            studentCheckbox.id = student.id;
            studentCheckbox.value = student.id;
            studentCheckbox.classList.add('student-checkbox'); // 添加一個 class 以便控制全選

            // 生成學生的名字
            const studentLabel = document.createElement('label');
            studentLabel.htmlFor = student.id;
            studentLabel.textContent = `${student.username}`; // 只顯示 @ 前的部分

            // 將 checkbox 和 label 添加到列表中
            studentListDiv.appendChild(studentCheckbox);
            studentListDiv.appendChild(studentLabel);
            studentListDiv.appendChild(document.createElement('br')); // 換行
        });

        // 監聽全選按鈕的狀態改變
        selectAllCheckbox.addEventListener('change', function () {
            const studentCheckboxes = document.querySelectorAll('.student-checkbox');
            studentCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked; // 全選或取消全選
            });
        });
    }, (error) => {
        console.error('Error loading users:', error);
    });
}

let currentReports = [];  // 全域變數用來存儲當前的 reports
let currentPage = 1;

document.addEventListener('DOMContentLoaded', function () {
    // 取得漢堡圖標和menu
    const toggle = document.getElementById('toggle');
    const slidemenu = document.getElementById('slidemenu');
    const homeLink = document.querySelector('a[href="#home"]');
    const practiceLink = document.querySelector('a[href="#practice"]');
    const generatePractice = document.querySelector('a[href="#generatePractice"]');
    const resultLink = document.querySelector('a[href="#result"]');
    const homeSection = document.querySelector('.home');
    const practiceSection = document.querySelector('.practice');
    const resultSection = document.querySelector('.result');
    const submitButton = document.getElementById('submit-button');
    const continueButton = document.querySelector('.practice button');
    const choiceSection = document.querySelector('.choice');
    const selectAllCheckbox = document.getElementById("all");
    const backButton = document.querySelector('.button-container button[type="button"]');
    const emotionCheckboxes = document.querySelectorAll('.practice-content input[type="checkbox"]');
    const studentCheckboxes = document.querySelectorAll('.student-checkbox:checked'); // 取得已選中的學生
    const selectAllStudentsCheckbox = document.getElementById('call'); // 學生「全選」選項
    const deadlineSection = document.querySelector('.deadline');

    let selectedEmotions = []; // 儲存選擇的情緒
    let selectedStudents = []; // 儲存選擇的學生

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
                // 隱藏上滑menu並恢復原始菜單顯示
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

    // 點擊 "生成練習" 時，清空所有的 checkbox
    if (generatePractice) {
        generatePractice.addEventListener('click', function (e) {
            e.preventDefault(); // 防止默認的跳轉行為

            // 清空情緒選擇的 checkbox
            emotionCheckboxes.forEach(checkbox => {
                checkbox.checked = false;  // 取消選中
            });

            selectAllStudentsCheckbox.checked = false;
            // 清空學生選擇的 checkbox
            const studentCheckboxes = document.querySelectorAll('.student-checkbox');
            studentCheckboxes.forEach(checkbox => {
                checkbox.checked = false;  // 取消選中
            });

            // 清空截止日期的輸入欄位和無期限選項
            const deadlineInput = document.getElementById('deadline');
            const noDeadlineCheckbox = document.getElementById('no-deadline');
            deadlineInput.value = ''; // 清空日期輸入
            noDeadlineCheckbox.checked = false; // 清空「無期限」選擇

            // 顯示情緒選擇界面
            document.querySelector('.home').style.display = 'none';
            document.getElementById('exercise-chatbox').style.display = 'none';
            document.querySelector('.practice').style.display = 'flex';
            document.querySelector('.view-exercises').style.display = 'none';
            document.querySelector('.choice').style.display = 'none';
            document.querySelector('.result').style.display = 'none';
            document.querySelector('.deadline').style.display = 'none';
        });
    }

    document.querySelector('a[href="#home"], a[href="#practice"], a[href="#leave"]').addEventListener('click', function () {
        //document.getElementById('remenu').style.display = 'none';
        document.getElementById('slidemenu').style.display = 'flex';
    });

    // 點擊 "繼續" 按鈕後先處理情緒選擇
    if (continueButton && emotionCheckboxes && studentCheckboxes) {
        continueButton.addEventListener('click', function (e) {
            e.preventDefault(); // 防止默認的跳轉行為

            // 清空先前的選擇
            selectedEmotions = [];

            // 取得勾選的情緒，排除「全選」選項
            emotionCheckboxes.forEach(checkbox => {
                if (checkbox.checked && checkbox.id !== 'all') {
                    selectedEmotions.push(checkbox.value);
                }
            });

            // 如果選擇的情緒少於三個，顯示警告，並不進行下一步
            if (selectedEmotions.length < 3) {
                alert('請至少選擇三個以上的情緒');
                return; // 中斷操作
            }

            // 顯示學生選擇界面，隱藏情緒選擇界面
            practiceSection.style.display = 'none';
            choiceSection.style.display = 'flex';
        });

        loadUsers();

        // 在學生選擇完成後進行存儲
        const continuebutton = document.getElementById('continue-button'); // 確認提交按鈕
        continuebutton.addEventListener('click', function (e) {
            e.preventDefault();
            selectedStudents = [];

            const studentCheckboxes = document.querySelectorAll('.student-checkbox:checked'); // 取得已選中的學生
            // 收集選中的學生及其對應的 Firebase ID 和名字（只存 @ 前部分）
            selectedStudents = Array.from(studentCheckboxes).map(checkbox => {
                const studentId = checkbox.value;
                const studentLabel = document.querySelector(`label[for="${studentId}"]`).textContent;
                return { id: studentId, username: studentLabel };
            });
            if (selectedStudents.length === 0) {
                alert('請選擇至少一位學生');
                return;
            }

            // 隱藏學生選擇部分，顯示截止日期選擇部分
            choiceSection.style.display = 'none';
            deadlineSection.style.display = 'flex';
        });
    } else {
        console.error('Required elements for continue button or student checkboxes not found!');
    }

    // 當點擊「提交」按鈕（在選擇截止日期部分）
    submitButton.addEventListener('click', async function (e) {
        e.preventDefault();
        submitButton.disabled = true;

        // 處理截止日期選擇
        const deadlineInput = document.getElementById('deadline');
        const noDeadlineCheckbox = document.getElementById('no-deadline');
        let deadlineValue = null;

        if (!noDeadlineCheckbox.checked && deadlineInput.value) {
            deadlineValue = deadlineInput.value;
        } else if (noDeadlineCheckbox.checked) {
            deadlineValue = '無期限'; // 如果選擇無期限，設置一個標示值
        }

        // 檢查是否已選擇截止日期或無期限
        if (!deadlineValue && !noDeadlineCheckbox.checked) {
            alert('請選擇截止日期或勾選「無期限」');
            submitButton.disabled = false;
            return;
        }

        // 隨機生成一個名字
        const randomName = '某個名字';
        //const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
        const caseDescription = `請你扮演一個需要心理諮商的患者，你的名字為 ${randomName}，情緒有 ${selectedEmotions.join('、')}，根據以上情緒生成一個個案，全程使用第一人稱描述，並且不要直接將情緒寫進個案中。`;

        submitButton.textContent = '正在儲存...';

        await generateCaseAndSave(caseDescription, selectedEmotions, deadlineValue, selectedStudents);

        // 重置按鈕狀態
        submitButton.textContent = '提交';
        submitButton.disabled = false;
    });

    async function generateCaseAndSave(caseDescription, selectedEmotions, deadline, selectedStudents) {
        try {
            const apiKey = process.env.API_KEY;
            const apiURL = 'https://api.openai.com/v1/chat/completions';
            const aiResponse = await fetch(apiURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4',
                    messages: [{ role: 'system', content: caseDescription }]
                })
            });

            const data = await aiResponse.json();
            const aiGeneratedCase = data.choices && data.choices.length > 0 ? data.choices[0].message.content : null;

            if (!aiGeneratedCase) {
                alert("AI 生成個案時發生錯誤，請稍後再試");
                return;
            }

            // 生成格式化的日期時間 (YYYY-MM-DD hh:mm:ss)
            const timestamp = new Date();
            const formattedTimestamp = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')} ${String(timestamp.getHours()).padStart(2, '0')}:${String(timestamp.getMinutes()).padStart(2, '0')}:${String(timestamp.getSeconds()).padStart(2, '0')}`;

            // 儲存個案到 Firebase
            const user = auth.currentUser;
            if (user) {
                const caseRef = push(ref(database, 'emotions/' + user.uid));
                await set(caseRef, {
                    emotions: selectedEmotions,
                    description: caseDescription,
                    aiGeneratedCase: aiGeneratedCase,
                    timestamp: formattedTimestamp,
                    deadline: deadline,
                    students: selectedStudents
                });
                alert('個案已成功儲存！');

                // 提交完成後返回主頁
                deadlineSection.style.display = 'none';
                homeSection.style.display = 'flex';
            } else {
                alert("請先登入再進行操作");
            }
        } catch (error) {
            console.error("生成個案或儲存時發生錯誤:", error);
            alert("生成個案或儲存時發生錯誤");
        }
    }

    // 情緒全選
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener("change", function () {
            const checkboxes = document.querySelectorAll('.practice-content input[type="checkbox"]:not(#all)');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    } else {
        console.error('Select All checkbox element not found!');
    }

    // 學生全選
    if (selectAllStudentsCheckbox) {
        selectAllStudentsCheckbox.addEventListener('change', function () {
            const isChecked = selectAllStudentsCheckbox.checked;
            studentCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });
    } else {
        console.error('Select All checkbox for students or student checkboxes not found!');
    }

    // 上一頁
    if (backButton && practiceSection && choiceSection) {
        backButton.addEventListener('click', function () {
            practiceSection.style.display = 'flex';
            choiceSection.style.display = 'none';
        });
    } else {
        console.error('Back button or necessary sections not found!');
    }

    // 主頁
    if (homeLink && homeSection && practiceSection && resultSection && choiceSection) {
        homeLink.addEventListener('click', function (e) {
            e.preventDefault();
            homeSection.style.display = 'flex';
            document.getElementById('view-exercises-section').style.display = 'none';
            practiceSection.style.display = 'none';
            resultSection.style.display = 'none';
            choiceSection.style.display = 'none';
        });
    } else {
        console.error('Required elements not found!');
    }

    // 生成練習
    if (practiceLink && homeSection && practiceSection && resultSection && choiceSection) {
        generatePractice.addEventListener('click', function (e) {
            e.preventDefault(); // 防止默認的跳轉行為

            homeSection.style.display = 'none';
            practiceSection.style.display = 'flex';
            resultSection.style.display = 'none';
            choiceSection.style.display = 'none';
        });
    } else {
        console.error('Required elements not found!');
    }

    const exerciseDropdown = document.getElementById('exercise-dropdown');
    const reportList = document.getElementById('report-list');

    // 加載 Firebase 中的練習選項
    function loadExercises() {
        const emotionsRef = ref(database, 'emotions/Wx4ZIQxVMnYbiI2vP3H6grYWiVE3');
        onValue(emotionsRef, (snapshot) => {
            const emotionsData = snapshot.val();
            if (!emotionsData) {
                console.error("No exercises found in the database!");
                return;
            }

            // 清空下拉選單中的選項
            exerciseDropdown.innerHTML = '<option value="all">全部</option>';
            exerciseDropdown.innerHTML += '<option value="expired">已截止</option>'; // 增加「已截止」選項

            // 動態生成選項
            Object.keys(emotionsData).forEach((exerciseId, index) => {
                const option = document.createElement('option');
                option.value = exerciseId;
                option.textContent = `練習 ${index + 1}`;
                exerciseDropdown.appendChild(option);
            });
        }, (error) => {
            console.error('Error loading exercises:', error);
        });
    }

    // 監聽下拉選單的變更來過濾報告
    exerciseDropdown.addEventListener('change', function () {
        const selectedExercise = this.value;
        // 重置排序為 "時間" 並設置為升序
        document.getElementById('sort-by').value = 'time';
        document.getElementById('sort-order').dataset.order = 'asc';
        updateSortOrderIcon(); // 更新排序箭頭為朝上

        const filterStatusDropdown = document.getElementById('filter-status');
        filterStatusDropdown.value = 'unreviewed';

        if (selectedExercise === 'expired') {
            loadExpiredReports('time', 'asc', filterStatusDropdown.value); // 如果選擇的是「已截止」，則載入已截止的報告
        } else {
            console.log(selectedExercise);
            loadTeacherPracticeReports(selectedExercise, 'time', 'asc', filterStatusDropdown.value); // 加載特定練習的報告
        }
    });

    // 加載已截止的報告
    function loadExpiredReports(sortBy = 'time', sortOrder = 'asc', filterStatus) {
        console.log(filterStatus);
        const reportsRef = ref(database, 'conversations');
        off(reportsRef);
        onValue(reportsRef, (snapshot) => {
            const emotionsData = snapshot.val();
            if (!emotionsData) {
                console.error("No reports found in the database!");
                return;
            }

            let expiredReports = [];
            const currentTime = new Date();

            for (const conversationId in emotionsData) {  // 修改這裡，把 conversations 改成 emotionsData
                if (emotionsData.hasOwnProperty(conversationId)) {
                    const conversationData = emotionsData[conversationId];
                    const deadline = conversationData.deadline;

                    // Check if the conversation has a deadline and if it has expired
                    if (deadline && deadline !== '無期限') {
                        const deadlineTime = new Date(deadline);
                        if (deadlineTime < currentTime) {
                            expiredReports.push({
                                id: conversationId,
                                studentId: conversationData.userId,
                                timestamp: conversationData.timestamp,
                                isReviewed: conversationData.isReviewed,
                                content: `生成於${conversationData.timestamp}`,
                                deadline: deadline
                            });
                        }
                    }
                }
            }

            if (filterStatus === 'unreviewed') {
                expiredReports = expiredReports.filter(report => report.isReviewed === "false");
            } else if (filterStatus === 'reviewed') {
                expiredReports = expiredReports.filter(report => report.isReviewed === "true");
            }

            expiredReports = sortReports(expiredReports, sortBy, sortOrder);

            if (expiredReports.length === 0) {
                document.getElementById('report-list').innerText = `無可顯示的${filterStatus === 'unreviewed' ? '未評分' : '已評分'}報告。`;
                return;
            }
            currentReports = expiredReports;
            displayReports(currentReports, 1, 'time', 'asc', filterStatus);
        }, (error) => {
            console.error('Error loading expired reports:', error);
        });
    }

    // 修改顯示報告的邏輯以過濾特定練習的報告
    function loadTeacherPracticeReports(selectedExerciseId, sortBy = 'time', sortOrder = 'asc', filterStatus = 'unreviewed') {
        const reportList = document.getElementById('report-list');
        const reportsRef = ref(database, 'conversations');
        off(reportsRef);
        onValue(reportsRef, (snapshot) => {
            const conversations = snapshot.val();
            console.log("全部對話:", conversations);
            if (!conversations) {
                console.error("No conversations found in the database!");
                return;
            }
            currentPage = 1;
            // 過濾出 state 為 teacher-practice 的報告，並根據選擇的練習進行篩選
            let teacherPracticeReports = [];
            reportList.innerHTML = '';  // 清空報告列表
            console.log("reportList cleared"); // 調試信息
            for (const conversationId in conversations) {
                if (conversations.hasOwnProperty(conversationId)) {
                    const conversationData = conversations[conversationId];

                    // 僅篩選符合 state 的對話
                    if (conversationData.state === 'teacher-practice' &&
                        (selectedExerciseId === 'all' || selectedExerciseId === conversationData.emotionId)) {

                        teacherPracticeReports.push({
                            id: conversationId,
                            studentId: conversationData.userId,
                            timestamp: conversationData.timestamp,
                            isReviewed: conversationData.isReviewed,
                            content: `生成於 ${conversationData.timestamp}`,
                            deadline: conversationData.deadline // 如果需要使用 deadline
                        });
                    }
                }
            }

            if (filterStatus === 'unreviewed') {
                teacherPracticeReports = teacherPracticeReports.filter(report => report.isReviewed === "false");
            } else if (filterStatus === 'reviewed') {
                teacherPracticeReports = teacherPracticeReports.filter(report => report.isReviewed === "true");
            }
            if (teacherPracticeReports.length === 0) {
                reportList.innerHTML = `無可顯示的${filterStatus === 'unreviewed' ? '未評分' : '已評分'}報告。`;
                document.getElementById('page-info').innerText = '第 1 頁，共 1 頁';
                return;
            }
            console.log("teacher:", teacherPracticeReports); // 檢查抓取到的報告

            // 儲存到全域變數中
            currentReports = teacherPracticeReports;
            // 顯示報告列表
            displayReports(currentReports, 1, sortBy, sortOrder, filterStatus);
        }, (error) => {
            console.error('Error loading reports:', error);
        });
    }

    // 點擊 "老師出題" 時，載入並顯示 teacher-practice 的報告
    document.querySelector('a[href="#teacher"]').addEventListener('click', function (e) {
        e.preventDefault(); // 防止默認的跳轉行為

        // 重置下拉選單為 "全部"
        const exerciseDropdown = document.getElementById('exercise-dropdown');
        exerciseDropdown.value = 'all'; // 將下拉選單設為 "全部"

        loadTeacherPracticeReports('all'); // 加載報告
        // 初始化時下拉選單設置為未評分
        document.getElementById('filter-status').value = 'unreviewed';
        loadExercises();
        document.querySelector('.home').style.display = 'none'; // 隱藏主頁
        document.querySelector('.view-exercises').style.display = 'none';
        practiceSection.style.display = 'none';
        reportsbox.style.display = 'none';
        document.querySelector('.student-reports').style.display = 'none';
        document.querySelector('.result').style.display = 'flex'; // 顯示報告結果頁面
        document.querySelector('.studentresult').style.display = 'none';
        document.querySelector('.teacherresult').style.display = 'flex';
    });

    function showTeacherReports() {
        currentPage = 1;

        const reportList = document.getElementById('report-list');
        reportList.innerHTML = ''; // 清空報告列表

        // 重置下拉選單為 "全部"
        const exerciseDropdown = document.getElementById('exercise-dropdown');
        exerciseDropdown.value = 'all'; // 將下拉選單設為 "全部"

        loadTeacherPracticeReports('all'); // 加載報告
        document.querySelector('.home').style.display = 'none'; // 隱藏主頁
        practiceSection.style.display = 'none';
        reportsbox.style.display = 'none';
        document.querySelector('.result').style.display = 'flex'; // 顯示報告結果頁面
        document.querySelector('.studentresult').style.display = 'none';
        document.querySelector('.teacherresult').style.display = 'flex';
    }

    // 根據排序方式對報告進行排序
    function sortReports(reports, sortBy, sortOrder) {
        return reports.sort((a, b) => {
            if (sortBy === 'time') {
                // 如果 timestamp 是字串，需要轉換為 Date 物件進行比較
                const timeA = new Date(a.timestamp).getTime();
                const timeB = new Date(b.timestamp).getTime();
                return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
            } else if (sortBy === 'studentId') {
                // 根據學生 ID 排序
                const usernameA = a.studentUsername || '';
                const usernameB = b.studentUsername || '';
                return sortOrder === 'asc' ? usernameA.localeCompare(usernameB) : usernameB.localeCompare(usernameA);
            }
        });
    }

    const reportsPerPage = 2; // 每頁顯示數量

    // 顯示報告列表
    async function displayReports(reportsObj, page, sortBy = 'time', sortOrder = 'asc', filterStatus) {
        const reportList = document.getElementById('report-list');
        reportList.innerHTML = ''; // 清空列表

        let reports = Object.values(reportsObj);

        if (filterStatus === 'unreviewed') {
            reports = reports.filter(report => report.isReviewed === "false");
            console.log(reports);
        } else if (filterStatus === 'reviewed') {
            reports = reports.filter(report => report.isReviewed === "true");
            console.log(reports);
        }

        if (reports.length === 0) {
            reportList.innerText = `無可顯示的${filterStatus === 'unreviewed' ? '未評分' : '已評分'}報告。`;
            document.getElementById('page-info').innerText = '第 1 頁，共 1 頁';
            return;
        }
        for (let report of reports) {
            const userRef = ref(database, `users/${report.studentId}`);
            const userSnapshot = await get(userRef);

            let username = '未知用戶'; // 默认值
            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                username = userData.username.split('@')[0]; // 获取学号部分
            }
            report.studentUsername = username; // 将用户名添加到报告对象
        }

        reports = sortReports(reports, sortBy, sortOrder);

        const totalPages = Math.ceil(reports.length / reportsPerPage);

        if (page > totalPages) {
            page = totalPages;
        }

        const start = (page - 1) * reportsPerPage;
        const end = start + reportsPerPage;
        const reportsToShow = reports.slice(start, end);

        for (let report of reportsToShow) {
            const reportBox = document.createElement('div');
            reportBox.classList.add('report-box');
            reportBox.innerText = `學生 ${report.studentUsername} 的報告\n報告時間: ${report.timestamp}`;
            // Check if reviewed
            const statusElement = document.createElement('span');
            statusElement.classList.add('review-status');
            if (report.isReviewed === "true") {
                statusElement.innerText = '已評分';
                statusElement.style.color = 'gray'; // 已評分顯示灰色
            } else {
                statusElement.innerText = '未評分';
                statusElement.style.color = 'red'; // 未評分顯示紅色
            }
            reportBox.appendChild(statusElement);

            reportBox.addEventListener('click', () => {
                reportsbox.style.display = 'flex';  // 顯示對話框
                document.querySelector('.teacherresult').style.display = 'flex';
                displayConversationMessages(report.id);  // 調用函數抓取報告數據
            });
            reportList.appendChild(reportBox);
        }
        // 更新頁面資訊
        document.getElementById('page-info').innerText = `第 ${page} 頁，共 ${Math.ceil(reports.length / reportsPerPage)} 頁`;

        // 在每次顯示報告之後，設置分頁邏輯
        setupPagination(reports, sortBy, sortOrder);
    }


    // 監聽下拉選單變化，根據選擇的狀態篩選報告
    const filterStatusDropdown = document.getElementById('filter-status');

    // 監聽下拉選單變更事件
    if (filterStatusDropdown) {
        filterStatusDropdown.addEventListener('change', function () {
            const selectedStatus = this.value;  // 獲取下拉選單的值
            const selectedExercise = document.getElementById('exercise-dropdown').value;  // 獲取選中的練習
            const sortBy = document.getElementById('sort-by').value;  // 獲取排序方式
            const sortOrder = document.getElementById('sort-order').dataset.order;
            console.log(selectedStatus);
            console.log(selectedExercise);
            if (selectedExercise === 'expired') {
                // 如果選擇的是「已截止」，則調用 loadExpiredReports
                loadExpiredReports(sortBy, sortOrder, selectedStatus);
            } else {
                loadTeacherPracticeReports(selectedExercise, 'time', 'asc', selectedStatus);
            }
        });
    } else {
        console.error('Filter status dropdown not found!');
    }

    const reportsbox = document.querySelector('.reports');
    const reportChatboxMessages = document.getElementById('report-chatboxMessages');

    let currentReportId = null;  // 用於存儲當前報告的 ID

    // 顯示對話內容
    async function displayConversationMessages(conversationId) {
        currentReportId = conversationId;
        document.querySelector('.teacherresult').style.display = 'none';
        try {
            // 從 Firebase 資料庫中抓取該對話的所有訊息
            const messagesRef = ref(database, `conversations/${conversationId}/messages`);
            const snapshot = await get(messagesRef);

            if (snapshot.exists()) {
                const messages = snapshot.val();

                // 清空對話框中的所有訊息
                reportChatboxMessages.innerHTML = '';

                // 顯示該對話的所有訊息
                for (const messageId in messages) {
                    const message = messages[messageId];
                    appendMessageToChatbox(reportChatboxMessages, message.sender, message.content);

                    // 動態添加評語輸入框
                    const feedbackInput = document.createElement('textarea');
                    feedbackInput.rows = 2;
                    feedbackInput.placeholder = '請填寫此訊息的評語...';
                    feedbackInput.classList.add('message-feedback');
                    feedbackInput.id = `feedback-${messageId}`;
                    if (message.feedback) {
                        feedbackInput.value = message.feedback;
                    }
                    reportChatboxMessages.appendChild(feedbackInput);
                }

                // 滾動到最新的訊息
                reportChatboxMessages.scrollTop = 0;

                // 取得總評語，並填入總評語輸入框
                const totalFeedbackElement = document.getElementById('total-feedback');
                totalFeedbackElement.innerText = '';
                const summaryRef = ref(database, `conversations/${conversationId}`);
                const summarySnapshot = await get(summaryRef);
                if (summarySnapshot.exists()) {
                    const conversation = summarySnapshot.val();
                    if (conversation.summary) {
                        totalFeedbackElement.innerHTML = `${conversation.summary}`;
                    }
                }
            } else {
                console.error(`No messages found for conversation ID: ${conversationId}`);
            }
        } catch (error) {
            console.error('Error fetching conversation messages:', error);
        }
    }

    // 將訊息顯示在聊天框中
    function appendMessageToChatbox(chatboxElement, sender, text) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender);  // 根據 sender 決定訊息樣式
        messageElement.innerText = text;
        chatboxElement.appendChild(messageElement);
    }

    // 返回報告列表
    document.getElementById('return-btn').addEventListener('click', function () {
        reportsbox.style.display = 'none';
        document.querySelector('.teacherresult').style.display = 'flex';  // 顯示報告列表
    });

    document.getElementById('submit-feedback').addEventListener('click', async function (e) {
        e.preventDefault();
        const summaryFeedback = document.getElementById('total-feedback').value;
        if (!summaryFeedback.trim()) {
            alert('請填寫總評語。');
            return;
        }
        const reportList = document.getElementById('report-list');
        reportList.innerHTML = '';  // 清空報告列表
        // 取得每條訊息的評語
        const messagesRef = ref(database, `conversations/${currentReportId}/messages`);
        get(messagesRef).then((snapshot) => {
            if (snapshot.exists()) {
                const messages = snapshot.val();

                // 遍歷所有訊息並動態更新每條訊息的 feedback
                for (const messageId in messages) {
                    if (messages.hasOwnProperty(messageId)) {
                        const feedbackElements = document.querySelectorAll('.message-feedback');
                        feedbackElements.forEach(feedbackElement => {
                            const feedbackText = feedbackElement.value;  // 獲取評語文字
                            if (feedbackText) {
                                // 使用 update() 來更新每條訊息的 feedback，確保不覆蓋其他資料
                                const feedbackRef = ref(database, `conversations/${currentReportId}/messages/${messageId}`);
                                update(feedbackRef, { feedback: feedbackText }).catch((error) => {
                                    console.error(`更新訊息 ${messageId} 的評語失敗:`, error);
                                });
                            }
                        });
                    }
                }
                // 更新總評語
                const summaryRef = ref(database, `conversations/${currentReportId}`);
                update(summaryRef, { summary: summaryFeedback, isReviewed: "true" });

                alert('評語已提交');
                showTeacherReports();
                setupPagination(currentReports, 'time', 'asc');
            } else {
                console.error(`No messages found for conversation ID: ${currentReportId}`);
            }
        }).catch((error) => {
            console.error('Error fetching messages:', error);
        });
    });

    // 設置分頁功能
    function setupPagination(reports, sortBy, sortOrder) {
        const totalPages = Math.ceil(reports.length / 2);

        document.getElementById('prev-btn').onclick = () => {
            const filterStatus = document.getElementById('filter-status').value;
            if (currentPage > 1) {
                currentPage--;
                displayReports(reports, currentPage, sortBy, sortOrder, filterStatus);
            }
        };

        document.getElementById('next-btn').onclick = () => {
            const filterStatus = document.getElementById('filter-status').value;
            if (currentPage < totalPages) {
                currentPage++;
                displayReports(reports, currentPage, sortBy, sortOrder, filterStatus);
            }
        };
    }

    // 初始化頁面
    document.getElementById('sort-by').addEventListener('change', (e) => {
        const sortBy = e.target.value;

        if (sortBy === 'studentId') {
            document.getElementById('sort-order').dataset.order = 'asc';
        } else {
            document.getElementById('sort-order').dataset.order = 'asc'; // 默認為升序
        }

        updateSortOrderIcon(); // 更新排序箭頭為朝上

        currentPage = 1;
        const sortOrder = document.getElementById('sort-order').dataset.order;
        updateSortOrderIcon();
        const filterStatus = document.getElementById('filter-status').value;
        displayReports(currentReports, currentPage, sortBy, sortOrder, filterStatus); // 更新顯示
    });

    // 更新排序箭頭的顯示
    function updateSortOrderIcon() {
        const sortOrderIcon = document.getElementById('sort-order-icon');
        const sortOrder = document.getElementById('sort-order').dataset.order;

        // 根據新的排序順序來顯示對應的箭頭圖示
        if (sortOrder === 'asc') {
            sortOrderIcon.innerHTML = '&#9650;';  // 向上箭頭，代表升序
        } else {
            sortOrderIcon.innerHTML = '&#9660;';  // 向下箭頭，代表降序
        }
    }

    // 切換排序順序
    document.getElementById('sort-order').addEventListener('click', () => {
        // 取得當前的排序方式
        const currentOrder = document.getElementById('sort-order').dataset.order;

        // 切換排序順序
        const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
        document.getElementById('sort-order').dataset.order = newOrder;

        // 更新排序箭頭
        updateSortOrderIcon();

        // 取得當前的排序欄位
        const sortBy = document.getElementById('sort-by').value;
        const filterStatus = document.getElementById('filter-status').value; // 保留當前評分狀態

        // 回到第一頁，重新顯示報告
        currentPage = 1;
        displayReports(currentReports, currentPage, sortBy, newOrder, filterStatus);
    });

    // 點擊「查看出題」時顯示老師出過的題目
    document.querySelector('a[href="#viewExercises"]').addEventListener('click', function (e) {
        e.preventDefault(); // 防止默認行為

        // 顯示出題區域，隱藏其他區域
        document.querySelector('.home').style.display = 'none';
        document.getElementById('view-exercises-section').style.display = 'none';
        document.querySelector('.practice').style.display = 'none';
        document.querySelector('.choice').style.display = 'none';
        document.querySelector('.deadline').style.display = 'none';
        document.querySelector('.result').style.display = 'none';

        document.getElementById('exercise-chatbox').style.display = 'none';
        document.getElementById('view-exercises-section').style.display = 'block';
        document.getElementById('exercises-list').style.display = 'flex';
        document.querySelector('.exercise-pagination').style.display = 'flex';
        // 從 Firebase 獲取老師出題
        loadTeacherExercises();
    });

    let currentExercisePage = 1;
    const exercisesPerPage = 2;

    // 加載老師出過的題目
    function loadTeacherExercises() {
        const exercisesListDiv = document.getElementById('exercises-list');
        const exercisesRef = ref(database, 'emotions/Wx4ZIQxVMnYbiI2vP3H6grYWiVE3'); // 假設老師出題存儲在 'emotions' 節點

        onValue(exercisesRef, (snapshot) => {
            const exercises = snapshot.val();

            if (!exercises) {
                exercisesListDiv.innerHTML = '<p>暫無題目。</p>';
                return;
            }

            let allExercises = Object.keys(exercises).map((exerciseId, index) => {
                const exercise = exercises[exerciseId];
                return {
                    id: exerciseId,
                    description: exercise.aiGeneratedCase,
                    deadline: exercise.deadline,
                    studentCount: exercise.students.length,
                    index: index + 1 // 題目索引
                };
            });

            // 顯示當前頁的題目
            displayExercises(allExercises, currentExercisePage);
        }, (error) => {
            console.error('Error loading exercises:', error);
        });
    }

    function displayExercises(exercises, page) {
        const exercisesListDiv = document.getElementById('exercises-list');
        exercisesListDiv.innerHTML = ''; // 清空列表

        let exerciseobj = Object.values(exercises);
        if (exerciseobj.length == 0) {
            exercisesListDiv.innerHTML = '無可顯示的報告';
        }
        exerciseobj.sort((a, b) => a.index - b.index);

        const start = (page - 1) * exercisesPerPage;
        const end = start + exercisesPerPage;
        const exercisesToShow = exerciseobj.slice(start, end); // 取得當前頁的題目

        exercisesToShow.forEach((exercise) => {
            const exerciseDiv = document.createElement('div');
            exerciseDiv.classList.add('exercise-item');
            exerciseDiv.innerHTML = `<h3>題目 ${exercise.index}</h3>`;

            // 點擊顯示對話框並加載題目描述
            exerciseDiv.addEventListener('click', async function () {
                const chatbox = document.getElementById('exercise-chatbox');
                const chatboxMessages = document.getElementById('exercise-chatboxMessages');
                const unpracticedStudentsDiv = document.createElement('div');
                unpracticedStudentsDiv.id = 'unpracticed-students';
                chatbox.style.display = 'block'; // 顯示對話框

                const deadline = exercise.deadline ? new Date(exercise.deadline) : null;
                const formattedDeadline = deadline instanceof Date && !isNaN(deadline)
                    ? `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, '0')}-${String(deadline.getDate()).padStart(2, '0')} ${String(deadline.getHours()).padStart(2, '0')}:${String(deadline.getMinutes()).padStart(2, '0')}:${String(deadline.getSeconds()).padStart(2, '0')}`
                    : '無期限';

                chatboxMessages.innerHTML = `
                <p><strong>描述:</strong><br> ${exercise.description}</p>
                <p><strong>截止日期:</strong> ${formattedDeadline}</p>
                <p><strong>學生數:</strong> ${exercise.studentCount}</p>
                <p><strong>尚未練習的學生:</strong></p>
                `;
                chatboxMessages.appendChild(unpracticedStudentsDiv);
                // 顯示尚未練習的學生
                await showUnpracticedStudents(exercise.id);
                chatboxMessages.scrollTop = 0;
                document.getElementById('exercises-list').style.display = 'none';
                document.querySelector('.exercise-pagination').style.display = 'none';
                // 清空之前的內容，並加載新題目描述
            });

            exercisesListDiv.appendChild(exerciseDiv);
        });

        // 顯示分頁控制
        setupExercisePagination(exercises.length);
    }

    async function showUnpracticedStudents(reportId) {
        const practiceStudentsRef = ref(database, `emotions/Wx4ZIQxVMnYbiI2vP3H6grYWiVE3/${reportId}/practiceStudents`);
        const allStudentsRef = ref(database, `emotions/Wx4ZIQxVMnYbiI2vP3H6grYWiVE3/${reportId}/students`);
        const unpracticedStudentsDiv = document.getElementById('unpracticed-students');

        try {
            // 從資料庫中獲取所有學生
            const studentsSnapshot = await get(allStudentsRef);
            const students = studentsSnapshot.val();

            // 過濾出 username 以數字開頭的學生
            let studentList = [];
            for (const userId in students) {
                if (/^\d/.test(students[userId].username.split('@')[0])) {
                    studentList.push({
                        id: students[userId].id,
                        username: students[userId].username.split('@')[0]
                    });
                }
            }

            // 從資料庫中獲取已練習的學生
            const practicedSnapshot = await get(practiceStudentsRef);
            const practicedStudents = practicedSnapshot.val() || {};  // 如果為 null，則回傳空物件

            // 取得已練習的學生 ID 列表
            const practicedStudentIds = Object.values(practicedStudents).map(practiced => practiced.userId);

            // 過濾出尚未練習的學生
            const unpracticedStudents = studentList.filter(student => !practicedStudentIds.includes(student.id));

            // 將尚未練習的學生按學號進行排序
            unpracticedStudents.sort((a, b) => a.username.localeCompare(b.username, undefined, { numeric: true }));

            // 在網頁上顯示尚未練習的學生
            unpracticedStudentsDiv.innerHTML = '';  // 清空之前的內容
            if (unpracticedStudents.length === 0) {
                unpracticedStudentsDiv.textContent = '所有學生都已練習';
            } else {
                unpracticedStudents.forEach(student => {
                    const studentElement = document.createElement('p');
                    studentElement.textContent = `學生 ${student.username} 尚未練習`;
                    unpracticedStudentsDiv.appendChild(studentElement);
                });
            }
        } catch (error) {
            console.error('無法獲取未練習的學生:', error);
            unpracticedStudentsDiv.textContent = '無法加載未練習的學生';
        }
    }

    function setupExercisePagination(totalExercises) {
        const totalPages = Math.ceil(totalExercises / exercisesPerPage);

        document.getElementById('exercise-prev-btn').onclick = () => {
            if (currentExercisePage > 1) {
                currentExercisePage--;
                loadTeacherExercises(); // 重新加載當前頁的題目
            }
        };

        document.getElementById('exercise-next-btn').onclick = () => {
            if (currentExercisePage < totalPages) {
                currentExercisePage++;
                loadTeacherExercises(); // 重新加載當前頁的題目
            }
        };

        // 更新頁面資訊
        document.getElementById('exercise-page-info').innerText = `第 ${currentExercisePage} 頁，共 ${totalPages} 頁`;
    }

    document.getElementById('exercise-return-btn').addEventListener('click', function () {
        const chatbox = document.getElementById('exercise-chatbox');
        chatbox.style.display = 'none'; // 隱藏對話框
        document.getElementById('exercises-list').style.display = 'flex';
        document.querySelector('.exercise-pagination').style.display = 'flex';

    });

    // 「學生自我練習」區域的點擊事件監聽
    document.querySelector('a[href="#student"]').addEventListener('click', function (e) {
        e.preventDefault(); // 防止預設的跳轉行為

        // 重置篩選狀態為未評分
        const StufilterStatusDropdown = document.getElementById('student-filter-status');
        StufilterStatusDropdown.value = 'unreviewed';

        // 載入「學生自我練習」報告
        loadStudentPracticeReports('time', 'asc', 'unreviewed'); // 預設按時間升序排列

        // 顯示報告結果區域
        document.querySelector('.home').style.display = 'none'; // 隱藏主頁
        practiceSection.style.display = 'none';
        Stureportsbox.style.display = 'none';
        document.querySelector('.choice').style.display = 'none';
        document.querySelector('.deadline').style.display = 'none';
        document.querySelector('.view-exercises').style.display = 'none';
        document.querySelector('.result').style.display = 'flex'; // 顯示報告結果頁面
        document.querySelector('.studentresult').style.display = 'flex';
        document.querySelector('.reports').style.display = 'none';
        document.querySelector('.teacherresult').style.display = 'none';
    });

    // 載入學生自我練習報告
    function loadStudentPracticeReports(sortBy = 'time', sortOrder = 'asc', filterStatus = 'unreviewed') {
        const reportsRef = ref(database, 'conversations');
        off(reportsRef);
        onValue(reportsRef, (snapshot) => {
            const conversations = snapshot.val();
            if (!conversations) {
                console.error("未找到任何報告！");
                return;
            }

            // 過濾狀態為 'self-practice' 的對話
            let studentPracticeReports = [];
            for (const conversationId in conversations) {
                if (conversations.hasOwnProperty(conversationId)) {
                    const conversationData = conversations[conversationId];

                    // 僅包含狀態為 'self-practice' 的報告
                    if (conversationData.state === 'self-practice') {
                        studentPracticeReports.push({
                            id: conversationId,
                            studentId: conversationData.userId,
                            timestamp: conversationData.timestamp,
                            isReviewed: conversationData.isReviewed,
                            content: conversationData.messages ? conversationData.messages[Object.keys(conversationData.messages)[0]].content : '',
                        });
                    }
                }
            }
            // 根據篩選狀態過濾報告
            if (filterStatus === 'unreviewed') {
                studentPracticeReports = studentPracticeReports.filter(report => report.isReviewed === "false");
            } else if (filterStatus === 'reviewed') {
                studentPracticeReports = studentPracticeReports.filter(report => report.isReviewed === "true");
            }

            // 儲存報告到全域變數
            currentReports = studentPracticeReports;

            // 顯示報告
            displayStudentReports(currentReports, 1, sortBy, sortOrder, filterStatus);
        }, (error) => {
            console.error('載入學生自我練習報告時發生錯誤：', error);
        });
    }

    // 監聽評分狀態的變更事件
    const StufilterStatusDropdown = document.getElementById('student-filter-status');
    StufilterStatusDropdown.addEventListener('change', function () {
        const selectedStatus = this.value;  // 獲取下拉選單的值
        studentCurrentPage = 1;
        loadStudentPracticeReports('time', 'asc', selectedStatus);
    });

    // 顯示學生自我練習報告
    async function displayStudentReports(reportsObj, page, sortBy = 'time', sortOrder = 'asc', filterStatus) {
        const studentReportList = document.getElementById('student-report-list');
        studentReportList.innerHTML = ''; // 清空列表

        let reports = Object.values(reportsObj);

        reports = reports.filter(report => {
            return filterStatus === 'unreviewed' ? report.isReviewed === "false" : report.isReviewed === "true";
        });

        if (reports.length === 0) {
            studentReportList.innerText = `無可顯示的${filterStatus === 'unreviewed' ? '未評分' : '已評分'}報告。`
            document.getElementById('student-page-info').innerText = '第 1 頁，共 1 頁';
            return;
        }

        // 取得學生的名字
        for (let report of reports) {
            const userRef = ref(database, `users/${report.studentId}`);
            const userSnapshot = await get(userRef);

            let username = '未知用戶'; // 預設值
            if (userSnapshot.exists()) {
                const userData = userSnapshot.val();
                username = userData.username.split('@')[0]; // 取 @ 前部分
            }
            report.studentUsername = username; // 將學生名字添加到報告對象
        }

        // 排序報告
        reports = sortReports(reports, sortBy, sortOrder);

        const reportsPerPage = 2; // 每頁顯示的報告數量
        const totalPages = Math.ceil(reports.length / reportsPerPage);

        if (page > totalPages) {
            page = totalPages;
        }

        const start = (page - 1) * reportsPerPage;
        const end = start + reportsPerPage;
        const reportsToShow = reports.slice(start, end);

        // 顯示報告
        reportsToShow.forEach(report => {
            const reportBox = document.createElement('div');
            reportBox.classList.add('report-box');
            reportBox.innerText = `學生 ${report.studentUsername} 的報告\n報告時間: ${report.timestamp}`;

            // Check if reviewed
            const statusElement = document.createElement('span');
            statusElement.classList.add('review-status');
            if (report.isReviewed === "true") {
                statusElement.innerText = '已評分';
                statusElement.style.color = 'gray'; // 已評分顯示灰色
            } else {
                statusElement.innerText = '未評分';
                statusElement.style.color = 'red'; // 未評分顯示紅色
            }
            reportBox.appendChild(statusElement);

            reportBox.addEventListener('click', () => {
                Stureportsbox.style.display = 'flex';  // 顯示對話框
                displayStuConversationMessages(report.id);  // 調用函數抓取報告數據
            });

            studentReportList.appendChild(reportBox);
        });
        // 更新頁面資訊
        document.getElementById('student-page-info').innerText = `第 ${page} 頁，共 ${totalPages} 頁`;

        // 設置分頁
        setupStudentPagination(reports, sortBy, sortOrder);
    }

    const Stureportsbox = document.querySelector('.student-reports');
    const StureportChatboxMessages = document.getElementById('student-report-chatboxMessages');
    let studentCurrentReportId = null;
    // 顯示對話內容
    async function displayStuConversationMessages(conversationId) {
        studentCurrentReportId = conversationId;
        document.querySelector('.studentresult').style.display = 'none';
        try {
            // 從 Firebase 資料庫中抓取該對話的所有訊息
            const messagesRef = ref(database, `conversations/${conversationId}/messages`);
            const snapshot = await get(messagesRef);

            if (snapshot.exists()) {
                const messages = snapshot.val();

                // 清空對話框中的所有訊息
                StureportChatboxMessages.innerHTML = '';

                // 顯示該對話的所有訊息
                for (const messageId in messages) {
                    const message = messages[messageId];
                    appendMessageToChatbox(StureportChatboxMessages, message.sender, message.content);

                    // 動態添加評語輸入框
                    const feedbackInput = document.createElement('textarea');
                    feedbackInput.rows = 2;
                    feedbackInput.placeholder = '請填寫此訊息的評語...';
                    feedbackInput.classList.add('student-message-feedback');
                    feedbackInput.id = `feedback-${messageId}`;
                    if (message.feedback) {
                        feedbackInput.value = message.feedback;
                    }
                    StureportChatboxMessages.appendChild(feedbackInput);
                }

                // 滾動到最新的訊息
                StureportChatboxMessages.scrollTop = 0;

                // 取得總評語，並填入總評語輸入框
                const summaryRef = ref(database, `conversations/${conversationId}/summary`);
                get(summaryRef).then((summarySnapshot) => {
                    if (summarySnapshot.exists()) {
                        document.getElementById('student-total-feedback').value = summarySnapshot.val();
                    }
                });
            } else {
                console.error(`No messages found for conversation ID: ${conversationId}`);
            }
        } catch (error) {
            console.error('Error fetching conversation messages:', error);
        }
    }

    // 返回報告列表
    document.getElementById('student-return-btn').addEventListener('click', function () {
        Stureportsbox.style.display = 'none'; // 隱藏對話框
        document.querySelector('.studentresult').style.display = 'flex';  // 顯示學生自我練習的報告列表
    });


    document.getElementById('student-submit-feedback').addEventListener('click', async function (e) {
        e.preventDefault();
        const summaryFeedback = document.getElementById('student-total-feedback').value;
        if (!summaryFeedback.trim()) {
            alert('請填寫總評語。');
            return;
        }
        const reportList = document.getElementById('student-report-list');
        reportList.innerHTML = '';  // 清空報告列表
        // 取得每條訊息的評語
        const messagesRef = ref(database, `conversations/${studentCurrentReportId}/messages`);
        get(messagesRef).then((snapshot) => {
            if (snapshot.exists()) {
                const messages = snapshot.val();

                // 遍歷所有訊息並動態更新每條訊息的 feedback
                for (const messageId in messages) {
                    if (messages.hasOwnProperty(messageId)) {
                        const feedbackText = document.getElementById(`feedback-${messageId}`).value;
                        const feedbackRef = ref(database, `conversations/${studentCurrentReportId}/messages/${messageId}`);
                        update(feedbackRef, { feedback: feedbackText });
                    }
                }
                // 更新總評語
                const summaryRef = ref(database, `conversations/${studentCurrentReportId}`);
                update(summaryRef, { summary: summaryFeedback, isReviewed: "true" }).then(() => {

                    alert('評語已提交');
                    studentCurrentPage = 1;
                    const filterStatus = document.getElementById('student-filter-status').value;
                    console.log(filterStatus);
                    Stureportsbox.style.display = 'none'; // 隱藏對話框
                    document.querySelector('.studentresult').style.display = 'flex';
                    loadStudentPracticeReports('time', 'asc', filterStatus);
                }).catch((error) => {
                    console.error('更新評語時發生錯誤：', error);
                });
            } else {
                console.error(`No messages found for conversation ID: ${studentCurrentReportId}`);
            }
        }).catch((error) => {
            console.error('Error fetching messages:', error);
        });
    });

    let studentCurrentPage = 1;  // 初始化學生報告的當前頁碼

    // 設置學生報告的分頁功能
    function setupStudentPagination(reports, sortBy, sortOrder) {
        const totalPages = Math.ceil(reports.length / 2);

        document.getElementById('student-prev-btn').onclick = () => {
            const filterStatus = document.getElementById('student-filter-status').value;
            if (studentCurrentPage > 1) {
                studentCurrentPage--;
                displayStudentReports(reports, studentCurrentPage, sortBy, sortOrder, filterStatus);
            }
        };

        document.getElementById('student-next-btn').onclick = () => {
            const filterStatus = document.getElementById('student-filter-status').value;
            if (studentCurrentPage < totalPages) {
                studentCurrentPage++;
                displayStudentReports(reports, studentCurrentPage, sortBy, sortOrder, filterStatus);
            }
        };
    }

    document.getElementById('student-sort-by').addEventListener('change', (e) => {
        const sortBy = e.target.value;

        // 默認設置排序順序為升序
        document.getElementById('student-sort-order').dataset.order = 'asc';
        updateStudentSortOrderIcon();

        studentCurrentPage = 1;
        const sortOrder = document.getElementById('student-sort-order').dataset.order;
        const filterStatus = document.getElementById('student-filter-status').value;
        displayStudentReports(currentReports, studentCurrentPage, sortBy, sortOrder, filterStatus); // 更新顯示
    });

    // 更新排序箭頭的顯示
    function updateStudentSortOrderIcon() {
        const sortOrderIcon = document.getElementById('student-sort-order-icon');
        const sortOrder = document.getElementById('student-sort-order').dataset.order;

        if (sortOrder === 'asc') {
            sortOrderIcon.innerHTML = '&#9650;';  // 向上箭頭，代表升序
        } else {
            sortOrderIcon.innerHTML = '&#9660;';  // 向下箭頭，代表降序
        }
    }

    // 切換排序順序
    document.getElementById('student-sort-order').addEventListener('click', () => {
        console.log('click');
        const currentOrder = document.getElementById('student-sort-order').dataset.order;

        // 切換排序順序
        const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
        document.getElementById('student-sort-order').dataset.order = newOrder;

        // 更新排序箭頭
        updateStudentSortOrderIcon();

        // 取得當前的排序欄位
        const sortBy = document.getElementById('student-sort-by').value;
        const filterStatus = document.getElementById('student-filter-status').value;

        // 回到第一頁，重新顯示報告
        studentCurrentPage = 1;
        displayStudentReports(currentReports, studentCurrentPage, sortBy, newOrder, filterStatus);
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
