/**
 * analyzer.js — วิเคราะห์สถานการณ์ความเสี่ยง
 */

const SCENARIOS = [
  { label:"Medication Error",  text:"พยาบาลให้ยาผิดคน ผู้ป่วยแพ้ยา เกิดอาการแพ้ต้องรักษาเพิ่ม นอน รพ. นานขึ้น" },
  { label:"Fatal Falls",       text:"ผู้ป่วยสูงอายุล้มในห้องน้ำ กระดูกสะโพกหัก Brain hemorrhage ต้องผ่าตัด" },
  { label:"Wrong-site Surgery",text:"ศัลยแพทย์ผ่าตัดผิดข้าง ผู้ป่วยต้องผ่าตัดซ้ำ เกิดภาวะแทรกซ้อนรุนแรง" },
  { label:"Near Miss",         text:"พยาบาลหยิบยาผิด แต่เพื่อนร่วมงานตรวจพบก่อนบริหารยา ไม่ถึงผู้ป่วย" },
  { label:"Personnel (เข็มตำ)",text:"พยาบาลถูกเข็มทิ่มตำขณะเก็บเข็มหลังฉีดยา สัมผัสเลือดผู้ป่วย" },
  { label:"HIS ล่ม",           text:"ระบบ HIS โรงพยาบาลล่มนาน 3 ชั่วโมง บุคลากรทำงานไม่ได้ บันทึกมือ" },
  { label:"ส่งมอบทารกผิดคน", text:"พยาบาลส่งมอบทารกแรกเกิดให้มารดาผิดคน ตรวจพบภายหลัง" },
];

window.initAnalyzer = function() {
  const chips = document.getElementById("example-chips");
  if (chips) {
    chips.innerHTML = SCENARIOS.map(s =>
      `<button class="chip" onclick="fillScenario(this)">${s.label}</button>`
    ).join("");
    chips.querySelectorAll(".chip").forEach((chip, i) => {
      chip.onclick = () => fillScenario(SCENARIOS[i].text);
    });
  }
};

window.fillScenario = function(text) {
  const inp = document.getElementById("scenario-input");
  if (inp) inp.value = text;
};

window.analyzeScenario = function() {
  const txt = (document.getElementById("scenario-input")?.value || "").toLowerCase();
  if (!txt.trim()) return;

  const result = classify(txt);
  const box = document.getElementById("analyze-result");
  if (!box) return;

  const lvl = getRiskLevel(result.score);
  box.style.display = "block";
  box.innerHTML = `
    <div class="result-row"><span class="result-label">ประเภทความเสี่ยง</span><span class="result-val">${result.type}</span></div>
    <div class="result-row"><span class="result-label">หมวดหมู่</span><span class="result-val" style="font-size:12px;color:#666;">${result.eng}</span></div>
    <div class="result-row"><span class="result-label">ระดับความรุนแรง (S)</span><span class="result-val">${result.s} — ${result.sevLabel}</span></div>
    <div class="result-row"><span class="result-label">ระดับโอกาสเกิด (L)</span><span class="result-val">${result.l}</span></div>
    <div class="result-row">
      <span class="result-label">คะแนนความเสี่ยง</span>
      <span class="result-val">
        <span style="font-size:20px;">${result.score}</span>
        &nbsp;<span class="badge" style="background:${lvl.bg};color:${lvl.color};">${lvl.label}</span>
      </span>
    </div>
    ${result.isZero ? `<div class="result-row"><span class="result-label">Zero Event</span><span class="result-val"><span class="badge badge-red">⚠️ ใช่ — รายงานทันที ภายใน 24 ชม.</span></span></div>` : ""}
    <div class="result-row"><span class="result-label">เทียบระดับ รพ.มหาราช</span><span class="result-val">${result.ha}</span></div>
    <div style="margin-top:14px;font-size:13px;font-weight:700;color:#333;">การดำเนินการที่แนะนำ:</div>
    <div style="margin-top:8px;">${result.actions.map((a,i) =>
      `<div class="action-item"><div class="action-n">${i+1}</div><span>${a}</span></div>`
    ).join("")}</div>`;
};

function classify(txt) {
  // ---- Type ----
  let type = "ความเสี่ยงทางคลินิกทั่วไป";
  let eng  = "Common Clinical Risk";
  let isZero = false;

  if (/ผ่าตัดผิด|ผิดข้าง|ผิดคน|wrong.?site/.test(txt)) {
    type="ความเสี่ยงทางคลินิกเฉพาะโรค"; eng="Specific Clinical Risk (Wrong-site Surgery)"; isZero=true;
  } else if (/ทารก.*ผิดคน|ส่งมอบทารก/.test(txt)) {
    type="ความเสี่ยงทางคลินิกเฉพาะโรค"; eng="Specific Clinical Risk (ส่งมอบทารกผิดคน)"; isZero=true;
  } else if (/เลือดผิด|transfusion/.test(txt)) {
    type="ความเสี่ยงทางคลินิกทั่วไป"; eng="Common Clinical Risk (Blood Safety)"; isZero=true;
  } else if (/ยา|medication|แพ้/.test(txt)) {
    type="ความเสี่ยงทางคลินิกทั่วไป"; eng="Common Clinical Risk (Medication Error)";
  } else if (/ล้ม|หกล้ม|ตกเตียง|กระดูก|falls/.test(txt)) {
    type="ความเสี่ยงทางคลินิกทั่วไป"; eng="Common Clinical Risk (Patient Falls)";
  } else if (/เข็ม|ทิ่มตำ|สัมผัสเลือด|บุคลากร/.test(txt)) {
    type="Non-Clinic: Personnel Safety Goals"; eng="Personnel Safety Goals";
  } else if (/ระบบ|ล่ม|his|server|ไฟฟ้า/.test(txt)) {
    type="Non-Clinic: Organization Safety Goals"; eng="Organization Safety Goals";
  }

  // ---- Severity ----
  let s = 3;
  let sevLabel = "ปานกลาง (Moderate)";
  let ha = "E–F";

  if (/เสียชีวิต|ฟ้องร้อง|ศาล/.test(txt))           { s=5; sevLabel="วิกฤต/เสียชีวิต (Catastrophic)"; ha="I"; }
  else if (/ช่วยชีวิต|ปั๊ม|รีซัส/.test(txt))         { s=5; sevLabel="วิกฤต/เสียชีวิต (Catastrophic)"; ha="H–I"; }
  else if (/พิการ|ถาวร|สูญเสียอวัยวะ/.test(txt))     { s=4; sevLabel="รุนแรง (Major)"; ha="G"; }
  else if (/ผ่าตัดผิด|ผิดข้าง/.test(txt))            { s=4; sevLabel="รุนแรง (Major)"; ha="G–H"; isZero=true; }
  else if (/นานขึ้น|เยียวยา|ต้องรักษาเพิ่ม/.test(txt)){ s=3; sevLabel="ปานกลาง (Moderate)"; ha="E–F"; }
  else if (/บาดเจ็บ|แพ้|ผื่น|อาการ/.test(txt))      { s=3; sevLabel="ปานกลาง (Moderate)"; ha="E"; }
  else if (/เฝ้าระวัง|สัมผัสเลือด|เข็ม/.test(txt))  { s=2; sevLabel="น้อย (Minor)"; ha="D"; }
  else if (/ก่อนบริหาร|ตรวจพบก่อน|near.?miss/.test(txt)){ s=1; sevLabel="ไม่มีอันตราย (Insignificant)"; ha="A–B"; }
  else if (/ระบบล่ม|his/.test(txt))                  { s=2; sevLabel="น้อย (Minor) — ไม่มีผลกระทบผู้ป่วยโดยตรง"; ha="–"; }

  // ---- Likelihood ----
  let l = 3;
  if (/บ่อย|ประจำ|ทุกวัน/.test(txt))   l = 4;
  else if (/ครั้งแรก|ไม่เคย/.test(txt)) l = 2;
  else if (/เกือบทุก/.test(txt))        l = 4;

  const score = l * s;

  // ---- Actions ----
  let actions = [];
  if (score >= 16 || isZero) {
    actions = [
      "แจ้งผู้อำนวยการโรงพยาบาลทันทีทางโทรศัพท์",
      "ลงรายงานในโปรแกรมความเสี่ยงภายใน 24 ชั่วโมง",
      "ทำ Root Cause Analysis (RCA) ภายใน 7 วัน",
      "รายงานต่อคณะกรรมการบริหารโรงพยาบาล",
      "เปิดเผยเหตุการณ์ต่อผู้ป่วย/ครอบครัว",
    ];
  } else if (score >= 10) {
    actions = [
      "รายงานในโปรแกรมความเสี่ยงภายใน 24 ชั่วโมง",
      "หัวหน้าหน่วยงานและทีม RM พิจารณาเร่งด่วน",
      "ทำ RCA ภายใน 7–14 วัน",
      "กำหนดมาตรการป้องกันการเกิดซ้ำ",
    ];
  } else if (score >= 5) {
    actions = [
      "รายงานในโปรแกรมความเสี่ยงภายใน 7 วันทำการ",
      "หัวหน้าหน่วยงาน Approved ภายใน 30 วัน",
      "วางมาตรการควบคุมภายใน 30–90 วัน",
    ];
  } else {
    actions = [
      "บันทึก Near Miss ในโปรแกรมความเสี่ยง",
      "หัวหน้าหน่วยงานรับทราบและทบทวนสาเหตุ",
      "ปรับปรุงกระบวนการป้องกันการเกิดซ้ำ",
    ];
  }

  return { type, eng, s, sevLabel, l, score, ha, isZero, actions };
}
