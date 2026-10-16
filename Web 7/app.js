const SEED = {
  accounts: [
    { id: "mhs-24071", name: "Nara Putri", role: "mahasiswa", email: "nara.putri@awan.test", password: "awan-demo" },
    { id: "mhs-24086", name: "Bima Adikara", role: "mahasiswa", email: "bima.adikara@awan.test", password: "awan-demo" },
    { id: "dsn-0042", name: "Dr. Saka Wibowo", role: "dosen", email: "saka.wibowo@awan.test", password: "awan-demo" },
    { id: "adm-0001", name: "Laras Mahendra", role: "admin", email: "laras.admin@awan.test", password: "awan-demo" }
  ],
  grades: [
    { studentId: "mhs-24071", course: "Interaksi Manusia & Komputer", code: "IF204", lecturer: "Dr. Saka Wibowo", score: 92, letter: "A", term: "2026 / Genap" },
    { studentId: "mhs-24071", course: "Basis Data Lanjut", code: "IF212", lecturer: "Nia Pramesti, M.Kom.", score: 86, letter: "A-", term: "2026 / Genap" },
    { studentId: "mhs-24071", course: "Rekayasa Perangkat Lunak", code: "IF220", lecturer: "Dimas Ardi, M.T.", score: 88, letter: "A-", term: "2026 / Genap" },
    { studentId: "mhs-24086", course: "Interaksi Manusia & Komputer", code: "IF204", lecturer: "Dr. Saka Wibowo", score: 78, letter: "B+", term: "2026 / Genap" },
    { studentId: "mhs-24086", course: "Basis Data Lanjut", code: "IF212", lecturer: "Nia Pramesti, M.Kom.", score: 81, letter: "A-", term: "2026 / Genap" }
  ],
  assignments: [
    { id: "tgs-301", course: "Interaksi Manusia & Komputer", title: "Audit pengalaman pengguna", due: "20 Okt 2026", status: "Dalam pengerjaan", studentId: "mhs-24071", file: "" },
    { id: "tgs-302", course: "Basis Data Lanjut", title: "Rancangan skema perpustakaan", due: "22 Okt 2026", status: "Belum dikumpulkan", studentId: "mhs-24071", file: "" },
    { id: "tgs-303", course: "Rekayasa Perangkat Lunak", title: "Prototipe aplikasi kelompok", due: "26 Okt 2026", status: "Terkumpul", studentId: "mhs-24071", file: "prototipe-nara.pdf" },
    { id: "tgs-304", course: "Interaksi Manusia & Komputer", title: "Audit pengalaman pengguna", due: "20 Okt 2026", status: "Terkumpul", studentId: "mhs-24086", file: "audit-bima.pdf" }
  ],
  discussions: [
    { id: "dsk-61", authorId: "mhs-24086", course: "Interaksi Manusia & Komputer", text: "Ada yang mau diskusi soal heuristik Nielsen? Aku masih bingung bedain visibility of system status dan match with real world.", time: "12 menit lalu", likes: 3 },
    { id: "dsk-60", authorId: "dsn-0042", course: "Interaksi Manusia & Komputer", text: "Pengingat: sesi konsultasi proyek hari Kamis pindah ke Lab Kreatif lantai 3, pukul 13.00 WIB.", time: "1 jam lalu", likes: 7 },
    { id: "dsk-59", authorId: "mhs-24071", course: "Basis Data Lanjut", text: "Sudah unggah ringkasan normalisasi sampai BCNF di materi minggu ini. Semoga membantu!", time: "Kemarin", likes: 2 }
  ]
};

const ROLE_LABELS = { mahasiswa: "Mahasiswa", dosen: "Dosen", admin: "Administrator" };
const NAV_ITEMS = [
  { id: "home", label: "Beranda", icon: "⌂", roles: ["mahasiswa", "dosen", "admin"] },
  { id: "grades", label: "Nilai akademik", icon: "▤", roles: ["mahasiswa"] },
  { id: "assignments", label: "Tugas & materi", icon: "▣", roles: ["mahasiswa", "dosen"] },
  { id: "discussion", label: "Ruang diskusi", icon: "◉", count: "3", roles: ["mahasiswa", "dosen"] },
  { id: "grading", label: "Penilaian", icon: "✓", roles: ["dosen"] },
  { id: "accounts", label: "Kelola akun", icon: "♙", roles: ["admin"] }
];

const storage = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(`ruangkita-${key}`)) ?? structuredClone(fallback); }
    catch (error) { console.error(`Gagal membaca ${key} dari penyimpanan lokal.`, error); return structuredClone(fallback); }
  },
  set(key, value) {
    try { localStorage.setItem(`ruangkita-${key}`, JSON.stringify(value)); }
    catch (error) { console.error(`Gagal menyimpan ${key}.`, error); toast("Data gagal disimpan di browser ini."); }
  }
};

let accounts = storage.get("accounts", SEED.accounts);
let grades = storage.get("grades", SEED.grades);
let assignments = storage.get("assignments", SEED.assignments);
let discussions = storage.get("discussions", SEED.discussions);
let currentUser = accounts.find((account) => account.id === sessionStorage.getItem("ruangkita-current-user")) || null;
let activeSection = "home";
let searchTerm = "";

const $ = (selector, root = document) => root.querySelector(selector);
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const initials = (name) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const displayName = (id) => accounts.find((account) => account.id === id)?.name || "Akun kampus";
const saveData = (key, value) => { storage.set(key, value); };

function openFileStore() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ruangkita-files", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("uploads");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Tidak dapat membuka penyimpanan berkas."));
  });
}

async function saveUploadedFile(assignmentId, file) {
  const database = await openFileStore();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction("uploads", "readwrite");
    transaction.objectStore("uploads").put(file, assignmentId);
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Tidak dapat menyimpan berkas."));
    transaction.onabort = () => reject(transaction.error || new Error("Penyimpanan berkas dibatalkan."));
  });
  database.close();
}

async function downloadUploadedFile(assignmentId, filename) {
  const database = await openFileStore();
  const file = await new Promise((resolve, reject) => {
    const transaction = database.transaction("uploads", "readonly");
    const request = transaction.objectStore("uploads").get(assignmentId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Tidak dapat membaca berkas."));
  });
  database.close();
  if (!(file instanceof Blob)) { toast("Berkas ini hanya berupa data contoh dan tidak memiliki isi unduhan."); return; }
  const link = document.createElement("a");
  const url = URL.createObjectURL(file);
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function toast(message) {
  const region = $("#toast-region");
  const element = document.createElement("div");
  element.className = "toast";
  element.textContent = message;
  region.append(element);
  window.setTimeout(() => element.remove(), 2800);
}

function showLogin() {
  document.body.insertAdjacentHTML("beforeend", `
    <div class="login-screen" id="login-screen">
      <div class="login-card">
        <a class="brand" href="#"><span class="brand-mark">rk<span>.</span></span><span class="brand-name">ruang<span>kita</span></span></a>
        <p class="eyebrow">PORTAL AKADEMIK UNIVERSITAS AWAN</p>
        <h1>Senang melihatmu lagi!</h1>
        <p class="subheading">Masuk dan lanjutkan perjalanan belajarmu hari ini.</p>
        <form id="login-form">
          <label>Email kampus<input name="email" type="email" placeholder="nama@awan.test" autocomplete="username" required></label>
          <label>Kata sandi<input name="password" type="password" placeholder="Masukkan kata sandi" autocomplete="current-password" required></label>
          <button class="primary-button" type="submit">Masuk ke portal <span>→</span></button>
        </form>
        <div class="demo-hint"><b>Akun demo</b> (semua kata sandi: <code>awan-demo</code>)<br>Mahasiswa: nara.putri@awan.test · Dosen: saka.wibowo@awan.test · Admin: laras.admin@awan.test</div>
      </div>
    </div>`);
  $("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const found = accounts.find((account) => account.email === form.get("email") && account.password === form.get("password"));
    if (!found) { toast("Email atau kata sandi tidak cocok."); return; }
    currentUser = found;
    sessionStorage.setItem("ruangkita-current-user", found.id);
    $("#login-screen").remove();
    render();
  });
  document.querySelectorAll("[data-download]").forEach((button) => button.addEventListener("click", async () => {
    try { await downloadUploadedFile(button.dataset.download, button.dataset.filename); }
    catch (error) { console.error("Gagal mengunduh berkas tugas.", error); toast("Berkas tidak dapat dibuka dari penyimpanan browser."); }
  }));
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem("ruangkita-current-user");
  $("#login-screen")?.remove();
  showLogin();
}

function renderNav() {
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(currentUser.role));
  $("#main-nav").className = "nav-list";
  $("#main-nav").innerHTML = visibleItems.map((item) => `<button type="button" class="nav-item ${activeSection === item.id ? "active" : ""}" data-section="${item.id}"><span class="nav-icon">${item.icon}</span>${item.label}${item.count ? `<span class="nav-count">${item.count}</span>` : ""}</button>`).join("");
  $("#main-nav").querySelectorAll("[data-section]").forEach((button) => button.addEventListener("click", () => { activeSection = button.dataset.section; render(); }));
  $("#profile-card").innerHTML = `<span class="avatar">${escapeHTML(initials(currentUser.name))}</span><span class="profile-info"><strong>${escapeHTML(currentUser.name)}</strong><small>${ROLE_LABELS[currentUser.role]} · ${escapeHTML(currentUser.id)}</small></span><button class="profile-menu" id="logout-button" aria-label="Keluar" title="Keluar">↪</button>`;
  $("#logout-button").addEventListener("click", logout);
  const alternatives = accounts.filter((account) => account.id !== currentUser.id);
  $("#account-switcher").hidden = true;
  $("#role-toggle").setAttribute("aria-expanded", "false");
  $("#account-switcher").innerHTML = alternatives.map((account) => `<button type="button" class="account-option" data-account="${escapeHTML(account.id)}"><span class="avatar">${escapeHTML(initials(account.name))}</span><span><strong>${escapeHTML(account.name)}</strong><small>${ROLE_LABELS[account.role]}</small></span></button>`).join("");
  $("#account-switcher").querySelectorAll("[data-account]").forEach((button) => button.addEventListener("click", () => {
    currentUser = accounts.find((account) => account.id === button.dataset.account);
    sessionStorage.setItem("ruangkita-current-user", currentUser.id);
    activeSection = "home";
    render();
  }));
  const current = visibleItems.find((item) => item.id === activeSection);
  if (!current) activeSection = "home";
  $("#current-section").textContent = visibleItems.find((item) => item.id === activeSection)?.label || "Beranda";
}

function header(title, subtitle, action = "") {
  return `<div class="welcome-row"><div><p class="eyebrow">RUANG BELAJAR, RUANG BERTUMBUH</p><h1>${title}</h1><p class="subheading">${subtitle}</p></div>${action}</div>`;
}

function stat(icon, label, value, note = "", color = "") {
  return `<div class="stat-card"><span class="stat-icon ${color}">${icon}</span><div><p class="stat-label">${label}</p><div class="stat-value">${value}<span class="stat-note">${note}</span></div></div></div>`;
}

function homePage() {
  const roleGreeting = currentUser.role === "mahasiswa" ? "Siap menaklukkan minggu ini," : currentUser.role === "dosen" ? "Selamat datang kembali," : "Semua berjalan lancar,";
  const roleSub = currentUser.role === "mahasiswa" ? "Satu langkah kecil hari ini, satu pencapaian besar nanti." : currentUser.role === "dosen" ? "Pantau kelas dan bantu mahasiswa terus berkembang." : "Ringkasan aktivitas portal kampus hari ini.";
  const roleStats = currentUser.role === "mahasiswa"
    ? `${stat("▤","IPK SEMENTARA","3.82","/ 4.00","purple")}${stat("▣","TUGAS AKTIF","3","tugas")}${stat("✓","KELAS DIIKUTI","5","semester ini","green")}${stat("◷","KEHADIRAN","96%","+2.4%","yellow")}`
    : currentUser.role === "dosen"
      ? `${stat("▤","KELAS DIAJAR","3","kelas","purple")}${stat("▣","TUGAS DINILAI","12","perlu diperiksa")}${stat("✓","MAHASISWA","84","aktif","green")}${stat("◷","DISKUSI BARU","3","hari ini","yellow")}`
      : `${stat("♙","AKUN AKTIF",accounts.length,"pengguna","purple")}${stat("▣","KELAS BERJALAN","12","semester ini")}${stat("✓","DOSEN","8","terdaftar","green")}${stat("◷","MAHASISWA",accounts.filter((a) => a.role === "mahasiswa").length,"terdaftar","yellow")}`;
  const courseData = currentUser.role === "mahasiswa"
    ? [{ icon: "✳", cls: "", name: "Interaksi Manusia & Komputer", meta: "IF204 · Dr. Saka Wibowo", progress: 72, detail: "Minggu 10 / 14" }, { icon: "⌘", cls: "purple", name: "Basis Data Lanjut", meta: "IF212 · Nia Pramesti, M.Kom.", progress: 55, detail: "Minggu 8 / 14" }, { icon: "◈", cls: "mint", name: "Rekayasa Perangkat Lunak", meta: "IF220 · Dimas Ardi, M.T.", progress: 81, detail: "Minggu 11 / 14" }]
    : [{ icon: "✳", cls: "", name: "Interaksi Manusia & Komputer", meta: "IF204 · 32 mahasiswa", progress: 72, detail: "3 tugas aktif" }, { icon: "⌘", cls: "purple", name: "Studio Desain Digital", meta: "DK115 · 26 mahasiswa", progress: 55, detail: "1 tugas aktif" }, { icon: "◈", cls: "mint", name: "Metodologi Riset", meta: "IF310 · 26 mahasiswa", progress: 81, detail: "2 tugas aktif" }];
  const activities = [{ color: "", text: "<b>Nilai baru tersedia</b> untuk tugas Audit UX", time: "Basis Data Lanjut · 2 jam lalu" }, { color: "purple", text: "<b>Diskusi baru</b> di Interaksi Manusia & Komputer", time: "12 menit lalu" }, { color: "green", text: "<b>Pengingat kelas</b> Metodologi Riset dimulai besok", time: "Kemarin" }];
  return `${header(`${roleGreeting} ${escapeHTML(currentUser.name.split(" ")[0])} <span>✦</span>`, roleSub, `<div class="date-pill"><b>◷</b> Jumat, 16 Oktober 2026</div>`)}
    <section class="hero-card"><div class="hero-copy"><p class="eyebrow">SEMESTER GENAP 2026</p><h2>${currentUser.role === "mahasiswa" ? "Belajar lebih seru bareng teman!" : "Bikin ruang belajar lebih hidup!"}</h2><p>${currentUser.role === "mahasiswa" ? "Bagikan insight, tanya dosen, dan temukan jawaban di ruang diskusi kampus." : "Kolaborasi dan diskusi aktif bikin setiap kelas jadi pengalaman bermakna."}</p><button type="button" class="hero-button" data-go="discussion">Jelajahi diskusi <span>→</span></button></div><div class="hero-illustration">✎</div></section>
    <section class="stats-grid">${roleStats}</section>
    <div class="content-grid"><section class="panel"><div class="panel-heading"><h3>${currentUser.role === "admin" ? "Ringkasan kampus" : "Kelas saya"}</h3><button type="button" class="text-link" data-go="${currentUser.role === "admin" ? "accounts" : "assignments"}">Lihat semua →</button></div><div class="course-list">${courseData.map((course) => `<div class="course-row"><span class="course-icon ${course.cls}">${course.icon}</span><div><p class="course-title">${course.name}</p><p class="course-meta">${course.meta}</p></div><div class="progress-label">${course.detail}<div class="progress-track"><div class="progress-fill" style="width:${course.progress}%"></div></div></div></div>`).join("")}</div></section>
      <section class="panel"><div class="panel-heading"><h3>Aktivitas terbaru</h3><button type="button" class="text-link" data-go="discussion">Lihat semua</button></div><div class="activity-list">${activities.map((activity) => `<div class="activity-row"><span class="activity-dot ${activity.color}"></span><p>${activity.text}<small>${activity.time}</small></p></div>`).join("")}</div></section></div>`;
}

function gradesPage() {
  const requestedId = new URLSearchParams(location.search).get("student") || currentUser.id;
  // Training weakness: studentId in the URL is trusted without checking the logged-in user's authorization.
  const rows = grades.filter((grade) => grade.studentId === requestedId);
  return `${header("Nilai akademik", "Pantau hasil belajarmu di setiap mata kuliah.", `<div class="date-pill"><b>◷</b> Semester Genap · 2026</div>`)}
    ${requestedId !== currentUser.id ? `<div class="info-note">Tampilan nilai untuk ID <b>${escapeHTML(requestedId)}</b> (akun aktif: ${escapeHTML(currentUser.id)}). Demo ID lain: mhs-24071 atau mhs-24086.</div>` : ""}
    <section class="stats-grid">${stat("✦","IPK SEMESTER","3.82","/ 4.00","purple")}${stat("✓","MATA KULIAH","5","diambil","green")}${stat("↗","NILAI TERTINGGI","92","poin")}${stat("◷","SKS LULUS","18","semester ini","yellow")}</section>
    <div class="section-toolbar"><h3>Hasil perkuliahan</h3><button type="button" class="secondary-button" id="grades-export">↓ &nbsp;Unduh rekap</button></div>
    <div class="table-wrap"><table><thead><tr><th>MATA KULIAH</th><th>DOSEN PENGAMPU</th><th>SEMESTER</th><th>NILAI ANGKA</th><th>HURUF</th></tr></thead><tbody>${rows.length ? rows.map((row) => `<tr><td><b>${escapeHTML(row.course)}</b><br><small>${escapeHTML(row.code)}</small></td><td>${escapeHTML(row.lecturer)}</td><td>${escapeHTML(row.term)}</td><td>${row.score}</td><td><span class="grade-badge">${escapeHTML(row.letter)}</span></td></tr>`).join("") : `<tr><td colspan="5" class="empty-state">Belum ada nilai untuk ID ini.</td></tr>`}</tbody></table></div>`;
}

function assignmentsPage() {
  const ownAssignments = currentUser.role === "dosen" ? assignments : assignments.filter((assignment) => assignment.studentId === currentUser.id);
  return `${header(currentUser.role === "dosen" ? "Tugas & pengumpulan" : "Tugas & materi", currentUser.role === "dosen" ? "Pantau tugas yang dikumpulkan mahasiswa." : "Semua tugas dan materi kelasmu, tersusun rapi.")}
    <div class="section-toolbar"><h3>${currentUser.role === "dosen" ? "Pengumpulan mahasiswa" : "Daftar tugas"}</h3>${currentUser.role === "mahasiswa" ? `<button type="button" class="primary-button" id="upload-trigger">↑ &nbsp;Unggah tugas</button>` : ""}</div>
    ${currentUser.role === "mahasiswa" ? `<form id="upload-form" class="inline-form" hidden><label class="subheading" for="upload-file">Pilih berkas tugas (maks. 10 MB, nama berkas):</label><input id="upload-file" type="file"><select id="upload-assignment">${ownAssignments.map((assignment) => `<option value="${escapeHTML(assignment.id)}">${escapeHTML(assignment.title)} · ${escapeHTML(assignment.course)}</option>`).join("")}</select><div class="form-actions"><button class="secondary-button" type="button" id="upload-cancel">Batal</button><button class="primary-button" type="submit">Simpan pengumpulan</button></div></form>` : ""}
    <div class="table-wrap"><table><thead><tr><th>TUGAS</th><th>MATA KULIAH</th>${currentUser.role === "dosen" ? "<th>MAHASISWA</th>" : ""}<th>TENGGAT</th><th>STATUS</th><th>BERKAS</th></tr></thead><tbody>${ownAssignments.map((item) => `<tr><td><b>${escapeHTML(item.title)}</b></td><td>${escapeHTML(item.course)}</td>${currentUser.role === "dosen" ? `<td>${escapeHTML(displayName(item.studentId))}</td>` : ""}<td>${escapeHTML(item.due)}</td><td><span class="status-badge ${item.status === "Belum dikumpulkan" ? "pending" : ""}">${escapeHTML(item.status)}</span></td><td>${item.fileKey ? `<button class="text-link" type="button" data-download="${escapeHTML(item.id)}" data-filename="${escapeHTML(item.file)}">${escapeHTML(item.file)}</button>` : escapeHTML(item.file || "—")}</td></tr>`).join("")}</tbody></table></div>`;
}

function discussionPage() {
  const filtered = discussions.filter((item) => `${item.course} ${item.text} ${displayName(item.authorId)}`.toLowerCase().includes(searchTerm.toLowerCase()));
  return `${header("Ruang diskusi", "Tanya, berbagi, dan belajar bareng komunitas kampus.")}
    <div class="section-toolbar"><h3>Obrolan terbaru <span class="nav-count">${discussions.length}</span></h3><button type="button" class="primary-button" id="new-post">＋ &nbsp;Mulai diskusi</button></div>
    <form id="discussion-form" class="inline-form" hidden><select name="course"><option>Interaksi Manusia & Komputer</option><option>Basis Data Lanjut</option><option>Rekayasa Perangkat Lunak</option></select><textarea name="text" placeholder="Tulis pertanyaan atau insight kamu..." required></textarea><div class="form-actions"><button class="secondary-button" type="button" id="post-cancel">Batal</button><button class="primary-button" type="submit">Terbitkan diskusi</button></div></form>
    <div class="discussion-list">${filtered.length ? filtered.map((item) => `<article class="discussion-card"><div class="discussion-author"><span class="avatar">${escapeHTML(initials(displayName(item.authorId)))}</span><span><strong>${escapeHTML(displayName(item.authorId))}</strong><small>${escapeHTML(item.course)} · ${escapeHTML(item.time)}</small></span></div><p class="discussion-message">${item.text}</p><div class="discussion-footer"><button type="button" data-like="${escapeHTML(item.id)}">♡ &nbsp;${item.likes} suka</button><button type="button" data-reply="${escapeHTML(item.id)}">↩ &nbsp;Balas</button></div></article>`).join("") : `<div class="empty-state">Belum ada diskusi yang cocok dengan pencarianmu.</div>`}</div>`;
}

function gradingPage() {
  const submissions = assignments.filter((assignment) => assignment.file);
  return `${header("Penilaian tugas", "Berikan umpan balik dan nilai untuk hasil kerja mahasiswa.")}
    <div class="info-note">Pilih aksi nilai pada tugas untuk memperbarui nilai mahasiswa di daftar nilai.</div>
    <div class="section-toolbar"><h3>Tugas terkumpul</h3></div>
    <div class="table-wrap"><table><thead><tr><th>MAHASISWA</th><th>TUGAS</th><th>MATA KULIAH</th><th>BERKAS</th><th>AKSI</th></tr></thead><tbody>${submissions.map((item) => `<tr><td><b>${escapeHTML(displayName(item.studentId))}</b></td><td>${escapeHTML(item.title)}</td><td>${escapeHTML(item.course)}</td><td>${escapeHTML(item.file)}</td><td><form class="grade-form" data-assignment="${escapeHTML(item.id)}"><input aria-label="Nilai untuk ${escapeHTML(displayName(item.studentId))}" name="score" type="number" min="0" max="100" required value="${grades.find((grade) => grade.studentId === item.studentId && grade.course === item.course)?.score ?? ""}"><button class="secondary-button" type="submit">Simpan</button></form></td></tr>`).join("")}</tbody></table></div>`;
}

function accountsPage() {
  return `${header("Kelola akun", "Atur akses dan profil warga Universitas Awan.")}
    <div class="section-toolbar"><h3>Semua akun <span class="nav-count">${accounts.length}</span></h3><button class="primary-button" type="button" id="account-add">＋ &nbsp;Tambah akun</button></div>
    <div class="info-note">Akun ini hanya disimpan di browser lokal sebagai data sintetis untuk latihan.</div>
    <form id="account-form" class="inline-form" hidden><input name="name" placeholder="Nama lengkap" required><input name="email" type="email" placeholder="email@awan.test" required><select name="role"><option value="mahasiswa">Mahasiswa</option><option value="dosen">Dosen</option><option value="admin">Administrator</option></select><div class="form-actions"><button class="secondary-button" type="button" id="account-cancel">Batal</button><button class="primary-button" type="submit">Buat akun</button></div></form>
    <div class="table-wrap"><table><thead><tr><th>NAMA</th><th>ID AKUN</th><th>EMAIL</th><th>PERAN</th><th>AKSI</th></tr></thead><tbody>${accounts.map((account) => `<tr><td><b>${escapeHTML(account.name)}</b></td><td>${escapeHTML(account.id)}</td><td>${escapeHTML(account.email)}</td><td><span class="status-badge open">${ROLE_LABELS[account.role]}</span></td><td><button class="secondary-button" type="button" data-delete="${escapeHTML(account.id)}" ${account.id === currentUser.id ? "disabled" : ""}>Hapus</button></td></tr>`).join("")}</tbody></table></div>`;
}

function renderPage() {
  const renderers = { home: homePage, grades: gradesPage, assignments: assignmentsPage, discussion: discussionPage, grading: gradingPage, accounts: accountsPage };
  $("#page-content").innerHTML = renderers[activeSection]?.() || homePage();
  wirePageActions();
}

function wirePageActions() {
  document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => { activeSection = button.dataset.go; render(); }));
  $("#new-post")?.addEventListener("click", () => { $("#discussion-form").hidden = false; $("#discussion-form textarea").focus(); });
  $("#post-cancel")?.addEventListener("click", () => { $("#discussion-form").hidden = true; });
  $("#discussion-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    discussions.unshift({ id: `dsk-${Date.now()}`, authorId: currentUser.id, course: form.get("course"), text: String(form.get("text")), time: "Baru saja", likes: 0 });
    saveData("discussions", discussions);
    render();
    toast("Diskusimu berhasil diterbitkan.");
  });
  document.querySelectorAll("[data-like]").forEach((button) => button.addEventListener("click", () => {
    const post = discussions.find((item) => item.id === button.dataset.like);
    if (!post) return;
    post.likes += 1;
    saveData("discussions", discussions);
    render();
  }));
  document.querySelectorAll("[data-reply]").forEach((button) => button.addEventListener("click", () => { activeSection = "discussion"; $("#global-search").focus(); toast("Balasan diskusi: tulis pesanmu melalui Mulai diskusi."); }));
  $("#upload-trigger")?.addEventListener("click", () => { $("#upload-form").hidden = false; });
  $("#upload-cancel")?.addEventListener("click", () => { $("#upload-form").hidden = true; });
  $("#upload-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = $("#upload-file").files[0];
    if (!file) { toast("Pilih berkas terlebih dahulu."); return; }
    if (file.size > 10 * 1024 * 1024) { toast("Berkas melebihi batas demo 10 MB."); return; }
    const assignment = assignments.find((item) => item.id === $("#upload-assignment").value);
    if (!assignment) { toast("Tugas tidak ditemukan."); return; }
    try {
      await saveUploadedFile(assignment.id, file);
    } catch (error) {
      console.error("Gagal menyimpan berkas tugas.", error);
      toast("Berkas gagal disimpan di browser ini.");
      return;
    }
    assignment.file = file.name;
    assignment.fileKey = true;
    assignment.status = "Terkumpul";
    saveData("assignments", assignments);
    render();
    toast("Berkas tugas berhasil disimpan di browser.");
  });
  document.querySelectorAll(".grade-form").forEach((formElement) => formElement.addEventListener("submit", (event) => {
    event.preventDefault();
    const assignment = assignments.find((item) => item.id === formElement.dataset.assignment);
    if (!assignment) { toast("Tugas tidak ditemukan."); return; }
    const studentId = assignment.studentId;
    const score = Number(new FormData(formElement).get("score"));
    if (!Number.isInteger(score) || score < 0 || score > 100) { toast("Nilai harus berupa angka bulat 0–100."); return; }
    const grade = grades.find((item) => item.studentId === studentId && item.course === assignment.course);
    if (grade) { grade.score = score; grade.letter = score >= 90 ? "A" : score >= 85 ? "A-" : score >= 80 ? "B+" : "B"; }
    if (assignment) { assignment.status = `Dinilai · ${score}`; }
    saveData("grades", grades);
    saveData("assignments", assignments);
    render();
    toast(`Nilai ${score} berhasil disimpan.`);
  }));
  $("#account-add")?.addEventListener("click", () => { $("#account-form").hidden = false; });
  $("#account-cancel")?.addEventListener("click", () => { $("#account-form").hidden = true; });
  $("#account-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim().toLowerCase();
    if (accounts.some((account) => account.email === email)) { toast("Email tersebut sudah digunakan."); return; }
    const prefix = form.get("role") === "mahasiswa" ? "mhs" : form.get("role") === "dosen" ? "dsn" : "adm";
    const id = `${prefix}-${Math.floor(10000 + Math.random() * 89999)}`;
    accounts.push({ id, name: String(form.get("name")).trim(), email, role: String(form.get("role")), password: "awan-demo" });
    saveData("accounts", accounts);
    render();
    toast("Akun sintetis berhasil dibuat. Kata sandi awal: awan-demo.");
  });
  document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.delete === currentUser.id || !window.confirm(`Hapus akun ${displayName(button.dataset.delete)}?`)) return;
    accounts = accounts.filter((account) => account.id !== button.dataset.delete);
    saveData("accounts", accounts);
    render();
    toast("Akun dihapus.");
  }));
  $("#grades-export")?.addEventListener("click", () => toast("Rekap demo: gunakan tabel nilai yang terlihat."));
}

function render() {
  if (!currentUser) { showLogin(); return; }
  renderNav();
  $("#page-content").innerHTML = "";
  renderPage();
}

$("#role-toggle").addEventListener("click", () => {
  const menu = $("#account-switcher");
  menu.hidden = !menu.hidden;
  $("#role-toggle").setAttribute("aria-expanded", String(!menu.hidden));
});

$("#global-search").addEventListener("input", (event) => {
  searchTerm = event.target.value;
  if (activeSection === "discussion") renderPage();
});

render();
