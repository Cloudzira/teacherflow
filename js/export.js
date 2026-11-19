/* Ekspor jadwal: Excel (.xlsx) dan cetak / simpan sebagai PDF.
   Logika data ada di js/logic.js (tfExportSheets) dan js/xlsx.js (tfBuildXlsx). */
function tfDownload(bytes,name,type){
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([bytes],{type}));a.download=name;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
}
const tfWeekRange=days=>tfDMYs(days[0].ds)+' – '+tfDMYs(days[6].ds);

function openExport(){
  const{days}=weekData(),n=days.reduce((t,x)=>t+x.items.length,0);
  tfModal('<i class="fa-solid fa-file-export text-blue-400"></i> Ekspor Jadwal',`
  <p class="text-slate-400 leading-relaxed">Pekan yang sedang ditampilkan: <b class="text-slate-100">${tfWeekRange(days)}</b> (${n} kegiatan).</p>
  <div class="ex-grid">
    <button type="button" id="ex-pdf" class="ex-opt"><i class="fa-solid fa-file-pdf"></i><span><b>Cetak / simpan PDF</b><small>Tabel jadwal pekan ini siap cetak. Pilih "Simpan sebagai PDF" pada dialog cetak.</small></span></button>
    <button type="button" id="ex-xls" class="ex-opt"><i class="fa-solid fa-file-excel"></i><span><b>Unduh Excel (.xlsx)</b><small>Empat lembar: Jadwal Pekan, Semua Agenda, Tugas, dan Kalender Akademik.</small></span></button>
  </div>`,null);
  $('ex-pdf').onclick=()=>{tfClose();setTimeout(tfPrintWeek,200)};
  $('ex-xls').onclick=()=>{tfExportXlsx();tfClose()};
}

function tfExportXlsx(){
  const{days}=weekData();
  try{
    tfDownload(tfBuildXlsx(tfExportSheets(state,days)),'TeacherFlow-jadwal-'+days[0].ds+'.xlsx','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    showToast('Berkas Excel diunduh.','success');
  }catch(e){showToast('Gagal membuat berkas Excel.','error')}
}

function tfPrintHtml(days){
  const f=($('week-filter')||{}).value||'ALL',today=new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});
  let rows='';
  days.forEach(x=>{
    const nm=TF_DAYS[new Date(x.ds+'T12:00:00').getDay()],labs=tfDayLabels(x.ds),note=labs.map(l=>esc(l.full)).join(' · ');
    const dayCell=`<td class="pr-day" rowspan="${Math.max(1,x.items.length)}"><b>${nm}</b><br>${tfDMYs(x.ds)}${note?`<br><span class="pr-hol">${note}</span>`:''}</td>`;
    if(!x.items.length){rows+=`<tr>${dayCell}<td colspan="6" class="pr-empty">${note?'Libur / tidak ada kegiatan':'Tidak ada kegiatan'}</td></tr>`;return}
    x.items.forEach((a,i)=>{rows+=`<tr>${i?'':dayCell}<td class="pr-time">${esc(a.startTime)}–${esc(a.endTime)}</td><td>${esc(jamText(a).replace(/^Jam ke:\s*/,''))}</td><td><b>${esc(a.title)}</b>${a.notes?`<br><small>${esc(a.notes)}</small>`:''}</td><td>${esc(a.type)}</td><td>${esc(a.location||'')}</td><td>${esc(a.target&&a.target!=='Anggota'?a.target:'')}</td></tr>`});
  });
  return `<div class="pr-head"><h1>Jadwal Pekan · ${tfWeekRange(days)}</h1><p>${f!=='ALL'?'Jenis: '+esc(f)+' · ':''}Dicetak dari TeacherFlow pada ${today}</p></div>
  <table class="pr-table"><thead><tr><th>Hari</th><th>Waktu</th><th>Jam ke</th><th>Kegiatan</th><th>Jenis</th><th>Lokasi</th><th>Kelas / Sasaran</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function tfPrintWeek(){
  const{days}=weekData();
  let root=$('print-root');if(!root){root=document.createElement('div');root.id='print-root';document.body.appendChild(root)}
  root.innerHTML=tfPrintHtml(days);
  document.documentElement.classList.add('tf-printing');
  const done=()=>{document.documentElement.classList.remove('tf-printing');root.innerHTML='';window.removeEventListener('afterprint',done)};
  window.addEventListener('afterprint',done);
  setTimeout(()=>window.print(),60);
}
