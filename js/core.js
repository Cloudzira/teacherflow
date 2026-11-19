/* Inti: konstanta UI, penyimpanan, tema, waktu, dan jam pelajaran. */
const TF_LOGO=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%" aria-hidden="true"><defs><linearGradient id="tfg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8B73E8"/><stop offset="1" stop-color="#5A44B8"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#tfg)"/><circle cx="256" cy="240" r="138" fill="#fff" stroke="#E8E2FA" stroke-width="14"/><path d="M256 150v92l62 42" fill="none" stroke="#5A44B8" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/><circle cx="256" cy="242" r="14" fill="#5A44B8"/><circle cx="348" cy="352" r="66" fill="#FDB84A" stroke="#6F55CF" stroke-width="12"/><path d="M318 352l22 22 40-46" fill="none" stroke="#fff" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
/* ================= TEACHERFLOW v2 MODULE (menimpa/menambah fungsi dasar) ================= */
const $=id=>document.getElementById(id);
const TI='glass-input rounded-xl p-2.5 w-full', LB='block text-slate-300 font-medium mb-1';
const TYPEC={'Mengajar':['sky','fa-chalkboard-user'],'Halaqah':['emerald','fa-book-quran'],'Ekstrakurikuler':['fuchsia','fa-masks-theater'],'Piket':['orange','fa-shield-halved'],'Lainnya':['gray','fa-thumbtack']};
const BADGE={blue:'bg-blue-500/20 text-blue-300 border-blue-500/30',sky:'bg-sky-500/20 text-sky-300 border-sky-500/40',emerald:'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',fuchsia:'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',orange:'bg-orange-500/20 text-orange-300 border-orange-500/40',gray:'bg-gray-500/20 text-gray-300 border-gray-500/40',amber:'bg-amber-500/20 text-amber-300 border-amber-500/30',purple:'bg-purple-500/20 text-purple-300 border-purple-500/30'};
const ICOL={blue:'text-blue-400',sky:'text-sky-400',emerald:'text-emerald-400',fuchsia:'text-fuchsia-400',orange:'text-orange-500',gray:'text-gray-400',amber:'text-amber-400',purple:'text-purple-400'};
let tfToday=dstr(), deferredInstall=null;

/* ---------- Penyimpanan ---------- */
const TFK={doneOn:'tf_doneOn',settings:'tf_settings',fired:'tf_fired',academic:'tf_academic'};
const TFDEF=()=>({doneOn:{},settings:{lead:10,sound:true,vibrate:true,theme:'auto',holidayMode:'national'},fired:{},academic:[]});
const TF_OLD_KEYS=['gf_isDinasLuar','gf_custom_templates','tf_classes','tf_attendance','tf_grades','tf_dinasDate'];
function loadStateFromStorage(){
  const g=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
  state.agendas=g('gf_agendas',[]);state.tasks=g('gf_tasks',[]);state.notes=g('gf_notes',[]);
  state.agendas.forEach(a=>{if(a.type==='Dinas Luar')a.type='Lainnya'});
  const d=TFDEF();for(const k in TFK){const v=g(TFK[k],null);state[k]=v?(k==='settings'?{...d.settings,...v}:v):d[k]}
  TF_OLD_KEYS.forEach(k=>localStorage.removeItem(k));
  tfApplyTheme();
}
function saveStateToStorage(silent){
  try{
    localStorage.setItem('gf_agendas',JSON.stringify(state.agendas));
    localStorage.setItem('gf_tasks',JSON.stringify(state.tasks));
    localStorage.setItem('gf_notes',JSON.stringify(state.notes));
    for(const k in TFK)localStorage.setItem(TFK[k],JSON.stringify(state[k]));
  }catch(e){showToast('Penyimpanan penuh atau diblokir browser. Ekspor cadangan dari Pengaturan.','warn',6000)}
  if(silent!==true){
    try{localStorage.setItem('tf_updatedAt',String(Date.now()))}catch(e){}
    if(fbUser&&fb){clearTimeout(fbPushT);fbState='busy';fbUi();fbPushT=setTimeout(()=>{if(!navigator.onLine){fbPending=true;fbState='ready';fbUi();return}fbPush().then(()=>{fbState='in';fbUi()}).catch(e=>{fbPending=true;fbState='err';fbUi();showToast('Gagal mengunggah ke cloud ('+(e.code||e.message)+'). Data tetap aman di perangkat.','error',6000)})},1500)}
  }
  try{renderCalendar();renderNotes()}catch(e){}
}

triggerVibration=function(p=50){if('vibrate'in navigator&&(!navigator.userActivation||navigator.userActivation.hasBeenActive))try{navigator.vibrate(p)}catch(e){}};

/* ---------- Tema terang / gelap ---------- */
const TF_THEMES={
  auto:{n:'Otomatis',sw:'linear-gradient(90deg,#f6f1ff 50%,#1f1847 50%)'},
  light:{n:'Terang',dark:false,meta:'#7c3aed',sw:'linear-gradient(135deg,#7c3aed,#d946ef)'},
  dark:{n:'Gelap',dark:true,meta:'#0d0a22',sw:'linear-gradient(135deg,#1f1847,#7c3aed)'},
  mint:{n:'Zamrud',dark:false,meta:'#047857',sw:'linear-gradient(135deg,#047857,#2dd4bf)'},
  ocean:{n:'Samudra',dark:true,meta:'#06142b',sw:'linear-gradient(135deg,#0f2347,#0284c7)'}
};
const tfThemeKey=()=>{const t=(state.settings||{}).theme;return TF_THEMES[t]?t:'auto'};
function tfApplyTheme(){
  let k=tfThemeKey();
  if(k==='auto')k=(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';
  const th=TF_THEMES[k],h=document.documentElement;
  h.classList.toggle('dark',!!th.dark);
  if(k==='mint'||k==='ocean')h.setAttribute('data-theme',k);else h.removeAttribute('data-theme');
  const m=document.querySelector('meta[name=theme-color]');if(m)m.content=th.meta;
  const i=$('theme-icon');if(i)i.className='fa-solid '+(th.dark?'fa-sun':'fa-moon');
}
const tfThemeBtn=(v,on)=>`<button type="button" data-th="${v}" role="radio" aria-checked="${on}" class="thm${on?' on':''}"><span class="thm-sw" style="background:${TF_THEMES[v].sw}"></span><span>${TF_THEMES[v].n}</span></button>`;

/* ---------- Komponen waktu & tanggal (24 jam, dd/mm/yyyy) dan jam pelajaran ---------- */
function startLiveClock(){
  /* Jam statis (JJ:MM, tanpa detik): hanya diperbarui saat menit berganti */
  const tick=()=>{const n=new Date();
    const ct=$('card-time');if(ct)ct.textContent=p2(n.getHours())+':'+p2(n.getMinutes());
    const ld=$('live-date');if(ld)ld.textContent=n.toLocaleDateString('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
    setTimeout(tick,(60-n.getSeconds())*1000-n.getMilliseconds()+50)};
  tick();
}
const _vd=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value');
function tfEnhance(root=document){
  root.querySelectorAll('input[type=time]:not([data-tf]),input[type=date]:not([data-tf]),input[type=datetime-local]:not([data-tf])').forEach(inp=>{
    inp.dataset.tf='1';inp.type==='time'?tfTime(inp):tfDate(inp,inp.type);
  });
}
function tfTime(inp){
  const cls=inp.className.replace(/\bw-full\b/,'').trim();
  const mk=(lbl,max)=>{const s=document.createElement('select');s.className=cls+' !px-1 flex-1 min-w-0 text-center tabular-nums';s.setAttribute('aria-label',lbl);s.innerHTML='<option value="">--</option>'+Array.from({length:max},(_,i)=>`<option>${p2(i)}</option>`).join('');return s};
  const h=mk('Jam',24),mi=mk('Menit',60),wrap=document.createElement('div'),sep=document.createElement('span');
  wrap.className='flex items-center gap-1.5';sep.textContent=':';sep.className='font-bold text-slate-400';
  inp.type='hidden';wrap.append(h,sep,mi);inp.after(wrap);
  const sync=()=>{const v=_vd.get.call(inp);h.value=v?v.slice(0,2):'';mi.value=v?v.slice(3,5):''};
  const push=()=>{if(h.value&&!mi.value)mi.value='00';_vd.set.call(inp,h.value?h.value+':'+mi.value:'');inp.dispatchEvent(new Event('change',{bubbles:true}))};
  h.onchange=mi.onchange=push;
  Object.defineProperty(inp,'value',{get(){return _vd.get.call(inp)},set(v){_vd.set.call(inp,v);sync()},configurable:true});
  if(inp.form)inp.form.addEventListener('reset',()=>setTimeout(sync,0));
  sync();
}
function tfDate(inp,t){
  const wrap=document.createElement('div'),disp=document.createElement('div');
  wrap.className='relative '+(inp.id==='timeline-date'?'inline-block':'');
  disp.className=inp.className.replace(/\bw-full\b/,'')+' flex items-center justify-between gap-2 w-full pointer-events-none select-none';
  disp.innerHTML='<span class="txt tabular-nums"></span><i class="fa-regular fa-calendar text-slate-400"></i>';
  inp.before(wrap);wrap.append(disp,inp);inp.className='absolute inset-0 w-full h-full opacity-0 cursor-pointer';
  const txt=disp.firstChild,fmt=()=>{const v=_vd.get.call(inp);
    if(!v){txt.textContent=t==='date'?'dd/mm/yyyy':'dd/mm/yyyy --:--';txt.classList.add('text-slate-500');return}
    const[d,tm]=v.split('T'),[y,mo,da]=d.split('-');txt.textContent=`${da}/${mo}/${y}`+(tm?' '+tm.slice(0,5):'');txt.classList.remove('text-slate-500')};
  Object.defineProperty(inp,'value',{get(){return _vd.get.call(inp)},set(v){_vd.set.call(inp,v);fmt()},configurable:true});
  ['input','change'].forEach(e=>inp.addEventListener(e,fmt));
  inp.addEventListener('click',()=>{try{inp.showPicker()}catch(e){}});
  if(inp.form)inp.form.addEventListener('reset',()=>setTimeout(fmt,0));
  fmt();
}
const bellRows=()=>state.settings.bell||[];
const bellLessons=()=>bellRows().filter(r=>r.n);
function bellSummary(){const L=bellLessons();return L.length?`${L.length} jam · ${L[0].s}–${L[L.length-1].e}`:'Belum diatur'}
function tfThemeSeg(){
  const all=()=>document.querySelectorAll('#theme-seg [data-th]');
  all().forEach(b=>b.onclick=()=>{state.settings.theme=b.dataset.th;saveStateToStorage();tfApplyTheme();
    all().forEach(x=>{const on=x===b;x.setAttribute('aria-checked',on);x.classList.toggle('on',on)})});
}
function fillJam(){
  const L=bellLessons(),nums=L.length?L.map(r=>r.n):Array.from({length:12},(_,i)=>i+1);
  const opt=n=>{const r=L.find(x=>x.n===n);return `<option value="${n}">Jam ke: ${n}${r?` (${r.s}–${r.e})`:''}</option>`};
  $('agenda-jam-from').innerHTML='<option value="">Tanpa jam ke</option>'+nums.map(opt).join('');
  $('agenda-jam-to').innerHTML='<option value="">Sampai jam ke…</option>'+nums.map(opt).join('');
  $('jam-hint').innerHTML=L.length?'Pilih jam ke: waktu mulai dan selesai terisi otomatis dari pengaturan jam pelajaran.':'Jam pelajaran belum diatur. <button type="button" class="text-blue-400 font-semibold underline" onclick="closeModal(\'modal-agenda\');openBellModal()">Atur sekarang</button> agar waktu terisi otomatis.';
}
function onJamChange(){
  const jf=$('agenda-jam-from'),jt=$('agenda-jam-to');let a=+jf.value,b=+jt.value;
  if(!a&&b){jf.value=jt.value;a=b}
  if(a&&b&&b<a){jt.value=String(a);b=a}
  if(a){const L=bellLessons(),ra=L.find(r=>r.n===a),rb=L.find(r=>r.n===(b||a));
    if(ra&&rb){$('agenda-start-time').value=ra.s;$('agenda-end-time').value=rb.e}}
  modalClash();
}
function setDur(n){const s=$('agenda-start-time').value;if(!s){showToast('Pilih jam mulai dulu.','info');return}$('agenda-end-time').value=minToT(tmin(s)+n);modalClash()}
function openBellModal(){
  let rows=JSON.parse(JSON.stringify(bellRows()));
  const renum=()=>{let n=0;rows.forEach(r=>{if(r.n)r.n=++n})};
  const f=tfModal('<i class="fa-regular fa-clock text-blue-400"></i> Jam Pelajaran',`<p class="text-slate-400">Atur sekali, lalu pilih "Jam ke" saat menambah jadwal. Waktu terisi otomatis. Setiap baris dapat diubah manual.</p>
  <div class="glass-card rounded-xl p-3 space-y-3"><p class="font-semibold text-slate-200">Buat otomatis</p>
  <div class="grid grid-cols-3 gap-2"><div><label class="${LB}">Mulai</label><input type="time" name="g0" value="07:00" class="${TI}"></div><div><label class="${LB}">Menit/jam</label><input type="number" name="g1" value="40" min="10" max="120" class="${TI}"></div><div><label class="${LB}">Jumlah jam</label><input type="number" name="g2" value="10" min="1" max="16" class="${TI}"></div></div>
  <div class="grid grid-cols-2 gap-3"><div><label class="${LB}">Istirahat 1: setelah jam ke / menit</label><div class="flex gap-2"><input type="number" name="b1a" value="3" min="1" class="${TI}"><input type="number" name="b1b" value="15" min="5" class="${TI}"></div></div><div><label class="${LB}">Istirahat 2: setelah jam ke / menit</label><div class="flex gap-2"><input type="number" name="b2a" value="6" min="1" class="${TI}"><input type="number" name="b2b" value="30" min="5" class="${TI}"></div></div></div>
  <button type="button" id="bell-gen" class="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold">Buat otomatis</button></div>
  <div id="bell-rows" class="space-y-2"></div>
  <div class="flex gap-2"><button type="button" id="bell-addj" class="px-3 py-2 rounded-xl glass-card text-slate-200 font-semibold"><i class="fa-solid fa-plus"></i> Jam</button><button type="button" id="bell-addb" class="px-3 py-2 rounded-xl glass-card text-slate-200 font-semibold"><i class="fa-solid fa-plus"></i> Istirahat</button></div>`,()=>{
    renum();
    for(let i=0;i<rows.length;i++){const r=rows[i];
      if(!r.s||!r.e){showToast('Lengkapi jam mulai dan selesai di semua baris.','error');return false}
      if(tmin(r.e)<=tmin(r.s)){showToast('Jam selesai harus setelah jam mulai (baris '+(i+1)+').','error');return false}
      if(i&&tmin(r.s)<tmin(rows[i-1].e)){showToast('Baris '+(i+1)+' tumpang tindih dengan baris sebelumnya.','error');return false}}
    state.settings.bell=rows;saveStateToStorage();renderWeek();showToast('Jam pelajaran tersimpan.','success');
  },'Simpan');
  const box=$('bell-rows');
  const draw=()=>{renum();
    box.innerHTML=rows.map((r,i)=>`<div class="glass-card rounded-xl p-2.5 space-y-2"><div class="flex items-center justify-between"><b class="text-xs ${r.n?'text-slate-100':'text-slate-400'}">${r.n?'Jam ke: '+r.n:esc(r.label||'Istirahat')}</b><button type="button" data-del="${i}" class="w-7 h-7 rounded-lg text-rose-400" aria-label="Hapus baris"><i class="fa-solid fa-trash"></i></button></div><div class="flex items-center gap-2"><div class="flex-1 min-w-0"><input type="time" data-i="${i}" data-k="s" value="${r.s}" class="${TI}"></div><span class="text-slate-400">–</span><div class="flex-1 min-w-0"><input type="time" data-i="${i}" data-k="e" value="${r.e}" class="${TI}"></div></div></div>`).join('')||'<p class="text-slate-400">Belum ada jam. Gunakan "Buat otomatis" atau tambah manual.</p>';
    tfEnhance(box)};
  box.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.k)rows[+t.dataset.i][t.dataset.k]=t.value});
  box.onclick=e=>{const d=e.target.closest('[data-del]');if(d){rows.splice(+d.dataset.del,1);draw()}};
  $('bell-gen').onclick=()=>{
    const g=n=>f[n].value,st=tmin(g('g0')||'07:00'),du=+g('g1')||40,cnt=Math.min(16,+g('g2')||10),br={};
    [['b1a','b1b'],['b2a','b2b']].forEach(([a,b])=>{if(+g(a)&&+g(b))br[+g(a)]=+g(b)});
    rows=[];let t=st;for(let i=1;i<=cnt;i++){rows.push({n:i,s:minToT(t),e:minToT(t+du)});t+=du;if(br[i]){rows.push({label:'Istirahat',s:minToT(t),e:minToT(t+br[i])});t+=br[i]}}
    draw()};
  const last=()=>rows.length?tmin(rows[rows.length-1].e):tmin(f.g0.value||'07:00');
  $('bell-addj').onclick=()=>{const du=+f.g1.value||40,s=last();rows.push({n:1,s:minToT(s),e:minToT(s+du)});draw()};
  $('bell-addb').onclick=()=>{const s=last();rows.push({label:'Istirahat',s:minToT(s),e:minToT(s+15)});draw()};
  draw();
}
