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

  // Get today's date
  const today = new Date().toISOString().split("T")[0];

  // Get user and flight data
  const user = auth.currentUser;
  const username = user?.email || "Unknown";

  // Header text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 255); // Blue
  doc.text("Najaf International Airport", 148, 12, { align: "center" });
  doc.text("Apron Operation Section / Aircraft Coordination Unit", 148, 20, { align: "center" });

  // Date (Top left)
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Date: ${today}`, 10, 10);

  const cards = document.querySelectorAll(".card");
  const tableData = [];

  cards.forEach((card, index) => {
    const inputs = card.querySelectorAll("input, textarea");
    const row = {};
    inputs.forEach((input) => {
      row[input.name] = input.value.trim();
    });
    if (Object.values(row).some(val => val)) {
      tableData.push([
        row.date || "",
        row.flightNo || "",
        row.onChocks || "",
        row.openDoor || "",
        row.startCleaning || "",
        row.completeCleaning || "",
        row.readyBoarding || "",
        row.startBoarding || "",
        row.completeBoarding || "",
        row.closeDoor || "",
        row.offChocks || ""
      ]);
    }
  });

  const tableHeaders = [[
    "Date",
    "FLT.NO",
    "ON Chocks",
    "Open Door",
    "Start Cleaning",
    "Complete Cleaning",
    "Ready Boarding",
    "Start Boarding",
    "Complete Boarding",
    "Close Door",
    "Off Chocks"
  ]];

  // Add table
  doc.autoTable({
    head: tableHeaders,
    body: tableData,
    startY: 30,
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 2,
      overflow: "linebreak"
    },
    headStyles: {
      fillColor: [0, 64, 128],
      textColor: 255,
      halign: "center"
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 20 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 25 },
      6: { cellWidth: 25 },
      7: { cellWidth: 25 },
      8: { cellWidth: 25 },
      9: { cellWidth: 25 },
      10: { cellWidth: 25 }
    }
  });

  // Name and Notes at bottom
  const lastY = doc.autoTable.previous.finalY || 30;
  const lastCard = cards[0]; // Assuming same user for 5 flights
  const name = lastCard?.querySelector("[name='name']")?.value.trim() || "";
  const notes = lastCard?.querySelector("[name='notes']")?.value.trim() || "";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Name: ${name}`, 10, lastY + 10);
  doc.text(`Notes: ${notes}`, 10, lastY + 18);

  doc.save("flights.pdf");
};
