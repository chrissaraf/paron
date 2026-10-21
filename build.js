// Φτιάχνει τις σελίδες της εφαρμογής από src/app.html + src/core.js
//   node build.js   → ergodo.html (για online δημοσίευση) και index.html (άνοιγμα με διπλό κλικ)
const fs=require('fs'),path=require('path');
const src=f=>fs.readFileSync(path.join(__dirname,'src',f),'utf8');
// οι μεταφράσεις (i18n.js) μπαίνουν πριν από το core.js, που τις χρησιμοποιεί
function fragment(){return src('app.html').replace('/*@CORE@*/',()=>src('i18n.js')+'\n'+src('core.js'))}
function fullPage(extraHead=''){
  return '<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'+
    '<style>body{margin:0}[hidden]{display:none!important}</style>'+extraHead+'\n'+fragment()+'\n</html>\n';
}
module.exports={fragment,fullPage};
if(require.main===module){
  fs.writeFileSync(path.join(__dirname,'ergodo.html'),fragment());
  fs.writeFileSync(path.join(__dirname,'index.html'),fullPage());
  require('./tools/presentation/presentation').writePresentation(fullPage);
  console.log('OK: ergodo.html, index.html, tools/paron-demo.html, tools/presentation-guide.html');
}
