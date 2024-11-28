// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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

//註冊
document.getElementById("submitForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, username, password);
        const user = userCredential.user;

        // 將使用者資訊儲存到 Realtime Database
        await set(ref(database, 'users/' + user.uid), {
            username: username,
            password: password
        });

        console.log("使用者註冊成功並儲存至資料庫:", user.uid);
        console.log("使用者註冊成功:", userCredential.user);
        alert("註冊成功！請重新登入");
        window.location.href = "login.html";
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            alert('這個帳號已經註冊過了。請使用其他的電子郵件地址。');
        } else {
            console.error("註冊錯誤:", error.message);
            alert('註冊過程中發生錯誤：' + error.message);
        }
    }
});