/* TeacherFlow: logika murni (tanpa DOM) supaya mudah diuji dengan `node --test`.
   Bergantung pada variabel global `state` yang disediakan js/tasks-notes.js. */
const TF_DAYS=['Ahad','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const TF_DAYS_S=['Ahd','Sen','Sel','Rab','Kam','Jum','Sab'];
const dstr=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const tmin=s=>{const[a,b]=String(s).split(':').map(Number);return a*60+b};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const p2=n=>String(n).padStart(2,'0');
const tfDMY=d=>`${p2(d.getDate())}/${p2(d.getMonth()+1)}/${d.getFullYear()}`;
const jamText=a=>a&&a.jamFrom?(a.jamTo&&a.jamTo!==a.jamFrom?`Jam ke: ${a.jamFrom}–${a.jamTo}`:`Jam ke: ${a.jamFrom}`):'';
const minToT=m=>p2(Math.floor(m/60)%24)+':'+p2(m%60);
const occursOn=(a,ds)=>a.date?a.date===ds:(!a.days||!a.days.length||a.days.includes(new Date(ds+'T00:00:00').getDay()));
const tfOcc=ds=>{const off=tfDayInfo(ds).off;return state.agendas.filter(a=>occursOn(a,ds)&&!(off&&!a.date)).map(a=>({...a,completed:!!state.doneOn[ds+'|'+a.id]})).sort((a,b)=>a.startTime.localeCompare(b.startTime))};
const repeatText=a=>a.date?'Sekali: '+a.date.split('-').reverse().join('/'):(a.days&&a.days.length?a.days.map(d=>TF_DAYS_S[d]).join(', '):'Setiap hari');
const tfMonday=o=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7)+o*7);return d};
const fmtD=d=>p2(d.getDate())+'/'+p2(d.getMonth()+1);
function clashPairs(ds){const l=tfOcc(ds),o=[];for(let i=0;i<l.length;i++)for(let j=i+1;j<l.length;j++)if(tmin(l[i].startTime)<tmin(l[j].endTime)&&tmin(l[j].startTime)<tmin(l[i].endTime))o.push([l[i],l[j]]);return o}
function clashIds(ds){const s=new Set();clashPairs(ds).forEach(p=>p.forEach(a=>s.add(a.id)));return s}
function tfShare(a,b){
  if(a.date&&b.date)return a.date===b.date;if(a.date)return occursOn(b,a.date);if(b.date)return occursOn(a,b.date);
  const x=a.days||[],y=b.days||[];return !x.length||!y.length||x.some(d=>y.includes(d));
}

/* ---------- Kalender akademik: libur nasional + acara sekolah buatan pengguna ---------- */
const TF_HOLIDAY_MODES={national:'Libur nasional saja',all:'Libur nasional + cuti bersama',none:'Jangan sembunyikan jadwal'};
const TF_EVENT_TYPES=['Libur sekolah','Ujian','Kegiatan sekolah','Lainnya'];
const tfHolidayOn=ds=>TF_HOLIDAYS[ds]||null;
const tfEventsOn=ds=>(state.academic||[]).filter(e=>e.from&&e.from<=ds&&ds<=(e.to||e.from));
/* off=true berarti jadwal berulang (tanpa tanggal khusus) disembunyikan pada hari itu.
   Agenda bertanggal khusus tetap tampil. Acara sekolah dengan off=true selalu menyembunyikan. */
function tfDayInfo(ds){
  const h=tfHolidayOn(ds),ev=tfEventsOn(ds),mode=(state.settings&&state.settings.holidayMode)||'national';
  const evOff=ev.find(e=>e.off);
  if(evOff)return{holiday:h,events:ev,off:true,reason:evOff.title};
  if(h&&((h.t==='libur'&&mode!=='none')||(h.t==='cuti'&&mode==='all')))return{holiday:h,events:ev,off:true,reason:h.n};
  return{holiday:h,events:ev,off:false,reason:''};
}
/* Daftar teks penanda untuk satu tanggal (dipakai kalender, pekan, dan banner). */
function tfDayLabels(ds){
  const i=tfDayInfo(ds),o=[];
  if(i.holiday)o.push({kind:i.holiday.t,text:i.holiday.n,full:i.holiday.t==='libur'?'Libur nasional · '+i.holiday.n:i.holiday.n});
  i.events.forEach(e=>o.push({kind:e.off?'sekolah-libur':'acara',text:e.title,type:e.type,full:e.type+' · '+e.title}));
  return o;
}

/* ---------- Data lembar ekspor (murni; dirender ke .xlsx oleh js/xlsx.js) ---------- */
const TF_MONTHS_ID=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const tfDMYs=ds=>ds.split('-').reverse().join('/');
function tfExportSheets(st,days){
  const lab=ds=>tfDayLabels(ds).map(x=>x.text).join('; ');
  const week=[['Hari','Tanggal','Mulai','Selesai','Jam ke','Kegiatan','Jenis','Lokasi','Kelas / Sasaran','Catatan','Keterangan hari']];
  days.forEach(x=>{
    const nm=TF_DAYS[new Date(x.ds+'T12:00:00').getDay()];
    if(!x.items.length)week.push([nm,tfDMYs(x.ds),'','','','—','','','','',lab(x.ds)]);
    else x.items.forEach(a=>week.push([nm,tfDMYs(x.ds),a.startTime,a.endTime,jamText(a).replace(/^Jam ke:\s*/,''),a.title,a.type,a.location||'',a.target&&a.target!=='Anggota'?a.target:'',a.notes||'',lab(x.ds)]))});
  const all=[['Kegiatan','Jenis','Mulai','Selesai','Jam ke','Pengulangan','Lokasi','Kelas / Sasaran','Catatan']];
  [...st.agendas].sort((a,b)=>(a.date||'').localeCompare(b.date||'')||a.startTime.localeCompare(b.startTime))
    .forEach(a=>all.push([a.title,a.type,a.startTime,a.endTime,jamText(a).replace(/^Jam ke:\s*/,''),repeatText(a),a.location||'',a.target&&a.target!=='Anggota'?a.target:'',a.notes||'']));
  const tasks=[['Tugas','Prioritas','Kategori','Batas waktu','Status','Rincian']];
  st.tasks.forEach(t=>tasks.push([t.title,t.priority||'',t.category||'',t.deadline?String(t.deadline).replace('T',' '):'',t.completed?'Selesai':'Aktif',t.desc||'']));
  const acad=[['Acara','Jenis','Dari','Sampai','Sembunyikan jadwal berulang']];
  (st.academic||[]).slice().sort((a,b)=>a.from.localeCompare(b.from)).forEach(e=>acad.push([e.title,e.type,tfDMYs(e.from),tfDMYs(e.to||e.from),e.off?'Ya':'Tidak']));
  return[{name:'Jadwal Pekan',rows:week,widths:[10,12,8,8,8,34,16,16,18,28,32]},
         {name:'Semua Agenda',rows:all,widths:[34,16,8,8,8,24,16,18,30]},
         {name:'Tugas',rows:tasks,widths:[36,10,18,18,10,40]},
         {name:'Kalender Akademik',rows:acad,widths:[34,18,12,12,26]}];
}
