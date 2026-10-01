// Cora Inclusive Learning & Cora Kids - Core Application Logic
let appState = {
  currentView: 'login', // 'login', 'student', 'admin'
  currentUser: null,
  selectedLoginRole: 'guru',
  activeTab: 'beranda-tab',
  dyslexiaMode: true,
  soundEnabled: true,
  coins: 240,
  streak: 3,
  activeLetter: 'b',
  currentTool: 'brush',
  currentColor: '#0D5C3A',
  brushSize: 14,
  isDrawing: false,
  isRecording: false,
  speechSynthesisVoice: null,
  studentsList: []
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initAccessibility();
  initTracingCanvas();
  initTTS();
  initChatBot();
  loadStudentsData();

  // Close profile popup when clicking outside
  document.addEventListener('click', (e) => {
    const popup = document.getElementById('profilePopupDropdown');
    const trigger = e.target.closest('.user-profile-btn');
    if (!trigger && popup && !popup.contains(e.target)) {
      closeProfilePopup();
    }
  });

  // Selalu tampilkan Halaman Login terlebih dahulu!
  // Tampilan Guru, Orang Tua, atau Siswa HANYA muncul setelah login berhasil.
  showView('viewLogin');
});

// ==========================================
// VIEW SWITCHING (Login vs Student vs Admin)
// ==========================================
function showView(viewId) {
  document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add('active');
    appState.currentView = viewId;
  }
  closeProfilePopup();
}

// ==========================================
// 1. LOGIN & AUTHENTICATION
// ==========================================
function selectLoginRole(role) {
  appState.selectedLoginRole = role;

  // Update pills
  document.getElementById('roleBtnOrtu').classList.toggle('active', role === 'orangtua');
  document.getElementById('roleBtnGuru').classList.toggle('active', role === 'guru');
  document.getElementById('roleBtnSiswa').classList.toggle('active', role === 'siswa');

  const emailLabel = document.getElementById('loginEmailLabel');
  const roleBadge = document.getElementById('loginRoleBadge');
  const emailInput = document.getElementById('loginEmailInput');
  const passLabel = document.getElementById('loginPassLabel');
  const passInput = document.getElementById('loginPasswordInput');
  const submitText = document.getElementById('loginSubmitBtnText');

  hideLoginError();

  if (role === 'guru') {
    emailLabel.textContent = "Email Sekolah (Guru / Tim GPK)";
    roleBadge.textContent = "Akses Guru Terpilih";
    emailInput.placeholder = "rahma.kartika@sekolahkita.sch.id";
    passLabel.textContent = "Kata Sandi Akun";
    passInput.placeholder = "••••••••••••";
    submitText.textContent = "Masuk ke Portal Sekolah";
  } else if (role === 'orangtua') {
    emailLabel.textContent = "Email Akun Orang Tua";
    roleBadge.textContent = "Akses Orang Tua Terpilih";
    emailInput.placeholder = "hendra.zidan@gmail.com";
    passLabel.textContent = "Kata Sandi Akun";
    passInput.placeholder = "••••••••••••";
    submitText.textContent = "Masuk ke Portal Orang Tua";
  } else if (role === 'siswa') {
    emailLabel.textContent = "Email atau Nama Siswa";
    roleBadge.textContent = "Akses Siswa (PIN)";
    emailInput.placeholder = "reya@corakids.id";
    passLabel.textContent = "PIN Masuk Siswa (4 Angka)";
    passInput.placeholder = "Contoh: 1234";
    submitText.textContent = "Mulai Belajar di Cora Kids 🚀";
  }
}

function quickFillAccount(email, password, role) {
  if (role) selectLoginRole(role);
  document.getElementById('loginEmailInput').value = email;
  document.getElementById('loginPasswordInput').value = password;
  hideLoginError();
}

function togglePasswordVisibility() {
  const passInput = document.getElementById('loginPasswordInput');
  const eye = document.getElementById('togglePasswordEye');
  if (passInput.type === 'password') {
    passInput.type = 'text';
    eye.textContent = '🙈';
  } else {
    passInput.type = 'password';
    eye.textContent = '👁️';
  }
}

function simulateWrongPassword() {
  document.getElementById('loginEmailInput').value = "user.salah@sekolah.sch.id";
  document.getElementById('loginPasswordInput').value = "passwordsalah123";
  showLoginError("Akun atau Kata Sandi salah! Silakan coba lagi dengan akun yang benar.");
}

function showLoginError(msg) {
  const banner = document.getElementById('loginErrorBanner');
  const text = document.getElementById('loginErrorMsg');
  text.textContent = msg || "Akun atau Kata Sandi salah! Silakan coba lagi dengan akun yang benar.";
  banner.style.display = 'flex';
  speakText("Akun atau kata sandi salah. Silakan periksa kembali dan gunakan akun yang benar.");
}

function hideLoginError() {
  const banner = document.getElementById('loginErrorBanner');
  if (banner) banner.style.display = 'none';
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmailInput').value.trim();
  const password = document.getElementById('loginPasswordInput').value.trim();
  const remember = document.getElementById('rememberMeCheckbox').checked;

  hideLoginError();

  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: password,
      role: appState.selectedLoginRole
    })
  })
  .then(res => {
    if (!res.ok) {
      throw new Error("Login failed");
    }
    return res.json();
  })
  .then(data => {
    if (data.success && data.user) {
      if (remember) {
        localStorage.setItem('cora_user', JSON.stringify(data.user));
      }
      applyUserSession(data.user);
      speakText(`Selamat datang, ${data.user.name}!`);
    } else {
      showLoginError(data.message);
    }
  })
  .catch(() => {
    // Offline / Static fallback authentication
    const FALLBACK_USERS = {
      "rahma.kartika@sekolahkita.sch.id": { password: "guru123", name: "Rahma Kartika, S.Psi", role: "guru", title: "Koordinator GPK & Konselor", institution: "SD Inklusi Pelita Harapan", avatar: "👩‍🏫" },
      "budi.santoso@sekolahkita.sch.id": { password: "guru123", name: "Budi Santoso, S.Pd", role: "guru", title: "Guru Kelas 2 Inklusi", institution: "SD Inklusi Pelita Harapan", avatar: "👨‍🏫" },
      "dewi.lestari@sekolahkita.sch.id": { password: "guru123", name: "Dewi Lestari, M.Pd", role: "guru", title: "Terapis Wicara & Fonetik", institution: "SD Inklusi Pelita Harapan", avatar: "👩‍⚕️" },
      "hendra.zidan@gmail.com": { password: "ortu123", name: "Hendra Zidan", role: "orangtua", child_name: "Reynarif Zidan", child_class: "Kelas 2-B Inklusi", institution: "SD Inklusi Pelita Harapan", avatar: "👨‍💼" },
      "siti.aminah@gmail.com": { password: "ortu123", name: "Siti Aminah", role: "orangtua", child_name: "Nabila Putri Amanda", child_class: "Kelas 3-B Inklusi", institution: "SD Inklusi Pelita Harapan", avatar: "🧕" },
      "yuli.iriana@gmail.com": { password: "ortu123", name: "Yuli Iriana", role: "orangtua", child_name: "Dimas Arya", child_class: "Kelas 2-B Inklusi", institution: "SD Inklusi Pelita Harapan", avatar: "👩‍💼" },
      "reya@corakids.id": { password: "1234", name: "Reya Narendra", role: "siswa", class: "Kelas 2 SD Inklusi", coins: 240, streak: 3, avatar: "👦" },
      "zidan@corakids.id": { password: "1234", name: "Reynarif Zidan", role: "siswa", class: "Kelas 2-B Inklusi", coins: 180, streak: 2, avatar: "🧒" },
      "nabila@corakids.id": { password: "1234", name: "Nabila Putri Amanda", role: "siswa", class: "Kelas 3-B Inklusi", coins: 310, streak: 5, avatar: "👧" }
    };

    const userMatch = FALLBACK_USERS[email];
    if (userMatch && userMatch.password === password) {
      const userCopy = Object.assign({ email: email }, userMatch);
      delete userCopy.password;
      if (remember) {
        localStorage.setItem('cora_user', JSON.stringify(userCopy));
      }
      applyUserSession(userCopy);
      speakText(`Selamat datang, ${userCopy.name}!`);
    } else {
      showLoginError("Akun atau Kata Sandi salah! Silakan coba lagi dengan akun yang benar.");
    }
  });
}

function applyUserSession(user) {
  appState.currentUser = user;

  // Update popup profile details
  document.getElementById('popupUserName').textContent = user.name;
  document.getElementById('popupUserAvatar').textContent = user.avatar || '👤';
  
  if (user.role === 'guru') {
    document.getElementById('popupUserTitle').textContent = `${user.title} • ${user.institution}`;
  } else if (user.role === 'orangtua') {
    document.getElementById('popupUserTitle').textContent = `Orang Tua dari ${user.child_name || 'Siswa'} • ${user.institution}`;
  } else {
    document.getElementById('popupUserTitle').textContent = `Siswa • ${user.class || 'Kelas Inklusi'}`;
  }

  // Handle Role Views & Pop-up restrictions
  if (user.role === 'siswa') {
    // 1. SISWA VIEW: Launch Cora Kids 5 Screens
    showView('viewStudent');

    // Update student header
    document.getElementById('studentNamePill').textContent = user.name;
    document.getElementById('welcomeStudentName').textContent = user.name.split(' ')[0];
    document.getElementById('studentAvatarPill').textContent = user.avatar || '👦';
    if (user.coins) {
      appState.coins = user.coins;
      document.getElementById('coinsCount').textContent = `${user.coins} Koin`;
    }
    if (user.streak) {
      document.getElementById('streakCount').textContent = `${user.streak} Hari Beruntun!`;
    }

    // Configure Pop-Up: ONLY LOGOUT IS VISIBLE! HIDE ADMIN ITEMS!
    document.querySelectorAll('.role-item-admin').forEach(el => el.style.display = 'none');

    // Ensure tracing canvas is ready
    setTimeout(() => {
      drawLetterGuide(appState.activeLetter);
    }, 100);

  } else {
    // 2. ADMIN PORTAL (GURU OR ORANG TUA)
    showView('viewAdmin');

    // Configure Pop-Up: SHOW ADMIN ITEMS!
    document.querySelectorAll('.role-item-admin').forEach(el => el.style.display = 'block');

    // Update Admin Header
    document.getElementById('adminNamePill').textContent = user.name;
    document.getElementById('adminAvatarPill').textContent = user.avatar || '👩‍🏫';

    if (user.role === 'guru') {
      // GURU / TIM (FOTO 2: 5 HALAMAN GURU AKTIF):
      document.getElementById('menuPortalOrangTua').style.display = 'none';
      document.getElementById('menuPortalSekolah').style.display = 'block';

      document.getElementById('adminSidebarSubtitle').textContent = "Portal Inklusi Sekolah";
      document.getElementById('adminPortalBadgeText').textContent = "Guru & Tim Sekolah";
      document.getElementById('adminRolePill').textContent = user.title || "Koordinator GPK";

      document.getElementById('popupSwitchRoleText').textContent = "Pratinjau Portal Orang Tua";
      document.getElementById('popupSwitchRoleDesc').textContent = "Lihat tampilan dari sisi orang tua";

      // Buka Halaman 1 Guru (Dashboard Kelas & Siswa)
      switchAdminTab('guru-dashboard-tab', document.getElementById('nav-guru-dashboard'), 'Dashboard Kelas & Siswa');

    } else if (user.role === 'orangtua') {
      // ORANG TUA (FOTO 1: 5 HALAMAN ORTU AKTIF):
      document.getElementById('menuPortalSekolah').style.display = 'none';
      document.getElementById('menuPortalOrangTua').style.display = 'block';

      document.getElementById('adminSidebarSubtitle').textContent = "Portal Pendampingan Keluarga";
      document.getElementById('adminPortalBadgeText').textContent = "Portal Orang Tua";
      document.getElementById('adminRolePill').textContent = `Wali dari ${user.child_name || 'Siswa'}`;

      document.getElementById('popupSwitchRoleText').textContent = "Buka Ruang Belajar Anak";
      document.getElementById('popupSwitchRoleDesc').textContent = "Beralih ke aplikasi belajar Cora Kids";

      // Buka Halaman 1 Ortu (Ringkasan & Beranda)
      switchAdminTab('ortu-beranda-tab', document.getElementById('nav-ortu-beranda'), 'Ringkasan & Beranda');
    }

    // Refresh student list
    renderStudentTable();
  }
}

function handleLogout() {
  localStorage.removeItem('cora_user');
  appState.currentUser = null;
  closeProfilePopup();
  showView('viewLogin');
  speakText("Anda telah keluar dari akun. Sampai jumpa lagi!");
}

// ==========================================
// 2. PROFILE POPUP DROPDOWN (Kanan Atas)
// ==========================================
function toggleProfilePopup(e) {
  e.stopPropagation();
  const popup = document.getElementById('profilePopupDropdown');
  if (popup) {
    popup.classList.toggle('show');
  }
}

function closeProfilePopup() {
  const popup = document.getElementById('profilePopupDropdown');
  if (popup) {
    popup.classList.remove('show');
  }
}

function switchPortalViewAction() {
  closeProfilePopup();
  if (!appState.currentUser) return;

  if (appState.currentUser.role === 'guru') {
    // Switch to preview as parent or student
    alert("Beralih ke pratinjau antarmuka siswa (Cora Kids).");
    showView('viewStudent');
  } else if (appState.currentUser.role === 'orangtua') {
    // Parent switches to kid learning room
    alert(`Membuka ruang belajar Cora Kids untuk mendampingi ${appState.currentUser.child_name || 'anak'} belajar.`);
    showView('viewStudent');
  }
}

// ==========================================
// 3. ADMIN PORTAL FUNCTIONS
// ==========================================
function loadStudentsData() {
  fetch('/api/students')
    .then(res => res.json())
    .then(data => {
      appState.studentsList = data;
      renderStudentTable();
    })
    .catch(() => {
      // Local fallback
      appState.studentsList = [
        {
          id: "1",
          name: "Reynarif Zidan",
          parent: "Hendra Zidan",
          class: "Kelas 2-B Inklusi",
          diagnosis: "Disleksia Fonemik • Disgrafia Ringan",
          diagnosis_type: "disleksia",
          iep_progress: 65,
          target: "Target Sem 1",
          focus_score: "88% Akurasi Bunyi Kata",
          streak: "5 Hari Beruntun",
          status_badge: "Sangat Baik",
          status_class: "badge-mint",
          notes: "Respon visual cepat, butuh penegasan huruf b & d."
        },
        {
          id: "2",
          name: "Nabila Putri",
          parent: "Siti Aminah",
          class: "Kelas 2-A Inklusi",
          diagnosis: "Diskalkulia Ringan",
          diagnosis_type: "diskalkulia",
          iep_progress: 90,
          target: "Target Sem 1 Selesai",
          focus_score: "78% Konsep Jumlah & Angka",
          streak: "3 Hari Beruntun",
          status_badge: "Penguatan Manipulatif",
          status_class: "badge-blue",
          notes: "Lebih mudah memahami dengan balok angka Cora."
        },
        {
          id: "3",
          name: "Dimas Arya",
          parent: "Yuli Iriana",
          class: "Kelas 2-B Inklusi",
          diagnosis: "Disleksia Fonemik",
          diagnosis_type: "disleksia",
          iep_progress: 40,
          target: "Di Bawah Target",
          focus_score: "52% Diskriminasi Fonem B/D",
          streak: "1 Hari (Perlu Dorongan)",
          status_badge: "Sesi Khusus GPK",
          status_class: "badge-red",
          notes: "Tertukar huruf cermin b & d saat membaca cepat."
        },
        {
          id: "4",
          name: "Jessica Amelia",
          parent: "Budi Santoso",
          class: "Kelas 3-A Inklusi",
          diagnosis: "Disgrafia Motorik Halus",
          diagnosis_type: "disgrafia",
          iep_progress: 70,
          target: "Melampaui Target",
          focus_score: "94% Kerapian Jalur Tulis",
          streak: "6 Hari Beruntun",
          status_badge: "Motorik Tulis Rapi",
          status_class: "badge-mint",
          notes: "Latihan tracking garis Cora sangat membantu."
        },
        {
          id: "5",
          name: "Kevin Sanjaya",
          parent: "Maya Kurnia",
          class: "Kelas 2-A Inklusi",
          diagnosis: "Sensori & Regulasi Emosi",
          diagnosis_type: "sensori",
          iep_progress: 75,
          target: "On Track",
          focus_score: "82% Stabilitas Durasi Fokus",
          streak: "4 Hari Beruntun",
          status_badge: "Regulasi Mandiri",
          status_class: "badge-blue",
          notes: "Menggunakan fitur jeda bebas tekanan secara mandiri."
        }
      ];
      renderStudentTable();
    });
}

function renderStudentTable(filterType = 'all') {
  const tbody = document.getElementById('studentTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';
  const filtered = appState.studentsList.filter(s => {
    if (filterType === 'all') return true;
    return s.diagnosis_type === filterType;
  });

  filtered.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="student-avatar-cell">
          <div class="student-img-circle">🧒</div>
          <div>
            <div class="student-name-bold">${s.name}</div>
            <div class="student-parent-sub">Ortu: ${s.parent} (Terhubung) • ${s.class}</div>
          </div>
        </div>
      </td>
      <td>
        <span class="diagnosis-badge">${s.diagnosis}</span>
      </td>
      <td>
        <div style="font-weight:700; font-size:11px;">${s.iep_progress}% <span style="color:#6B7280; font-weight:400;">(${s.target})</span></div>
        <div class="iep-progress-bar">
          <div class="iep-progress-fill" style="width:${s.iep_progress}%;"></div>
        </div>
      </td>
      <td>
        <div style="font-weight:700;">${s.focus_score}</div>
      </td>
      <td>
        <div style="display:flex; align-items:center; gap:4px; font-weight:600;">
          <span>🔥</span>
          <span>${s.streak}</span>
        </div>
      </td>
      <td>
        <span class="status-badge-custom ${s.status_class}">${s.status_badge}</span>
        <div style="font-size:10.5px; color:#4B5563; margin-top:4px;">${s.notes}</div>
      </td>
      <td>
        <button class="btn-sm" style="background:#E8F8F0; color:#0D5C3A;" onclick="alert('Membuka Laporan Lengkap IEP untuk ${s.name}')">Lihat IEP</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterStudentTable(type, btn) {
  document.querySelectorAll('.table-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderStudentTable(type);
}

function launchClassModule() {
  speakText("Meluncurkan Modul Interaktif 3D Spasial Kinestetik ke layar sentral kelas untuk membedakan huruf b dan d.");
  alert("🚀 Modul Interaktif Berhasil Diluncurkan ke Layar Sentral Kelas!");
}

function sendBroadcastMessage() {
  const textarea = document.getElementById('broadcastTextarea');
  const msg = textarea.value.trim();
  if (!msg) return;

  fetch('/api/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: msg })
  })
  .then(res => res.json())
  .then(data => {
    alert(`✅ ${data.message}`);
    speakText("Siaran pesan berhasil dikirimkan ke seluruh orang tua siswa!");
  })
  .catch(() => {
    alert("✅ Siaran berhasil dikirimkan ke 24 orang tua siswa terhubung!");
  });
}

function setAdminTab(el, name) {
  document.querySelectorAll('#viewAdmin .nav-link').forEach(l => l.classList.remove('active'));
  if (el) el.classList.add('active');
  speakText(`Membuka menu ${name}`);
}

// ==========================================
// 4. NAVIGATION (SISWA - 5 TABS)
// ==========================================
function initNavigation() {
  const links = document.querySelectorAll('#viewStudent .nav-link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = link.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('#viewStudent .nav-link').forEach(l => {
    if (l.getAttribute('data-tab') === tabId) {
      l.classList.add('active');
    } else {
      l.classList.remove('active');
    }
  });

  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.remove('active');
  });

  const activePane = document.getElementById(tabId);
  if (activePane) {
    activePane.classList.add('active');
    appState.activeTab = tabId;

    if (tabId === 'ruang-tab') {
      setTimeout(() => {
        resizeCanvas();
        drawLetterGuide(appState.activeLetter);
      }, 50);
    }
  }
}

// ==========================================
// 5. ACCESSIBILITY & DYSLEXIA MODE
// ==========================================
function initAccessibility() {
  const dyslexiaToggle = document.getElementById('dyslexiaToggle');
  const soundToggle = document.getElementById('soundToggle');

  if (dyslexiaToggle) {
    dyslexiaToggle.addEventListener('change', (e) => {
      appState.dyslexiaMode = e.target.checked;
      document.body.classList.toggle('dyslexia-mode', appState.dyslexiaMode);
    });
  }

  if (soundToggle) {
    soundToggle.addEventListener('change', (e) => {
      appState.soundEnabled = e.target.checked;
    });
  }

  document.body.classList.toggle('dyslexia-mode', appState.dyslexiaMode);
}

function toggleDyslexiaTheme() {
  appState.dyslexiaMode = !appState.dyslexiaMode;
  document.body.classList.toggle('dyslexia-mode', appState.dyslexiaMode);
  const toggle = document.getElementById('dyslexiaToggle');
  if (toggle) toggle.checked = appState.dyslexiaMode;
}

// ==========================================
// 6. TEXT TO SPEECH (TTS) NARRATOR
// ==========================================
function initTTS() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('ID'));
      if (idVoice) {
        appState.speechSynthesisVoice = idVoice;
      }
    };
  }

  const globalSpeaker = document.getElementById('globalSpeakerBtn');
  if (globalSpeaker) {
    globalSpeaker.addEventListener('click', () => {
      speakText("Halo! Selamat datang di Cora Kids. Silakan pilih petualangan belajarmu hari ini!");
    });
  }
}

function speakText(text) {
  if (!appState.soundEnabled) return;
  if (!('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'id-ID';
  utterance.rate = 0.88;
  utterance.pitch = 1.15;

  if (appState.speechSynthesisVoice) {
    utterance.voice = appState.speechSynthesisVoice;
  }

  const avatar = document.getElementById('coraBigAvatar');
  const waveBars = document.querySelectorAll('.wave-bar');

  utterance.onstart = () => {
    if (avatar) avatar.classList.add('speaking');
    waveBars.forEach(b => b.classList.add('active'));
  };

  utterance.onend = () => {
    if (avatar) avatar.classList.remove('speaking');
    waveBars.forEach(b => b.classList.remove('active'));
  };

  window.speechSynthesis.speak(utterance);
}

// ==========================================
// 7. INTERACTIVE TRACING CANVAS (SCREEN 2)
// ==========================================
let canvas, ctx;
let userStrokes = [];

function initTracingCanvas() {
  canvas = document.getElementById('tracingCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  resizeCanvas();

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    stopDrawing();
  });
}

function resizeCanvas() {
  if (!canvas) return;
  const container = document.getElementById('canvasContainer');
  if (container) {
    canvas.width = container.clientWidth || 600;
    canvas.height = 380;
  }
}

function setTracingLetter(letter) {
  appState.activeLetter = letter;
  document.getElementById('activeLetterLabel').textContent = letter;

  const trickBox = document.getElementById('letterTrickContent');
  if (letter === 'b') {
    trickBox.innerHTML = `<strong>Huruf 'b':</strong> Tarik garis lurus tinggi dari atas ke bawah seperti tiang jerapah, lalu buat perut gendut melengkung di sebelah <strong>kanan</strong>!`;
  } else {
    trickBox.innerHTML = `<strong>Huruf 'd':</strong> Buat lengkungan bulat di sebelah <strong>kiri</strong> dulu, lalu tarik tiang lurus tinggi dari atas ke bawah di sebelah kanan!`;
  }

  clearCanvas();
  speakText(`Kita sekarang berlatih huruf ${letter}. Ikuti garis panduannya ya!`);
}

function drawLetterGuide(letter) {
  if (!ctx || !canvas) return;
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;

  ctx.save();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 42;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([12, 12]);

  if (letter === 'b') {
    ctx.beginPath();
    ctx.moveTo(cx - 50, cy - 120);
    ctx.lineTo(cx - 50, cy + 110);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx - 10, cy + 30, 75, -Math.PI / 2, Math.PI / 2, false);
    ctx.stroke();

    drawCheckpoint(cx - 50, cy - 120, '1', '#EF4444');
    drawCheckpoint(cx - 50, cy + 110, '2', '#3B82F6');
    drawCheckpoint(cx + 65, cy + 30, '3', '#10B981');
  } else {
    ctx.beginPath();
    ctx.arc(cx + 10, cy + 30, 75, Math.PI / 2, -Math.PI / 2, false);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 50, cy - 120);
    ctx.lineTo(cx + 50, cy + 110);
    ctx.stroke();

    drawCheckpoint(cx - 65, cy + 30, '1', '#EF4444');
    drawCheckpoint(cx + 50, cy - 120, '2', '#3B82F6');
    drawCheckpoint(cx + 50, cy + 110, '3', '#10B981');
  }
  ctx.restore();
}

function drawCheckpoint(x, y, text, color) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, 16, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px Lexend, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function startDrawing(e) {
  appState.isDrawing = true;
  ctx.beginPath();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  ctx.moveTo(x, y);
  userStrokes.push({ x, y });
}

function draw(e) {
  if (!appState.isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  ctx.save();
  if (appState.currentTool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = 28;
  } else if (appState.currentTool === 'rainbow') {
    const rainbowColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
    ctx.strokeStyle = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
    ctx.lineWidth = appState.brushSize;
  } else {
    ctx.strokeStyle = appState.currentColor;
    ctx.lineWidth = appState.brushSize;
  }

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.restore();

  userStrokes.push({ x, y });
}

function stopDrawing() {
  if (appState.isDrawing) {
    appState.isDrawing = false;
    ctx.closePath();
  }
}

function setCanvasTool(tool) {
  appState.currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));

  if (tool === 'brush') {
    document.getElementById('toolBrush').classList.add('active');
    appState.brushSize = 14;
  } else if (tool === 'pencil') {
    document.getElementById('toolPencil').classList.add('active');
    appState.brushSize = 6;
  } else if (tool === 'rainbow') {
    document.getElementById('toolRainbow').classList.add('active');
    appState.brushSize = 16;
  } else if (tool === 'eraser') {
    document.getElementById('toolEraser').classList.add('active');
  }
}

function setBrushColor(color, el) {
  appState.currentColor = color;
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
  if (el) el.classList.add('active');
  if (appState.currentTool === 'eraser') {
    setCanvasTool('brush');
  }
}

function clearCanvas() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  userStrokes = [];
  drawLetterGuide(appState.activeLetter);
  document.getElementById('tracingFeedbackText').textContent = "Mulai menggores dari angka 1!";
  document.getElementById('tracingStarsDisplay').textContent = "⭐⭐⭐";
}

function playLetterGuidance() {
  if (appState.activeLetter === 'b') {
    speakText("Untuk huruf b: Mulai dari angka 1 merah di atas, tarik tiang lurus ke angka 2 biru, lalu putar buat perut ke angka 3 hijau di kanan!");
  } else {
    speakText("Untuk huruf d: Mulai dari angka 1 merah di kiri, buat lingkaran melengkung, lalu tarik tiang lurus dari angka 2 biru ke bawah!");
  }
}

function checkTracingCompletion() {
  if (userStrokes.length < 15) {
    speakText("Goresanmu masih sedikit, yuk teruskan gores mengikuti bentuk hurufnya!");
    document.getElementById('tracingFeedbackText').textContent = "Ayo gores lebih panjang lagi! 🖌️";
    return;
  }

  appState.coins += 20;
  document.getElementById('coinsCount').textContent = `${appState.coins} Koin`;

  document.getElementById('tracingStarsDisplay').textContent = "🌟🌟🌟";
  document.getElementById('tracingFeedbackText').textContent = "Luar biasa! Goresanmu sangat rapi!";
  speakText("Hebat sekali! Kamu berhasil membuat huruf dengan sangat indah! Kamu dapat 20 koin baru!");

  fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      letter: appState.activeLetter,
      points: 20,
      stars: 3
    })
  }).catch(() => {});
}

// ==========================================
// 8. TAMAN BELAJAR AI CORA (VOICE & CHAT)
// ==========================================
function initChatBot() {
  const micBtn = document.getElementById('micRecordBtn');
  const micStatus = document.getElementById('micStatusText');
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      appState.isRecording = true;
      micBtn.classList.add('recording');
      micStatus.textContent = "Mendengarkan suaramu... Bicaralah sekarang!";
    };

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      appendChatMessage('user', transcript);
      processAiResponse(transcript);
    };

    recognition.onerror = () => {
      micBtn.classList.remove('recording');
      micStatus.textContent = "Bicaralah pelan-pelan, Cora mendengarkanmu!";
      appState.isRecording = false;
    };

    recognition.onend = () => {
      micBtn.classList.remove('recording');
      micStatus.textContent = "Bicaralah pelan-pelan, Cora mendengarkanmu!";
      appState.isRecording = false;
    };
  }

  window.toggleVoiceRecording = () => {
    if (recognition) {
      if (appState.isRecording) {
        recognition.stop();
      } else {
        recognition.start();
      }
    } else {
      const sampleQueries = [
        "Bagaimana cara mudah ingat huruf b?",
        "Bisa ceritakan dongeng tentang burung hantu?",
        "Kenapa huruf b dan d kelihatan sama bagiku?"
      ];
      const randomQuery = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
      appendChatMessage('user', randomQuery);
      processAiResponse(randomQuery);
    }
  };
}

function handleChatEnter(e) {
  if (e.key === 'Enter') {
    sendUserMessage();
  }
}

function sendUserMessage() {
  const input = document.getElementById('chatInputField');
  const text = input.value.trim();
  if (!text) return;

  appendChatMessage('user', text);
  input.value = '';
  processAiResponse(text);
}

function appendChatMessage(sender, text) {
  const list = document.getElementById('chatMessagesList');
  if (!list) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  bubble.innerHTML = `<strong>${sender === 'cora' ? 'Cora' : (appState.currentUser ? appState.currentUser.name.split(' ')[0] : 'Siswa')}:</strong> ${text}`;
  list.appendChild(bubble);
  list.scrollTop = list.scrollHeight;
}

function processAiResponse(userText) {
  const balloon = document.getElementById('coraBalloonText');

  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: userText })
  })
  .then(res => res.json())
  .then(data => {
    const reply = data.reply;
    appendChatMessage('cora', reply);
    if (balloon) balloon.textContent = `"${reply}"`;
    speakText(reply);
  })
  .catch(() => {
    let reply = "Hebat sekali kamu bertanya! Huruf 'b' dan 'd' memang kembar yang lucu. Bayangkan huruf 'b' seperti tongkat pemukul bola kasti, bolanya ada di depan!";
    if (userText.toLowerCase().includes('dongeng') || userText.toLowerCase().includes('cerita')) {
      reply = "Di sebuah pohon apel yang rindang, ada Cora yang sedang terbang riang. Cora menemukan apel bertuliskan huruf B yang sangat manis!";
    }
    appendChatMessage('cora', reply);
    if (balloon) balloon.textContent = `"${reply}"`;
    speakText(reply);
  });
}

function askTopic(topicName) {
  appendChatMessage('user', `Cora, jelaskan tentang ${topicName} dong!`);
  processAiResponse(`Jelaskan ${topicName}`);
}

function replayCoraSpeech() {
  const balloon = document.getElementById('coraBalloonText');
  if (balloon) {
    speakText(balloon.textContent);
  }
}

function readStoryExcerpt() {
  const text = "Di sebuah hutan yang tenang, tinggal seekor burung hantu kecil bernama Cora. Cora suka sekali melihat buku-buku bergambar warna-warni.";
  const balloon = document.getElementById('coraBalloonText');
  if (balloon) balloon.textContent = `"${text}"`;
  speakText(text);
}

// ==========================================
// 9. MODALS (STORY & MINI GAMES)
// ==========================================
let currentStoryText = "";

function openStoryModal(title, content) {
  document.getElementById('modalStoryTitle').textContent = title;
  document.getElementById('modalStoryBody').textContent = content;
  currentStoryText = content;
  document.getElementById('storyModal').classList.add('open');
  speakText(content);
}

function closeStoryModal() {
  document.getElementById('storyModal').classList.remove('open');
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function speakCurrentStory() {
  if (currentStoryText) speakText(currentStoryText);
}

function openGameModal(gameType) {
  const modal = document.getElementById('gameModal');
  const title = document.getElementById('gameModalTitle');
  const desc = document.getElementById('gameModalDesc');
  const playArea = document.getElementById('gamePlayArea');

  modal.classList.add('active', 'open');

  if (gameType === 'tebak-bunyi') {
    title.textContent = "Tebak Bunyi & Awalan Kata 🎵";
    desc.textContent = "Dengarkan bunyinya, lalu pilih huruf awal kata Bebek!";
    playArea.innerHTML = `
      <div style="font-size:48px; margin-bottom:12px;">🦆</div>
      <div style="font-size:18px; font-weight:800; margin-bottom:16px;">"B E B E K"</div>
      <button class="btn-sm btn-mint" style="margin-bottom:16px;" onclick="speakText('Bebek! Huruf apakah awal kata Bebek?')">🔊 Putar Suara Bebek</button>
      <div style="display:flex; justify-content:center; gap:16px;">
        <button class="btn-primary" style="font-size:24px; padding:12px 28px;" onclick="handleGameAnswer(true)">b</button>
        <button class="btn-primary" style="font-size:24px; padding:12px 28px; background:#4B5563;" onclick="handleGameAnswer(false)">d</button>
      </div>
    `;
    speakText("Huruf apakah awalan untuk kata Bebek?");
  } else {
    title.textContent = "Panen Buah Ceria 🍎";
    desc.textContent = "Pilih buah apel yang bertuliskan huruf b!";
    playArea.innerHTML = `
      <div style="font-size:48px; margin-bottom:12px;">🧺</div>
      <div style="display:flex; justify-content:center; gap:18px;">
        <button class="btn-primary" style="font-size:22px; padding:14px 24px; background:#EF4444;" onclick="handleGameAnswer(true)">🍎 b</button>
        <button class="btn-primary" style="font-size:22px; padding:14px 24px; background:#F59E0B;" onclick="handleGameAnswer(false)">🍊 d</button>
        <button class="btn-primary" style="font-size:22px; padding:14px 24px; background:#10B981;" onclick="handleGameAnswer(false)">🍏 p</button>
      </div>
    `;
    speakText("Ayo petik buah apel yang bertuliskan huruf b!");
  }
}

function handleGameAnswer(isCorrect) {
  if (isCorrect) {
    appState.coins += 10;
    document.getElementById('coinsCount').textContent = `${appState.coins} Koin`;
    document.getElementById('gameScoreText').textContent = "Benar! +10 Koin 🪙";
    speakText("Yey benar sekali! Kamu hebat!");
    setTimeout(() => {
      closeGameModal();
    }, 1200);
  } else {
    speakText("Hampir tepat! Coba lihat lagi bentuk perut hurufnya ya!");
    document.getElementById('gameScoreText').textContent = "Coba sekali lagi ya!";
  }
}

function closeGameModal() {
  document.getElementById('gameModal').classList.remove('open');
}

// ==========================================
// 6. DYNAMIC ADMIN & ORTU TABS & MODALS
// ==========================================

let meetTimerInterval = null;
let meetSeconds = 0;

function switchAdminTab(tabId, el, label) {
  // Update nav links
  document.querySelectorAll('#viewAdmin .nav-link').forEach(l => l.classList.remove('active'));
  if (el) {
    el.classList.add('active');
  } else {
    const foundLink = document.querySelector(`#viewAdmin a[onclick*="${tabId}"]`);
    if (foundLink) foundLink.classList.add('active');
  }

  // Hide all admin tab panes
  document.querySelectorAll('.admin-tab-pane').forEach(p => p.classList.remove('active'));

  // Show target tab
  const target = document.getElementById(tabId);
  if (target) {
    target.classList.add('active');
  }

  // Update Breadcrumb
  const breadcrumb = document.getElementById('adminHeaderBreadcrumb');
  if (breadcrumb) {
    const rolePrefix = appState.currentUser?.role === 'orangtua' ? 'Portal Orang Tua' : 'SD Inklusi Pelita Harapan';
    breadcrumb.textContent = `${rolePrefix} • ${label || 'Beranda'}`;
  }

  if (label) {
    speakText(`Membuka ${label}`);
  }
}

function switchOrtuTab(tabId) {
  const map = {
    'ortu-beranda-tab': { id: 'nav-ortu-beranda', label: 'Ringkasan & Beranda' },
    'ortu-perkembangan-tab': { id: 'nav-ortu-perkembangan', label: 'Perkembangan Anak' },
    'ortu-jadwal-tab': { id: 'nav-ortu-jadwal', label: 'Jadwal & Konsultasi Terapis' },
    'ortu-aksesibilitas-tab': { id: 'nav-ortu-aksesibilitas', label: 'Aksesibilitas & Akun' },
    'ortu-langganan-tab': { id: 'nav-ortu-langganan', label: 'Langganan & Pembayaran' }
  };
  const item = map[tabId] || { id: 'nav-ortu-beranda', label: 'Beranda' };
  switchAdminTab(tabId, document.getElementById(item.id), item.label);
}

// Meet Modal
function openMeetModal() {
  const modal = document.getElementById('meetModal');
  if (modal) {
    modal.classList.add('active', 'open');
    meetSeconds = 0;
    clearInterval(meetTimerInterval);
    meetTimerInterval = setInterval(() => {
      meetSeconds++;
      const m = String(Math.floor(meetSeconds / 60)).padStart(2, '0');
      const s = String(meetSeconds % 60).padStart(2, '0');
      const disp = document.getElementById('meetTimerDisplay');
      if (disp) disp.textContent = `⏱️ ${m}:${s}`;
    }, 1000);
    speakText("Terhubung ke ruang konsultasi video meet terenkripsi bersama Ibu Rahma Kartika.");
  }
}

function closeMeetModal() {
  const modal = document.getElementById('meetModal');
  if (modal) modal.classList.remove('active', 'open');
  clearInterval(meetTimerInterval);
}

function toggleMeetMic() {
  const btn = document.getElementById('meetMicBtn');
  if (btn.textContent.includes('Aktif')) {
    btn.textContent = '🔇 Mic: Mute';
    btn.style.background = '#991B1B';
  } else {
    btn.textContent = '🎤 Mic: Aktif';
    btn.style.background = '#374151';
  }
}

function toggleMeetCam() {
  const btn = document.getElementById('meetCamBtn');
  if (btn.textContent.includes('On')) {
    btn.textContent = '📷 Kamera: Off';
    btn.style.background = '#991B1B';
  } else {
    btn.textContent = '📷 Kamera: On';
    btn.style.background = '#374151';
  }
}

function copyMeetLink() {
  navigator.clipboard?.writeText('https://meet.google.com/cor-inklusi-reya');
  alert('✅ Link ruang konsultasi Google Meet berhasil disalin ke clipboard:\nhttps://meet.google.com/cor-inklusi-reya');
}

// Booking Modal
function openBookingModal(type) {
  const modal = document.getElementById('bookingModal');
  if (modal) {
    modal.classList.add('active', 'open');
    if (type === 'reschedule') {
      document.querySelector('#bookingModal h3').textContent = 'Ubah Jadwal Sesi Konsultasi Terapis';
    } else {
      document.querySelector('#bookingModal h3').textContent = 'Jadwalkan Sesi Konsultasi Terapis';
    }
  }
}

function closeBookingModal() {
  const modal = document.getElementById('bookingModal');
  if (modal) modal.classList.remove('active', 'open');
}

function handleBookingSubmit(e) {
  e.preventDefault();
  const spec = document.getElementById('bookingSpecialist').value;
  const date = document.getElementById('bookingDate').value;
  const time = document.getElementById('bookingTime').value;
  closeBookingModal();
  alert(`✅ Jadwal konsultasi berhasil dikonfirmasi!\n\nSpesialis: ${spec}\nTanggal: ${date}\nWaktu: ${time}\n\nLink Google Meet & pengingat telah dikirimkan ke WhatsApp Anda.`);
  speakText("Jadwal konsultasi berhasil disimpan. Sampai jumpa di sesi konsultasi!");
}

// Addon Modal
function openAddonModal() {
  const modal = document.getElementById('addonModal');
  if (modal) modal.classList.add('active', 'open');
}

function closeAddonModal() {
  const modal = document.getElementById('addonModal');
  if (modal) modal.classList.remove('active', 'open');
}

function handleAddonOrder(e) {
  e.preventDefault();
  const addr = document.getElementById('addonAddressInput').value;
  const date = document.getElementById('addonDateInput').value;
  const pay = document.getElementById('addonPaymentMethod').value;
  closeAddonModal();
  alert(`🎉 Pemesanan Sesi Terapis Mandiri (Home Visit) Berhasil!\n\nLokasi: ${addr}\nTanggal Kunjungan: ${date}\nMetode: ${pay}\nTotal: Rp 175.000\n\nTerapis bersertifikasi kami akan hadir tepat waktu.`);
  speakText("Pemesanan sesi terapis mandiri berhasil diproses!");
}

// IEP Detail Modal & Print
function openIepModal(studentName) {
  const modal = document.getElementById('iepDetailModal');
  const title = document.getElementById('modalIepStudentName');
  const body = document.getElementById('modalIepContentBody');
  if (modal) {
    if (title) title.textContent = studentName || 'Reynarif Zidan';
    if (body) {
      body.innerHTML = `
        <div style="background:#F9FAFB; padding:12px; border-radius:10px; margin-bottom:12px;">
          <strong>Sekolah:</strong> SD Inklusi Pelita Harapan • <strong>Tahun Ajaran:</strong> 2026/2027<br>
          <strong>Nama Siswa:</strong> ${studentName || 'Reynarif Zidan'} • <strong>Kelas:</strong> 2-B Inklusi<br>
          <strong>Koordinator GPK:</strong> Rahma Kartika, S.Psi • <strong>Guru Kelas:</strong> Budi Santoso, S.Pd
        </div>
        <h4 style="color:#065F46; font-size:13px; margin:10px 0 4px 0;">1. Profil Diagnostik Awal:</h4>
        <p>Siswa memiliki inteligensi normal dengan hambatan persepsi visual spasial pada huruf kembar (b, d, p, q) dan kecenderungan kelelahan sensori mata saat membaca teks rapat.</p>
        <h4 style="color:#065F46; font-size:13px; margin:10px 0 4px 0;">2. Sasaran Capaian Jangka Pendek (IEP):</h4>
        <ul>
          <li>Mampu membedakan arah perut huruf 'b' dan 'd' dengan akurasi &gt; 85% melalui kanvas kinestetik Cora.</li>
          <li>Menggabungkan 2 suku kata berpola konsonan-vokal (ba, bu, da, du) tanpa jeda kecemasan.</li>
          <li>Menyelesaikan latihan membaca 15 menit mandiri di rumah dengan pendampingan orang tua.</li>
        </ul>
        <h4 style="color:#065F46; font-size:13px; margin:10px 0 4px 0;">3. Akomodasi Khusus yang Diberikan:</h4>
        <p>Penggunaan font Lexend berspasi lega, layar tinting peach bebas silau, pemandu suara otomatis (TTS) saat membaca modul, dan waktu istirahat fleksibel.</p>
      `;
    }
    modal.classList.add('active', 'open');
  }
}

function closeIepModal() {
  const modal = document.getElementById('iepDetailModal');
  if (modal) modal.classList.remove('active', 'open');
}

function printCurrentIepDocument() {
  alert('🖨️ Menyiapkan dokumen IEP resmi berstandar Kemdikbud untuk dicetak...');
  window.print();
}

function generateAndPrintIEP(studentName) {
  openIepModal(studentName);
}

function openReviseIepModal(studentName) {
  const newTarget = prompt(`Masukkan penyesuaian target sasaran belajar untuk ${studentName}:`, 'Penyederhanaan konsep visual perkalian menggunakan blok manipulatif');
  if (newTarget) {
    alert(`✅ Sasaran IEP untuk ${studentName} berhasil diperbarui:\n"${newTarget}"\n\nNotifikasi revisi telah dikirimkan ke orang tua.`);
  }
}

// AI Draft IEP Generator
function runAiIepGenerator() {
  const student = document.getElementById('iepAiStudentSelect').value;
  const focus = document.getElementById('iepAiFocusSelect').value;
  alert(`🤖 AI Cora berhasil men-generate Draft IEP Baru untuk ${student}!\n\nFokus: ${focus}\nRekomendasi Aktivitas: Latihan 10 menit sesi pagi modul 3D Spasial + evaluasi tracing kanvas dua hari sekali.\n\nDraf telah ditambahkan ke antrian persetujuan kepala sekolah.`);
  speakText(`Draft IEP otomatis untuk ${student} berhasil dirancang oleh kecerdasan buatan.`);
}

// Screening Assessment Modal
function openScreeningAssessmentModal(studentName) {
  const modal = document.getElementById('screeningModal');
  if (modal) {
    if (studentName) {
      document.getElementById('screeningStudentNameInput').value = studentName;
    }
    modal.classList.add('active', 'open');
  }
}

function closeScreeningModal() {
  const modal = document.getElementById('screeningModal');
  if (modal) modal.classList.remove('active', 'open');
}

function selectScreeningChoice(btn, letter) {
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function runScreeningCalculation() {
  const name = document.getElementById('screeningStudentNameInput').value;
  closeScreeningModal();
  alert(`📊 Hasil Screening Diagnostik AI untuk ${name}:\n\n• Tingkat Risiko Disleksia: SEDANG (Akurasi Huruf Kembar: 65%)\n• Kecepatan Motorik Tracing: Cukup Baik (72%)\n• Rekomendasi Modul Inklusi: Modul 3D Kinestetik Huruf b vs d\n\nData telah dimasukkan ke dalam daftar bimbingan kelas inklusi.`);
  speakText(`Screening selesai. Hasil diagnostik telah terdata untuk ${name}.`);
}

// Assign Module Modal
function openAssignModuleModal(modulName) {
  const modal = document.getElementById('assignModuleModal');
  const title = document.getElementById('assignModalTitle');
  if (modal) {
    if (title) title.textContent = `Tugaskan: ${modulName}`;
    modal.classList.add('active', 'open');
  }
}

function closeAssignModuleModal() {
  const modal = document.getElementById('assignModuleModal');
  if (modal) modal.classList.remove('active', 'open');
}

function confirmAssignModule() {
  const target = document.getElementById('assignTargetSelect').value;
  closeAssignModuleModal();
  alert(`🚀 Berhasil menugaskan modul ke ${target}!\n\nMateri kini aktif dan akan muncul di beranda tablet siswa secara otomatis.`);
  speakText("Modul berhasil ditugaskan ke tablet siswa.");
}

function toggleModuleClassAccess(modulName, chk) {
  const status = chk.checked ? "Diaktifkan" : "Dinonaktifkan";
  alert(`⚙️ ${modulName} telah ${status} pada tablet kelas.`);
}

// AI Module Idea Generator
function generateAiModuleIdea() {
  const promptText = document.getElementById('aiModulePromptInput').value.trim();
  if (!promptText) {
    alert('Silakan tuliskan ide topik modul terlebih dahulu.');
    return;
  }
  alert(`✨ Ide Modul Inklusi AI Berhasil Dirancang!\n\nTopik: "${promptText}"\n\nStruktur Modul:\n1. Pengenalan Karakter & Dongeng Suara Cora (3 Mnt)\n2. Wahana Tracing Layar Sentuh Berbintang (5 Mnt)\n3. Kuis Tebak Rima Bergambar Tanpa Tekanan (4 Mnt)\n\nRancangan telah disimpan ke draf katalog modul.`);
  speakText("Rancangan modul inklusi berhasil dibuat oleh asisten AI.");
}

// Ortu Actions
function sendOrtuReply() {
  const input = document.getElementById('ortuQuickReplyInput');
  const val = input.value.trim();
  if (!val) {
    alert('Silakan tuliskan pesan balasan.');
    return;
  }
  input.value = '';
  alert(`✉️ Pesan Anda berhasil dikirim ke Ibu Rahma & Pak Budi:\n"${val}"`);
  speakText("Pesan balasan Anda telah terkirim ke tim guru sekolah.");
}

function openAdjustTimeModal() {
  const modal = document.getElementById('adjustTimeModal');
  if (modal) modal.classList.add('active', 'open');
}

function closeAdjustTimeModal() {
  const modal = document.getElementById('adjustTimeModal');
  if (modal) modal.classList.remove('active', 'open');
}

function saveTimeLimit() {
  const val = document.getElementById('timeLimitSelect').value;
  closeAdjustTimeModal();
  alert(`✅ Batas waktu belajar harian anak berhasil diatur ke ${val} Menit / Hari.`);
}

function toggleTimeLimit(chk) {
  alert(chk.checked ? "Batas sesi belajar 30 menit per hari aktif." : "Batas sesi belajar dinonaktifkan.");
}

// Live Typography & Accessibility Preview
function changeCustomFont(fontName) {
  const preview = document.getElementById('liveTypographyPreview');
  if (preview) preview.style.fontFamily = `'${fontName}', sans-serif`;

  document.querySelectorAll('#fontBtnLexend, #fontBtnComic, #fontBtnOpenDyslexic').forEach(b => b.classList.remove('active'));
  if (fontName === 'Lexend') document.getElementById('fontBtnLexend')?.classList.add('active');
  if (fontName === 'Comic Neue') document.getElementById('fontBtnComic')?.classList.add('active');
  if (fontName === 'sans-serif') document.getElementById('fontBtnOpenDyslexic')?.classList.add('active');

  speakText(`Font diubah ke ${fontName}`);
}

function changeIrlenTint(colorHex, btn) {
  const preview = document.getElementById('liveTypographyPreview');
  if (preview) preview.style.backgroundColor = colorHex;

  if (btn && btn.parentElement) {
    btn.parentElement.querySelectorAll('button').forEach(b => {
      b.style.border = 'none';
      b.classList.remove('active');
    });
    btn.style.border = '2px solid #0D5C3A';
    btn.classList.add('active');
  }

  // Also adjust document body if user wants full experience
  document.body.style.backgroundColor = colorHex;
}

function toggleReadingRuler(chk) {
  let bar = document.getElementById('readingRulerBar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'readingRulerBar';
    document.body.appendChild(bar);
    window.addEventListener('mousemove', (e) => {
      if (bar.style.display === 'block') {
        bar.style.top = `${e.clientY - 14}px`;
      }
    });
  }

  if (chk.checked) {
    bar.style.display = 'block';
    speakText("Garis pandu bacaan diaktifkan. Garis akan mengikuti kursor mouse Anda.");
  } else {
    bar.style.display = 'none';
    speakText("Garis pandu bacaan dinonaktifkan.");
  }
}

function selectVoiceCharacter(charKey) {
  if (charKey === 'cora') speakText("Halo! Aku Cora Ceria, siap menemani petualangan belajar!");
  if (charKey === 'guru') speakText("Selamat pagi anak hebat, mari kita baca huruf bersama dengan tenang.");
  if (charKey === 'audio') speakText("Suara frekuensi rendah diaktifkan untuk kenyamanan indra pendengaran.");
}

function testCoraVoice() {
  speakText("Halo Ayah dan Bunda! Ini adalah contoh suara pemandu belajar Cora Kids yang ramah disleksia.");
}

function saveChildPin() {
  const val = document.getElementById('newChildPinInput').value.trim();
  if (val.length === 4) {
    alert(`✅ PIN Masuk Siswa berhasil diubah menjadi: ${val}`);
    speakText("PIN baru berhasil disimpan.");
  } else {
    alert("PIN harus terdiri dari 4 digit angka.");
  }
}

function saveAccessibilityPrefs() {
  alert("✅ Seluruh preferensi aksesibilitas & sensori visual berhasil disimpan dan disinkronkan ke tablet anak!");
  speakText("Pengaturan aksesibilitas berhasil disimpan.");
}

function downloadReport(type) {
  const filename = `${type}_cora_inclusive_report.pdf`;
  alert(`📥 Mengunduh dokumen resmi: ${filename}\n\nDokumen terverifikasi format PDF siap dicetak.`);
}

function openTeacherMessageModal() {
  const msg = prompt('Ketikkan pesan langsung untuk Guru Pendamping Khusus (Ibu Rahma / Pak Budi):', 'Halo Bu Rahma, saya ingin menanyakan perkembangan latihan huruf kembar Reya sore ini.');
  if (msg) {
    alert(`✉️ Pesan Anda telah terkirim ke Ibu Rahma:\n"${msg}"`);
  }
}

// Filters for IEP & Modules
function filterIepCards(category, btn) {
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const cards = document.querySelectorAll('.iep-student-card');
  cards.forEach(card => {
    const cat = card.getAttribute('data-category') || '';
    if (category === 'all' || cat.includes(category)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function searchIepList(query) {
  const q = query.toLowerCase();
  const cards = document.querySelectorAll('.iep-student-card');
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(q) ? 'block' : 'none';
  });
}

function filterModuleCatalog(category, btn) {
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const items = document.querySelectorAll('.module-card-item');
  items.forEach(item => {
    const cat = item.getAttribute('data-category') || '';
    if (category === 'all' || cat.includes(category)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

function setPerkembanganFilter(period, btn) {
  btn.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  speakText(`Menampilkan data capaian periode ${period}`);
}
