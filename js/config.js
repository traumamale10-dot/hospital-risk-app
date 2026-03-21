/**
 * config.js — ตั้งค่าระบบบริหารความเสี่ยง รพ.มหาราชนครราชสีมา
 * แก้ไขไฟล์นี้ไฟล์เดียวก็พร้อมใช้งานได้เลย
 */

const CONFIG = {

  // =========================================================
  // 1. GOOGLE APPS SCRIPT — วาง URL หลัง Deploy Code.gs แล้ว
  // =========================================================
  SHEET_URL: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
  SHEET_ID:  "YOUR_GOOGLE_SHEET_ID",   // จาก URL ของ Google Sheets

  HOSPITAL_NAME: "โรงพยาบาลมหาราชนครราชสีมา",
  SHEETS: {
    INCIDENTS: "อุบัติการณ์",
    SENTINEL:  "Zero_Event",
    DASHBOARD: "Dashboard_Cache",  // Apps Script เขียนสถิติรายวันไว้ที่นี่
  },

  // =========================================================
  // 2. AUTHENTICATION
  //    enabled: false  → ปิด login (สำหรับทดสอบ)
  //    enabled: true   → เปิด login ก่อนใช้งาน
  // =========================================================
  AUTH: {
    enabled: true,   // *** เปลี่ยนเป็น false เพื่อทดสอบโดยไม่ต้อง login ***

    // เพิ่ม/แก้ผู้ใช้ได้ที่นี่
    // role: "admin" | "rm" | "nurse"
    users: [
      { username: "admin",   password: "mnrh2567!",  name: "ผู้ดูแลระบบ",         role: "admin"  },
      { username: "rm01",    password: "rm2567",      name: "RM กลุ่มภารกิจพยาบาล", role: "rm"     },
      { username: "nurse01", password: "nurse2567",   name: "พยาบาลวิชาชีพ",        role: "nurse"  },
      // เพิ่มได้ตามต้องการ...
    ],
  },

  // =========================================================
  // 3. DASHBOARD — ช่วงวันที่โหลดข้อมูลเริ่มต้น (วัน)
  // =========================================================
  DASHBOARD: {
    defaultDays: 30,   // โหลดข้อมูลย้อนหลัง 30 วัน
    refreshMs:   0,    // 0 = ไม่ auto-refresh, ตั้งเป็น 60000 = refresh ทุก 1 นาที
  },

};

