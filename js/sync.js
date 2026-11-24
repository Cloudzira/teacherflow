/* Sinkronisasi Firebase (opsional). */
/* ---------- Sinkronisasi Firebase (opsional: login Google + Firestore) ---------- */
const TF_FIREBASE={
  apiKey:"AIzaSyCIAaCeGoXk7Cwhrlli26oDvd1bt0WjFjM",
  authDomain:"teacherflow-f19d6.firebaseapp.com",
  projectId:"teacherflow-f19d6",
  storageBucket:"teacherflow-f19d6.firebasestorage.app",
  messagingSenderId:"764903525171",
  appId:"1:764903525171:web:f12cc63ba10adb47f34c46"
}; /* konfigurasi web Firebase (bukan rahasia); keamanan data diatur oleh firestore.rules */
const FBV='10.12.2';
let fb=null,fbUser=null,fbUnsub=null,fbPushT=null,fbState='off';let fbSynced=false;
const tfDevice=(()=>{let d=localStorage.getItem('tf_device');if(!d){d=Math.random().toString(36).slice(2,10);try{localStorage.setItem('tf_device',d)}catch(e){}}return d})();
const fbCfg=()=>{if(TF_FIREBASE)return TF_FIREBASE;try{return JSON.parse(localStorage.getItem('tf_fbconfig'))}catch(e){return null}};
const lastUpd=()=>+localStorage.getItem('tf_updatedAt')||0;
/* ---------- Pengaman data: jangan pernah menimpa data berisi dengan data kosong ---------- */
const TF_BAK='tf_backup';
const tfLocalObj=()=>{const p={};tfKeys().forEach(k=>p[k]=localStorage.getItem(k));return p};
const tfHasData=o=>{try{return ['gf_agendas','gf_tasks','gf_notes'].some(k=>{const v=JSON.parse(o[k]);return Array.isArray(v)&&v.length>0})}catch(e){return false}};
function tfBackupLocal(){const p=tfLocalObj();if(!tfHasData(p))return false;try{localStorage.setItem(TF_BAK,JSON.stringify({t:Date.now(),d:p}));return true}catch(e){return false}}
function tfRestoreBackup(){
  try{
    const b=JSON.parse(localStorage.getItem(TF_BAK));if(!b||!b.d)throw 0;
    tfKeys().forEach(k=>{if(!(k in b.d))localStorage.removeItem(k)});
    for(const k in b.d){if(/^(gf_|tf_)/.test(k)&&!TF_LOCAL.includes(k))localStorage.setItem(k,String(b.d[k]))}
    loadStateFromStorage();saveStateToStorage();renderTimeline();renderWeek();renderTasks();renderNotes();renderCalendar();updateFocusCard();updateStats();tfApplyTheme();
    showToast('Data dikembalikan dari cadangan otomatis.','success');
  }catch(e){showToast('Tidak ada cadangan otomatis yang bisa dipulihkan.','error')}
}
async function fbSavePrev(r){try{await fb.Fs.setDoc(fb.Fs.doc(fb.db,'users',fbUser.uid,'teacherflow','prev'),r)}catch(e){}}
const fbRef=()=>fb.Fs.doc(fb.db,'users',fbUser.uid,'teacherflow','data');
async function fbInit(){
  if(fb)return fb;const c=fbCfg();if(!c||!c.apiKey||!c.projectId)throw new Error('Konfigurasi Firebase belum diisi.');
  const mods=await Promise.all(['app','auth','firestore'].map(n=>import(`https://www.gstatic.com/firebasejs/${FBV}/firebase-${n}.js`)));
  const [A,Au,Fs]=mods,app=A.initializeApp(c);
  fb={A,Au,Fs,auth:Au.getAuth(app),db:Fs.getFirestore(app)};fbState='ready';
  Au.onAuthStateChanged(fb.auth,u=>{fbUser=u;if(u){try{localStorage.setItem('tf_fbon','1')}catch(e){}fbStart()}else{fbStop();fbState='ready'}fbUi()});
  return fb;
}
function fbStop(){if(fbUnsub){fbUnsub();fbUnsub=null}}
async function fbStart(){
  fbStop();fbSynced=false;fbState='busy';fbUi();
  try{
    const ref=fbRef(),snap=await fb.Fs.getDoc(ref),lu=lastUpd(),localHas=tfHasData(tfLocalObj());
    if(snap.exists()){
      const r=snap.data();let cp={};try{cp=JSON.parse(r.payload||'{}')}catch(e){}
      const cloudHas=tfHasData(cp);
      if(cloudHas&&!localHas)fbApply(r); /* perangkat kosong/baru: selalu ambil data cloud, apa pun cap waktunya */
      else if(!cloudHas&&localHas)await fbPush(true);
      else if((r.updatedAt||0)>lu)fbApply(r);
      else if(lu>(r.updatedAt||0)){if(cloudHas)await fbSavePrev(r);await fbPush(true)}
    }
    else if(lu>0)await fbPush(true);
    fbUnsub=fb.Fs.onSnapshot(ref,s=>{if(!s.exists()||s.metadata.hasPendingWrites)return;const r=s.data();if(r.device!==tfDevice&&(r.updatedAt||0)>lastUpd())fbApply(r)},e=>{fbState='err';fbUi()});
    fbSynced=true;fbState='in';
  }catch(e){fbState='err';showToast('Sinkronisasi gagal ('+(e.code||e.message)+'). Periksa aturan Firestore dan domain di Firebase.','error',8000)}
  fbUi();
}
async function fbPush(force){
  if(!fbUser||!fb)return;
  if(!force&&!fbSynced){fbPending=true;return false} /* belum selesai membandingkan dengan cloud: jangan unggah dulu */
  const p=tfLocalObj();
  if(force&&!tfHasData(p)){ /* data perangkat kosong: jangan timpa cloud yang berisi */
    const s0=await fb.Fs.getDoc(fbRef());
    if(s0.exists()){let c={};try{c=JSON.parse(s0.data().payload||'{}')}catch(e){}
      if(tfHasData(c)){const er=new Error('Data di perangkat ini kosong, cloud tidak ditimpa');er.code='data-kosong';throw er}}
  }
  const s=JSON.stringify(p);if(s.length>900000)throw new Error('Data melebihi batas 1 MB');
  const u=lastUpd()||Date.now();await fb.Fs.setDoc(fbRef(),{payload:s,updatedAt:u,device:tfDevice,v:2});
}
function fbApply(r){
  try{
    const p=JSON.parse(r.payload||'{}');const hadBak=tfBackupLocal();
    tfKeys().forEach(k=>{if(!(k in p))localStorage.removeItem(k)});
    for(const k in p){if(/^(gf_|tf_)/.test(k)&&!TF_LOCAL.includes(k))localStorage.setItem(k,String(p[k]))}
    localStorage.setItem('tf_updatedAt',String(r.updatedAt||Date.now()));
    loadStateFromStorage();renderTimeline();renderWeek();renderTasks();renderNotes();renderCalendar();updateFocusCard();updateStats();tfApplyTheme();
    if(hadBak)showToast('Data disinkronkan dari cloud.','success',10000,{label:'Batalkan',fn:tfRestoreBackup});else showToast('Data disinkronkan dari cloud.','success');
  }catch(e){showToast('Data cloud tidak dapat dibaca.','error')}
}
function fbWipe(){return fbUser&&fb?fb.Fs.deleteDoc(fbRef()).catch(()=>{}):Promise.resolve()}
function fbParseCfg(t){
  try{const o=JSON.parse(t);if(o&&o.apiKey)return o}catch(e){}
  const o={};t.replace(/([A-Za-z]+)\s*:\s*["'`]([^"'`]+)["'`]/g,(_,k,v)=>{o[k]=v});return o.apiKey&&o.projectId?o:null;
}
function fbUi(){
  const ic=$('sync-icon');
  if(ic){const m={off:['fa-cloud','text-slate-400'],ready:['fa-cloud','text-slate-300'],busy:['fa-arrows-rotate fa-spin','text-blue-400'],in:['fa-cloud-arrow-up','text-emerald-400'],err:['fa-triangle-exclamation','text-amber-400']}[fbState]||['fa-cloud',''];ic.className='fa-solid '+m[0]+' '+m[1];$('sync-btn').title=fbUser?'Tersinkron: '+fbUser.email:'Sinkronisasi cloud (belum masuk)'}
  const box=$('st-sync-box');if(!box)return;
  const cfg=fbCfg();let h='<p class="font-semibold text-slate-200"><i class="fa-solid fa-cloud text-blue-400"></i> Sinkronisasi antar perangkat</p>';
  if(!cfg)h+=`<p class="text-[11px] text-slate-400">Tempel <b>firebaseConfig</b> dari Firebase Console (Project settings > Your apps > Web). Lihat SETUP-FIREBASE.md.</p><textarea id="fb-cfg" rows="4" class="${TI} tabular-nums text-[11px]" placeholder='{ apiKey: "...", authDomain: "...", projectId: "...", appId: "..." }'></textarea><button type="button" id="fb-save" class="px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold">Simpan konfigurasi</button>`;
  else if(fbUser)h+=`<p class="text-slate-300">Masuk sebagai <b>${esc(fbUser.email)}</b> · ${fbState==='busy'?'menyinkronkan...':fbState==='err'?'ada masalah sinkronisasi':'tersinkron'}</p><div class="flex gap-2 flex-wrap"><button type="button" id="fb-now" class="px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold">Sinkronkan sekarang</button><button type="button" id="fb-out" class="px-3 py-2 rounded-xl glass-card text-slate-200 font-semibold">Keluar</button></div>`;
  else h+=`<p class="text-[11px] text-slate-400">Masuk dengan Google agar agenda, jadwal pekan, tugas, dan catatan sama di HP dan laptop. Aplikasi tetap bisa dipakai tanpa masuk.</p><div class="flex gap-2 flex-wrap"><button type="button" id="fb-in" class="px-3 py-2 rounded-xl bg-white text-slate-900 font-semibold border border-slate-300"><i class="fa-brands fa-google text-rose-500"></i> Masuk dengan Google</button>${TF_FIREBASE?'':'<button type="button" id="fb-reset" class="px-3 py-2 rounded-xl glass-card text-slate-300 font-semibold">Ganti konfigurasi</button>'}</div>`;
  let bk=null;try{bk=JSON.parse(localStorage.getItem(TF_BAK))}catch(e){}
  if(bk&&bk.t)h+=`<div class="flex items-center gap-2 flex-wrap"><span class="text-[11px] text-slate-400">Cadangan otomatis: ${new Date(bk.t).toLocaleString('id-ID')}</span><button type="button" id="fb-restore" class="px-3 py-2 rounded-xl glass-card text-slate-200 font-semibold">Pulihkan data sebelum sinkron</button></div>`;
  box.innerHTML=h;
  const on=(id,f)=>{const e=$(id);if(e)e.onclick=f};
  on('fb-restore',()=>tfConfirm({title:'Pulihkan cadangan otomatis?',message:'Data saat ini akan diganti dengan cadangan otomatis, lalu disinkronkan ke cloud.',yes:'Pulihkan',icon:'fa-rotate-left',onYes:tfRestoreBackup}));
  on('fb-save',()=>{const c=fbParseCfg($('fb-cfg').value);if(!c)return showToast('Konfigurasi tidak valid. Pastikan ada apiKey dan projectId.','error');localStorage.setItem('tf_fbconfig',JSON.stringify(c));fbInit().then(fbUi).catch(e=>showToast(e.message,'error'));fbUi()});
  on('fb-reset',()=>{localStorage.removeItem('tf_fbconfig');localStorage.removeItem('tf_fbon');fb=null;fbUi()});
  on('fb-in',async()=>{try{await fbInit();const P=new fb.Au.GoogleAuthProvider();try{await fb.Au.signInWithPopup(fb.auth,P)}catch(e){if(e.code==='auth/popup-blocked'||e.code==='auth/operation-not-supported-in-this-environment')await fb.Au.signInWithRedirect(fb.auth,P);else if(e.code!=='auth/popup-closed-by-user'&&e.code!=='auth/cancelled-popup-request')throw e}}catch(e){showToast('Gagal masuk ('+(e.code||e.message)+'). Pastikan domain sudah ditambahkan di Authentication > Authorized domains.','error',9000)}});
  on('fb-now',()=>{fbState='busy';fbUi();fbPush(true).then(()=>{fbState='in';fbUi();showToast('Terunggah ke cloud.','success')}).catch(e=>{fbState='err';fbUi();showToast('Gagal: '+(e.code||e.message),'error')})});
  on('fb-out',async()=>{await fb.Au.signOut(fb.auth);try{localStorage.removeItem('tf_fbon')}catch(e){}showToast('Keluar. Data tetap ada di perangkat ini.','info')});
}
