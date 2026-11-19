const test=require('node:test'),assert=require('node:assert/strict');
const{load}=require('./helpers');
const{get,ctx}=load(['xlsx.js']);
const dec=b=>new TextDecoder().decode(b);

/* Pembaca zip minimal (metode "store") untuk memeriksa keluaran tfZip secara independen dari penulisnya. */
function readZip(u8){
  const dv=new DataView(u8.buffer,u8.byteOffset,u8.byteLength);
  const eocd=u8.length-22;assert.equal(dv.getUint32(eocd,true),0x06054b50,'EOCD');
  const n=dv.getUint16(eocd+10,true),cdOff=dv.getUint32(eocd+16,true),out={};let p=cdOff;
  for(let i=0;i<n;i++){
    assert.equal(dv.getUint32(p,true),0x02014b50,'central header');
    const crc=dv.getUint32(p+16,true),size=dv.getUint32(p+24,true),nl=dv.getUint16(p+28,true),off=dv.getUint32(p+42,true);
    const name=dec(u8.subarray(p+46,p+46+nl));
    assert.equal(dv.getUint32(off,true),0x04034b50,'local header '+name);
    const ln=dv.getUint16(off+26,true),le=dv.getUint16(off+28,true),data=u8.subarray(off+30+ln+le,off+30+ln+le+size);
    out[name]={data,crc};p+=46+nl;
  }
  return out;
}

test('CRC-32 sesuai vektor uji standar',()=>{
  const c=get('tfCrc32');
  assert.equal(c(new TextEncoder().encode('123456789')),0xCBF43926);
  assert.equal(c(new Uint8Array(0)),0);
  assert.equal(c(new TextEncoder().encode('The quick brown fox jumps over the lazy dog')),0x414FA339);
});
test('kolom Excel: A, Z, AA, AZ, BA',()=>{
  const f=get('tfColName');assert.deepEqual([0,25,26,51,52,701,702].map(f),['A','Z','AA','AZ','BA','ZZ','AAA']);
});
test('nama lembar: dibersihkan, dipotong 31 karakter, dan dibuat unik',()=>{
  const f=get('tfSheetNames');
  assert.deepEqual(f(['Tugas:[a]/b']),['Tugas  a  b']);
  assert.equal(f(['x'.repeat(50)])[0].length,31);
  const r=f(['Data','data','DATA']);assert.equal(new Set(r.map(x=>x.toLowerCase())).size,3);
  assert.ok(f(['y'.repeat(31),'y'.repeat(31)]).every(x=>x.length<=31));
});
test('escape XML menghapus karakter kontrol dan menetralkan simbol',()=>{
  const f=get('tfXmlEsc');assert.equal(f('a<b>&"c"\u0001\u0008d'),'a&lt;b&gt;&amp;&quot;c&quot;d');assert.equal(f(null),'');
});
const runIn=c=>Uint8Array.from(require('vm').runInContext(c,ctx));
test('zip: struktur sah, CRC tiap berkas cocok, isi utuh (termasuk UTF-8)',()=>{
  const enc=new TextEncoder();ctx.fs=[{name:'a.txt',data:enc.encode('halo')},{name:'dir/é.txt',data:enc.encode('Ünïcode — ✓')},{name:'kosong',data:new Uint8Array(0)}];
  const z=readZip(runIn('tfZip(fs)'));
  assert.deepEqual(Object.keys(z),['a.txt','dir/é.txt','kosong']);
  assert.equal(dec(z['a.txt'].data),'halo');assert.equal(dec(z['dir/é.txt'].data),'Ünïcode — ✓');assert.equal(z['kosong'].data.length,0);
  for(const f of Object.values(z))assert.equal(get('tfCrc32')(Uint8Array.from(f.data)),f.crc);
});

const build=sheets=>{ctx.sh=sheets;return readZip(runIn('tfBuildXlsx(sh)'))};
test('xlsx: berisi semua bagian OOXML yang wajib',()=>{
  const z=build([{name:'A',rows:[['h'],['v']]},{name:'B',rows:[['h']]}]);
  for(const n of['[Content_Types].xml','_rels/.rels','xl/workbook.xml','xl/_rels/workbook.xml.rels','xl/styles.xml','xl/worksheets/sheet1.xml','xl/worksheets/sheet2.xml'])assert.ok(z[n],'hilang: '+n);
  const wb=dec(z['xl/workbook.xml'].data);assert.match(wb,/<sheet name="A" sheetId="1" r:id="rId1"\/>/);assert.match(wb,/<sheet name="B" sheetId="2" r:id="rId2"\/>/);
  assert.match(dec(z['xl/_rels/workbook.xml.rels'].data),/Id="rId3"[^>]*styles\.xml/);   // styles menyusul setelah semua lembar
  assert.match(dec(z['[Content_Types].xml'].data),/worksheets\/sheet2\.xml/);
});
test('xlsx: sel teks, angka, kosong, dan karakter khusus dirender benar',()=>{
  const z=build([{name:'S',rows:[['Hari','Jam'],['Senin <&> "x"',5],['',null,'ujung']],widths:[12,8]}]);
  const x=dec(z['xl/worksheets/sheet1.xml'].data);
  assert.match(x,/<c r="A1" s="1" t="inlineStr"><is><t xml:space="preserve">Hari<\/t><\/is><\/c>/);   // header bergaya
  assert.match(x,/<c r="A2" s="2" t="inlineStr"><is><t xml:space="preserve">Senin &lt;&amp;&gt; &quot;x&quot;<\/t>/);
  assert.match(x,/<c r="B2" s="2"><v>5<\/v><\/c>/);                                                  // angka tanpa inlineStr
  assert.ok(!/r="A3"|r="B3"/.test(x));assert.match(x,/<c r="C3"/);                                  // sel kosong dilewati
  assert.match(x,/<col min="1" max="1" width="12" customWidth="1"\/>/);assert.match(x,/state="frozen"/);
});
test('xlsx: setiap bagian XML well-formed (tag seimbang)',()=>{
  const z=build([{name:'S',rows:[['a','b'],['<x>',2]]}]);
  for(const[n,f]of Object.entries(z)){const s=dec(f.data);const tags=s.replace(/<\?[^>]*\?>/g,'').match(/<\/?[A-Za-z][^>]*>/g)||[];const st=[];
    for(const t of tags){if(t.endsWith('/>'))continue;if(t[1]==='/'){assert.equal(st.pop(),t.slice(2,-1).split(' ')[0],n)}else st.push(t.slice(1,-1).split(/[ >]/)[0])}
    assert.equal(st.length,0,'tag tidak ditutup di '+n)}
});
test('xlsx: angka tak hingga/NaN dirender sebagai teks, bukan merusak berkas',()=>{
  const z=build([{name:'S',rows:[['h'],[Infinity],[NaN]]}]);const x=dec(z['xl/worksheets/sheet1.xml'].data);
  assert.ok(!/<v>Infinity<\/v>|<v>NaN<\/v>/.test(x));
});
