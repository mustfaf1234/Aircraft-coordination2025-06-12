// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
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

window.login = async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "flights.html";
  } catch (err) {
    alert("فشل تسجيل الدخول: " + err.message);
  }
};

window.logout = () => {
  signOut(auth).then(() => window.location.href = "index.html");
};

const adminEmail = "ahmedaltalqani@gmail.com";

onAuthStateChanged(auth, async user => {
  if (!user) return window.location.href = "index.html";

  document.getElementById("username")?.textContent = user.email;

  if (user.email === adminEmail && location.pathname.endsWith("flights.html")) {
    return location.href = "admin.html";
  }

  if (location.pathname.endsWith("flights.html")) {
    renderFlightCards();
    await loadPreviousFlights();
    setUserNameField();
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

  const cards = document.getElementById("cards");
  cards.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h4>الرحلة ${i + 1}</h4>`;
    fields.forEach(f => {
      const g = document.createElement("div");
      g.className = "form-group";
      const lbl = document.createElement("label");
      lbl.textContent = f.label;
      const inp = f.type === "textarea" ? document.createElement("textarea") : document.createElement("input");
      inp.name = f.key;
      if (f.key === "name") inp.readOnly = true;
      g.append(lbl, inp);
      card.appendChild(g);
    });
    cards.appendChild(card);
  }
}

function setUserNameField() {
  let name = localStorage.getItem("userFullName");
  if (!name) {
    name = prompt("الرجاء إدخال اسمك الكامل:");
    if (name) localStorage.setItem("userFullName", name);
  }
  document.querySelectorAll("input[name='name']").forEach(i => {
    i.value = name || "";
    i.readOnly = true;
  });
}

async function loadPreviousFlights() {
  const flightRef = collection(db, "flights");
  const snap = await getDocs(query(flightRef, where("createdBy", "==", auth.currentUser.email)));
  const container = document.getElementById("savedFlightsList");
  container.innerHTML = "";
  snap.forEach(d => {
    const dt = d.data();
    container.innerHTML += `<div class="flight-item">
      <strong>${dt.date} - ${dt.flightNo}</strong><br>
      ملاحظات: ${dt.notes || "-"}
    </div>`;
  });
}

window.saveFlights = async () => {
  const cards = document.querySelectorAll(".card");
  const allData = [];
  let saved = 0;

  cards.forEach(c => {
    const data = {}, inputs = c.querySelectorAll("input,textarea");
    let hasDate = false;
    inputs.forEach(i => {
      data[i.name] = i.value.trim();
      if (i.name === "date" && i.value.trim()) hasDate = true;
    });
    if (hasDate) allData.push(data);
  });

  for (const d of allData) {
    d.createdBy = auth.currentUser.email;
    d.createdAt = serverTimestamp();
    try { await addDoc(collection(db, "flights"), d); saved++; }
    catch(e){ console.error(e); }
  }

  if (saved) {
    alert(`✅ تم حفظ ${saved} رحلة`);
    loadPreviousFlights();
  } else alert("⚠️ لا توجد رحلات تحتوي على تاريخ للحفظ");
};

window.exportToPDF = () => {
  const date = new Date().toLocaleDateString("ar-EG");
  const rows = [["التاريخ","رقم الرحلة","ON chocks","Open Door","Start Cleaning","Complete Cleaning","Ready Boarding","Start Boarding","Complete Boarding","Close Door","Off chocks"]];
  document.querySelectorAll(".card").forEach(c => {
    const vals = Array.from(c.querySelectorAll("input,textarea")).map(i => i.value || "-");
    if (vals[0].trim()) rows.push(vals.slice(0,11));
  });
  const name = localStorage.getItem("userFullName") || "-";
  const notes = document.querySelector(".card textarea[name='notes']")?.value || "-";

  pdfMake.createPdf({
    pageOrientation: "landscape",
    content:[
      {text:`التاريخ: ${date}`, alignment:"right"},
      {text:"مطار النجف الأشرف الدولي", style:"header", alignment:"center"},
      {text:"قسم عمليات ساحة الطيران / شعبة تنسيق الطائرات", style:"subheader", alignment:"center"},
      {table:{ headerRows:1, body:rows }, layout:"lightHorizontalLines"},
      {text:`الاسم: ${name}`, margin:[0,10,0,0], alignment:"right"},
      {text:`ملاحظات: ${notes}`, alignment:"right"},
    ],
    styles:{
      header:{fontSize:16,bold:true},
      subheader:{fontSize:12,color:"#004080"}
    },
    defaultStyle:{ alignment:"right", font: "Amiri" }
  }).download("flights.pdf");
};
