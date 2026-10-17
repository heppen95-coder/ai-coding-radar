import {readFile,mkdir,cp,writeFile} from 'node:fs/promises';
import {validateItem} from './core.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const [items,editions,status,config]=await Promise.all(['data/items.json','data/editions.json','data/status.json','config.json'].map(read));
const ids=new Set();const urls=new Set();for(const i of items){validateItem(i);if(ids.has(i.id)||urls.has(i.url))throw Error('Duplicate item '+i.id);ids.add(i.id);urls.add(i.url);}
for(const e of editions)for(const id of e.itemIds)if(!ids.has(id))throw Error('Edition references missing item '+id);
await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});
await writeFile('dist/data.json',JSON.stringify({items,editions:[...editions].sort((a,b)=>b.date.localeCompare(a.date)),status,config}));
await writeFile('dist/.nojekyll','');
console.log(`Built ${items.length} stories and ${editions.length} editions to dist/`);
const [html,css,js]=await Promise.all(['public/index.html','public/style.css','public/app.js'].map(p=>readFile(p,'utf8')));
const data=JSON.stringify({items,editions:[...editions].sort((a,b)=>b.date.localeCompare(a.date)),status,config}).replaceAll('<','\\u003c');
const offline=html.replace('<link rel="stylesheet" href="./style.css">',`<style>${css}</style>`).replace('<script src="./app.js" defer></script>',()=>`<script>window.RADAR_DATA=${data};</script><script>${js.replaceAll('</script','<\\/script')}</script>`).replace('<link rel="icon" href="./favicon.svg" type="image/svg+xml">','');
await writeFile('../AI编码观察-本地预览.html',offline);
