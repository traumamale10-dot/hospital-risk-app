/**
 * dashboard.js — โหลดสถิติจาก Google Sheets + แสดงกราฟ
 */

window.initDashboard = function() {
  renderDemoStats();
  if (!CONFIG.SHEET_URL.includes("YOUR_SCRIPT_ID")) fetchStats();
};

async function fetchStats() {
  const el = document.getElementById("dash-status");
  if (el) { el.textContent = "กำลังโหลดข้อมูลจาก Google Sheets..."; el.style.display = "block"; }
  try {
    await fetch(CONFIG.SHEET_URL + "?action=getStats", { mode: "no-cors" });
    if (el) { el.textContent = "✓ ข้อมูลอัปเดตแล้ว"; el.style.color = "#2D8A4E"; }
  } catch(e) {
    if (el) { el.textContent = "⚠ แสดงข้อมูล Demo (ยังไม่ได้เชื่อม Sheets)"; }
  }
}

function renderDemoStats() {
  setKPI("kpi-total",    "247","รายการทั้งหมด (30 วัน)");
  setKPI("kpi-high",     "12", "ระดับสูง/วิกฤต");
  setKPI("kpi-sentinel", "2",  "Sentinel/Zero Event");
  setKPI("kpi-pending",  "38", "รอ Approved");

  renderDoughnut("chart-type",{
    labels:["Medication Error","Patient Falls","HAI","Patient ID","Tube/Line","อื่นๆ"],
    data:[68,42,35,28,19,55],
    colors:["#B22222","#D4621A","#C9A227","#2D8A4E","#185FA5","#888"],
  });
  renderBar("chart-level",{
    labels:["ต่ำ (1–4)","ปานกลาง (5–9)","สูง (10–15)","วิกฤต (16–25)"],
    data:[130,89,20,8],
    colors:["#2D8A4E","#C9A227","#D4621A","#B22222"],
  });
  renderLine("chart-trend",{
    labels:["สัปดาห์ 1","สัปดาห์ 2","สัปดาห์ 3","สัปดาห์ 4"],
    datasets:[
      {label:"Clinical",    data:[42,38,51,45],color:"#185FA5"},
      {label:"Non-Clinical",data:[18,22,15,21],color:"#C9A227"},
    ],
  });
  renderTopTable("top-incidents",[
    {rank:1,type:"Medication Error",count:68,pct:"27.5%",trend:"↗"},
    {rank:2,type:"Patient Falls",   count:42,pct:"17.0%",trend:"→"},
    {rank:3,type:"HAI",             count:35,pct:"14.2%",trend:"↘"},
    {rank:4,type:"Patient ID",      count:28,pct:"11.3%",trend:"→"},
    {rank:5,type:"Tube/Line",       count:19,pct:"7.7%", trend:"↘"},
  ]);
}

function waitForChart(cb, tries=0) {
  if (window.Chart) { cb(); }
  else if (tries < 20) { setTimeout(()=>waitForChart(cb, tries+1), 200); }
}

function renderDoughnut(id,{labels,data,colors}) {
  waitForChart(()=>{
    const c=document.getElementById(id); if(!c)return;
    new Chart(c,{type:"doughnut",data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:2,borderColor:"#fff"}]},
      options:{plugins:{legend:{position:"right",labels:{font:{size:11},padding:10}}},cutout:"62%"}});
  });
}
function renderBar(id,{labels,data,colors}) {
  waitForChart(()=>{
    const c=document.getElementById(id); if(!c)return;
    new Chart(c,{type:"bar",data:{labels,datasets:[{data,backgroundColor:colors,borderRadius:5,borderSkipped:false}]},
      options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,grid:{color:"#f0f0f0"}},x:{grid:{display:false}}}}});
  });
}
function renderLine(id,{labels,datasets}) {
  waitForChart(()=>{
    const c=document.getElementById(id); if(!c)return;
    new Chart(c,{type:"line",data:{labels,datasets:datasets.map(d=>({
      label:d.label,data:d.data,borderColor:d.color,backgroundColor:d.color+"22",tension:0.4,fill:true,pointRadius:4}))},
      options:{plugins:{legend:{position:"top"}},scales:{y:{beginAtZero:true},x:{grid:{display:false}}}}});
  });
}
function renderTopTable(id,rows) {
  const el=document.getElementById(id); if(!el)return;
  el.innerHTML=`<table class="data-table"><thead><tr><th>#</th><th>ประเภทอุบัติการณ์</th><th>จำนวน</th><th>%</th><th>แนวโน้ม</th></tr></thead><tbody>${
    rows.map(r=>`<tr><td style="text-align:center;font-weight:700;">${r.rank}</td><td>${r.type}</td>
      <td style="text-align:center;font-weight:700;">${r.count}</td><td style="text-align:center;">${r.pct}</td>
      <td style="text-align:center;font-size:16px;color:${r.trend==="↗"?"#c00":r.trend==="↘"?"#080":"#888"};">${r.trend}</td></tr>`).join("")
  }</tbody></table>`;
}
function setKPI(id,val,label) {
  const el=document.getElementById(id); if(!el)return;
  el.innerHTML=`<div style="font-size:28px;font-weight:700;">${val}</div><div style="font-size:12px;color:#666;margin-top:4px;">${label}</div>`;
}
