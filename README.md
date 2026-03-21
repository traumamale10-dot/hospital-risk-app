# ระบบบริหารความเสี่ยง — กลุ่มภารกิจด้านการพยาบาล
## โรงพยาบาลมหาราชนครราชสีมา ปี 2567

> **Stack:** HTML + CSS + Vanilla JS (GitHub Pages) + Google Apps Script + Google Sheets

---

## โครงสร้างไฟล์

```
hospital-risk-app/
├── index.html          ← หน้าหลัก (tab navigation)
├── css/
│   └── style.css       ← Stylesheet ทั้งหมด
├── js/
│   ├── config.js       ← *** ตั้งค่า Google Sheets URL ที่นี่ ***
│   ├── app.js          ← Tab routing + shared helpers
│   ├── matrix.js       ← Risk Matrix 5×5
│   ├── report.js       ← ฟอร์มรายงาน + ส่งข้อมูลไป Sheets
│   └── analyzer.js     ← วิเคราะห์สถานการณ์อัตโนมัติ
├── pages/
│   ├── knowledge.html  ← คำจำกัดความ & นโยบาย
│   ├── types.html      ← ประเภทความเสี่ยง
│   ├── matrix.html     ← Risk Matrix
│   ├── severity.html   ← ระดับความรุนแรง A–I / 1–5
│   ├── flow.html       ← Flow การจัดการ
│   ├── zero.html       ← Zero Event / Sentinel
│   ├── report.html     ← ฟอร์มรายงานอุบัติการณ์
│   └── analyze.html    ← วิเคราะห์สถานการณ์
└── Code.gs             ← Google Apps Script (วางใน Google Sheets)
```

---

## วิธี Deploy (ทำครั้งเดียว ~15 นาที)

### ขั้นตอนที่ 1 — สร้าง Google Sheets + Apps Script

1. เปิด [Google Sheets](https://sheets.google.com) → สร้าง Spreadsheet ใหม่
   - ตั้งชื่อ: `ระบบรายงานความเสี่ยง รพ.มหาราช`
2. ไปที่ **Extensions → Apps Script**
3. ลบโค้ดเดิมทั้งหมด → วางโค้ดจากไฟล์ `Code.gs`
4. กด **Save** (Ctrl+S)
5. กด **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. กด **Deploy** → Copy **Web App URL**

### ขั้นตอนที่ 2 — ตั้งค่า config.js

เปิด `js/config.js` แก้ไข:

```js
const CONFIG = {
  SHEET_URL: "https://script.google.com/macros/s/XXXXXXX/exec",  // ← วาง URL ที่ copy มา
  // ...
};
```

### ขั้นตอนที่ 3 — Push ขึ้น GitHub Pages

```bash
# clone หรือ init repo
git init
git add .
git commit -m "feat: hospital risk management app"
git remote add origin https://github.com/YOUR_USERNAME/hospital-risk-app.git
git push -u origin main
```

จากนั้นไปที่ GitHub repo → **Settings → Pages**
- Source: **Deploy from a branch**
- Branch: **main** → folder: **/ (root)**
- กด **Save**

รอ 1–2 นาที แล้วเปิด:
```
https://YOUR_USERNAME.github.io/hospital-risk-app/
```

---

## ทดสอบการเชื่อมต่อ Google Sheets

เปิด URL ใน browser:
```
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```
ถ้าเห็น `{"status":"ok","message":"Hospital Risk API ready"}` = เชื่อมสำเร็จ ✅

---

## ข้อมูลที่บันทึกลง Google Sheets

| คอลัมน์ | ข้อมูล |
|---------|--------|
| ลำดับ | Auto-increment |
| Timestamp | วันเวลาที่รายงาน |
| วันที่เกิดเหตุ | จากฟอร์ม |
| หน่วยงาน | หอผู้ป่วย/แผนก |
| ประเภท | Clinical / Non-Clinical |
| รายละเอียด | SBAR |
| L × S | คะแนนความเสี่ยง |
| ระดับ | ต่ำ / กลาง / สูง / วิกฤต |
| Sentinel? | Zero Event flag |

---

## อ้างอิง

- คู่มือการบริหารความเสี่ยง กลุ่มภารกิจด้านการพยาบาล รพ.มหาราชนครราชสีมา 2567
- สถาบันรับรองคุณภาพสถานพยาบาล (สรพ.) HA Standard Edition 4
- ISO 31000:2018 Risk Management
- WHO Patient Safety Curriculum Guide
