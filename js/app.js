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

// إعداد Firebase
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

window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};

const adminEmail = "ahmedaltalqani@gmail.com";

// منع إعادة تحميل غير منتهي عند index.html
onAuthStateChanged(auth, (user) => {
  const path = window.location.pathname;

  if (!user && !path.includes("index.html")) {
    window.location.href = "index.html";
  } else if (user) {
    const usernameEl = document.getElementById("username");
    if (usernameEl) usernameEl.textContent = user.email;

    if (user.email === adminEmail && path.includes("flights.html")) {
      window.location.href = "admin.html";
    }

    if (path.includes("flights.html")) {
      renderFlightCards();
      restoreCachedFlights();
      setUserNameField();
    }
  }
});

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

// زر الحفظ والتصدير معاً
window.saveAndExport = async function () {
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

    if (!data.date) continue;
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
    exportToPDF();
    alert("✅ تم الحفظ والتصدير بنجاح");
  } else {
    localStorage.setItem("cachedFlights", JSON.stringify(allData));
    alert("⚠️ لم يتم حفظ أي رحلة بدون تاريخ.");
  }
};

// التصدير فقط
function exportToPDF() {
  const cards = document.querySelectorAll(".card");
  const content = [];

  cards.forEach((card, index) => {
    const inputs = card.querySelectorAll("input, textarea");
    const data = Array.from(inputs).map(input => `${input.name}: ${input.value}`);
    content.push({ text: `الرحلة ${index + 1}\n${data.join("\n")}`, margin: [0, 0, 0, 10] });
  });

  const docDefinition = {
    content,
    defaultStyle: {
      alignment: "right"
    }
  };

  pdfMake.createPdf(docDefinition).download("رحلات_اليوم.pdf");
}
