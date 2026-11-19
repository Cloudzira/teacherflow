/* Penulis .xlsx minimal tanpa pustaka (murni, tanpa DOM): CRC32 + zip tanpa kompresi + XML spreadsheet.
   Dipakai oleh js/export.js. Dapat diuji dengan `node --test`. */
const TF_CRC_TABLE=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function tfCrc32(bytes){let c=0xFFFFFFFF;for(let i=0;i<bytes.length;i++)c=TF_CRC_TABLE[(c^bytes[i])&0xFF]^(c>>>8);return(c^0xFFFFFFFF)>>>0}

/* files: [{name:string, data:Uint8Array}] -> Uint8Array (format ZIP, metode "store") */
function tfZip(files){
  const enc=new TextEncoder(),parts=[],central=[];let offset=0;
  const d=new Date(),dosTime=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),dosDate=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  files.forEach(f=>{
    const name=enc.encode(f.name),crc=tfCrc32(f.data),size=f.data.length;
    const lh=new DataView(new ArrayBuffer(30));
    lh.setUint32(0,0x04034b50,true);lh.setUint16(4,20,true);lh.setUint16(6,0x0800,true);lh.setUint16(8,0,true);
    lh.setUint16(10,dosTime,true);lh.setUint16(12,dosDate,true);lh.setUint32(14,crc,true);lh.setUint32(18,size,true);lh.setUint32(22,size,true);
    lh.setUint16(26,name.length,true);lh.setUint16(28,0,true);
    parts.push(new Uint8Array(lh.buffer),name,f.data);
    const ch=new DataView(new ArrayBuffer(46));
    ch.setUint32(0,0x02014b50,true);ch.setUint16(4,20,true);ch.setUint16(6,20,true);ch.setUint16(8,0x0800,true);ch.setUint16(10,0,true);
    ch.setUint16(12,dosTime,true);ch.setUint16(14,dosDate,true);ch.setUint32(16,crc,true);ch.setUint32(20,size,true);ch.setUint32(24,size,true);
    ch.setUint16(28,name.length,true);ch.setUint16(30,0,true);ch.setUint16(32,0,true);ch.setUint16(34,0,true);ch.setUint16(36,0,true);ch.setUint32(38,0,true);ch.setUint32(42,offset,true);
    central.push(new Uint8Array(ch.buffer),name);
    offset+=30+name.length+size;
  });
  const cdSize=central.reduce((t,p)=>t+p.length,0);
  const end=new DataView(new ArrayBuffer(22));
  end.setUint32(0,0x06054b50,true);end.setUint16(4,0,true);end.setUint16(6,0,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);
  end.setUint32(12,cdSize,true);end.setUint32(16,offset,true);end.setUint16(20,0,true);
  const all=[...parts,...central,new Uint8Array(end.buffer)],out=new Uint8Array(offset+cdSize+22);let o=0;
  all.forEach(p=>{out.set(p,o);o+=p.length});
  return out;
}

const tfXmlEsc=v=>String(v??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const tfColName=i=>{let s='';for(i++;i>0;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s};
/* Nama lembar Excel: maksimal 31 karakter dan tanpa karakter terlarang; nama kembar diberi nomor. */
function tfSheetNames(list){
  const used=new Set();
  return list.map(n=>{let b=String(n||'Lembar').replace(/[\[\]:*?\/\\]/g,' ').trim().slice(0,31)||'Lembar',x=b,k=2;
    while(used.has(x.toLowerCase())){const suf=' ('+k+')';x=b.slice(0,31-suf.length)+suf;k++}
    used.add(x.toLowerCase());return x});
}

function tfSheetXml(sh){
  const rows=sh.rows||[],widths=sh.widths||[];
  let x='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">';
  x+='<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>';
  if(widths.length)x+='<cols>'+widths.map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join('')+'</cols>';
  x+='<sheetData>';
  rows.forEach((r,ri)=>{
    x+=`<row r="${ri+1}">`;
    r.forEach((v,ci)=>{
      if(v===''||v==null)return;
      const ref=tfColName(ci)+(ri+1),st=ri===0?' s="1"':' s="2"';
      if(typeof v==='number'&&isFinite(v))x+=`<c r="${ref}"${st}><v>${v}</v></c>`;
      else x+=`<c r="${ref}"${st} t="inlineStr"><is><t xml:space="preserve">${tfXmlEsc(v)}</t></is></c>`;
    });
    x+='</row>';
  });
  return x+'</sheetData></worksheet>';
}

/* sheets: [{name, rows:[[sel,...],...], widths:[lebar kolom]}] -> Uint8Array berkas .xlsx */
function tfBuildXlsx(sheets){
  const enc=new TextEncoder(),names=tfSheetNames(sheets.map(s=>s.name)),n=sheets.length;
  const H='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const ct=H+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
    +sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')
    +'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>';
  const rels=H+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
  const wb=H+'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'
    +names.map((nm,i)=>`<sheet name="${tfXmlEsc(nm)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')+'</sheets></workbook>';
  const wbRels=H+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    +sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')
    +`<Relationship Id="rId${n+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const styles=H+'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>'
    +'<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF6F5BD0"/><bgColor indexed="64"/></patternFill></fill></fills>'
    +'<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
    +'<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
  const files=[{name:'[Content_Types].xml',data:enc.encode(ct)},{name:'_rels/.rels',data:enc.encode(rels)},
    {name:'xl/workbook.xml',data:enc.encode(wb)},{name:'xl/_rels/workbook.xml.rels',data:enc.encode(wbRels)},{name:'xl/styles.xml',data:enc.encode(styles)}];
  sheets.forEach((s,i)=>files.push({name:`xl/worksheets/sheet${i+1}.xml`,data:enc.encode(tfSheetXml(s))}));
  return tfZip(files);
}
