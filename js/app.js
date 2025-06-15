// js/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import * as docx from "https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.js";

// إعدادات Firebase
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

// تسجيل الدخول
export async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "flights.html";
  } catch (err) {
    alert("فشل تسجيل الدخول: " + err.message);
  }
}
window.login = login;

// تسجيل الخروج
export function logout() {
  signOut(auth).then(() => window.location.href = "index.html");
}
window.logout = logout;

// مراقبة المستخدم (وحماية صفحات المسؤول)
onAuthStateChanged(auth, (user) => {
  if (!user) return;
  const name = localStorage.getItem("userFullName") || user.email;
  const path = window.location.pathname;
  if (user.email === adminEmail && path.includes("flights")) {
    window.location.href = "admin.html";
  }
  const usernameEl = document.getElementById("username");
  if (usernameEl) usernameEl.textContent = name;
  if (path.includes("flights")) {
    renderFlightCards();
    setUserName();
    loadPreviousFlights();
  }
});

function renderFlightCards() {
  const fields = [
    'date', 'flightNo', 'onChocks', 'openDoor', 'startCleaning', 'completeCleaning',
    'readyBoarding', 'startBoarding', 'completeBoarding', 'closeDoor', 'offChocks',
    'name', 'notes'
  ];
  const labels = {
    date: 'Date', flightNo: 'FLT.NO', onChocks: 'On Chocks Time', openDoor: 'Open Door Time',
    startCleaning: 'Start Cleaning Time', completeCleaning: 'Complete Cleaning Time',
    readyBoarding: 'Ready Boarding Time', startBoarding: 'Start Boarding Time',
    completeBoarding: 'Complete Boarding Time', closeDoor: 'Close Door Time',
    offChocks: 'Off Chocks Time', name: 'Name', notes: 'Notes'
  };
  const container = document.getElementById("cards");
  if (!container) return;
  container.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const card = document.createElement("div");
    card.className = "card flight-card";
    card.innerHTML = `<h4>Flight ${i + 1}</h4>`;
    fields.forEach(f => {
      const label = document.createElement("label");
      label.textContent = labels[f];
      const input = f === 'notes' ? document.createElement("textarea") : document.createElement("input");
      input.name = f;
      if (f === 'date') input.type = 'date';
      if (f === 'name') input.readOnly = true;
      card.appendChild(label);
      card.appendChild(input);
    });
    container.appendChild(card);
  }
}

function setUserName() {
  let name = localStorage.getItem("userFullName");
  if (!name) {
    name = prompt("يرجى إدخال اسمك الكامل:");
    if (!name) {
      alert("الاسم مطلوب.");
      location.reload();
    }
    localStorage.setItem("userFullName", name);
  }
  document.querySelectorAll("input[name='name']").forEach(input => input.value = name);
}

window.saveAndExport = async function () {
  const user = auth.currentUser;
  if (!user) return;
  const username = localStorage.getItem("userFullName") || user.email;
  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-EG");
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const cards = document.querySelectorAll(".flight-card");
  if (cards.length === 0) {
    alert("لا توجد رحلات لإصدارها.");
    return;
  }
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType } = docx;
  const headers = [
    "FLT.NO", "ON chocks", "Open Door", "Start Cleaning", "Complete Cleaning",
    "Ready Boarding", "Start Boarding", "Complete Boarding", "Close Door", "Off chocks", "ملاحظات"
  ];
  const rows = [
    new TableRow({
      children: headers.map(h => new TableCell({
        children: [new Paragraph({ text: h, alignment: AlignmentType.CENTER, bold: true })],
        width: { size: 10, type: WidthType.PERCENTAGE }
      }))
    })
  ];

  let saved = 0;
  for (let i = 0; i < cards.length; i++) {
    const inputs = cards[i].querySelectorAll("input, textarea");
    const data = {};
    inputs.forEach(input => data[input.name] = input.value.trim());
    if (!data.date || !username) continue;
    data.createdAt = serverTimestamp();
    data.createdBy = user.email;
    await setDoc(doc(db, `flights/${month}/${username}_${Date.now()}_${i}`), data);
    saved++;
    rows.push(new TableRow({
      children: [
        data.flightNo, data.onChocks, data.openDoor, data.startCleaning, data.completeCleaning,
        data.readyBoarding, data.startBoarding, data.completeBoarding, data.closeDoor,
        data.offChocks, data.notes
      ].map(val => new TableCell({
        children: [new Paragraph({ text: val || "", alignment: AlignmentType.CENTER })],
        width: { size: 10, type: WidthType.PERCENTAGE }
      }))
    }));
  }

  const docFile = new Document({
    sections: [{
      properties: { page: { size: { orientation: "landscape" } } },
      children: [
        new Paragraph({
          children: [new TextRun({ text: "Najaf International Airport", bold: true, size: 32 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "", spacing: { after: 100 } }),
        new Paragraph({
          children: [new TextRun({ text: `التاريخ: ${dateStr}`, size: 24 })],
          alignment: AlignmentType.LEFT,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Airside Operations Dept", bold: true }),
            new TextRun({ text: "
Aircraft Coordination Unit", break: 1 }),
          ],
          alignment: AlignmentType.RIGHT,
        }),
        new Paragraph({ text: "", spacing: { after: 200 } }),
        new Table({ rows }),
        new Paragraph({ text: `الاسم: ${username}`, alignment: AlignmentType.LEFT, spacing: { before: 300 } }),
        new Paragraph({ text: "ملاحظات: ", alignment: AlignmentType.LEFT })
      ]
    }]
  });

  const blob = await Packer.toBlob(docFile);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `رحلات-${dateStr}.docx`;
  link.click();

  if (saved > 0) {
    alert("✅ تم حفظ وتصدير الرحلات بنجاح.");
    loadPreviousFlights();
  } else {
    alert("⚠️ تأكد من ملء التاريخ والاسم لكل رحلة.");
  }
};

async function loadPreviousFlights() {
  const user = auth.currentUser;
  if (!user) return;
  const username = localStorage.getItem("userFullName") || user.email;
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const savedFlightsList = document.getElementById("savedFlightsList");
  if (!savedFlightsList) return;
  savedFlightsList.innerHTML = "جارٍ تحميل الرحلات...";
  const monthRef = collection(db, "flights", month);
  const querySnapshot = await getDocs(monthRef);
  let html = "";
  querySnapshot.forEach((doc) => {
    if (!doc.id.startsWith(username)) return;
    const data = doc.data();
    html += `<div class="prev-flight">
      <strong>${data.flightNo || ""}</strong> | ${data.date || ""} | ${data.notes || ""}
    </div>`;
  });
  savedFlightsList.innerHTML = html || "لا توجد رحلات سابقة.";
}
