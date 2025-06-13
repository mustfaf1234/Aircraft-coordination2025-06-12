// app.js (مُحدث)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqOK8dAsYVd3G5kv6rFbrkDfLhmgFOXAU",
  authDomain: "flight-scheduler-3daea.firebaseapp.com",
  projectId: "flight-scheduler-3daea",
  storageBucket: "flight-scheduler-3daea.appspot.com",
  messagingSenderId: "1036581965112",
  appId: "1:1036581965112:web:0bd21e436764ea4294c5cd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// تسجيل الدخول
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "flights.html";
  } catch (error) {
    alert("فشل تسجيل الدخول: " + error.message);
  }
};

// تسجيل الخروج
window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};

// تحديد صلاحية المشرف
const adminEmail = "ahmedaltalqani@gmail.com";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    const usernameEl = document.getElementById("username");
    if (usernameEl) usernameEl.textContent = user.email;

    if (user.email === adminEmail && window.location.pathname.includes("flights.html")) {
      window.location.href = "admin.html";
    }

    if (window.location.pathname.includes("flights.html")) {
      renderFlightCards();
      restoreCachedFlights();
    }
  }
});

// إنشاء بطاقات الرحلات
function renderFlightCards() {
  const fields = [
    { key: 'date', label: 'التاريخ' },
    { key: 'flightNo', label: 'FLT.NO' },
    { key: 'onChocks', label: 'ON chocks' },
    { key: 'openDoor', label: 'Open Door' },
    { key: 'startCleaning', label: 'Start Cleaning' },
    { key: 'completeCleaning', label: 'Complete Cleaning' },
    { key: 'readyBoarding', label: 'Ready Boarding' },
    { key: 'startBoarding', label: 'Start Boarding' },
    { key: 'completeBoarding', label: 'Complete Boarding' },
    { key: 'closeDoor', label: 'Close Door' },
    { key: 'offChocks', label: 'Off chocks' },
    { key: 'name', label: 'الاسم' },
    { key: 'notes', label: 'ملاحظات', type: 'textarea' }
  ];

  const cardsContainer = document.getElementById("cards");
  if (!cardsContainer) return;

  for (let i = 0; i < 5; i++) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h4>الرحلة ${i + 1}</h4>`;

    fields.forEach(field => {
      const group = document.createElement("div");
      group.className = "form-group";
      const label = document.createElement("label");
      label.textContent = field.label;
      const input = field.type === 'textarea' ? document.createElement("textarea") : document.createElement("input");
      input.name = field.key;
      input.dataset.row = i;
      group.appendChild(label);
      group.appendChild(input);
      card.appendChild(group);
    });

    cardsContainer.appendChild(card);
  }
}

// استرجاع الحقول من التخزين المؤقت
function restoreCachedFlights() {
  const cachedData = localStorage.getItem("cachedFlights");
  if (!cachedData) return;
  const parsed = JSON.parse(cachedData);
  parsed.forEach((entry, index) => {
    for (const key in entry) {
      const input = document.querySelector(`.card:nth-child(${index + 1}) [name='${key}']`);
      if (input) input.value = entry[key];
    }
  });
}

// حفظ الرحلات
window.saveFlights = async function () {
  const user = auth.currentUser;
  if (!user) return;

  const cards = document.querySelectorAll(".card");
  let savedCount = 0;
  const allData = [];

  for (let card of cards) {
    const inputs = card.querySelectorAll("input, textarea");
    const data = {};
    let isFilled = false;

    inputs.forEach((input) => {
      const value = input.value.trim();
      data[input.name] = value;
      if (value !== "") isFilled = true;
    });

    if (!isFilled) continue;
    data.createdBy = user.email;
    data.createdAt = serverTimestamp();
    allData.push(data);

    try {
      await addDoc(collection(db, "flights"), data);
      savedCount++;
    } catch (err) {
      console.error("فشل في الحفظ:", err);
    }
  }

  if (savedCount > 0) {
    localStorage.removeItem("cachedFlights");
    alert(`✅ تم حفظ ${savedCount} رحلة`);
  } else {
    localStorage.setItem("cachedFlights", JSON.stringify(allData));
    alert("⚠️ تم حفظ الرحلات مؤقتًا لعدم توفر الاتصال بالإنترنت. سيتم حفظها عند توفر الإنترنت.");
  }
};

// تصدير إلى PDF
window.exportToPDF = function () {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // البيانات النموذجية للرحلات
  const flights = [
    {
      date: "2025-06-11", flightNo: "IA123", onChocks: "10:00", openDoor: "10:05", startCleaning: "10:10",
      completeCleaning: "10:30", readyBoarding: "10:40", startBoarding: "10:45", completeBoarding: "11:00",
      closeDoor: "11:10", offChocks: "11:20"
    },
    {
      date: "2025-06-11", flightNo: "QR456", onChocks: "12:00", openDoor: "12:05", startCleaning: "12:10",
      completeCleaning: "12:25", readyBoarding: "12:40", startBoarding: "12:50", completeBoarding: "13:00",
      closeDoor: "13:05", offChocks: "13:15"
    },
    {
      date: "2025-06-11", flightNo: "EK789", onChocks: "14:00", openDoor: "14:10", startCleaning: "14:15",
      completeCleaning: "14:35", readyBoarding: "14:50", startBoarding: "15:00", completeBoarding: "15:20",
      closeDoor: "15:25", offChocks: "15:35"
    },
    {
      date: "2025-06-11", flightNo: "BA987", onChocks: "16:00", openDoor: "16:05", startCleaning: "16:10",
      completeCleaning: "16:30", readyBoarding: "16:45", startBoarding: "16:50", completeBoarding: "17:00",
      closeDoor: "17:05", offChocks: "17:15"
    },
    {
      date: "2025-06-11", flightNo: "LH321", onChocks: "18:00", openDoor: "18:05", startCleaning: "18:15",
      completeCleaning: "18:35", readyBoarding: "18:45", startBoarding: "18:50", completeBoarding: "19:10",
      closeDoor: "19:15", offChocks: "19:25"
    }
  ];

  const headers = [
    "Date", "FLT.NO", "ON Chocks", "Open Door", "Start Cleaning",
    "Complete Cleaning", "Ready Boarding", "Start Boarding",
    "Complete Boarding", "Close Door", "Off Chocks"
  ];

  // إعداد العنوان
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("AL-NAJAF AL-ASHRAF INTERNATIONAL AIRPORT", 148, 15, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(0, 102, 204);
  doc.text("Apron Operations Department / Aircraft Coordination Unit", 148, 22, { align: "center" });

  doc.setTextColor(0);
  doc.setFontSize(9);

  // رأس الجدول
  const startX = 10;
  const startY = 30;
  const rowHeight = 8;
  const colWidth = 27;

  headers.forEach((header, i) => {
    doc.rect(startX + i * colWidth, startY, colWidth, rowHeight);
    doc.text(header, startX + i * colWidth + 1, startY + 5);
  });

  // بيانات الرحلات
  flights.forEach((flight, rowIndex) => {
    const rowY = startY + rowHeight * (rowIndex + 1);
    const values = Object.values(flight);
    values.forEach((val, colIndex) => {
      doc.rect(startX + colIndex * colWidth, rowY, colWidth, rowHeight);
      doc.text(String(val), startX + colIndex * colWidth + 1, rowY + 5);
    });
  });

  // خانات الاسم والملاحظات
  const endY = startY + rowHeight * (flights.length + 1) + 10;
  doc.text("Name:", 10, endY);
  doc.text("Notes:", 10, endY + 7);

  // حفظ
  doc.save("flight_schedule.pdf");
};
