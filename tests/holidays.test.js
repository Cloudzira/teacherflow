const test=require('node:test'),assert=require('node:assert/strict');
const{load}=require('./helpers');
const raw=load(['holidays.js']).get('TF_HOLIDAYS_RAW');
const dow=ds=>new Date(ds+'T12:00:00').getDay();           // 0=Minggu ... 6=Sabtu
const of=(y,t)=>raw.filter(r=>r[0].startsWith(y)&&r[1]===t);

test('jumlah sesuai SKB 3 Menteri: 2026 = 17 libur + 8 cuti; 2027 = 18 libur + 8 cuti',()=>{
  assert.equal(of('2026','libur').length,17);assert.equal(of('2026','cuti').length,8);
  assert.equal(of('2027','libur').length,18);assert.equal(of('2027','cuti').length,8);
});
test('format tanggal valid, jenis valid, nama tidak kosong, dan tanpa duplikat',()=>{
  const seen=new Set();
  for(const[d,t,n]of raw){
    assert.match(d,/^20\d\d-\d\d-\d\d$/,d);assert.ok(!isNaN(new Date(d+'T12:00:00')),d);
    assert.equal(new Date(d+'T12:00:00').toISOString().slice(0,10),d,'tanggal tidak ada di kalender: '+d);
    assert.ok(['libur','cuti'].includes(t),d);assert.ok(n.trim().length>3,d);
    assert.ok(!seen.has(d),'duplikat '+d);seen.add(d);
  }
});
test('daftar terurut menurut tanggal',()=>{
  const d=raw.map(r=>r[0]);assert.deepEqual(d,[...d].sort());
});
test('cuti bersama selalu jatuh pada hari kerja (Senin–Jumat)',()=>{
  for(const[d]of raw.filter(r=>r[1]==='cuti'))assert.ok(dow(d)>=1&&dow(d)<=5,d+' hari ke-'+dow(d));
});
test('hari-hari bertanda tetap sesuai dokumen resmi',()=>{
  const day=(d)=>['Min','Sen','Sel','Rab','Kam','Jum','Sab'][dow(d)];
  assert.equal(day('2026-01-01'),'Kam');   // Tahun Baru 2026: Kamis
  assert.equal(day('2026-12-25'),'Jum');   // Natal 2026: Jumat
  assert.equal(day('2026-08-17'),'Sen');   // 17 Agustus 2026: Senin
  assert.equal(day('2026-03-21'),'Sab');   // Idulfitri 1447: Sabtu
  assert.equal(day('2027-01-01'),'Jum');   // Tahun Baru 2027: Jumat
  assert.equal(day('2027-08-17'),'Sel');   // 17 Agustus 2027: Selasa
  assert.equal(day('2027-03-10'),'Rab');   // Idulfitri 1448 hari pertama: Rabu
  assert.equal(day('2027-12-26'),'Min');   // Isra Mikraj 1449: Minggu
});
test('hari kemerdekaan, Pancasila, dan Natal ada di kedua tahun',()=>{
  const has=(d,frag)=>raw.some(r=>r[0]===d&&r[2].includes(frag));
  for(const y of['2026','2027']){assert.ok(has(y+'-08-17','Proklamasi'));assert.ok(has(y+'-06-01','Pancasila'));assert.ok(has(y+'-12-25','Natal'))}
});
test('TF_HOLIDAYS (peta) konsisten dengan daftar mentah',()=>{
  const m=load(['holidays.js']).get('TF_HOLIDAYS');assert.equal(Object.keys(m).length,raw.length);
  assert.deepEqual(m['2026-12-25'],{t:'libur',n:'Kelahiran Yesus Kristus (Natal)'});
});
