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

  const user = auth.currentUser;
  if (!user) {
    alert("User not logged in");
    return;
  }

  const date = new Date().toLocaleDateString();
  const cards = document.querySelectorAll(".card");

  // Header
  doc.setFontSize(16);
  doc.text("Najaf International Airport", 148, 15, { align: "center" });
  doc.setFontSize(12);
  doc.text("Apron Operations Department / Aircraft Coordination Section", 148, 23, { align: "center" });

  // Date and user
  doc.setFontSize(10);
  doc.text(`Date: ${date}`, 10, 15);
  doc.text(`User: ${user.email}`, 10, 20);

  const tableHeaders = [
    "Date", "FLT.NO", "ON chocks", "Open Door", "Start Cleaning",
    "Complete Cleaning", "Ready Boarding", "Start Boarding",
    "Complete Boarding", "Close Door", "Off chocks"
  ];

  let startY = 30;
  const rowHeight = 10;
  const colWidth = 27;
  const maxRowsPerPage = 5;

  // Draw headers
  doc.setFontSize(10);
  tableHeaders.forEach((header, i) => {
    doc.setFillColor(200, 220, 255);
    doc.rect(10 + i * colWidth, startY, colWidth, rowHeight, "F");
    doc.text(header, 10 + i * colWidth + 2, startY + 7);
  });

  startY += rowHeight;

  let flightIndex = 0;

  cards.forEach((card, idx) => {
    const inputs = card.querySelectorAll("input");
    const textarea = card.querySelector("textarea");
    let data = {};

    inputs.forEach(input => {
      data[input.name] = input.value.trim();
    });
    data.notes = textarea ? textarea.value.trim() : "";

    if (!data.flightNo && !data.date) return; // Skip empty rows

    if (flightIndex >= maxRowsPerPage) {
      doc.addPage();
      startY = 30;

      // Redraw headers
      tableHeaders.forEach((header, i) => {
        doc.setFillColor(200, 220, 255);
        doc.rect(10 + i * colWidth, startY, colWidth, rowHeight, "F");
        doc.text(header, 10 + i * colWidth + 2, startY + 7);
      });

      startY += rowHeight;
      flightIndex = 0;
    }

    // Draw data row
    const values = [
      data.date || "", data.flightNo || "", data.onChocks || "",
      data.openDoor || "", data.startCleaning || "", data.completeCleaning || "",
      data.readyBoarding || "", data.startBoarding || "", data.completeBoarding || "",
      data.closeDoor || "", data.offChocks || ""
    ];

    values.forEach((value, i) => {
      doc.rect(10 + i * colWidth, startY, colWidth, rowHeight);
      doc.text(value, 10 + i * colWidth + 2, startY + 7);
    });

    // Notes
    doc.setFontSize(9);
    doc.text(`Name: ${data.name || ""}`, 10, startY + rowHeight + 5);
    doc.text(`Notes: ${data.notes || ""}`, 10, startY + rowHeight + 10);

    startY += rowHeight + 15;
    flightIndex++;
  });

  doc.save("flights.pdf");
};
