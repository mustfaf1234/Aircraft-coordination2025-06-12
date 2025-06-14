// استيراد وحدات Firebase
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

// =========================================================
// إعداد Firebase (تأكد من أن هذه المعلومات صحيحة لمشروعك)
// =========================================================
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

// البريد الإلكتروني للمسؤول (يمكنك تغييره حسب الحاجة)
const adminEmail = "ahmedaltalqani@gmail.com";

// =========================================================
// وظائف المصادقة (تسجيل الدخول/الخروج)
// =========================================================

/**
 * وظيفة لتسجيل دخول المستخدم باستخدام البريد الإلكتروني وكلمة المرور.
 * يتم استدعاؤها عادةً من حدث زر في ملف HTML (مثال: onclick="login()").
 */
window.login = async function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // إعادة التوجيه إلى صفحة الرحلات بعد تسجيل الدخول بنجاح
    window.location.href = "flights.html";
  } catch (error) {
    let errorMessage = "حدث خطأ غير معروف أثناء تسجيل الدخول.";
    // رسائل خطأ أكثر تحديدًا لتجربة مستخدم أفضل
    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "صيغة البريد الإلكتروني غير صحيحة.";
    } else {
      errorMessage = "فشل تسجيل الدخول: " + error.message;
    }
    alert(errorMessage);
    console.error("Login error:", error); // تسجيل الخطأ في وحدة التحكم للمطور
  }
};

/**
 * وظيفة لتسجيل خروج المستخدم.
 * يتم استدعاؤها عادةً من حدث زر في ملف HTML (مثال: onclick="logout()").
 */
window.logout = function () {
  signOut(auth).then(() => {
    // إعادة التوجيه إلى صفحة تسجيل الدخول بعد تسجيل الخروج
    window.location.href = "index.html";
  }).catch((error) => {
    console.error("Logout error:", error);
    alert("حدث خطأ أثناء تسجيل الخروج: " + error.message);
  });
};

/**
 * معالج حالة المصادقة: يتم تشغيله عند تغيير حالة تسجيل الدخول.
 * يستخدم لإدارة إعادة التوجيه وعرض معلومات المستخدم.
 */
onAuthStateChanged(auth, (user) => {
  const path = window.location.pathname;

  // المستخدم غير مسجل الدخول
  if (!user) {
    // إذا لم يكن في صفحة تسجيل الدخول (index.html)، أعد التوجيه إليها
    if (!path.includes("index.html")) {
      window.location.href = "index.html";
    }
    return; // توقف عن التنفيذ هنا
  }

  // المستخدم مسجل الدخول
  const usernameEl = document.getElementById("username");
  if (usernameEl) {
    usernameEl.textContent = user.email; // عرض بريد المستخدم في الواجهة
  }

  // منطق خاص بالمسؤول: إذا كان المستخدم هو المسؤول وفي صفحة الرحلات، أعد التوجيه إلى صفحة المسؤول
  if (user.email === adminEmail && path.includes("flights.html")) {
    window.location.href = "admin.html";
    return; // توقف عن التنفيذ هنا بعد إعادة التوجيه
  }

  // منطق خاص بصفحة الرحلات لغير المسؤولين
  if (path.includes("flights.html")) {
    renderFlightCards();      // رسم بطاقات إدخال الرحلات
    restoreCachedFlights();   // استعادة البيانات المخزنة مؤقتًا إذا وجدت
    setUserNameField();       // تعيين اسم المستخدم تلقائيًا
  }
});

// =========================================================
// وظائف واجهة المستخدم (UI) والمنطق الخاص بالرحلات
// =========================================================

/**
 * يرسم بطاقات إدخال بيانات الرحلات في حاوية الـ DOM.
 */
function renderFlightCards() {
  // تعريف الحقول التي ستظهر في كل بطاقة رحلة
  const fields = [
    { key: 'date', label: 'التاريخ', type: 'text' },
    { key: 'flightNo', label: 'FLT.NO', type: 'text' },
    { key: 'onChocks', label: 'ON chocks', type: 'text' },
    { key: 'openDoor', label: 'Open Door', type: 'text' },
    { key: 'startCleaning', label: 'Start Cleaning', type: 'text' },
    { key: 'completeCleaning', label: 'Complete Cleaning', type: 'text' },
    { key: 'readyBoarding', label: 'Ready Boarding', type: 'text' },
    { key: 'startBoarding', label: 'Start Boarding', type: 'text' },
    { key: 'completeBoarding', label: 'Complete Boarding', type: 'text' },
    { key: 'closeDoor', label: 'Close Door', type: 'text' },
    { key: 'offChocks', label: 'Off chocks', type: 'text' },
    { key: 'name', label: 'الاسم', type: 'text' }, // سيتم تعيينه للقراءة فقط لاحقًا
    { key: 'notes', label: 'ملاحظات', type: 'textarea' }
  ];

  const cardsContainer = document.getElementById("cards");
  // إذا لم يتم العثور على حاوية البطاقات، لا تفعل شيئًا
  if (!cardsContainer) return;

  // مسح أي محتوى قديم داخل الحاوية قبل الرسم
  cardsContainer.innerHTML = '';

  // إنشاء 5 بطاقات رحلات افتراضية
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
      input.dataset.row = i; // لتحديد أي صف ينتمي إليه هذا الحقل

      // جعل حقل الاسم للقراءة فقط
      if (field.key === 'name') {
        input.readOnly = true;
      }
      // يمكنك إضافة أنواع input أخرى إذا لزم الأمر، مثلاً for type="date"
      if (field.key === 'date') {
          input.type = 'date'; // لتفعيل منتقي التاريخ
      } else if (field.type === 'text') {
          input.type = 'text';
      }


      group.appendChild(label);
      group.appendChild(input);
      card.appendChild(group);
    });

    cardsContainer.appendChild(card);
  }
}

/**
 * تطلب من المستخدم إدخال اسمه الكامل وتحفظه في localStorage،
 * ثم تملأ حقول "الاسم" في جميع بطاقات الرحلات.
 */
function setUserNameField() {
  let storedName = localStorage.getItem("userFullName");

  // إذا لم يكن هناك اسم مخزن، اطلب من المستخدم إدخاله مرة واحدة
  if (!storedName) {
    const name = prompt("الرجاء إدخال اسمك الكامل ليتم إرفاقه بالرحلات:");
    if (name) {
      localStorage.setItem("userFullName", name.trim());
      storedName = name.trim(); // تحديث storedName بعد الحفظ
    } else {
      // إذا لم يدخل المستخدم اسماً، يمكن تعيين قيمة افتراضية
      localStorage.setItem("userFullName", "مستخدم غير معروف");
      storedName = "مستخدم غير معروف";
      alert("لم يتم إدخال اسم. سيتم استخدام 'مستخدم غير معروف'.");
    }
  }

  // تحديث جميع حقول الاسم في البطاقات
  const nameInputs = document.querySelectorAll("input[name='name']");
  nameInputs.forEach(input => {
    input.value = storedName;
    input.readOnly = true; // التأكد أنه للقراءة فقط
  });
}

/**
 * تسترجع بيانات الرحلات المخزنة مؤقتًا من localStorage وتملأ بها حقول الإدخال.
 */
function restoreCachedFlights() {
  const cachedData = localStorage.getItem("cachedFlights");
  if (!cachedData) return; // لا توجد بيانات مخزنة مؤقتًا

  try {
    const parsed = JSON.parse(cachedData);
    parsed.forEach((entry, index) => {
      // التأكد من وجود البطاقة قبل محاولة ملء الحقول
      const card = document.querySelector(`.card:nth-child(${index + 1})`);
      if (card) {
        for (const key in entry) {
          const input = card.querySelector(`[name='${key}']`);
          if (input) {
            input.value = entry[key];
          }
        }
      }
    });
  } catch (e) {
    console.error("فشل في تحليل البيانات المخزنة مؤقتًا:", e);
    localStorage.removeItem("cachedFlights"); // مسح البيانات التالفة
  }
}

/**
 * تحفظ بيانات الرحلات من البطاقات إلى Firebase Firestore وتصدرها إلى PDF.
 * يتم استدعاؤها عادةً من حدث زر في ملف HTML (مثال: onclick="saveAndExport()").
 */
window.saveAndExport = async function () {
  const user = auth.currentUser;
  if (!user) {
    alert("الرجاء تسجيل الدخول أولاً قبل حفظ وتصدير البيانات.");
    return;
  }

  const cards = document.querySelectorAll(".card");
  let savedSuccessfullyCount = 0; // عدد الرحلات التي تم حفظها بنجاح في Firebase
  const allDataForCaching = []; // لتخزين جميع البيانات (بما في ذلك غير المحفوظة)

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const inputs = card.querySelectorAll("input, textarea");
    const data = {};
    let isCardMeaningfullyFilled = false; // هل تحتوي البطاقة على بيانات ذات معنى (غير فارغة تمامًا)

    inputs.forEach((input) => {
      const value = input.value.trim();
      data[input.name] = value;
      // اعتبر البطاقة مملوءة إذا كان أي حقل بخلاف 'name' أو 'notes' يحتوي على قيمة
      // أو إذا كان 'date' موجودًا
      if (input.name !== 'name' && input.name !== 'notes' && value !== "") {
        isCardMeaningfullyFilled = true;
      }
      // إذا كان التاريخ موجودا، اعتبرها مملوءة أيضا
      if (input.name === 'date' && value !== "") {
          isCardMeaningfullyFilled = true;
      }
    });

    // إضافة جميع البيانات (سواء تم حفظها أم لا) إلى قائمة التخزين المؤقت
    allDataForCaching.push(data);

    // إذا لم يكن هناك تاريخ أو كانت البطاقة فارغة تمامًا، تخطى الحفظ في Firebase
    if (!data.date || !isCardMeaningfullyFilled) {
        continue;
    }

    // إضافة معلومات المستخدم ووقت الإنشاء
    data.createdBy = user.email;
    data.createdAt = serverTimestamp();

    try {
      await addDoc(collection(db, "flights"), data);
      savedSuccessfullyCount++;
    } catch (err) {
      console.error(`فشل في حفظ الرحلة رقم ${i + 1} إلى Firebase:`, err);
      // يمكنك إظهار رسالة تنبيه جزئية هنا إذا أردت
    }
  }

  // بعد محاولة حفظ جميع الرحلات
  if (savedSuccessfullyCount > 0) {
    localStorage.removeItem("cachedFlights"); // مسح البيانات المؤقتة بعد الحفظ الناجح
    exportToPDF(); // تصدير إلى PDF
    alert(`✅ تم حفظ ${savedSuccessfullyCount} رحلة في قاعدة البيانات وتصدير جميع الرحلات المتاحة إلى PDF بنجاح.`);
  } else if (allDataForCaching.length > 0 && savedSuccessfullyCount === 0) {
    // إذا لم يتم حفظ أي رحلة (مثلاً لأن التاريخ مفقود) ولكن هناك بيانات لبطاقات
    localStorage.setItem("cachedFlights", JSON.stringify(allDataForCaching)); // تخزين البيانات المؤقتة
    alert("⚠️ لم يتم حفظ أي رحلة في قاعدة البيانات (ربما لم يتم إدخال التاريخ لكل الرحلات). تم تخزين البيانات غير المحفوظة مؤقتًا.");
  } else {
    alert("لا توجد بيانات رحلات لحفظها أو تصديرها.");
  }
};

/**
 * تنشئ ملف PDF من بيانات الرحلات المدخلة.
 * تتطلب تضمين مكتبتي pdfmake.min.js و vfs_fonts.js في ملف HTML.
 */
function exportToPDF() {
  const cards = document.querySelectorAll(".card");
  const content = [];

  cards.forEach((card, index) => {
    const inputs = card.querySelectorAll("input, textarea");
    // تجميع البيانات من كل بطاقة
    const data = Array.from(inputs).map(input => {
      // يمكنك تنسيق عرض البيانات هنا
      const label = card.querySelector(`label[for="${input.name}"]`)?.textContent || input.name;
      return `${label}: ${input.value}`;
    }).join("\n"); // فصل كل حقل بسطر جديد

    // إضافة عنوان للرحلة وبياناتها إلى محتوى الـ PDF
    content.push({ text: `الرحلة ${index + 1}\n${data}`, margin: [0, 0, 0, 10] });
  });

  const docDefinition = {
    content: content,
    defaultStyle: {
      // ✅ تم تغيير الخط إلى "Roboto" وهو الخط الافتراضي في vfs_fonts.js
      // إذا كنت تريد استخدام خطوط أخرى، يجب تضمينها في pdfMake بشكل منفصل.
      font: "Roboto",
      alignment: "right" // للمحتوى العربي
    },
    // تعريف الخطوط المستخدمة (مهم لـ pdfMake)
    // هذا الجزء ضروري إذا كنت لا تستخدم الخط الافتراضي (Roboto) أو تريد خطوطًا مخصصة.
    // لكن مع vfs_fonts.js الافتراضي، Roboto متاح.
    // fonts: {
    //   Roboto: {
    //     normal: 'Roboto-Regular.ttf', // تأكد من توفر هذه الملفات إذا كنت تستخدمها
    //     bold: 'Roboto-Medium.ttf',
    //     italics: 'Roboto-Italic.ttf',
    //     bolditalics: 'Roboto-MediumItalic.ttf'
    //   }
    // }
  };

  // إنشاء وتنزيل ملف PDF
  if (typeof pdfMake !== 'undefined' && typeof pdfMake.createPdf !== 'undefined') {
      pdfMake.createPdf(docDefinition).download("رحلات_اليوم.pdf");
  } else {
      console.error("PDFMake مكتبة غير موجودة أو لم يتم تهيئتها بشكل صحيح.");
      alert("فشل في إنشاء PDF. الرجاء التأكد من تحميل مكتبة PDFMake بشكل صحيح.");
  }
}
