// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

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

//登入
document.getElementById("submitForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    try {
        const userCredential = await signInWithEmailAndPassword(auth, username, password);
        console.log("使用者登入成功:", userCredential.user);

        const userEmail = userCredential.user.email;
        if (userEmail && /^[a-zA-Z]/.test(userEmail.charAt(0))) {
            window.location.replace('teacher.html');
        } else {
            window.location.href = "student.html";
        }
    } catch (error) {
        console.error("登入錯誤代碼:", error.code);
        console.error("登入錯誤訊息:", error.message);

        if (error.code === 'auth/user-not-found') {
            alert('此帳號尚未註冊。請檢查電子郵件或註冊新帳號。');
        } else if (error.code === 'auth/wrong-password') {
            alert('密碼錯誤。請檢查您的密碼或重設密碼。');
        } else {
            alert(`登入失敗: ${error.message}`);
        }
    }

});

document.getElementById("forgotPasswordButton").addEventListener('click', () => {
    const email = prompt('請輸入您的電子郵件以重設密碼：');
    if (email) {
        sendPasswordResetEmail(auth, email)
            .then(() => {
                alert('密碼重置郵件已發送，請檢查您的信箱。');
            })
            .catch((error) => {
                console.error(error);
                alert('發送失敗：' + error.message);
            });
    }
});