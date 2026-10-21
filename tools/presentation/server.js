const http=require('node:http');
const os=require('node:os');
const {fullPage}=require('../../build');
const {createPresentationSession}=require('./session');
const {presentationHtml,reviewPage,guidePage}=require('./presentation');

function createPresentationServer(){
  const session=createPresentationSession();
  return http.createServer(async(req,res)=>{
    const url=new URL(req.url,'http://localhost');
    res.setHeader('cache-control','no-store');
    res.setHeader('x-content-type-options','nosniff');
    if(url.pathname.startsWith('/api/')){
      res.setHeader('content-type','application/json; charset=utf-8');
      try{
        let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>2*1024*1024){res.writeHead(413);res.end(JSON.stringify({error:'Το παράδειγμα είναι πολύ μεγάλο.'}));return}}
        const result=session.request(req.method,url.pathname+url.search,raw?JSON.parse(raw):undefined);
        res.writeHead(result.status);res.end(JSON.stringify(result.body));
      }catch(e){res.writeHead(400);res.end(JSON.stringify({error:'Η αλλαγή δεν διαβάστηκε. Δοκίμασε ξανά.'}))}
      return;
    }
    if(req.method!=='GET'){res.writeHead(405);res.end();return}
    const pages={'/':()=>presentationHtml(fullPage),'/app':()=>presentationHtml(fullPage),'/review':reviewPage,'/guide':guidePage,
      '/paron-demo.html':()=>presentationHtml(fullPage,{offline:true})};
    if(!Object.prototype.hasOwnProperty.call(pages,url.pathname)){res.writeHead(404);res.end('Δεν βρέθηκε η σελίδα.');return}
    res.setHeader('content-type','text/html; charset=utf-8');res.end(pages[url.pathname]());
  });
}

if(require.main===module){
  const lan=process.argv.includes('--lan'),port=Number(process.env.PARON_DEMO_PORT||4175),host=lan?'0.0.0.0':'127.0.0.1';
  const server=createPresentationServer();
  server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Η θύρα ${port} χρησιμοποιείται ήδη. Δοκίμασε http://localhost:${port}/review ή όρισε PARON_DEMO_PORT.`:error.message);process.exitCode=1});
  server.listen(port,host,()=>{
    console.log(`PARON · Παρουσίαση\nMac: http://localhost:${port}/review\nΟδηγός: http://localhost:${port}/guide`);
    if(lan)for(const net of Object.values(os.networkInterfaces()).flat())if(net&&!net.internal&&net.family==='IPv4')console.log(`Κινητό, στο ίδιο Wi-Fi: http://${net.address}:${port}/`);
    console.log('Μόνο δεδομένα παραδείγματος. Για κλείσιμο, Ctrl+C.');
  });
}
module.exports={createPresentationServer};
