/**
 * matrix.js — Risk Matrix 5×5
 */

const SEVERITY = [
  { s:1, label:"ไม่มีอันตราย (Insignificant)", desc:"ไม่เกิดความเสียหาย ตรวจพบและแก้ไขได้ก่อนถึงผู้ป่วย", ha:"A–B" },
  { s:2, label:"น้อย (Minor)",                  desc:"เสียหายเล็กน้อย ฟื้นตัวได้ในระยะสั้น ไม่ส่งผลระยะยาว", ha:"C–D" },
  { s:3, label:"ปานกลาง (Moderate)",            desc:"ต้องรักษาเพิ่มเติม หรือนอน รพ. นานขึ้น แต่ฟื้นตัวได้", ha:"E–F" },
  { s:4, label:"รุนแรง (Major)",                desc:"พิการถาวร หรือสูญเสียอวัยวะ/หน้าที่การทำงานถาวร", ha:"G" },
  { s:5, label:"วิกฤต/เสียชีวิต (Catastrophic)",desc:"เสียชีวิต หรือผลกระทบร้ายแรงสูงสุด มีการฟ้องร้อง", ha:"H–I" },
];

const LIKELIHOOD = [
  { l:1, label:"Remote — แทบไม่เกิด",          def:"น้อยกว่า 1 ครั้ง/ปี" },
  { l:2, label:"Unlikely — ไม่ค่อยเกิด",       def:"1–2 ครั้ง/ปี" },
  { l:3, label:"Possible — อาจเกิด",           def:"3–6 ครั้ง/ปี" },
  { l:4, label:"Likely — มีโอกาสสูง",          def:"7–11 ครั้ง/ปี" },
  { l:5, label:"Almost Certain — แน่นอน",      def:"≥12 ครั้ง/ปี" },
];

let activeCell = null;

window.initMatrix = function() {
  buildMatrix();
  buildLegend();
  buildBands();
};

function buildLegend() {
  const el = document.getElementById("matrix-legend");
  if (!el) return;
  el.innerHTML = [
    { bg:"#2D8A4E", text:"ต่ำ (1–4)" },
    { bg:"#C9A227", text:"ปานกลาง (5–9)" },
    { bg:"#D4621A", text:"สูง (10–15)" },
    { bg:"#B22222", text:"วิกฤต (16–25)" },
  ].map(l => `<div class="leg-item"><div class="leg-box" style="background:${l.bg};"></div>${l.text}</div>`).join("");
}

function buildMatrix() {
  const tbl = document.getElementById("matrix-tbl");
  if (!tbl) return;

  // header
  let html = `<thead><tr>
    <th style="text-align:left;padding:8px 10px;font-size:11px;min-width:130px;">โอกาส / ความรุนแรง</th>`;
  SEVERITY.forEach(s => {
    html += `<th style="padding:8px 4px;font-size:11px;width:76px;">S${s.s}<br><span style="font-weight:400;">${["ไม่มี","น้อย","กลาง","รุนแรง","วิกฤต"][s.s-1]}</span></th>`;
  });
  html += `</tr></thead><tbody>`;

  // rows L5 → L1
  for (let l = 5; l >= 1; l--) {
    const lk = LIKELIHOOD[l - 1];
    html += `<tr><td style="font-size:11px;padding:6px 10px;background:#f0f2f5;font-weight:600;">L${l} ${lk.label.split(" — ")[1]}</td>`;
    for (let s = 1; s <= 5; s++) {
      const score = l * s;
      const bg = cellBg(score);
      const tag = score >= 16 ? "วิกฤต" : score >= 10 ? "สูง" : score >= 5 ? "กลาง" : "ต่ำ";
      html += `<td class="matrix-cell" style="background:${bg};" onclick="matrixClick(${l},${s},${score},this)">
        <span class="cell-score" style="color:#fff;">${score}</span>
        <span class="cell-tag" style="color:#fff;">${tag}</span>
      </td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody>`;
  tbl.innerHTML = html;
}

window.matrixClick = function(l, s, score, cell) {
  const tip = document.getElementById("matrix-tooltip");
  if (!tip) return;

  if (activeCell === cell && tip.classList.contains("show")) {
    tip.classList.remove("show");
    activeCell = null;
    return;
  }

  const lk = LIKELIHOOD[l - 1];
  const sv = SEVERITY[s - 1];
  const lvl = getRiskLevel(score);
  const bg = cellBg(score);

  tip.style.borderLeftColor = bg;
  tip.innerHTML = `
    <div class="matrix-tooltip-title" style="color:${lvl.color};">
      คะแนน ${score} — ${lvl.label}
    </div>
    <div class="matrix-tooltip-body">
      <strong>โอกาสเกิด (L=${l}):</strong> ${lk.label} — ${lk.def}<br>
      <strong>ความรุนแรง (S=${s}):</strong> ${sv.label}<br>
      <em style="color:#666;">${sv.desc}</em><br>
      <strong style="display:block;margin-top:8px;">เทียบ รพ.มหาราช:</strong> ระดับ ${sv.ha}<br>
      <strong style="display:block;margin-top:6px;">การดำเนินการ:</strong> ${lvl.action}
    </div>`;
  tip.classList.add("show");
  activeCell = cell;
};

function buildBands() {
  const el = document.getElementById("band-grid");
  if (!el) return;
  const bands = [
    { score:"1–4",  label:"ต่ำ (Low)",              action:"ยอมรับได้ — บริหารตามปกติ",               time:"ทบทวนรายปี",          bg:"#E8F5EE", col:"#1A5E2A" },
    { score:"5–9",  label:"ปานกลาง (Moderate)",      action:"ต้องจัดการ — วางมาตรการควบคุม",           time:"ภายใน 30–90 วัน",     bg:"#FFF8E1", col:"#7B5C00" },
    { score:"10–15",label:"สูง (High)",               action:"เร่งด่วน — รายงานผู้บริหาร ทำ RCA",       time:"ภายใน 7–14 วัน",      bg:"#FFF0E6", col:"#8B3A0A" },
    { score:"16–25",label:"วิกฤต (Critical/Extreme)", action:"แก้ไขทันที — รายงาน ผอ. ใน 24 ชม.",       time:"Sentinel / Zero Event",bg:"#FCEBEB", col:"#7A1010" },
  ];
  el.innerHTML = bands.map(b => `
    <div class="band-card" style="background:${b.bg};">
      <div class="band-score" style="color:${b.col};">${b.score}</div>
      <div class="band-label" style="color:${b.col};">${b.label}</div>
      <div class="band-action" style="color:${b.col};">${b.action}</div>
      <div class="band-time" style="color:${b.col};">${b.time}</div>
    </div>`).join("");
}
