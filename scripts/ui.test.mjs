import {test} from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile} from 'node:fs/promises';
test('页面数据加载、分类、搜索、日期空状态和详情链接',async()=>{
 const data={};for(const name of ['items','editions','status'])data[name]=JSON.parse(await readFile(`data/${name}.json`,'utf8'));data.config=JSON.parse(await readFile('config.json','utf8'));
 const nodes=new Map();const node=s=>{if(!nodes.has(s))nodes.set(s,{innerHTML:'',textContent:'',addEventListener(type,fn){this[type]=fn;},showModal(){this.open=true;},close(){this.open=false;}});return nodes.get(s);};const events={};const winEvents={};const location={hash:'#/latest'};
 const context=vm.createContext({console,URL,Promise,location,window:{RADAR_DATA:data,addEventListener:(e,fn)=>winEvents[e]=fn},document:{querySelector:node,querySelectorAll:()=>[],addEventListener:(e,fn)=>events[e]=fn}});
 vm.runInContext(await readFile('public/app.js','utf8'),context);await new Promise(r=>setImmediate(r));
 assert.match(node('#view').innerHTML,/featured-story/);assert.match(node('#view').innerHTML,/阅读原文/);assert.match(node('#view').innerHTML,/https:\/\/claude.dev/);
 const click=selector=>events.click({target:{closest:s=>s===selector?{dataset:{category:'Pi Agent',detail:'pi-130'}}:null}});
 click('[data-category]');assert.match(node('#view').innerHTML,/Pi v1.3.0/);assert.doesNotMatch(node('#view').innerHTML,/Claude Code 团队把/);
 const issuePi=data.items.filter(i=>data.editions[0].itemIds.includes(i.id)&&i.category==='Pi Agent').length;
 assert.ok(node('#categories').innerHTML.includes(`Pi Agent<span>${issuePi}</span>`));
 node('#search').input({target:{value:'不存在的关键词'}});assert.match(node('#view').innerHTML,/这里还没有收录内容/);node('#search').input({target:{value:''}});
 location.hash='#/archive/2026-01-01';winEvents.hashchange();assert.match(node('#view').innerHTML,/这个日期暂无收录/);
 assert.ok(node('#categories').innerHTML.includes('Pi Agent<span>0</span>'));assert.match(node('#view-head').innerHTML,/0 STORIES/);
 location.hash='#/all';winEvents.hashchange();assert.ok(node('#categories').innerHTML.includes(`Pi Agent<span>${data.items.filter(i=>i.category==='Pi Agent').length}</span>`));
 location.hash='#/sources';winEvents.hashchange();assert.match(node('#view').innerHTML,/免费公开采集|免费公开嵌入采集|X API 尚未启用/);
 click('[data-detail]');assert.equal(node('#detail').open,true);assert.match(node('#detail-body').innerHTML,/https:\/\/github.com\/earendil-works\/pi\/releases\/tag\/v1.3.0/);
});
