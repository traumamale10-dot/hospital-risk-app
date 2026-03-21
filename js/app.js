/**
 * app.js — Tab navigation + lazy page loader
 */

// ---- Tab switching ----
const tabBtns = document.querySelectorAll(".tab-btn");
const tabSections = document.querySelectorAll(".tab-section");
const loaded = {};

async function loadPage(section) {
  const page = section.dataset.page;
  if (!page || loaded[page]) return;
  try {
    const res = await fetch(page);
    if (!res.ok) throw new Error("not found");
    const html = await res.text();
    section.innerHTML = html;
    loaded[page] = true;
    // fire init hooks
    if (section.id === "tab-dashboard") initDashboard();
    if (section.id === "tab-matrix")  initMatrix();
    if (section.id === "tab-report")  initReport();
    if (section.id === "tab-analyze") initAnalyzer();
    if (section.id === "tab-types")   initTypes();
    if (section.id === "tab-flow")    initFlow();
    if (section.id === "tab-severity")initSeverity();
    if (section.id === "tab-zero")    initZero();
  } catch (e) {
    section.innerHTML = `<div class="card"><p style="color:#c00;">ไม่สามารถโหลดหน้านี้ได้: ${e.message}</p></div>`;
  }
}

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    tabSections.forEach(s => s.classList.remove("active"));
    btn.classList.add("active");
    const id = "tab-" + btn.dataset.tab;
    const section = document.getElementById(id);
    section.classList.add("active");
    loadPage(section);
  });
});

// load first tab on start
document.addEventListener("DOMContentLoaded", () => {
  const first = document.querySelector(".tab-section.active");
  if (first) loadPage(first);
});

// ---- Shared helpers ----
window.showToast = function(msg, type = "success") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = `status-bar show status-${type}`;
  setTimeout(() => el.classList.remove("show"), 4000);
};

window.calcRiskScore = function(l, s) { return l * s; };

window.getRiskLevel = function(score) {
  if (score >= 16) return { label: "วิกฤต (Critical)", color: "#7A1010", bg: "#FCEBEB", action: "แก้ไขทันที — รายงาน ผอ. ภายใน 24 ชม." };
  if (score >= 10) return { label: "สูง (High)",       color: "#8B3A0A", bg: "#FFF0E6", action: "เร่งด่วน — ทำ RCA ภายใน 7–14 วัน" };
  if (score >= 5)  return { label: "ปานกลาง (Moderate)", color: "#7B5C00", bg: "#FFF8E1", action: "จัดการภายใน 30–90 วัน" };
  return                   { label: "ต่ำ (Low)",        color: "#1A5E2A", bg: "#E8F5EE", action: "ติดตามและทบทวนรายปี" };
};

window.cellBg = function(score) {
  if (score >= 16) return "#B22222";
  if (score >= 10) return "#D4621A";
  if (score >= 5)  return "#C9A227";
  return "#2D8A4E";
};

// ---- Dashboard tab init hook ----
// (called by loadPage when tab-dashboard is loaded)
window.initDashboardPage = function() {
  if (typeof initDashboard === "function") initDashboard();
};
