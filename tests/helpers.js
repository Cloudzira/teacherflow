/* Memuat berkas js/ browser ke dalam konteks vm Node, tanpa DOM, sehingga logika murni bisa diuji. */
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..');
function load(files=['holidays.js','logic.js'],globals={}){
  const ctx=vm.createContext({TextEncoder,TextDecoder,console,...globals});
  files.forEach(f=>vm.runInContext(fs.readFileSync(path.join(ROOT,'js',f),'utf8'),ctx,{filename:f}));
  /* Objek/array dari konteks vm berbeda "realm"; ubah jadi nilai biasa agar bisa dibandingkan dengan assert. */
  const norm=v=>v&&typeof v==='object'&&Object.prototype.toString.call(v)!=='[object Set]'?JSON.parse(JSON.stringify(v)):v;
  const get=n=>{const v=vm.runInContext(n,ctx);return typeof v==='function'?(...a)=>norm(v(...a)):norm(v)};
  return{ctx,get,run:c=>norm(vm.runInContext(c,ctx))};
}
const ag=(o)=>({id:'x'+Math.random().toString(36).slice(2,7),type:'Mengajar',title:'T',startTime:'07:00',endTime:'08:00',date:null,days:[],location:'',target:'',notes:'',...o});
module.exports={load,ag,ROOT};
