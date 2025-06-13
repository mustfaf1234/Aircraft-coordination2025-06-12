// app.js (مُحدث ومصحح تمامًا)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
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

// صلاحية المشرف
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
      setUserNameField();
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
      if (field.key === 'name') input.readOnly = true;
      group.appendChild(label);
      group.appendChild(input);
      card.appendChild(group);
    });

    cardsContainer.appendChild(card);
  }
}

function setUserNameField() {
  const storedName = localStorage.getItem("userFullName");
  if (!storedName) {
    const name = prompt("الرجاء إدخال اسمك الكامل:");
    if (name) localStorage.setItem("userFullName", name);
  }
  const nameInputs = document.querySelectorAll("input[name='name']");
  nameInputs.forEach(input => {
    input.value = localStorage.getItem("userFullName") || "";
    input.readOnly = true;
  });
}

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
// تصدير إلى PDF مع دعم اللغة العربية
window.exportToPDF = async function () {
  const user = auth.currentUser;
  if (!user) {
    alert("لم يتم تسجيل الدخول");
    return;
  }

  const date = new Date().toLocaleDateString("ar-EG");
  const cards = document.querySelectorAll(".card");

  const flights = [];

  cards.forEach((card) => {
    const fields = card.querySelectorAll("input, textarea");
    const flight = [];
    fields.forEach((input) => {
      flight.push(input.value || "-");
    });
    flights.push(flight);
  });

  const tableHeader = [
    "التاريخ", "رقم الرحلة", "وقت وضع العجلات", "فتح الباب", "بدء التنظيف",
    "إكمال التنظيف", "جاهزية الصعود", "بدء الصعود", "إكمال الصعود",
    "إغلاق الباب", "إقلاع العجلات"
  ];

  const tableBody = [tableHeader, ...flights.map(f => f.slice(0, 11))];

  const name = localStorage.getItem("userFullName") || "-";
  const notes = flights[0][12] || "-";

  const docDefinition = {
    pageOrientation: "landscape",
    content: [
      { text: `📅 التاريخ: ${date}`, alignment: "right", margin: [0, 0, 0, 10] },
      { text: "مطار النجف الأشرف الدولي", alignment: "center", fontSize: 16, bold: true },
      { text: "قسم عمليات ساحة الطيران / شعبة تنسيق الطائرات", alignment: "center", margin: [0, 0, 0, 20], color: '#004080' },
      {
        table: {
          headerRows: 1,
          widths: Array(11).fill('*'),
          body: tableBody,
        },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 20],
      },
      { text: `👤 الاسم: ${name}`, margin: [0, 0, 0, 5], alignment: "right" },
      { text: `📝 ملاحظات: ${notes}`, alignment: "right" },
    ],
    defaultStyle: {
      font: "Amiri",
      alignment: "right"
    }
  };

  // دعم اللغة العربية - تحميل خط Amiri
  pdfMake.fonts = {
    Amiri: {
      normal: "https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@0.0.4/fonts/amiri/Amiri-Regular.ttf",
      bold: "https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@0.0.4/fonts/amiri/Amiri-Bold.ttf",
      italics: "https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@0.0.4/fonts/amiri/Amiri-Italic.ttf",
      bolditalics: "https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@0.0.4/fonts/amiri/Amiri-BoldItalic.ttf"
    }
  };

  pdfMake.createPdf(docDefinition).download("flights.pdf");
};
