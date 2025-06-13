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
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4"
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // رأس الصفحة
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 139); // أزرق غامق
  doc.text("مطار النجف الأشرف الدولي", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setFontSize(12);
  doc.text("قسم عمليات ساحة الطيران / شعبة تنسيق الطائرات", pageWidth / 2, y, { align: "center" });

  // التاريخ في أعلى اليسار
  const today = new Date().toLocaleDateString('ar-EG');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text(`التاريخ: ${today}`, 10, 12);

  // إعدادات الجدول
  y += 10;
  const headers = [
    "Date", "FLT.NO", "ON Chocks", "Open Door", "Start Cleaning", "Complete Cleaning",
    "Ready Boarding", "Start Boarding", "Complete Boarding", "Close Door", "Off Chocks"
  ];
  const colWidths = 26;
  const startX = 10;

  // رسم رأس الجدول
  headers.forEach((header, i) => {
    doc.setFillColor(220, 230, 241); // لون خلفية العناوين
    doc.rect(startX + i * colWidths, y, colWidths, 10, "F");
    doc.setTextColor(0);
    doc.setFontSize(9);
    doc.text(header, startX + i * colWidths + 2, y + 7);
  });

  y += 11;

  // جلب بيانات الرحلات
  const cards = document.querySelectorAll(".card");
  cards.forEach((card, index) => {
    const inputs = card.querySelectorAll("input");
    let x = startX;

    inputs.forEach((input, i) => {
      if (input.name === "notes" || input.name === "name") return; // نخليهم تحت
      doc.setFontSize(8);
      doc.text(input.value || "-", x + 2, y + 6);
      doc.rect(x, y, colWidths, 10);
      x += colWidths;
    });

    y += 11;
  });

  // إضافة الاسم والملاحظات في الأسفل
  let notes = "";
  let name = "";
  const lastCard = cards[0];
  if (lastCard) {
    notes = lastCard.querySelector("[name='notes']")?.value || "";
    name = lastCard.querySelector("[name='name']")?.value || "";
  }

  doc.setFontSize(10);
  y += 5;
  doc.text(`Name: ${name}`, 10, y + 5);
  doc.text(`Notes: ${notes}`, 10, y + 12);

  // حفظ الملف
  doc.save("flights.pdf");
};
