/* Agenda: fokus, beranda, timeline, jadwal pekan, toast, pengingat, statistik. */
/* ---------- Agenda: kejadian per tanggal ---------- */
const tfSel=()=>($('timeline-date')&&$('timeline-date').value)||dstr();
function shiftDate(n){const d=new Date(tfSel()+'T00:00:00');d.setDate(d.getDate()+n);$('timeline-date').value=dstr(d);renderTimeline()}
function todayDate(){$('timeline-date').value=dstr();renderTimeline()}

/* ---------- Kartu fokus ---------- */
function tfFocusExtras(){
  const a=currentFocusAgenda,n=new Date(),cur=n.getHours()*60+n.getMinutes();
  const bar=$('focus-bar');if(bar){let r=0;if(a){const s=tmin(a.startTime),e=tmin(a.endTime);if(cur>=s)r=Math.min(1,(cur-s)/(e-s))}bar.firstChild.style.width=(r*100)+'%'}
  const mo=$('moti');if(!mo)return;if(state.settings.motivasi===false){mo.style.display='none';return}mo.style.display='';
  const m=tfMoti();$('moti-ic').textContent=m.i;$('moti-t').textContent=m.t;$('moti-s').textContent=m.s
}
function updateFocusCard(){
  const now=new Date(),ds=dstr(now),nm=now.getHours()*60+now.getMinutes()+now.getSeconds()/60;
  const list=tfOcc(ds),next=list.filter(a=>!a.completed&&tmin(a.endTime)>nm)[0];
  const set=(id,v)=>{const el=$(id);if(el)el.innerText=v};
  if(!next){
    const inf=tfDayInfo(ds),lib=!list.length&&inf.off;
    set('focus-title',list.length?'Semua Agenda Hari Ini Selesai!':lib?'Hari Libur':'Belum Ada Agenda Hari Ini');
    set('focus-subtitle',list.length?'Istirahat yang cukup atau siapkan administrasi esok hari.':lib?inf.reason+'. Jadwal berulang disembunyikan hari ini.':'Tambah agenda lewat tombol Tambah di Beranda atau tab Agenda.');
    set('focus-location','-');set('focus-time-range','--:--');set('focus-target','-');set('focus-countdown','00:00:00');
    $('focus-type-badge').className='px-3 py-1 rounded-full text-xs font-semibold border '+BADGE.emerald;$('focus-type-badge').innerText=list.length?'Tuntas':lib?'Libur':'Kosong';
    $('focus-action-btn').style.display='none';currentFocusAgenda=null;tfFocusExtras();return;
  }
  currentFocusAgenda=next;const c=(TYPEC[next.type]||TYPEC.Lainnya)[0];
  $('focus-action-btn').style.display='flex';
  set('focus-title',next.title);
  set('focus-subtitle',[jamText(next),next.notes].filter(Boolean).join(' · ')||'Tidak ada catatan tambahan');
  set('focus-location',next.location||'Ruang Kelas');set('focus-time-range',`${next.startTime} - ${next.endTime}`);set('focus-target',next.target||'Anggota');
  $('focus-type-badge').className='px-3 py-1 rounded-full text-xs font-semibold border '+BADGE[c];$('focus-type-badge').innerText=next.type;
  const s=tmin(next.startTime)*60,e=tmin(next.endTime)*60,cur=nm*60,cd=$('focus-countdown'),f=x=>{x=Math.max(0,Math.floor(x));return [Math.floor(x/3600),Math.floor(x%3600/60),x%60].map(v=>String(v).padStart(2,'0')).join(':')};
  if(cd){if(cur<s){cd.innerText=f(s-cur);cd.className='text-2xl sm:text-3xl tabular-nums font-bold text-amber-400 tracking-wider'}
  else{cd.innerText='Berlangsung '+f(e-cur);cd.className='text-xl sm:text-2xl tabular-nums font-bold text-emerald-400 tracking-wider'}}
  tfFocusExtras();
}
function completeFocusAgenda(){
  if(!currentFocusAgenda)return;state.doneOn[dstr()+'|'+currentFocusAgenda.id]=1;saveStateToStorage();
  triggerAudioBeep(800);triggerVibration([100,50,100]);showToast(`Agenda "${currentFocusAgenda.title}" ditandai selesai!`,'success');
  renderTimeline();renderWeek();updateFocusCard();updateStats();
  if(state.settings.motivasi!==false)setTimeout(()=>showToast(MCOMPLETE[Math.floor(Math.random()*MCOMPLETE.length)],'success'),600);
}
function toggleAgendaComplete(id){const k=tfSel()+'|'+id;state.doneOn[k]?delete state.doneOn[k]:state.doneOn[k]=1;saveStateToStorage();triggerVibration(50);renderTimeline();renderWeek();updateFocusCard();updateStats()}

/* ---------- Beranda: tugas sampai batas waktu deadline ---------- */
function renderHomeTasks(){
  const box=$('home-tasks');if(!box)return;
  const flt=$('timeline-filter');
  if(flt&&flt.value!=='ALL'){box.innerHTML='';return}
  const now=Date.now(),pr={Tinggi:0,Sedang:1,Rendah:2};
  const list=(state.tasks||[]).map(t=>({t,ts:new Date(t.deadline).getTime()})).filter(x=>!isNaN(x.ts)&&x.ts>=now)
    .sort((a,b)=>a.ts-b.ts||(pr[a.t.priority]??3)-(pr[b.t.priority]??3));
  if(!list.length){box.innerHTML='';return}
  const PC={Tinggi:'#ef4444',Sedang:'#f59e0b',Rendah:'#10b981'},p2=n=>String(n).padStart(2,'0');
  const left=ms=>{const m=Math.max(0,Math.floor(ms/60000));if(m<60)return m+' menit lagi';const h=Math.floor(m/60);if(h<24)return h+' j'+(m%60?' '+m%60+' m':'')+' lagi';const d=Math.floor(h/24);return d+' hari'+(h%24?' '+h%24+' j':'')+' lagi'};
  let h=`<div class="ag-sum"><span><i class="fa-solid fa-list-check"></i> ${list.length} tugas &amp; deadline</span><span><i class="fa-regular fa-clock"></i> sampai batas waktu</span></div>`;
  list.forEach(({t,ts})=>{
    const d=new Date(ts),col=PC[t.priority]||'#8b8fa3',done=!!t.completed,soon=!done&&ts-now<3600000*3;
    h+=`<div class="ag-card${done?' done':''}" style="--wc:${col}">
      <button type="button" onclick="toggleTaskComplete('${t.id}')" class="ag-check" aria-label="${done?'Batalkan selesai':'Tandai selesai'}: ${esc(t.title)}" aria-pressed="${done}"><i class="fa-solid fa-check"></i></button>
      <div class="ag-time"><b>${p2(d.getHours())}:${p2(d.getMinutes())}</b><span>${esc(tfDMY(d))}</span><small>batas</small></div>
      <div class="ag-main">
        <div class="ag-chips"><span class="ag-type"><i class="fa-solid fa-list-check"></i> Tugas</span><span class="ag-chip">Prioritas ${esc(t.priority||'-')}</span><span class="ag-chip">${esc(t.category||'Administrasi')}</span><span class="ag-chip"><i class="fa-regular fa-hourglass-half"></i> ${left(ts-now)}</span>${done?'<span class="ag-chip ok"><i class="fa-solid fa-check"></i> Selesai</span>':''}${soon?'<span class="ag-live" style="background:#ef4444"><i></i> Segera</span>':''}</div>
        <h4 class="ag-title">${esc(t.title)}</h4>
        ${t.desc?`<div class="ag-meta"><span><i class="fa-regular fa-note-sticky"></i> ${esc(t.desc)}</span></div>`:''}
      </div>
    </div>`;
  });
  box.innerHTML=h;
}
/* ---------- Timeline ---------- */
/* Penanda libur / acara sekolah untuk satu tanggal (dipakai timeline, kalender). */
function dayBannerHtml(ds){
  const L=tfDayLabels(ds);if(!L.length)return'';
  const ic={libur:'fa-flag',cuti:'fa-flag','sekolah-libur':'fa-umbrella-beach',acara:'fa-graduation-cap'};
  const i=tfDayInfo(ds);
  return L.map(x=>`<span class="dbn-i dbn-${x.kind}"><i class="fa-solid ${ic[x.kind]||'fa-flag'}"></i>${esc(x.full)}</span>`).join('')
    +(i.off?'<span class="dbn-note">Jadwal berulang disembunyikan pada hari ini. Agenda bertanggal khusus tetap tampil.</span>':'');
}
function renderDayBanner(ds){const b=$('day-banner');if(!b)return;const h=dayBannerHtml(ds);b.innerHTML=h;b.classList.toggle('hidden',!h)}
function renderTimeline(){
  renderHomeTasks();
  const box=$('timeline-list'),ds=tfSel(),filter=$('timeline-filter').value,all=tfOcc(ds);
  const dl=$('timeline-daylabel');if(dl)dl.innerText=new Date(ds+'T00:00:00').toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+(ds===dstr()?' (hari ini)':'');
  renderDayBanner(ds);
  const list=all.filter(a=>filter==='ALL'||a.type===filter);
  if(!list.length){box.innerHTML=`<div class="ag-empty"><i class="fa-regular fa-calendar-xmark"></i><b>Belum ada agenda pada tanggal ini</b><span>Tekan "Tambah Agenda Harian" untuk membuat agenda baru.</span></div>`;clashBanner();return}
  const cl=clashIds(ds),now=new Date(),isToday=ds===dstr(),nm=now.getHours()*60+now.getMinutes();
  const done=list.filter(a=>a.completed).length,mins=list.reduce((t,a)=>t+tmin(a.endTime)-tmin(a.startTime),0);
  const dur=m=>m>=60?Math.floor(m/60)+' j'+(m%60?' '+m%60+' m':''):m+' m';
  let h=`<div class="ag-sum"><span><i class="fa-solid fa-list-check"></i> ${list.length} agenda</span><span><i class="fa-solid fa-circle-check"></i> ${done} selesai</span><span><i class="fa-regular fa-hourglass-half"></i> ${dur(mins)}</span></div>`;
  list.forEach(it=>{
    const c=TYPEC[it.type]||TYPEC.Lainnya,col=WK_COL[c[0]]||'#8b8fa3',s0=tmin(it.startTime),e0=tmin(it.endTime);
    const live=isToday&&!it.completed&&nm>=s0&&nm<e0;
    h+=`<div class="ag-card${it.completed?' done':''}${live?' live':''}${cl.has(it.id)?' clash':''}" style="--wc:${col}">
      <button type="button" onclick="toggleAgendaComplete('${it.id}')" class="ag-check" aria-label="${it.completed?'Batalkan selesai':'Tandai selesai'}: ${esc(it.title)}" aria-pressed="${!!it.completed}"><i class="fa-solid fa-check"></i></button>
      <div class="ag-time"><b>${esc(it.startTime)}</b><span>${esc(it.endTime)}</span><small>${dur(e0-s0)}</small></div>
      <div class="ag-main">
        <div class="ag-chips"><span class="ag-type"><i class="fa-solid ${c[1]}"></i> ${esc(it.type)}</span>${jamText(it)?`<span class="ag-chip">${esc(jamText(it))}</span>`:''}<span class="ag-chip"><i class="fa-solid fa-repeat"></i> ${esc(repeatText(it))}</span>${live?'<span class="ag-live"><i></i> Berlangsung</span>':''}${it.completed?'<span class="ag-chip ok"><i class="fa-solid fa-check"></i> Selesai</span>':''}${cl.has(it.id)?clashTag:''}</div>
        <h4 class="ag-title">${esc(it.title)}</h4>
        <div class="ag-meta"><span><i class="fa-solid fa-location-dot"></i> ${esc(it.location||'-')}</span><span><i class="fa-solid fa-users"></i> ${esc(it.target||'Anggota')}</span>${it.notes?`<span><i class="fa-regular fa-note-sticky"></i> ${esc(it.notes)}</span>`:''}</div>
      </div>
    </div>`;
  });
  box.innerHTML=h;
  clashBanner();
}
function openAgendaModal(editId=null){
  $('form-agenda').reset();$('agenda-id').value='';fillJam();
  const it=editId&&state.agendas.find(a=>a.id===editId);
  if(it){$('agenda-id').value=it.id;$('agenda-type').value=it.type;$('agenda-title').value=it.title;$('agenda-start-time').value=it.startTime;$('agenda-end-time').value=it.endTime;$('agenda-location').value=it.location||'';$('agenda-target').value=it.target==='Anggota'?'':(it.target||'');$('agenda-notes').value=it.notes||'';
    $('agenda-jam-from').value=it.jamFrom?String(it.jamFrom):'';$('agenda-jam-to').value=it.jamTo?String(it.jamTo):''}
  document.querySelectorAll('[name=agenda-day]').forEach(c=>c.checked=!!it&&(it.days||[]).includes(+c.value));
  $('agenda-date').value=(it&&it.date)||'';
  $('modal-agenda-title-text').innerHTML=`<i class="fa-solid fa-calendar-plus text-blue-400"></i> ${it?'Edit':'Tambah'} Agenda`;
  $('modal-agenda').classList.remove('hidden');
  modalClash();
}
function saveAgenda(e){
  e.preventDefault();
  const id=$('agenda-id').value,o={type:$('agenda-type').value,title:$('agenda-title').value.trim(),startTime:$('agenda-start-time').value,endTime:$('agenda-end-time').value,location:$('agenda-location').value.trim(),target:$('agenda-target').value.trim()||'Anggota',notes:$('agenda-notes').value.trim()};
  if(!o.startTime||!o.endTime)return showToast('Pilih jam mulai dan jam selesai.','error');
  if(tmin(o.endTime)<=tmin(o.startTime))return showToast('Jam selesai harus setelah jam mulai.','error');
  o.jamFrom=+$('agenda-jam-from').value||null;o.jamTo=o.jamFrom?(+$('agenda-jam-to').value||o.jamFrom):null;if(o.jamTo&&o.jamTo<o.jamFrom)o.jamTo=o.jamFrom;
  o.date=$('agenda-date').value||null;o.days=o.date?[]:[...document.querySelectorAll('[name=agenda-day]:checked')].map(c=>+c.value);
  let saved;
  if(id){const i=state.agendas.findIndex(a=>a.id===id);state.agendas[i]=saved={...state.agendas[i],...o}}
  else{saved={id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),completed:false,...o};state.agendas.push(saved)}
  const clash=state.agendas.find(b=>b.id!==saved.id&&tmin(b.startTime)<tmin(saved.endTime)&&tmin(b.endTime)>tmin(saved.startTime)&&tfShare(b,saved));
  saveStateToStorage();renderTimeline();renderWeek();updateFocusCard();updateStats();closeModal('modal-agenda');
  clash?showToast(`Perhatian: bentrok jam dengan "${clash.title}" (${clash.startTime}-${clash.endTime}).`,'warn',7000):showToast(o.days.length?'Jadwal tetap disimpan. Berulang tiap pekan sampai dihapus.':'Agenda berhasil disimpan!','success',4500);
}

/* ---------- Jadwal pekan ---------- */
let tfWeekOff=0;
function shiftWeek(n){tfWeekOff=n===0?0:tfWeekOff+n;renderWeek()}
function weekData(){
  const f=($('week-filter')||{}).value||'ALL',mon=tfMonday(tfWeekOff),days=[];
  for(let i=0;i<7;i++){const d=new Date(mon);d.setDate(mon.getDate()+i);const ds=dstr(d);days.push({d,ds,items:tfOcc(ds).filter(a=>f==='ALL'||a.type===f)})}
  days.forEach(x=>{const cl=clashIds(x.ds);x.items=x.items.map(a=>({...a,clash:cl.has(a.id)}));x.labels=tfDayLabels(x.ds)});
  return{days,mon};
}
function setWeekView(v){state.settings.weekView=v;saveStateToStorage();renderWeek()}
const WK_COL={blue:'#3b82f6',sky:'#0ea5e9',emerald:'#10b981',fuchsia:'#d946ef',orange:'#f97316',gray:'#8b8fa3',amber:'#f59e0b'};
function weekChip(a,compact){
  const c=TYPEC[a.type]||TYPEC.Lainnya,col=WK_COL[c[0]]||'#8b8fa3',jam=jamText(a),who=a.target&&a.target!=='Anggota'?a.target:'';
  const body=`<button type="button" onclick="editAgenda('${a.id}')" class="wk-body" aria-label="${esc(a.title)}, ${esc(a.startTime)} sampai ${esc(a.endTime)}">${a.clash?clashTag:''}<span class="wk-top"><span class="wk-time">${esc(a.startTime)}&ndash;${esc(a.endTime)}</span><i class="fa-solid ${a.completed?'fa-circle-check':c[1]} wk-ic"></i></span><span class="wk-title">${esc(a.title)}</span>${jam||who?`<span class="wk-tags">${jam?`<span class="wk-tag">${esc(jam)}</span>`:''}${who?`<span class="wk-tag">${esc(who)}</span>`:''}</span>`:''}${a.location?`<span class="wk-meta"><i class="fa-solid fa-location-dot"></i> ${esc(a.location)}</span>`:''}</button>`;
  const act=compact?'':`<div class="wk-act"><button type="button" onclick="editAgenda('${a.id}')" class="wk-ab" aria-label="Edit ${esc(a.title)}"><i class="fa-solid fa-pen"></i> Edit</button><button type="button" onclick="deleteAgenda('${a.id}')" class="wk-ab del" aria-label="Hapus ${esc(a.title)}"><i class="fa-solid fa-trash"></i> Hapus</button></div>`;
  return `<div class="wk-card${a.completed?' done':''}${a.clash?' clash':''}" style="--wc:${col}">${body}${act}</div>`}
function renderWeek(){
  const box=$('week-grid');if(!box)return;
  const{days,mon}=weekData(),sun=days[6].d,today=dstr(),view=state.settings.weekView||(bellLessons().length?'table':'card');
  $('week-range').textContent=fmtD(mon)+'/'+mon.getFullYear()+' – '+fmtD(sun)+'/'+sun.getFullYear()+(tfWeekOff===0?' (pekan ini)':'');
  let mins=0,cnt=0;days.forEach(x=>x.items.forEach(a=>{if(a.type==='Mengajar'){cnt++;mins+=tmin(a.endTime)-tmin(a.startTime)}}));
  $('week-summary').textContent=cnt+' sesi mengajar · '+Math.floor(mins/60)+' jam '+(mins%60)+' menit pada pekan ini';
  ['table','card'].forEach(v=>{const b=$('wv-'+v);if(b){b.className='px-3 py-2 text-xs font-semibold rounded-lg '+(view===v?'bg-blue-600 text-white':'text-slate-300');b.setAttribute('aria-pressed',view===v)}});
  $('week-grid').classList.toggle('hidden',view!=='card');$('week-table').classList.toggle('hidden',view!=='table');
  if(view==='table')return renderWeekTable(days,today);
  box.innerHTML=days.map(x=>{
    const t=x.ds===today,nm=TF_DAYS[x.d.getDay()];
    return `<div class="wk-day${t?' today':''}"><div class="wk-dh"><div><b>${nm}</b><span>${fmtD(x.d)}${t?' · Hari ini':''}</span>${x.labels&&x.labels.length?`<span class="wk-hol" title="${esc(x.labels.map(l=>l.full).join('; '))}"><i class="fa-solid fa-flag"></i> ${esc(x.labels[0].text)}</span>`:''}</div><span class="wk-count" title="${x.items.length} kegiatan">${x.items.length}</span><button type="button" onclick="addAgendaOn('${x.ds}')" class="wk-add" aria-label="Tambah agenda hari ${nm}"><i class="fa-solid fa-plus"></i></button></div><div class="wk-list">`+(x.items.map(a=>weekChip(a)).join('')||'<p class="wk-empty"><i class="fa-regular fa-calendar"></i>Kosong</p>')+`</div></div>`}).join('');
}
function renderWeekTable(days,today){
  const box=$('week-table'),rows=bellRows();
  if(!bellLessons().length){box.innerHTML=`<div class="p-6 text-center text-slate-400 text-sm space-y-3"><p>Atur jam pelajaran dulu agar jadwal tampil per "Jam ke".</p><button onclick="openBellModal()" class="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold">Atur Jam Pelajaran</button></div>`;return}
  const cols=days.filter((x,i)=>i<6||x.items.length),has=(x,n)=>x.items.find(a=>a.jamFrom&&a.jamFrom<=n&&n<=(a.jamTo||a.jamFrom));
  const th=cols.map(x=>`<th class="p-2 text-xs ${x.ds===today?'text-blue-400':'text-slate-100'}">${TF_DAYS[x.d.getDay()]}<span class="block text-[10px] font-normal text-slate-400">${fmtD(x.d)}</span>${x.labels&&x.labels.length?`<span class="wk-hol" title="${esc(x.labels.map(l=>l.full).join('; '))}"><i class="fa-solid fa-flag"></i> ${esc(x.labels[0].text)}</span>`:''}</th>`).join('');
  const body=rows.map(r=>{
    if(!r.n)return `<tr><td class="p-2 text-[11px] text-slate-400 whitespace-nowrap tabular-nums">${r.s}–${r.e}</td><td colspan="${cols.length}" class="p-1"><div class="rounded-lg bg-slate-700/30 text-center text-[11px] text-slate-400 py-1">${esc(r.label||'Istirahat')}</div></td></tr>`;
    return `<tr><td class="p-2 whitespace-nowrap"><b class="text-xs text-slate-100">Jam ke: ${r.n}</b><span class="block text-[10px] text-slate-400 tabular-nums">${r.s}–${r.e}</span></td>`+cols.map(x=>{
      const a=has(x,r.n);if(!a)return `<td class="p-1"><div class="rounded-lg border border-dashed border-slate-700/60 h-12"></div></td>`;
      const c=TYPEC[a.type]||TYPEC.Lainnya,first=r.n===a.jamFrom;
      return `<td class="p-1"><button onclick="editAgenda('${a.id}')" aria-label="${esc(a.title)}" class="w-full h-12 text-left rounded-lg border px-2 py-1 text-[11px] leading-tight overflow-hidden ${BADGE[c[0]]} ${a.completed?'opacity-50':''}${a.clash?' clash':''}">${first?`<b class="block truncate">${esc(a.title)}</b><span class="block truncate opacity-80">${esc([a.target&&a.target!=='Anggota'?a.target:'',a.location].filter(Boolean).join(' · ')||a.startTime+'–'+a.endTime)}</span>`:'<span class="opacity-60">↳</span>'}</button></td>`}).join('')+`</tr>`}).join('');
  const inBell=a=>a.jamFrom&&rows.some(r=>r.n===a.jamFrom);
  const outside=cols.some(x=>x.items.some(a=>!inBell(a)))?`<tr><td class="p-2 text-[11px] text-slate-400 align-top">Di luar jam pelajaran</td>`+cols.map(x=>`<td class="p-1 align-top">${x.items.filter(a=>!inBell(a)).map(a=>weekChip(a,true)).join('')}</td>`).join('')+`</tr>`:'';
  box.innerHTML=`<table class="w-full min-w-[760px]" style="border-collapse:separate;border-spacing:0;table-layout:fixed"><thead><tr><th class="p-2 text-left text-xs text-slate-400" style="width:92px">Jam</th>${th}</tr></thead><tbody>${body}${outside}</tbody></table>`;
}
function addAgendaOn(ds){
  openAgendaModal();const dow=new Date(ds+'T12:00:00').getDay();
  document.querySelectorAll('[name=agenda-day]').forEach(c=>c.checked=+c.value===dow);
}
function copyWeek(){
  const{days}=weekData();
  tfCopy(['Jadwal '+$('week-range').textContent].concat(days.map(x=>TF_DAYS[x.d.getDay()]+' '+fmtD(x.d)+':\n'+(x.items.map(a=>`- ${jamText(a)?jamText(a)+' ':''}${a.startTime}-${a.endTime} ${a.title}${a.location?' ('+a.location+')':''}`).join('\n')||'- Kosong'))).join('\n\n'));
}
function tfRefreshAgenda(){renderTimeline();renderWeek();updateFocusCard();updateStats()}
function deleteAgenda(id){
  const idx=state.agendas.findIndex(a=>a.id===id);if(idx<0)return;
  const it=state.agendas[idx],rep=!it.date,nm=it.title?'“'+it.title+'” ':'';
  const run=()=>{
    state.agendas.splice(idx,1);saveStateToStorage();tfRefreshAgenda();
    showToast('Agenda dihapus.','info',7000,{label:'Batalkan',fn:()=>{
      state.agendas.splice(Math.min(idx,state.agendas.length),0,it);saveStateToStorage();tfRefreshAgenda();showToast('Agenda dikembalikan.','success')}});
  };
  rep?tfConfirm({title:'Hapus jadwal tetap?',message:nm+'akan dihapus dari SEMUA pekan. Anda masih bisa membatalkannya sesaat setelah dihapus.',yes:'Hapus',onYes:run}):run();
}

/* ---------- Toast ---------- */
function showToast(msg,type='info',ms=3500,act){
  const box=$('toast-container'),t=document.createElement('div');
  const m={success:['bg-emerald-500/20 text-emerald-300 border-emerald-500/40','fa-circle-check text-emerald-400'],warn:['bg-amber-500/20 text-amber-300 border-amber-500/40','fa-bell text-amber-400'],error:['bg-rose-500/20 text-rose-300 border-rose-500/40','fa-circle-exclamation text-rose-400'],info:['bg-slate-800 text-slate-100 border-slate-700','fa-circle-info text-blue-400']}[type]||[];
  t.setAttribute('role','alert');t.className=`px-4 py-3 rounded-xl border ${m[0]} shadow-xl text-xs font-semibold flex items-center gap-2.5 pointer-events-auto transition-all max-w-xs sm:max-w-sm backdrop-blur-md`;
  const i=document.createElement('i');i.className='fa-solid text-sm '+m[1];const s=document.createElement('span');s.textContent=msg;t.append(i,s);
   if(act){const bt=document.createElement('button');bt.type='button';bt.textContent=act.label;bt.className='ml-1 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 font-bold underline';bt.onclick=()=>{t.remove();act.fn()};t.append(bt)}
  t.style.backgroundColor='rgb(var(--toast))';box.appendChild(t);while(box.children.length>3)box.firstChild.remove();
  setTimeout(()=>{t.classList.add('opacity-0');setTimeout(()=>t.remove(),300)},ms);
}

/* ---------- Pengingat otomatis ---------- */
function tfAlert(title,body){
  if(state.settings.motivasi!==false&&!/^(Deadline|Uji)/.test(title))body+=' · '+tfMoti().t;
  showToast(title+' — '+body,'warn',10000);
  if(state.settings.sound){triggerAudioBeep(880);setTimeout(()=>triggerAudioBeep(660),350);setTimeout(()=>triggerAudioBeep(880),700)}
  if(state.settings.vibrate)triggerVibration([300,150,300,150,500]);
  tfNotify(title,body);
}
async function tfNotify(t,b){
  if(!('Notification'in window)||Notification.permission!=='granted')return;
  try{const r=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();r?r.showNotification(t,{body:b,icon:'icons/icon-192.png',badge:'icons/icon-192.png',vibrate:[300,150,300],tag:t}):new Notification(t,{body:b})}catch(e){try{new Notification(t,{body:b})}catch(_){}}
}
function tfCheck(){
  const now=new Date(),ds=dstr(now),n=now.getHours()*60+now.getMinutes(),lead=+state.settings.lead||10;let ch=false;
  const fire=(k,t,b)=>{if(state.fired[k])return;state.fired[k]=1;ch=true;tfAlert(t,b)};
  if(ds!==tfToday){if(tfSel()===tfToday)$('timeline-date').value=ds;tfToday=ds;renderTimeline();renderWeek();ch=true}
  const list=tfOcc(ds);
  list.forEach(a=>{if(a.completed)return;const s=tmin(a.startTime),e=tmin(a.endTime),k=ds+'|'+a.id,loc=a.location?' di '+a.location:'';
    if(n>=s-lead&&n<s)fire(k+'|pre',`${a.title} dimulai ${s-n} menit lagi`,`${a.startTime}${loc}`);
    if(n>=s&&n<e)fire(k+'|start',n-s>2?`${a.title} sudah berjalan ${n-s} menit`:`Waktunya ${a.title}`,`${a.startTime}-${a.endTime}${loc}`);
  });
  state.tasks.forEach(t=>{if(t.completed)return;const d=new Date(t.deadline);if(isNaN(d))return;const m=(d-now)/6e4;
    if(m>0&&m<=60)fire('t|'+t.id+'|soon',`Deadline ${Math.max(1,Math.round(m))} menit lagi`,t.title);
    if(m<=0&&m>-180)fire('t|'+t.id+'|late','Deadline terlewat',t.title)});
  Object.keys(state.fired).forEach(k=>{if(!k.startsWith(ds)&&!k.startsWith('t|')){delete state.fired[k];ch=true}});
  if(ch)saveStateToStorage(true);
}

/* ---------- Statistik ---------- */
function updateStats(){
  if(!$('st-agenda'))return;const l=tfOcc(dstr()),open=state.tasks.filter(t=>!t.completed);
  $('st-agenda').textContent=l.filter(a=>a.completed).length+'/'+l.length;$('st-urgent').textContent=open.filter(t=>t.priority==='Tinggi').length;
  $('st-tasks').textContent=open.length;$('st-notes').textContent=state.notes.length;
}
