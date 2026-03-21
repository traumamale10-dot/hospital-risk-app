/**
 * Code.gs — Google Apps Script Backend
 * วาง script นี้ใน Google Sheets → Extensions → Apps Script
 *
 * วิธี Deploy:
 * 1. วางโค้ดทั้งหมด → Save
 * 2. Deploy → New Deployment
 *    - Type: Web App
 *    - Execute as: Me
 *    - Who has access: Anyone (เพื่อให้ GitHub Pages เรียกได้)
 * 3. Copy "Web App URL" → วางใน js/config.js → CONFIG.SHEET_URL
 */

// ชื่อ Sheet ที่จะบันทึกข้อมูล
const SHEET_INCIDENTS = "อุบัติการณ์";
const SHEET_SENTINEL  = "Zero_Event";

// ===============================
// รับ POST request จาก GitHub Pages
// ===============================
function doPost(e) {
  try {
    const data   = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === "addIncident") {
      return addIncident(data);
    }
    return jsonResponse({ status: "error", message: "Unknown action" });

  } catch (err) {
    return jsonResponse({ status: "error", message: err.message });
  }
}

// ===============================
// รับ GET request (ตรวจสอบการเชื่อมต่อ)
// ===============================
function doGet(e) {
  return jsonResponse({ status: "ok", message: "Hospital Risk API ready", timestamp: new Date().toISOString() });
}

// ===============================
// เพิ่มรายการอุบัติการณ์ลง Sheet
// ===============================
function addIncident(data) {
  const ss     = SpreadsheetApp.getActiveSpreadsheet();
  const sheet  = getOrCreateSheet(ss, SHEET_INCIDENTS);
  const isZero = data.isSentinel || data.isZeroEvent;

  // สร้าง header ถ้ายังไม่มี
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "ลำดับ","Timestamp","วันที่เกิดเหตุ","เวลา","หน่วยงาน","ผู้รายงาน",
      "ประเภทหลัก","ประเภทย่อย","รายละเอียด (SBAR)","การแก้ไขเบื้องต้น",
      "L (โอกาส)","S (ความรุนแรง)","คะแนน","ระดับ","Sentinel?","Zero Event?","สถานะ"
    ]);
    // จัด header style
    const header = sheet.getRange(1, 1, 1, 17);
    header.setBackground("#085041").setFontColor("#fff").setFontWeight("bold");
  }

  const rowNum = sheet.getLastRow() + 1;
  const row = [
    rowNum - 1,          // ลำดับ
    data.timestamp,
    data.date,
    data.time,
    data.ward,
    data.reporter || "ไม่ระบุ",
    data.type,
    data.subtype,
    data.description,
    data.immediate || "",
    data.likelihood,
    data.severity,
    data.score,
    data.riskLevel,
    data.isSentinel ? "✓" : "",
    data.isZeroEvent ? "✓" : "",
    "รอตรวจสอบ",
  ];

  sheet.appendRow(row);

  // สีแถวตามระดับความเสี่ยง
  const range = sheet.getRange(rowNum, 1, 1, 17);
  const bg =
    data.score >= 16 ? "#FFCCCC" :
    data.score >= 10 ? "#FFE0B2" :
    data.score >= 5  ? "#FFF9C4" : "#E8F5E9";
  range.setBackground(bg);

  // ถ้าเป็น Zero/Sentinel → บันทึกอีก Sheet ด้วย
  if (isZero) {
    addSentinelRecord(ss, data, rowNum - 1);
  }

  return jsonResponse({
    status:  "success",
    message: "บันทึกข้อมูลสำเร็จ",
    rowId:   rowNum - 1,
    score:   data.score,
    isSentinel: isZero,
  });
}

// ===============================
// บันทึก Sentinel/Zero Event แยก Sheet
// ===============================
function addSentinelRecord(ss, data, id) {
  const sheet = getOrCreateSheet(ss, SHEET_SENTINEL);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["ลำดับ","Timestamp","วันที่","หน่วยงาน","ประเภท","รายละเอียด","คะแนน","สถานะ RCA"]);
    sheet.getRange(1,1,1,8).setBackground("#7A1010").setFontColor("#fff").setFontWeight("bold");
  }

  sheet.appendRow([
    id, data.timestamp, data.date, data.ward,
    data.subtype, data.description, data.score, "รอทำ RCA"
  ]);
  sheet.getRange(sheet.getLastRow(), 1, 1, 8).setBackground("#FFCCCC");
}

// ===============================
// Helper: สร้าง Sheet ถ้ายังไม่มี
// ===============================
function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// ===============================
// Helper: return JSON response + CORS headers
// ===============================
function jsonResponse(data) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}
