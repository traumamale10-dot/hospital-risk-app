/**
 * report.js — ฟอร์มรายงานอุบัติการณ์ + ส่งข้อมูลไป Google Sheets
 */

window.initReport = function() {
  bindScoreCalc();
  bindSubmit();
};

// คำนวณคะแนนความเสี่ยงแบบ real-time
function bindScoreCalc() {
  const likelihood = document.getElementById("f-likelihood");
  const severity   = document.getElementById("f-severity");
  const display    = document.getElementById("score-display");
  if (!likelihood || !severity || !display) return;

  function update() {
    const l = parseInt(likelihood.value) || 0;
    const s = parseInt(severity.value) || 0;
    if (!l || !s) { display.style.display = "none"; return; }

    const score = l * s;
    const lvl   = getRiskLevel(score);
    display.style.display = "flex";
    display.style.background = lvl.bg;
    display.style.borderColor = lvl.color;
    display.innerHTML = `
      <div class="score-num" style="color:${lvl.color};">${score}</div>
      <div>
        <div class="score-label" style="color:${lvl.color};">${lvl.label}</div>
        <div class="score-action" style="color:${lvl.color};">${lvl.action}</div>
      </div>`;
  }

  likelihood.addEventListener("change", update);
  severity.addEventListener("change", update);
}

// ส่งข้อมูลไป Google Sheets ผ่าน Apps Script
function bindSubmit() {
  const form = document.getElementById("incident-form");
  const toast = document.getElementById("report-toast");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = form.querySelector(".submit-btn");
    const l = parseInt(form["f-likelihood"].value);
    const s = parseInt(form["f-severity"].value);
    const score = l * s;
    const lvl = getRiskLevel(score);

    const payload = {
      action:       "addIncident",
      timestamp:    new Date().toLocaleString("th-TH"),
      date:         form["f-date"].value,
      time:         form["f-time"].value,
      ward:         form["f-ward"].value,
      reporter:     form["f-reporter"].value,
      type:         form["f-type"].value,
      subtype:      form["f-subtype"].value,
      description:  form["f-desc"].value,
      immediate:    form["f-immediate"].value,
      likelihood:   l,
      severity:     s,
      score:        score,
      riskLevel:    lvl.label,
      isSentinel:   form["f-sentinel"] ? form["f-sentinel"].checked : false,
      isZeroEvent:  form["f-zero"] ? form["f-zero"].checked : false,
    };

    // ตรวจสอบ Sentinel Event → ต้องระบุเหตุผล
    if (payload.isSentinel && !payload.description.trim()) {
      setToast(toast, "กรุณาระบุรายละเอียดเหตุการณ์ Sentinel Event", "error");
      return;
    }

    btn.disabled = true;
    btn.textContent = "กำลังส่งข้อมูล...";
    setToast(toast, "กำลังบันทึกข้อมูล...", "loading");

    try {
      // *** ตรวจสอบว่า CONFIG.SHEET_URL ถูกตั้งค่าแล้ว ***
      if (CONFIG.SHEET_URL.includes("YOUR_SCRIPT_ID")) {
        // Demo mode: แสดงผลเสมือนสำเร็จ
        await new Promise(r => setTimeout(r, 800));
        setToast(toast, "⚠️ Demo Mode: ยังไม่ได้เชื่อม Google Sheets — กรุณาตั้งค่า SHEET_URL ใน config.js", "error");
        console.log("Payload ที่จะส่ง:", payload);
        btn.disabled = false;
        btn.textContent = "ส่งรายงาน";
        return;
      }

      const res = await fetch(CONFIG.SHEET_URL, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        mode: "no-cors", // Apps Script ต้องการ no-cors
      });

      setToast(toast, "✅ บันทึกข้อมูลสำเร็จ! รายงานถูกบันทึกลง Google Sheets แล้ว", "success");
      form.reset();
      document.getElementById("score-display").style.display = "none";

      // ถ้าเป็น Sentinel Event → แจ้งเตือนพิเศษ
      if (payload.isSentinel) {
        setTimeout(() => {
          alert("⚠️ Sentinel Event: กรุณาแจ้งผู้อำนวยการโรงพยาบาลทันที และทำ RCA ภายใน 7 วัน");
        }, 500);
      }

    } catch (err) {
      setToast(toast, "เกิดข้อผิดพลาด: " + err.message, "error");
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.textContent = "ส่งรายงาน";
    }
  });
}

function setToast(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  el.className = `status-bar show status-${type}`;
}
