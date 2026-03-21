/**
 * auth.js — ระบบ Login ด้วย PIN/Password
 * ไม่ใช้ backend — เก็บ session ใน sessionStorage
 * เหมาะสำหรับ intranet / hospital internal use
 *
 * วิธีใช้: เพิ่ม role ใน CONFIG.AUTH.users ใน config.js
 */

const Auth = (() => {
  const SESSION_KEY = "mnrh_risk_auth";

  // ดึง session ปัจจุบัน
  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
    } catch { return null; }
  }

  // บันทึก session
  function setSession(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      ...user,
      loginAt: Date.now(),
    }));
  }

  // ล้าง session (logout)
  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  // ตรวจสอบว่า Login อยู่หรือเปล่า
  function isLoggedIn() {
    const s = getSession();
    if (!s) return false;
    // Session หมดอายุหลัง 8 ชั่วโมง
    const EIGHT_HOURS = 8 * 60 * 60 * 1000;
    if (Date.now() - s.loginAt > EIGHT_HOURS) {
      clearSession();
      return false;
    }
    return true;
  }

  // ตรวจสอบ role
  function hasRole(role) {
    const s = getSession();
    if (!s) return false;
    if (s.role === "admin") return true;
    return s.role === role;
  }

  // Login
  function login(username, password) {
    const users = CONFIG.AUTH?.users || [];
    const user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase()
         && u.password === password
    );
    if (user) {
      setSession({ username: user.username, role: user.role, name: user.name });
      return { ok: true, user };
    }
    return { ok: false, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  return { isLoggedIn, hasRole, getSession, login, clearSession };
})();

// ---- UI: สร้างหน้า Login overlay ----
function renderLoginScreen() {
  const overlay = document.createElement("div");
  overlay.id = "login-overlay";
  overlay.innerHTML = `
    <div class="login-box">
      <div class="login-logo">
        <div class="login-logo-icon">⚕</div>
        <h2>ระบบบริหารความเสี่ยง</h2>
        <p>กลุ่มภารกิจด้านการพยาบาล<br>โรงพยาบาลมหาราชนครราชสีมา</p>
      </div>
      <div id="login-error" class="login-error" style="display:none;"></div>
      <div class="login-form">
        <label class="login-label">ชื่อผู้ใช้</label>
        <input type="text" id="login-user" class="login-input" placeholder="เช่น nurse01, rm_admin" autocomplete="username" />
        <label class="login-label" style="margin-top:12px;">รหัสผ่าน</label>
        <input type="password" id="login-pass" class="login-input" placeholder="รหัสผ่าน" autocomplete="current-password" />
        <button class="login-btn" onclick="doLogin()">เข้าสู่ระบบ</button>
        <p class="login-hint">* ติดต่อผู้ดูแลระบบหากลืมรหัสผ่าน</p>
      </div>
    </div>`;

  // กด Enter ส่ง form
  overlay.addEventListener("keydown", e => {
    if (e.key === "Enter") doLogin();
  });

  document.body.appendChild(overlay);
  document.getElementById("login-user").focus();
}

window.doLogin = function() {
  const username = document.getElementById("login-user").value.trim();
  const password = document.getElementById("login-pass").value;
  const errEl    = document.getElementById("login-error");

  if (!username || !password) {
    errEl.textContent = "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน";
    errEl.style.display = "block";
    return;
  }

  const result = Auth.login(username, password);
  if (result.ok) {
    document.getElementById("login-overlay").remove();
    initAppAfterLogin(result.user);
  } else {
    errEl.textContent = result.error;
    errEl.style.display = "block";
    document.getElementById("login-pass").value = "";
    document.getElementById("login-pass").focus();
  }
};

// ---- แสดง user info bar หลัง login ----
function initAppAfterLogin(user) {
  const bar = document.createElement("div");
  bar.className = "user-bar";
  bar.innerHTML = `
    <span>👤 ${user.name} <span class="user-role-badge">${roleLabel(user.role)}</span></span>
    <button class="logout-btn" onclick="doLogout()">ออกจากระบบ</button>`;
  document.querySelector(".app-header .header-inner").appendChild(bar);

  // ซ่อน tab ที่ไม่มีสิทธิ์
  applyRoleRestrictions(user.role);
}

function roleLabel(role) {
  return { admin:"ผู้ดูแลระบบ", rm:"RM / หัวหน้ากลุ่มงาน", nurse:"พยาบาล / ผู้รายงาน" }[role] || role;
}

function applyRoleRestrictions(role) {
  // nurse เห็นแค่ report + knowledge + matrix
  if (role === "nurse") {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      const tab = btn.dataset.tab;
      if (!["report","knowledge","matrix","analyze"].includes(tab)) {
        btn.style.display = "none";
      }
    });
  }
  // rm เห็นทุกอย่างยกเว้น admin settings
}

window.doLogout = function() {
  Auth.clearSession();
  location.reload();
};

// ---- Bootstrap: เช็ค auth เมื่อ page โหลด ----
document.addEventListener("DOMContentLoaded", () => {
  // ถ้าปิด auth ใน config → ข้ามไปเลย
  if (CONFIG.AUTH?.enabled === false) return;

  if (!Auth.isLoggedIn()) {
    renderLoginScreen();
  } else {
    const s = Auth.getSession();
    initAppAfterLogin(s);
  }
});
