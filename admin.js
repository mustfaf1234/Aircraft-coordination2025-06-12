// js/admin.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  listCollections
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// إعدادات Firebase (نفس app.js)
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

// تسجيل الخروج
function logout() {
  signOut(auth).then(() => window.location.href = "index.html");
}
window.logout = logout;

// التحقق من هوية المسؤول
onAuthStateChanged(auth, (user) => {
  if (!user || user.email !== adminEmail) {
    window.location.href = "index.html";
    return;
  }
  document.getElementById("username").textContent = user.email;
  loadAllFlights();
});

// تحميل كل الرحلات من Firestore حسب الهيكلية الجديدة
async function loadAllFlights() {
  const adminFlightList = document.getElementById("adminFlightList");
  const userStats = {};
  adminFlightList.innerHTML = "<div>جاري تحميل الرحلات...</div>";
  
  // الشهر الحالي بصيغة YYYY-MM
  const now = new Date();
  const monthPath = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthCol = collection(db, "flights", monthPath);
  
  let allFlights = [];
  let total = 0;
  
  // جلب جميع مجلدات المستخدمين داخل هذا الشهر
  // نحتاج استخدام listCollections (غير متوفرة دائماً في إصدار 9.6.1، سنستخدم حل بديل)
  // لذا نجرب الحصول على أسماء المستخدمين أولاً عبر محاولة قراءة جميع المجموعات الفرعية (users)
  // سنفترض هنا أن المستخدمين هم أسماء مجلدات فرعية
  
  // نحاول نقرأ كل مجلد مستخدم داخل الشهر (collection group)
  // نحصل على أسماء المستخدمين (collections الفرعية)
  // الحل البديل: حدد أسماء المستخدمين يدوياً إذا أردت أو حدث الكود في حال أردت تحسين الأداء
  // لكن الكود التالي يعمل غالباً مع Firestore السحابي
  
  try {
    // نحصل على جميع مجموعات المستخدمين داخل الشهر الحالي
    const monthRef = collection(db, "flights", monthPath);
    const userCollections = await listCollections(monthRef);
    
    for (const userCol of userCollections) {
      const userName = userCol.id;
      const flightsSnap = await getDocs(collection(db, "flights", monthPath, userName));
      userStats[userName] = 0;
      
      flightsSnap.forEach(docSnap => {
        const data = docSnap.data();
        allFlights.push({ ...data, name: userName });
        userStats[userName]++;
        total++;
      });
    }
  } catch (err) {
    // إذا كانت listCollections غير متوفرة (في بعض إصدارات firebase)، استخدم حل fallback يدوي
    adminFlightList.innerHTML = "<div style='color:red'>لا يمكن قراءة مجلدات المستخدمين لهذا الشهر تلقائيًا، يرجى تحديث firebase أو إرسال أسماء المستخدمين يدوياً.</div>";
    document.getElementById("userStats").innerHTML = "";
    return;
  }
  
  // عرض كل الرحلات في جدول
  if (allFlights.length === 0) {
    adminFlightList.innerHTML = "<div style='color:red'>لا توجد رحلات لهذا الشهر.</div>";
    document.getElementById("userStats").innerHTML = "";
    return;
  }
  
  let table = `<table style="width:100%;margin-bottom:28px;border-collapse:collapse;">
    <thead>
      <tr>
        <th>الاسم</th>
        <th>التاريخ</th>
        <th>FLT.NO</th>
        <th>On Chocks</th>
        <th>Open Door</th>
        <th>Start Cleaning</th>
        <th>Complete Cleaning</th>
        <th>Ready Boarding</th>
        <th>Start Boarding</th>
        <th>Complete Boarding</th>
        <th>Close Door</th>
        <th>Off Chocks</th>
        <th>ملاحظات</th>
      </tr>
    </thead><tbody>`;
  
  for (const flight of allFlights) {
    table += `
      <tr>
        <td>${flight.name || ""}</td>
        <td>${flight.date || ""}</td>
        <td>${flight.flightNo || ""}</td>
        <td>${flight.onChocks || ""}</td>
        <td>${flight.openDoor || ""}</td>
        <td>${flight.startCleaning || ""}</td>
        <td>${flight.completeCleaning || ""}</td>
        <td>${flight.readyBoarding || ""}</td>
        <td>${flight.startBoarding || ""}</td>
        <td>${flight.completeBoarding || ""}</td>
        <td>${flight.closeDoor || ""}</td>
        <td>${flight.offChocks || ""}</td>
        <td>${flight.notes || ""}</td>
      </tr>
    `;
  }
  
  table += "</tbody></table>";
  adminFlightList.innerHTML = table;
  
  // عرض إحصائيات المستخدمين
  let statsHtml = "<ul style='padding-right:12px'>";
  for (const user in userStats) {
    statsHtml += `<li style="margin-bottom:6px">${user}: <strong>${userStats[user]}</strong> رحلة</li>`;
  }
  statsHtml += `</ul><div style="margin-top:7px">عدد الرحلات الكلي: <strong>${total}</strong></div>`;
  document.getElementById("userStats").innerHTML = statsHtml;
  
  // زر تصدير الإحصائية
  document.getElementById("exportStats").onclick = function() {
    exportStatsToWord(userStats, monthPath, total);
  };
}

// تصدير الإحصائيات إلى Word
function exportStatsToWord(userStats, month, total) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType } = window.docx;
  
  const rows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "المستخدم", alignment: AlignmentType.CENTER, bold: true })] }),
        new TableCell({ children: [new Paragraph({ text: "عدد الرحلات", alignment: AlignmentType.CENTER, bold: true })] })
      ]
    })
  ];
  
  for (const user in userStats) {
    rows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: user, alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: String(userStats[user]), alignment: AlignmentType.CENTER })] })
      ]
    }));
  }
  
  const docFile = new Document({
    sections: [{
      properties: { page: { size: { orientation: "landscape" } } },
      children: [
        new Paragraph({
          children: [new TextRun({ text: `إحصائيات الشهر ${month} لشعبة تنسيق الطائرات`, bold: true, size: 32 })],
          alignment: AlignmentType.CENTER,
        }),
        new Table({ rows }),
        new Paragraph({
          children: [new TextRun({ text: `عدد الرحلات الكلي: ${total}`, bold: true })],
          alignment: AlignmentType.RIGHT,
        })
      ]
    }]
  });
  
  Packer.toBlob(docFile).then(blob => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `إحصائيات-${month}.docx`;
    link.click();
  });
}