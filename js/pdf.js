/**
 * pdf.js — Export รายงานอุบัติการณ์เป็น PDF
 * ใช้ window.print() + print-specific CSS (ไม่ต้องพึ่ง library)
 * สร้าง popup หน้าใหม่ที่จัดหน้าสวยงาม แล้วสั่งพิมพ์
 */

window.exportPDF = function(data) {
  if (!data) {
    // ถ้าไม่ได้ส่งข้อมูลมา → ดึงจากฟอร์มที่กรอกอยู่
    data = collectFormData();
    if (!data) { alert("กรุณากรอกข้อมูลในฟอร์มก่อนออก PDF"); return; }
  }

  const lvl   = getRiskLevel(data.score || (data.likelihood * data.severity));
  const html  = buildPDFHTML(data, lvl);
  const popup = window.open("", "_blank", "width=800,height=900");
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  setTimeout(() => popup.print(), 600);
};

// ดึงข้อมูลจากฟอร์มรายงาน
function collectFormData() {
  const form = document.getElementById("incident-form");
  if (!form) return null;
  const l = parseInt(form["f-likelihood"]?.value) || 0;
  const s = parseInt(form["f-severity"]?.value)   || 0;
  if (!l || !s) return null;
  return {
    date:        form["f-date"]?.value       || "",
    time:        form["f-time"]?.value       || "",
    ward:        form["f-ward"]?.value       || "",
    reporter:    form["f-reporter"]?.value   || "ไม่ระบุ",
    type:        form["f-type"]?.value       || "",
    subtype:     form["f-subtype"]?.value    || "",
    description: form["f-desc"]?.value      || "",
    immediate:   form["f-immediate"]?.value  || "",
    likelihood:  l,
    severity:    s,
    score:       l * s,
    isSentinel:  form["f-sentinel"]?.checked || false,
    isZeroEvent: form["f-zero"]?.checked     || false,
    printedAt:   new Date().toLocaleString("th-TH"),
  };
}

function buildPDFHTML(d, lvl) {
  const scoreColor =
    d.score >= 16 ? "#B22222" :
    d.score >= 10 ? "#D4621A" :
    d.score >= 5  ? "#C9A227" : "#2D8A4E";

  const sevLabels = ["","ไม่มีอันตราย (1)","น้อย (2)","ปานกลาง (3)","รุนแรง (4)","วิกฤต (5)"];
  const lkLabels  = ["","Remote (1)","Unlikely (2)","Possible (3)","Likely (4)","Almost Certain (5)"];

  return `<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8"/>
<title>รายงานอุบัติการณ์ — รพ.มหาราช</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Sarabun',sans-serif; font-size:13px; color:#111; padding:20px 28px; }
  .header { text-align:center; border-bottom:2px solid #085041; padding-bottom:12px; margin-bottom:16px; }
  .header h1 { font-size:16px; font-weight:700; color:#085041; }
  .header p  { font-size:12px; color:#555; margin-top:2px; }
  .doc-title { font-size:14px; font-weight:700; text-align:center; margin:10px 0 16px; color:#222; text-decoration:underline; }
  table.info { width:100%; border-collapse:collapse; margin-bottom:14px; }
  table.info td { padding:6px 8px; border:1px solid #ccc; font-size:12px; vertical-align:top; }
  table.info td.label { background:#f0f4f0; font-weight:700; width:140px; }
  .score-box { display:inline-block; padding:6px 18px; border-radius:6px; font-size:18px; font-weight:700; color:#fff; background:${scoreColor}; }
  .section-title { font-size:13px; font-weight:700; background:#e8f0e8; padding:5px 10px; border-left:4px solid #085041; margin:14px 0 8px; }
  .text-block { font-size:12px; line-height:1.8; background:#fafafa; border:1px solid #ddd; padding:10px 12px; border-radius:4px; white-space:pre-wrap; }
  .sentinel-alert { background:#FFEBEB; border:2px solid #B22222; border-radius:6px; padding:10px 14px; margin:14px 0; font-size:13px; font-weight:700; color:#B22222; }
  .sign-row { display:flex; gap:20px; margin-top:24px; }
  .sign-box { flex:1; border-top:1px solid #aaa; padding-top:6px; text-align:center; font-size:11px; color:#666; }
  .footer { text-align:center; font-size:10px; color:#aaa; margin-top:20px; border-top:1px solid #eee; padding-top:8px; }
  @media print {
    body { padding:10px 16px; }
    .no-print { display:none !important; }
    @page { size:A4; margin:1.5cm; }
  }
</style>
</head><body>

<div class="no-print" style="background:#085041;color:#fff;padding:10px 16px;text-align:center;margin:-20px -28px 20px;">
  <strong>กำลังแสดงตัวอย่างรายงาน</strong> — กด Ctrl+P หรือ ⌘+P เพื่อพิมพ์/บันทึก PDF
</div>

<div class="header">
  <h1>โรงพยาบาลมหาราชนครราชสีมา</h1>
  <p>กลุ่มภารกิจด้านการพยาบาล</p>
</div>

<div class="doc-title">แบบรายงานอุบัติการณ์ความเสี่ยง (Incident Report)</div>

${d.isSentinel || d.isZeroEvent ? `
<div class="sentinel-alert">
  ⚠️ ${d.isSentinel ? "SENTINEL EVENT" : "ZERO EVENT"} — ต้องรายงานผู้อำนวยการโรงพยาบาลทันที ภายใน 24 ชั่วโมง
</div>` : ""}

<div class="section-title">1. ข้อมูลเบื้องต้น</div>
<table class="info">
  <tr><td class="label">วันที่เกิดเหตุ</td><td>${d.date}</td><td class="label">เวลา</td><td>${d.time}</td></tr>
  <tr><td class="label">หน่วยงาน/หอผู้ป่วย</td><td colspan="3">${d.ward}</td></tr>
  <tr><td class="label">ผู้รายงาน</td><td>${d.reporter}</td><td class="label">วันที่พิมพ์</td><td>${d.printedAt}</td></tr>
</table>

<div class="section-title">2. ประเภทความเสี่ยง</div>
<table class="info">
  <tr><td class="label">หมวดหมู่หลัก</td><td>${d.type}</td></tr>
  <tr><td class="label">ประเภทย่อย</td><td>${d.subtype}</td></tr>
</table>

<div class="section-title">3. รายละเอียดเหตุการณ์ (SBAR)</div>
<div class="text-block">${d.description}</div>

<div class="section-title">4. การแก้ไขเบื้องต้น</div>
<div class="text-block">${d.immediate || "–"}</div>

<div class="section-title">5. ประเมินระดับความเสี่ยง</div>
<table class="info">
  <tr>
    <td class="label">โอกาสเกิด (L)</td><td>${d.likelihood} — ${lkLabels[d.likelihood]}</td>
    <td class="label">ความรุนแรง (S)</td><td>${d.severity} — ${sevLabels[d.severity]}</td>
  </tr>
  <tr>
    <td class="label">คะแนนความเสี่ยง (L×S)</td>
    <td colspan="3"><span class="score-box">${d.score}</span>&nbsp;&nbsp;<strong>${lvl.label}</strong> — ${lvl.action}</td>
  </tr>
</table>

<div class="sign-row">
  <div class="sign-box">ลงชื่อผู้รายงาน<br><br><br>(.................................)<br>วันที่ ........../........../..........ม</div>
  <div class="sign-box">ลงชื่อหัวหน้าหน่วยงาน<br><br><br>(.................................)<br>วันที่ ........../........../..........ม</div>
  <div class="sign-box">ลงชื่อผู้จัดการความเสี่ยง<br><br><br>(.................................)<br>วันที่ ........../........../..........ม</div>
</div>

<div class="footer">
  คู่มือการบริหารความเสี่ยง กลุ่มภารกิจด้านการพยาบาล รพ.มหาราชนครราชสีมา ปี 2567 |
  อ้างอิง: สรพ. HA Standard Edition 4
</div>
</body></html>`;
}
