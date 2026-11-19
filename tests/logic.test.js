const test=require('node:test'),assert=require('node:assert/strict');
const{load,ag}=require('./helpers');

function env(state){const e=load();e.ctx.state={agendas:[],tasks:[],notes:[],doneOn:{},settings:{holidayMode:'national'},academic:[],...state};return e}
// 2026-11-16 Senin, 2026-11-17 Selasa, 2026-11-21 Sabtu, 2026-11-22 Minggu

test('tmin dan minToT saling berkebalikan',()=>{
  const{get}=env();const tmin=get('tmin'),minToT=get('minToT');
  assert.equal(tmin('07:30'),450);assert.equal(tmin('00:00'),0);assert.equal(minToT(450),'07:30');
  for(const t of['00:05','12:00','23:59'])assert.equal(minToT(tmin(t)),t);
});
test('dstr memakai zona waktu lokal dan format YYYY-MM-DD',()=>{
  const{get}=env();assert.equal(get('dstr')(new Date(2026,0,5,23,59)),'2026-01-05');assert.equal(get('dstr')(new Date(2026,11,31,0,0)),'2026-12-31');
});
test('esc menetralkan HTML dan nilai kosong',()=>{
  const{get}=env();const esc=get('esc');
  assert.equal(esc('<b onclick="x">&\'</b>'),'&lt;b onclick=&quot;x&quot;&gt;&amp;&#39;&lt;/b&gt;');assert.equal(esc(null),'');assert.equal(esc(undefined),'');assert.equal(esc(0),'0');
});

test('occursOn: tanggal khusus, hari tertentu, dan setiap hari',()=>{
  const{get}=env();const o=get('occursOn');
  assert.equal(o(ag({date:'2026-11-16'}),'2026-11-16'),true);assert.equal(o(ag({date:'2026-11-16'}),'2026-11-17'),false);
  const senin=ag({days:[1]});assert.equal(o(senin,'2026-11-16'),true);assert.equal(o(senin,'2026-11-17'),false);
  assert.equal(o(ag({days:[]}),'2026-11-21'),true);
});
test('tfOcc mengurutkan menurut jam mulai dan membawa status selesai',()=>{
  const a=ag({id:'a',startTime:'09:00',endTime:'10:00'}),b=ag({id:'b',startTime:'07:00',endTime:'08:00'});
  const{ctx,get}=env({agendas:[a,b],doneOn:{'2026-11-16|a':true}});
  const r=get('tfOcc')('2026-11-16');
  assert.deepEqual(r.map(x=>x.id),['b','a']);assert.equal(r[1].completed,true);assert.equal(r[0].completed,false);
});
test('repeatText dan jamText menghasilkan teks Indonesia',()=>{
  const{get}=env();
  assert.equal(get('repeatText')(ag({date:'2026-11-16'})),'Sekali: 16/11/2026');
  assert.equal(get('repeatText')(ag({days:[1,3]})),'Sen, Rab');assert.equal(get('repeatText')(ag({days:[]})),'Setiap hari');
  assert.equal(get('jamText')(ag({jamFrom:2,jamTo:4})),'Jam ke: 2–4');assert.equal(get('jamText')(ag({jamFrom:3})),'Jam ke: 3');assert.equal(get('jamText')(ag({})),'');
});

test('bentrok: waktu beririsan pada hari yang sama terdeteksi',()=>{
  const{get}=env({agendas:[ag({id:'a',startTime:'07:00',endTime:'08:30',days:[1]}),ag({id:'b',startTime:'08:00',endTime:'09:00',days:[1]})]});
  assert.deepEqual([...get('clashIds')('2026-11-16')].sort(),['a','b']);
});
test('bentrok: jam yang bersambung (selesai = mulai) BUKAN bentrok',()=>{
  const{get}=env({agendas:[ag({id:'a',startTime:'07:00',endTime:'08:00',days:[1]}),ag({id:'b',startTime:'08:00',endTime:'09:00',days:[1]})]});
  assert.equal(get('clashIds')('2026-11-16').size,0);
});
test('bentrok: hari berbeda tidak bentrok',()=>{
  const{get}=env({agendas:[ag({id:'a',days:[1]}),ag({id:'b',days:[2]})]});
  assert.equal(get('clashIds')('2026-11-16').size,0);assert.equal(get('clashIds')('2026-11-17').size,0);
});
test('bentrok: jadwal berulang vs agenda bertanggal pada hari yang cocok',()=>{
  const{get}=env({agendas:[ag({id:'rutin',days:[1]}),ag({id:'khusus',date:'2026-11-16'})]});
  assert.equal(get('clashIds')('2026-11-16').size,2);
});
test('tfShare: dua jadwal berulang berbagi hari bila salah satunya kosong atau ada hari yang sama',()=>{
  const{get}=env();const s=get('tfShare');
  assert.equal(s(ag({days:[]}),ag({days:[3]})),true);assert.equal(s(ag({days:[1,2]}),ag({days:[2,3]})),true);assert.equal(s(ag({days:[1]}),ag({days:[2]})),false);
  assert.equal(s(ag({date:'2026-11-16'}),ag({date:'2026-11-17'})),false);
});

/* ---------- Kalender akademik ---------- */
test('hari libur nasional menyembunyikan jadwal berulang tetapi bukan agenda bertanggal khusus',()=>{
  const{get}=env({agendas:[ag({id:'rutin'}),ag({id:'khusus',date:'2026-12-25',startTime:'10:00',endTime:'11:00'})]});
  assert.deepEqual(get('tfOcc')('2026-12-25').map(x=>x.id),['khusus']);   // Natal
  assert.deepEqual(get('tfOcc')('2026-12-26').map(x=>x.id),['rutin']);    // hari biasa
});
test('mode "national": cuti bersama hanya penanda, jadwal tetap tampil',()=>{
  const{get}=env({agendas:[ag({id:'rutin'})],settings:{holidayMode:'national'}});
  assert.equal(get('tfDayInfo')('2026-12-24').off,false);assert.equal(get('tfOcc')('2026-12-24').length,1);
  assert.equal(get('tfDayInfo')('2026-12-24').holiday.t,'cuti');
});
test('mode "all": cuti bersama ikut menyembunyikan jadwal berulang',()=>{
  const{get}=env({agendas:[ag({id:'rutin'})],settings:{holidayMode:'all'}});
  assert.equal(get('tfDayInfo')('2026-12-24').off,true);assert.equal(get('tfOcc')('2026-12-24').length,0);
});
test('mode "none": libur nasional hanya penanda',()=>{
  const{get}=env({agendas:[ag({id:'rutin'})],settings:{holidayMode:'none'}});
  assert.equal(get('tfDayInfo')('2026-12-25').off,false);assert.equal(get('tfOcc')('2026-12-25').length,1);assert.equal(get('tfDayLabels')('2026-12-25').length,1);
});
test('pengaturan kosong/lama (tanpa holidayMode) dianggap "national"',()=>{
  const{get}=env({agendas:[ag({id:'rutin'})],settings:{}});assert.equal(get('tfDayInfo')('2026-12-25').off,true);
});
test('data lama tanpa kunci academic tidak menyebabkan error',()=>{
  const e=env({agendas:[ag({})]});e.ctx.state.academic=undefined;
  assert.doesNotThrow(()=>e.get('tfOcc')('2026-11-16'));assert.deepEqual(e.get('tfDayLabels')('2026-11-16'),[]);
});
test('acara sekolah rentang tanggal: batas awal dan akhir inklusif',()=>{
  const{get}=env({agendas:[ag({id:'rutin'})],academic:[{id:'e1',title:'Libur Semester',type:'Libur sekolah',from:'2026-12-14',to:'2026-12-18',off:true}]});
  for(const d of['2026-12-14','2026-12-16','2026-12-18'])assert.equal(get('tfOcc')(d).length,0,d);
  for(const d of['2026-12-13','2026-12-19'])assert.equal(get('tfOcc')(d).length,1,d);
});
test('acara tanpa tanggal selesai berlaku satu hari; acara off=false hanya penanda',()=>{
  const{get}=env({agendas:[ag({id:'rutin'})],academic:[{id:'e1',title:'PAS',type:'Ujian',from:'2026-12-01',off:false}]});
  assert.equal(get('tfOcc')('2026-12-01').length,1);assert.equal(get('tfDayLabels')('2026-12-01')[0].full,'Ujian · PAS');assert.equal(get('tfDayLabels')('2026-12-02').length,0);
});
test('acara sekolah off=true menyembunyikan jadwal walau mode "none"',()=>{
  const{get}=env({agendas:[ag({id:'rutin'})],settings:{holidayMode:'none'},academic:[{id:'e',title:'Libur',type:'Libur sekolah',from:'2026-11-16',to:'2026-11-16',off:true}]});
  assert.equal(get('tfOcc')('2026-11-16').length,0);
});
test('bentrok tidak dihitung dari jadwal yang disembunyikan karena libur',()=>{
  const{get}=env({agendas:[ag({id:'a',days:[5]}),ag({id:'b',days:[5]})]});   // Jumat 25 Des 2026
  assert.equal(get('clashIds')('2026-12-25').size,0);assert.equal(get('clashIds')('2026-12-18').size,2);
});

/* ---------- Data lembar ekspor ---------- */
test('tfExportSheets: empat lembar dengan header dan baris yang benar',()=>{
  const st={agendas:[ag({id:'a',title:'Matematika',startTime:'07:00',endTime:'08:30',date:null,days:[1],jamFrom:1,jamTo:2,location:'R1',target:'X-A'})],
    tasks:[{id:'t',title:'Koreksi UTS',priority:'Tinggi',category:'Penilaian',deadline:'2026-11-20T10:00',completed:false,desc:'x'}],notes:[],doneOn:{},settings:{holidayMode:'national'},
    academic:[{id:'e',title:'PAS',type:'Ujian',from:'2026-11-17',to:'2026-11-18',off:false}]};
  const e=load();e.ctx.state=st;e.ctx.days=['2026-11-16','2026-11-17'].map(ds=>({ds,items:e.get('tfOcc')(ds)}));
  const sh=e.run('tfExportSheets(state,days)');
  assert.deepEqual(sh.map(s=>s.name),['Jadwal Pekan','Semua Agenda','Tugas','Kalender Akademik']);
  assert.equal(sh[0].rows[0][5],'Kegiatan');
  assert.deepEqual([...sh[0].rows[1]].slice(0,9),['Senin','16/11/2026','07:00','08:30','1–2','Matematika','Mengajar','R1','X-A']);
  assert.equal(sh[0].rows.length,3);                                // header + Senin(1 kegiatan) + Selasa(kosong)
  assert.deepEqual(sh[0].rows[2].slice(0,6),['Selasa','17/11/2026','','','','—']);
  assert.equal(sh[0].rows[2][10],'PAS');                            // keterangan hari dari kalender akademik
  assert.deepEqual(sh[1].rows[1].slice(0,6),['Matematika','Mengajar','07:00','08:30','1–2','Sen']);
  assert.deepEqual(sh[2].rows[1],['Koreksi UTS','Tinggi','Penilaian','2026-11-20 10:00','Aktif','x']);
  assert.deepEqual(sh[3].rows[1],['PAS','Ujian','17/11/2026','18/11/2026','Tidak']);
});
