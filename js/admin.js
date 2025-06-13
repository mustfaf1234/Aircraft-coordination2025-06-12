// admin.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore, collection, getDocs
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getAuth, signOut, onAuthStateChanged
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
const adminEmail = "ahmedaltalqani@gmail.com";

onAuthStateChanged(auth, async user => {
  if (!user || user.email !== adminEmail) {
    alert("❌ ليس لديك صلاحية دخول لوحة الإدارة.");
    return location.href = "index.html";
  }
  document.getElementById("username").textContent = `مرحباً، ${user.email}`;
  await loadMonthlyCounts();
  await loadAllFlights();
});

window.logout = () => signOut(auth).then(()=> location.href="index.html");

async function loadMonthlyCounts() {
  const snap = await getDocs(collection(db,"flights"));
  const cnt = {};

  snap.forEach(d=>{
    const dt=d.data(), u=dt.createdBy, m=dt.date?.split("-")[1]||"غير محدد";
    cnt[u] ??= {};
    cnt[u][m] = (cnt[u][m]||0)+1;
  });

  const div = document.getElementById("monthlyCounts");
  div.innerHTML = "";
  Object.entries(cnt).forEach(([u, months])=>{
    const sec = document.createElement("div");
    sec.innerHTML = `<h4>${u}</h4>`+Object.entries(months).map(([m,c])=>`<p>شهر ${m}: ${c} رحلة</p>`).join("");
    div.appendChild(sec);
  });
}

async function loadAllFlights() {
  const snap = await getDocs(collection(db,"flights"));
  const div = document.getElementById("allFlightsList");
  div.innerHTML = "";
  snap.forEach(d=>{
    const dt=d.data(), it=document.createElement("div");
    it.className = "flight-item";
    it.innerHTML = `<strong>${dt.createdBy}</strong> | ${dt.date} | ${dt.flightNo}<br>ملاحظات: ${dt.notes||"-"}<hr>`;
    div.appendChild(it);
  });
}

window.exportAdminPDF = () => {
  const txt = document.getElementById("monthlyCounts").innerText;
  pdfMake.createPdf({
    content:[
      {text:"إحصائيات الرحلات", style:"h"},
      {text:txt, style:"b"}
    ],
    styles:{h:{fontSize:16,bold:true},b:{fontSize:12}},
    defaultStyle:{alignment:"right",font:"Amiri"}
  }).download("إحصائيات.pdf");
};
