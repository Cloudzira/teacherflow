/* Dialog: konfirmasi, panduan, onboarding, pengaturan, PWA. */
/* ---------- Modal dinamis ---------- */
function tfClose(){const m=$('tf-modal');if(m)m.remove()}
/* ---------- Popup konfirmasi (mengikuti tema) ---------- */
function tfConfirm(o){
  const old=$('tf-confirm');if(old)old.remove();
  const prev=document.activeElement;
  const w=document.createElement('div');w.id='tf-confirm';w.className='tfc';
  w.innerHTML='<div class="tfc-box" role="alertdialog" aria-modal="true" aria-labelledby="tfc-t" aria-describedby="tfc-m"><div class="tfc-ic"><i class="fa-solid"></i></div><h3 id="tfc-t"></h3><p id="tfc-m"></p><div class="tfc-act"><button type="button" class="tfc-no"></button><button type="button" class="tfc-yes"></button></div></div>';
  const q=x=>w.querySelector(x),no=q('.tfc-no'),yes=q('.tfc-yes');
  q('.tfc-ic i').classList.add(o.icon||'fa-trash-can');
  q('#tfc-t').textContent=o.title||'Konfirmasi';q('#tfc-m').textContent=o.message||'';
  no.textContent=o.no||'Batal';yes.textContent=o.yes||'Hapus';
  if(o.danger===false){yes.classList.add('ok');q('.tfc-ic').classList.add('ok')}
  const done=ok=>{w.remove();document.removeEventListener('keydown',kd,true);try{prev&&prev.focus&&prev.focus()}catch(e){}if(ok&&o.onYes)o.onYes()};
  const kd=e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();done(false)}
    else if(e.key==='Tab'){e.preventDefault();const b=[no,yes],i=b.indexOf(document.activeElement);b[i<0?(e.shiftKey?1:0):(i+1)%2].focus()}
  };
  document.addEventListener('keydown',kd,true);
  no.onclick=()=>done(false);yes.onclick=()=>done(true);
  w.onclick=e=>{if(e.target===w)done(false)};
  document.body.appendChild(w);no.focus();
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){tfClose();['modal-agenda','modal-task','modal-note'].forEach(closeModal)}});
function tfModal(title,body,onSave,label='Simpan',wide){
  tfClose();const w=document.createElement('div');w.id='tf-modal';w.className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm';
  w.innerHTML=`<div class="glass-panel w-full ${wide?'max-w-2xl':'max-w-lg'} rounded-2xl p-6 border border-white/10 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"><div class="flex items-center justify-between border-b border-slate-700/60 pb-3"><h3 class="text-lg font-bold text-slate-100 flex items-center gap-2">${title}</h3><button type="button" onclick="tfClose()" class="text-slate-400 hover:text-slate-100 p-1" aria-label="Tutup"><i class="fa-solid fa-xmark text-lg"></i></button></div><form class="space-y-4 text-xs">${body}${onSave?`<div class="flex justify-end gap-3 pt-3 border-t border-slate-700/60"><button type="button" onclick="tfClose()" class="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-700/60 font-medium">Batal</button><button type="submit" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md">${label}</button></div>`:''}</form></div>`;
  document.body.appendChild(w);tfEnhance(w);const f=w.querySelector('form');f.onsubmit=e=>{e.preventDefault();if(onSave&&onSave(f)!==false)tfClose()};w.onclick=e=>{if(e.target===w)tfClose()};return f;
}
function tfCopy(text,msg){(navigator.clipboard?navigator.clipboard.writeText(text):Promise.reject()).catch(()=>{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();try{document.execCommand('copy')}catch(e){}t.remove()}).finally(()=>showToast(msg||'Jadwal disalin ke clipboard.','success'))}



/* ---------- Kalender akademik: acara sekolah ---------- */
function openAcademic(){
  const L=(state.academic||[]).slice().sort((a,b)=>a.from.localeCompare(b.from));
  const rows=L.length?L.map(e=>`<div class="ac-row"><div class="min-w-0"><b>${esc(e.title)}</b><small>${esc(e.type)} · ${tfDMYs(e.from)}${e.to&&e.to!==e.from?' – '+tfDMYs(e.to):''}${e.off?' · jadwal berulang disembunyikan':''}</small></div><button type="button" class="ac-del" data-id="${e.id}" aria-label="Hapus ${esc(e.title)}"><i class="fa-solid fa-trash"></i></button></div>`).join('')
    :'<p class="ac-empty">Belum ada acara sekolah. Tambahkan libur semester, jadwal ujian, atau kegiatan sekolah di bawah ini.</p>';
  tfModal('<i class="fa-solid fa-calendar-check text-blue-400"></i> Kalender Akademik',`
  <p class="text-slate-400 leading-relaxed">Libur nasional dan cuti bersama 2026–2027 sudah tersedia otomatis (SKB 3 Menteri). Tambahkan di sini acara khusus sekolah Anda.</p>
  <div id="ac-list" class="space-y-2">${rows}</div>
  <div class="glass-card rounded-xl p-3 space-y-3"><p class="font-semibold text-slate-200">Tambah acara</p>
    <div><label class="${LB}">Nama acara</label><input name="t" required maxlength="80" class="${TI}" placeholder="Contoh: Libur Semester Ganjil"></div>
    <div><label class="${LB}">Jenis</label><select name="ty" class="${TI}">${TF_EVENT_TYPES.map(t=>`<option>${t}</option>`).join('')}</select></div>
    <div class="grid grid-cols-2 gap-3"><div><label class="${LB}">Dari tanggal</label><input type="date" name="fr" required class="${TI}"></div><div><label class="${LB}">Sampai (opsional)</label><input type="date" name="to" class="${TI}"></div></div>
    <label class="flex items-start gap-2 text-slate-200"><input type="checkbox" name="off" class="mt-0.5" checked> <span>Sembunyikan jadwal berulang pada tanggal ini<br><small class="text-slate-400">Agenda bertanggal khusus tetap tampil.</small></span></label></div>`,
  f=>{
    const t=f.t.value.trim(),fr=f.fr.value,to=f.to.value||fr;
    if(!t||!fr){showToast('Isi nama acara dan tanggal mulai.','warn');return false}
    if(to<fr){showToast('Tanggal selesai tidak boleh sebelum tanggal mulai.','warn');return false}
    (state.academic=state.academic||[]).push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,5),title:t,type:f.ty.value,from:fr,to:to,off:f.off.checked});
    saveStateToStorage();tfRefreshAgenda();showToast('Acara ditambahkan.','success');setTimeout(openAcademic,0);return false;
  },'Tambah',true);
  const f=document.querySelector('#tf-modal form'),sel=f.ty,off=f.off;
  sel.onchange=()=>{off.checked=sel.value==='Libur sekolah'};off.checked=sel.value==='Libur sekolah';
  document.querySelectorAll('#tf-modal .ac-del').forEach(b=>b.onclick=()=>{
    const idx=state.academic.findIndex(e=>e.id===b.dataset.id);if(idx<0)return;const it=state.academic[idx];
    state.academic.splice(idx,1);saveStateToStorage();tfRefreshAgenda();openAcademic();
    showToast('Acara dihapus.','info',7000,{label:'Batalkan',fn:()=>{state.academic.splice(Math.min(idx,state.academic.length),0,it);saveStateToStorage();tfRefreshAgenda();showToast('Acara dikembalikan.','success')}});
  });
}

/* ---------- Info aplikasi & panduan penggunaan ---------- */
function openGuide(){
  const ic=(c,t)=>`<i class="fa-solid ${c} gd-ic"></i><span>${t}</span>`;
  const sec=(icon,title,body,open)=>`<details class="gd-sec"${open?' open':''}><summary>${ic(icon,title)}<i class="fa-solid fa-chevron-down gd-ch"></i></summary><div class="gd-body">${body}</div></details>`;
  const li=a=>'<ul>'+a.map(x=>`<li>${x}</li>`).join('')+'</ul>';
  const body=`<div class="gd-wrap">
  <div class="gd-hero"><div class="gd-logo" data-logo></div><div><b>TeacherFlow</b><small>Agenda &amp; pengingat guru terpadu</small></div></div>
  <p class="gd-p">TeacherFlow membantu guru mengatur jadwal mengajar, halaqah, ekstrakurikuler, piket, tugas administrasi, dan catatan harian dalam satu tempat. Data tersimpan di perangkat Anda, aplikasi dapat dipakai tanpa internet, dan bisa dipasang seperti aplikasi biasa di HP maupun laptop.</p>
  <div class="gd-feat"><span><i class="fa-solid fa-bell"></i> Pengingat</span><span><i class="fa-solid fa-wifi"></i> Bisa offline</span><span><i class="fa-solid fa-triangle-exclamation"></i> Deteksi bentrok</span><span><i class="fa-solid fa-cloud"></i> Sinkron (opsional)</span></div>
  <h4 class="gd-h">Panduan penggunaan</h4>
  ${sec('fa-house','Beranda: agenda hari ini',li([
    'Kartu biru di atas menampilkan <b>agenda terdekat</b> beserta jam, lokasi, dan sasarannya. Garis di bawahnya menunjukkan kemajuan agenda yang sedang berlangsung.',
    'Tekan <b>Tandai Selesai / Masuk</b> saat agenda dimulai atau selesai. Agenda yang sudah ditandai tidak muncul lagi sebagai agenda terdekat.',
    'Empat kartu ringkasan menampilkan agenda selesai, tugas urgent, tugas aktif, dan jumlah catatan.',
    'Gunakan panah dan tombol <b>Hari ini</b> pada daftar agenda untuk berpindah tanggal. Jika ada jadwal yang saling bertabrakan, banner peringatan <b>Bentrok</b> akan muncul.'
  ]),true)}
  ${sec('fa-plus','Menambah &amp; mengubah agenda',li([
    'Tekan <b>Tambah</b> di Beranda atau tab Agenda, lalu isi judul, jenis (Mengajar, Halaqah, Ekstrakurikuler, Piket, Lainnya), jam mulai dan selesai.',
    'Isi <b>Jam ke</b> bila jadwal mengikuti jam pelajaran; jam mulai dan selesai akan terisi otomatis sesuai pengaturan Jam pelajaran.',
    '<b>Berulang pada hari</b>: centang hari tertentu (kosong berarti setiap hari). Untuk kegiatan sekali jalan, pilih <b>tanggal khusus</b>.',
    'Tambahkan ruangan/lokasi, kelompok atau kelas, dan catatan singkat. Jika waktunya bertabrakan, formulir langsung memberi peringatan, tetapi jadwal tetap bisa disimpan.',
    'Ketuk agenda yang sudah ada untuk mengubah atau menghapusnya. Agenda, tugas, atau catatan yang terhapus tidak sengaja bisa dikembalikan lewat tombol <b>Batalkan</b> yang muncul beberapa detik.'
  ]))}
  ${sec('fa-calendar-week','Jadwal pekanan',li([
    'Tab <b>Agenda</b> menampilkan seluruh agenda satu pekan. Pindah pekan dengan panah, atau kembali dengan <b>Pekan ini</b>.',
    'Pilih tampilan <b>Tabel jam</b> (per jam pelajaran) atau <b>Kartu</b> (per hari).',
    'Tombol <b>Salin jadwal</b> menyalin jadwal pekan ke clipboard sehingga mudah dibagikan lewat WhatsApp atau dokumen.'
  ]))}
  ${sec('fa-umbrella-beach','Libur &amp; kalender akademik',li([
    'Libur nasional dan cuti bersama <b>2026–2027</b> (sumber SKB 3 Menteri) sudah otomatis tampil di kalender, jadwal pekan, dan Beranda. Tanggalnya berwarna merah.',
    'Pada hari libur, <b>jadwal berulang disembunyikan</b> dan pengingat tidak berbunyi. Agenda yang dibuat dengan <b>tanggal khusus</b> tetap tampil. Atur perilakunya di <b>Pengaturan &gt; Jadwal berulang pada hari libur</b>.',
    'Buka <b>Pengaturan &gt; Kalender akademik</b> untuk menambah acara sekolah seperti libur semester atau jadwal ujian. Satu acara bisa mencakup beberapa hari.'
  ]))}
  ${sec('fa-file-export','Ekspor &amp; cetak jadwal',li([
    'Di tab <b>Agenda</b>, tekan <b>Ekspor</b>. Pilih <b>Cetak / simpan PDF</b> untuk tabel jadwal pekan yang sedang tampil, atau <b>Unduh Excel</b> berisi lembar jadwal pekan, semua agenda, tugas, dan kalender akademik.',
    'Untuk PDF, pada dialog cetak pilih tujuan <b>Simpan sebagai PDF</b>.'
  ]))}
  ${sec('fa-list-check','Tugas &amp; administrasi',li([
    'Di tab <b>Tugas</b>, tambahkan tugas lengkap dengan <b>prioritas</b> (Tinggi, Sedang, Rendah), <b>kategori</b> (Administrasi, Penilaian, Halaqah, Ekstrakurikuler, Wali Kelas), batas waktu, dan rincian.',
    'Tugas berprioritas tinggi dihitung sebagai <b>urgent</b> pada ringkasan Beranda.',
    'Ketuk lingkaran centang untuk menandai tugas selesai atau membatalkannya. Angka pada tab Tugas menunjukkan tugas yang masih aktif.'
  ]))}
  ${sec('fa-calendar-days','Kalender &amp; catatan',li([
    'Tab <b>Kalender</b> menampilkan satu bulan penuh. Ketuk tanggal untuk melihat agenda dan catatan pada hari itu, atau pilih <b>Ke hari ini</b> untuk kembali.',
    'Tekan tombol catatan untuk membuat <b>catatan cepat / observasi</b> pada tanggal terpilih. Gunakan kolom <b>Cari catatan</b> untuk menemukannya kembali.'
  ]))}
  ${sec('fa-bell','Pengingat &amp; notifikasi',li([
    'Buka <b>Pengaturan</b> (ikon roda gigi), lalu atur <b>Ingatkan sebelum mulai</b> (5 sampai 30 menit), bunyi, dan getar.',
    'Tekan <b>Aktifkan notifikasi</b> dan izinkan di browser, lalu coba dengan <b>Uji pengingat</b>.',
    'Agar pengingat andal, biarkan aplikasi terbuka atau terpasang di perangkat. Browser dapat menunda pengingat jika aplikasi benar-benar ditutup.'
  ]))}
  ${sec('fa-palette','Tema tampilan',li([
    'Buka <b>Pengaturan</b> (ikon roda gigi) lalu pilih tema: <b>Otomatis</b> (mengikuti perangkat), <b>Terang, Gelap, Zamrud, atau Samudra</b>.'
  ]))}
  ${sec('fa-cloud-arrow-up','Cadangan &amp; sinkronisasi',li([
    '<b>Ekspor JSON</b> menyimpan seluruh data ke berkas, dan <b>Impor JSON</b> memulihkannya, misalnya saat berganti HP. Lakukan ekspor secara berkala sebagai cadangan.',
    'Tombol <b>Hapus semua data</b> di Pengaturan tidak dapat dibatalkan, jadi buat cadangan terlebih dahulu.'
  ]))}
  ${sec('fa-download','Memasang sebagai aplikasi',li([
    'Jika tombol hijau <b>Pasang</b> muncul di bagian atas, tekan untuk memasang aplikasi ke layar utama.',
    'Bila tidak muncul, buka menu browser lalu pilih <b>Tambahkan ke layar utama</b> (Android/Chrome) atau <b>Bagikan &gt; Tambah ke Layar Utama</b> (iPhone/Safari).',
    'Setelah dibuka sekali dengan internet, aplikasi dapat dipakai sepenuhnya secara offline.'
  ]))}
  <p class="gd-foot"><button type="button" class="gd-link" onclick="tfClose();tfOnboard(true)"><i class="fa-solid fa-rotate-right"></i> Tampilkan lagi pengenalan awal</button></p>
  <p class="gd-foot"><i class="fa-solid fa-lock"></i> Data Anda tersimpan di perangkat ini dan tidak dikirim ke mana pun kecuali Anda mengaktifkan sinkronisasi.</p>
  </div>`;
  tfModal('<i class="fa-solid fa-circle-info text-blue-400"></i> Info &amp; Panduan',body,null,'',true);
  document.querySelectorAll('#tf-modal [data-logo]').forEach(e=>e.innerHTML=TF_LOGO);
}


/* ---------- Onboarding pengguna baru ---------- */
const TF_ONB_KEY='tf_onboarded';
function tfOnboard(force){
  try{if(!force&&localStorage.getItem(TF_ONB_KEY)==='1')return}catch(e){return}
  if(!force&&(state.agendas.length||state.tasks.length||state.notes.length)){try{localStorage.setItem(TF_ONB_KEY,'1')}catch(e){}return}
  if($('tf-onb')||$('tf-modal'))return;
  let step=0;const N=3,ios=/iPhone|iPad|iPod/.test(navigator.userAgent);
  const w=document.createElement('div');w.id='tf-onb';w.className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm';
  w.setAttribute('role','dialog');w.setAttribute('aria-modal','true');w.setAttribute('aria-labelledby','onb-t');
  const onKey=e=>{if(e.key==='Escape'){e.stopImmediatePropagation();finish()}};
  function finish(then){try{localStorage.setItem(TF_ONB_KEY,'1')}catch(e){}saveStateToStorage();document.removeEventListener('keydown',onKey,true);w.remove();if(typeof then==='function')then()}
  const head=(ic,t,sub)=>`<div class="ob-hd"><span class="ob-ic"><i class="fa-solid ${ic}"></i></span><div><h3 id="onb-t">${t}</h3><small>${sub}</small></div></div>`;
  function body(){
    const s=state.settings;
    if(step===0)return head('fa-hand-sparkles','Selamat datang di TeacherFlow','Langkah 1 dari 3 · Tampilan')+`<p class="ob-p">Mari siapkan aplikasi dalam kurang dari satu menit. Mulai dengan memilih tema yang nyaman di mata Anda.</p><div id="theme-seg" role="radiogroup" aria-label="Tema tampilan" class="thm-grid">${Object.keys(TF_THEMES).map(v=>tfThemeBtn(v,tfThemeKey()===v)).join('')}</div><p class="ob-p ob-s">Tema bisa diganti kapan saja lewat Pengaturan.</p>`;
    if(step===1)return head('fa-bell','Atur pengingat','Langkah 2 dari 3 · Pengingat')+`<div><label class="${LB}" for="ob-ld">Ingatkan sebelum agenda mulai</label><select id="ob-ld" class="${TI}">${[5,10,15,20,30].map(n=>`<option value="${n}" ${+s.lead===n?'selected':''}>${n} menit sebelumnya</option>`).join('')}</select></div><div class="ob-chk"><label><input type="checkbox" id="ob-sn" ${s.sound?'checked':''}> Bunyi pengingat</label><label><input type="checkbox" id="ob-vb" ${s.vibrate?'checked':''}> Getar (Android)</label></div>`;
    const perm='Notification'in window?Notification.permission:'unsupported';
    return head('fa-circle-check','Hampir selesai','Langkah 3 dari 3 · Notifikasi')+`<div class="glass-card rounded-xl p-3 space-y-2"><p class="ob-p" style="margin:0">Izin notifikasi: <b>${perm==='granted'?'aktif':perm==='denied'?'diblokir browser':perm==='unsupported'?'tidak didukung':'belum diaktifkan'}</b></p>${perm==='default'?'<button type="button" id="ob-perm" class="px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold">Aktifkan notifikasi</button>':''}${perm==='denied'?'<p class="ob-p ob-s" style="margin:0">Buka pengaturan situs di browser untuk mengizinkannya kembali.</p>':''}${ios&&!isStandalone()?'<p class="ob-p ob-s" style="margin:0">Di iPhone/iPad, pasang dulu ke layar utama (Bagikan, lalu Tambah ke Layar Utama) agar notifikasi dapat bekerja.</p>':''}</div><p class="ob-p" style="margin:0">Lanjutkan dengan:</p><div class="ob-act"><button type="button" id="ob-bell" class="glass-card rounded-xl px-3 py-2 font-semibold text-left"><i class="fa-solid fa-clock"></i> Atur jam pelajaran</button><button type="button" id="ob-add" class="glass-card rounded-xl px-3 py-2 font-semibold text-left"><i class="fa-solid fa-plus"></i> Tambah agenda pertama</button></div>`;
  }
  function render(){
    w.innerHTML=`<div class="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/10 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"><div class="ob-body">${body()}</div><div class="ob-dots" aria-hidden="true">${Array.from({length:N},(_,i)=>`<i class="${i===step?'on':''}"></i>`).join('')}</div><div class="ob-ft"><button type="button" id="ob-skip" class="px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-700/60 font-medium">Lewati</button><span>${step>0?'<button type="button" id="ob-back" class="px-4 py-2 rounded-xl glass-card text-slate-200 font-semibold">Kembali</button>':''}<button type="button" id="ob-next" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md">${step===N-1?'Mulai':'Lanjut'}</button></span></div></div>`;
    $('ob-skip').onclick=()=>finish();
    $('ob-next').onclick=()=>step===N-1?finish():(step++,render());
    if($('ob-back'))$('ob-back').onclick=()=>{step--;render()};
    if(step===0)tfThemeSeg();
    if(step===1){$('ob-ld').onchange=e=>{state.settings.lead=+e.target.value;saveStateToStorage()};$('ob-sn').onchange=e=>{state.settings.sound=e.target.checked;saveStateToStorage()};$('ob-vb').onchange=e=>{state.settings.vibrate=e.target.checked;saveStateToStorage()}}
    if(step===2){if($('ob-perm'))$('ob-perm').onclick=async()=>{try{await Notification.requestPermission()}catch(e){}render()};$('ob-bell').onclick=()=>finish(openBellModal);$('ob-add').onclick=()=>finish(()=>openAgendaModal())}
    const f=w.querySelector('#ob-next');if(f)f.focus({preventScroll:true});
  }
  document.addEventListener('keydown',onKey,true);document.body.appendChild(w);render();
}

/* ---------- Pengaturan, cadangan, install ---------- */
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;if(typeof tfNetUi==='function')tfNetUi()});
const TF_LOCAL=['tf_onboarded','tf_fired','tf_fbconfig','tf_device','tf_updatedAt','tf_dinasDate','tf_fbon','tf_backup'];
const tfKeys=()=>Object.keys(localStorage).filter(k=>/^(gf_|tf_)/.test(k)&&!TF_LOCAL.includes(k));
function openSettings(){setTimeout(fbUi,0);
  const s=state.settings,perm='Notification'in window?Notification.permission:'tidak didukung';
  tfModal('<i class="fa-solid fa-gear text-blue-400"></i> Pengaturan',`<div class="space-y-3"><div><label class="${LB}">Tema tampilan</label><div id="theme-seg" role="radiogroup" aria-label="Tema tampilan" class="thm-grid">${Object.keys(TF_THEMES).map(v=>tfThemeBtn(v,tfThemeKey()===v)).join('')}</div></div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label class="${LB}">Ingatkan sebelum mulai</label><select name="ld" class="${TI}">${[5,10,15,20,30].map(n=>`<option value="${n}" ${+s.lead===n?'selected':''}>${n} menit</option>`).join('')}</select></div>
  <div><label class="${LB}">Jam pelajaran</label><button type="button" id="st-bell" class="${TI} text-left flex items-center justify-between"><span>${bellSummary()}</span><i class="fa-solid fa-chevron-right text-slate-400"></i></button></div></div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label class="${LB}">Jadwal berulang pada hari libur</label><select name="hm" class="${TI}">${Object.entries(TF_HOLIDAY_MODES).map(([k,v])=>`<option value="${k}" ${(s.holidayMode||'national')===k?'selected':''}>${v}</option>`).join('')}</select></div>
  <div><label class="${LB}">Kalender akademik</label><button type="button" id="st-acad" class="${TI} text-left flex items-center justify-between"><span>${(state.academic||[]).length} acara sekolah</span><i class="fa-solid fa-chevron-right text-slate-400"></i></button></div></div></div>
<div class="st-chk"><label class="flex items-center gap-2 text-slate-200"><input type="checkbox" name="sn" ${s.sound?'checked':''}> Bunyi pengingat</label><label class="flex items-center gap-2 text-slate-200"><input type="checkbox" name="vb" ${s.vibrate?'checked':''}> Getar (Android)</label><label class="flex items-center gap-2 text-slate-200"><input type="checkbox" name="mo" ${s.motivasi!==false?'checked':''}> Pesan motivasi</label></div>
  <div class="glass-card rounded-xl p-3 space-y-2"><p class="text-slate-300">Izin notifikasi: <b>${({granted:'aktif',denied:'diblokir browser',default:'belum diaktifkan',unsupported:'tidak didukung'})[perm]||perm}</b></p><div class="flex gap-2 flex-wrap"><button type="button" id="st-perm" class="px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold">Aktifkan notifikasi</button><button type="button" id="st-test" class="px-3 py-2 rounded-xl glass-card text-slate-200 font-semibold">Uji pengingat</button>${deferredInstall&&!isStandalone()?'<button type="button" id="st-inst" class="px-3 py-2 rounded-xl bg-emerald-600 text-white font-semibold">Pasang aplikasi</button>':''}</div><p class="text-[11px] text-slate-300"><i class="fa-solid fa-mobile-screen"></i> ${installHelp()}</p><p class="text-[11px] text-slate-400">Setelah dibuka sekali saat online, TeacherFlow berjalan penuh tanpa internet. Pengingat berbunyi selama aplikasi terbuka; browser dapat menunda aplikasi yang tertutup.</p></div>
  <div id="st-sync-box" class="glass-card rounded-xl p-3 space-y-2"></div>
  <div class="glass-card rounded-xl p-3 space-y-2"><p class="font-semibold text-slate-200">Cadangan data</p><div class="flex gap-2 flex-wrap"><button type="button" id="st-exp" class="px-3 py-2 rounded-xl bg-blue-600 text-white font-semibold">Ekspor JSON</button><label class="px-3 py-2 rounded-xl glass-card text-slate-200 font-semibold cursor-pointer">Impor JSON<input type="file" id="st-imp" accept=".json,application/json" hidden></label><button type="button" id="st-rst" class="px-3 py-2 rounded-xl bg-rose-600 text-white font-semibold">Hapus semua data</button></div></div>`,f=>{
    Object.assign(state.settings,{lead:+f.ld.value,sound:f.sn.checked,vibrate:f.vb.checked,motivasi:f.mo.checked,holidayMode:f.hm.value});saveStateToStorage();tfApplyTheme();tfRefreshAgenda();showToast('Pengaturan disimpan.','success')});
  tfThemeSeg();$('st-bell').onclick=openBellModal;$('st-acad').onclick=openAcademic;
  $('st-perm').onclick=async()=>{if('Notification'in window){await Notification.requestPermission();openSettings()}};
  $('st-test').onclick=()=>tfAlert('Uji pengingat','Jika Anda mendengar bunyi atau melihat notifikasi ini, pengingat siap.');
  if($('st-inst'))$('st-inst').onclick=installApp;
  $('st-exp').onclick=()=>{const o={};tfKeys().forEach(k=>o[k]=localStorage.getItem(k));const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:'application/json'}));a.download='teacherflow-cadangan-'+dstr()+'.json';a.click()};
  $('st-imp').onchange=e=>{const fl=e.target.files[0];if(!fl)return;fl.text().then(t=>{try{const o=JSON.parse(t);const ks=Object.keys(o).filter(k=>/^(gf_|tf_)/.test(k)&&!TF_LOCAL.includes(k));if(!ks.length)throw 0;ks.forEach(k=>{JSON.parse(o[k]);localStorage.setItem(k,String(o[k]).replace(/</g,'&lt;'))});location.reload()}catch(x){showToast('Berkas bukan cadangan TeacherFlow yang valid.','error')}})};
  $('st-rst').onclick=()=>tfConfirm({title:'Hapus semua data?',message:'Semua data TeacherFlow di perangkat ini'+(fbUser?' dan di cloud':'')+' akan dihapus. Tindakan ini tidak bisa dibatalkan.',yes:'Hapus semua',icon:'fa-triangle-exclamation',onYes:()=>{fbWipe().finally(()=>{tfKeys().concat(['tf_fired','tf_updatedAt']).forEach(k=>localStorage.removeItem(k));location.reload()})}});
}



/* ---------- Pasang aplikasi (PWA) & status offline ---------- */
const isStandalone=()=>(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
function installHelp(){
  if(isStandalone())return 'Aplikasi sudah terpasang di perangkat ini.';
  const ua=navigator.userAgent;
  if(/iphone|ipad|ipod/i.test(ua))return 'iPhone/iPad: buka di Safari, ketuk ikon Bagikan, lalu pilih "Tambah ke Layar Utama".';
  if(/android/i.test(ua))return 'Android: ketuk tombol Pasang, atau menu Chrome (titik tiga) lalu "Instal aplikasi".';
  return 'Laptop: klik tombol Pasang di header, atau ikon pasang di kanan address bar Chrome/Edge.';
}
async function installApp(){
  if(!deferredInstall)return showToast(installHelp(),'info',8000);
  deferredInstall.prompt();const c=await deferredInstall.userChoice;deferredInstall=null;tfNetUi();
  if(c.outcome==='accepted')showToast('TeacherFlow sedang dipasang...','success');
}
window.addEventListener('appinstalled',()=>{deferredInstall=null;tfNetUi();showToast('TeacherFlow terpasang. Buka dari layar utama atau daftar aplikasi.','success',6000)});
function tfNetUi(){
  const ib=$('install-btn');if(ib)ib.classList.toggle('hidden',!deferredInstall||isStandalone());
  const nb=$('net-badge');if(nb)nb.classList.toggle('hidden',navigator.onLine!==false);
}
let fbPending=false;
window.addEventListener('offline',()=>{tfNetUi();showToast('Anda offline. TeacherFlow tetap bisa dipakai; data disinkronkan saat online lagi.','warn',6000)});
window.addEventListener('online',()=>{
  tfNetUi();showToast('Kembali online.','success');
  if(fbCfg()&&localStorage.getItem('tf_fbon')==='1'&&!fb)fbInit().catch(()=>{});
  else if(fbUser&&fb){if(!fbSynced)fbStart();else if(fbPending){fbPending=false;fbPush().then(()=>{fbState='in';fbUi()}).catch(()=>{fbState='err';fbUi()})}}
});
