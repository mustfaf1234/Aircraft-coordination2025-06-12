// js/admin.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// إعداد Firebase - المشروع الجديد
const firebaseConfig = {
  apiKey: "AIzaSyAiU4-PvYgqnWbVLgISz73P9D4HaSIhW-o",
  authDomain: "abcd-3b894.firebaseapp.com",
  projectId: "abcd-3b894",
  storageBucket: "abcd-3b894.appspot.com",
  messagingSenderId: "41388459465",
  appId: "1:41388459465:web:9c67ef67f0ad4810e55418"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const adminEmail = "ahmedaltalqani@gmail.com";

// التحقق من صلاحية الدخول
onAuthStateChanged(auth, async (user) => {
  if (!user || user.email !== adminEmail) {
    alert("❌ ليس لديك صلاحية دخول لوحة الإدارة.");
    window.location.href = "index.html";
    return;
  }

  document.getElementById("username").textContent = `مرحباً، ${user.email}`;
  await loadMonthlyCounts();
  await loadAllFlights();
});

// زر تسجيل الخروج
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};

// تحميل إحصائيات الرحلات شهرياً
async function loadMonthlyCounts() {
  const flightsRef = collection(db, "flights");
  const snapshot = await getDocs(flightsRef);

  const counts = {};

  snapshot.forEach(doc => {
    const data = doc.data();
    const email = data.createdBy;
    const date = data.date || "";
    const month = date.split("-")[1] || "غير محدد";

    if (!counts[email]) counts[email] = {};
    if (!counts[email][month]) counts[email][month] = 0;
    counts[email][month]++;
  });

  const container = document.getElementById("monthlyCounts");
  container.innerHTML = "";
  for (const email in counts) {
    const userDiv = document.createElement("div");
    userDiv.innerHTML = `<h4>${email}</h4>`;
    for (const month in counts[email]) {
      const p = document.createElement("p");
      p.textContent = `شهر ${month}: ${counts[email][month]} رحلة`;
      userDiv.appendChild(p);
    }
    container.appendChild(userDiv);
  }
}

// تحميل جميع الرحلات
async function loadAllFlights() {
  const flightsRef = collection(db, "flights");
  const snapshot = await getDocs(flightsRef);
  const container = document.getElementById("allFlightsList");
  container.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();
    const div = document.createElement("div");
    div.className = "flight-item";
    div.innerHTML = `
      <strong>المستخدم:</strong> ${data.createdBy}<br>
      <strong>التاريخ:</strong> ${data.date || "-"}<br>
      <strong>رقم الرحلة:</strong> ${data.flightNo || "-"}<br>
      <strong>ملاحظات:</strong> ${data.notes || "-"}
      <hr>
    `;
    container.appendChild(div);
  });
}

// تصدير PDF للإحصائيات بدون خط خارجي
window.exportAdminPDF = function () {
  const container = document.getElementById("monthlyCounts");
  const text = container.innerText || "لا توجد بيانات.";

  const docDefinition = {
    content: [
      { text: "إحصائيات الرحلات حسب المستخدم", style: "header" },
      { text: text, style: "body" }
    ],
    defaultStyle: {
      fontSize: 12,
      alignment: "right"
    },
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      body: { fontSize: 12 }
    }
  };

  pdfMake.createPdf(docDefinition).download("إحصائيات_الرحلات.pdf");
};
