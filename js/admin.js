// admin.js (مُحدث)
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

window.logout = function () {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  });
};

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

window.exportAdminPDF = function () {
  const container = document.getElementById("monthlyCounts");
  const text = container.innerText || "لا توجد بيانات.";

  const docDefinition = {
    content: [
      { text: "إحصائيات الرحلات حسب المستخدم", style: "header" },
      { text: text, style: "body" }
    ],
    defaultStyle: {
      font: "Amiri",
      alignment: "right"
    },
    styles: {
      header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
      body: { fontSize: 12 }
    }
  };

  pdfMake.createPdf(docDefinition).download("إحصائيات_الرحلات.pdf");
};
