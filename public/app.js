const $ = s => document.querySelector(s);
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories = ['全部主题','模型发布','Agent 能力','Harness 实践','Pi Agent'];
let db, selected = '全部主题', query = '';
const fmt = s => s ? s.slice(0,10).replaceAll('-','.') : '尚未运行';
function route(){const [view = 'latest', value = ''] = location.hash.replace(/^#\/?/,'').split('/');return {view, value:decodeURIComponent(value)};}
function matchesSearch(item){return !query || [item.title,item.summary,item.source,item.author,item.originalTitle].join(' ').toLowerCase().includes(query.toLowerCase());}
function matches(item){return (selected === '全部主题' || item.category === selected) && matchesSearch(item);}
function filters(scope){const pool=scope.filter(matchesSearch); $('#categories').innerHTML = categories.map(c => `<button class="${c===selected?'selected':''}" data-category="${esc(c)}" aria-pressed="${c===selected}">${esc(c)}<span>${c==='全部主题'?pool.length:pool.filter(i=>i.category===c).length}</span></button>`).join(''); }
function story(i,n,featured=false){return `<article class="story ${featured?'featured-story':''}"><div class="story-number">${String(n+1).padStart(2,'0')}</div><div><div class="story-top"><span class="tag ${i.category==='Pi Agent'?'pi':i.category==='模型发布'?'model':''}">${esc(i.category)}</span><span>${esc(i.source)}</span><time datetime="${esc(i.publishedAt)}">${fmt(i.publishedAt)}</time></div><h3><button data-detail="${esc(i.id)}">${esc(i.title)}</button></h3><p>${esc(i.summary)}</p>${i.takeaway?`<p class="takeaway"><strong>实践启发 / </strong>${esc(i.takeaway)}</p>`:''}<div class="story-bottom"><span>${esc(i.kind)} · 收录于 ${fmt(i.collectedAt)}</span><a class="original-link" href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">阅读原文 ↗</a></div></div></article>`;}
function heading(title,sub,count){$('#view-head').innerHTML=`<div class="view-heading"><div><h2>${esc(title)}</h2><p>${esc(sub)}</p></div><span class="number">${esc(count)}</span></div>`;}
function empty(msg='试试其他主题或关键词。'){return `<div class="empty"><strong>这里还没有收录内容</strong>${esc(msg)}</div>`;}
function render(){
 if(!db)return; const {view,value}=route();
 const edition=db.editions.find(e=>e.id===value)||db.editions[0];
 const scope=view==='all'||view==='sources'?db.items:view==='archive'?db.items.filter(i=>!value||i.publishedAt.startsWith(value)):(edition?.itemIds||[]).map(id=>db.items.find(i=>i.id===id)).filter(Boolean);
 filters(scope);
 document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===view));
 const items=scope.filter(matches).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
 let html='';
 if(view==='sources'){
  heading('信息从哪里来','原始出处优先，持续积累可验证的实践。','SOURCE DIRECTORY');
  const sources=[...(db.config.modelOrgs||[]).map(s=>({...s,url:'https://huggingface.co/'+s.author,type:'国内模型 · 官方模型仓库'})),...(db.config.bluesky||[]).map(s=>({...s,url:'https://bsky.app/profile/'+s.did,type:'Bluesky · 社交原帖 · 免费公开接口'})),...db.config.github.map(s=>({...s,url:`https://github.com/${s.repo}/releases`,type:'版本发布'})),...db.config.feeds.map(s=>({...s,type:s.kind})),...db.config.sitemaps.map(s=>({...s,type:s.kind}))];
  html=`<div class="sources-grid">${sources.map(s=>`<section class="source-card"><h3>${esc(s.name)}</h3><p>${esc(s.type)}</p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">访问来源 ↗</a></section>`).join('')}</div><section class="status-panel"><h3>X · 公开社交动态</h3><p>${db.status.xEnabled?'最近一次采集已启用 X API。':'X API 尚未启用：目前仅展示关注名单，不自动采集帖子。'}</p><div class="x-accounts">${db.config.xAccounts.map(a=>`<a href="https://x.com/${esc(a)}" target="_blank" rel="noopener noreferrer">@${esc(a)} ↗</a>`).join('')}</div></section><section class="status-panel"><h3>更新状态</h3><p>最近尝试：${db.status.lastAttemptAt?esc(new Date(db.status.lastAttemptAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})):'尚未运行'}<br>最近成功：${db.status.lastSuccessAt?esc(new Date(db.status.lastSuccessAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})):'尚未运行'}<br>${esc(db.status.mode)}</p>${db.status.sources?.length?`<ul>${db.status.sources.map(s=>`<li>${esc(s.name)}：${s.ok?'成功':'失败'}${s.message?' · '+esc(s.message):''}</li>`).join('')}</ul>`:''}<p>计划每天北京时间 09:17 收集，每两天生成一期精选。定时任务需部署并配置后生效；GitHub 调度可能延迟。</p></section><section class="status-panel"><h3>阅读说明</h3><p>官方公告、个人实践与观点分别标注。能力与效果数据归属于原作者；中文摘要不代表独立复现。实践启发属于编辑整理。只收录可定位原文的内容，不把采集日期当作发布日期。</p></section>`;
 }else if(view==='archive'){
  heading('每日归档','按原文发布日期浏览；旧消息补录后也归入原来的日期。',`${items.length} STORIES`);
  html=`<div class="date-controls"><label for="archive-date">选择日期</label><input type="date" id="archive-date" value="${/^\d{4}-\d{2}-\d{2}$/.test(value)?value:''}"><button id="clear-date">查看全部日期</button></div>`;
  const days=[...new Set(items.map(i=>i.publishedAt.slice(0,10)))].filter(d=>!value||d===value);
  html+=days.map(d=>{const list=items.filter(i=>i.publishedAt.startsWith(d));return `<section class="day-group"><h3 class="day-title">${fmt(d)}<span>${list.length} 条</span></h3>${list.map((i,n)=>story(i,n)).join('')}</section>`;}).join('')||empty('这个日期暂无收录。');
 }else if(view==='all'){
  heading('全部资讯','每一个变化，都有可以追溯的出处。',`${items.length} STORIES`);
  html=items.map((i,n)=>story(i,n)).join('')||empty();
 }else{
  const edition=db.editions.find(e=>e.id===value)||db.editions[0];
  heading('两日精选',edition?.description||'新一期发布后会出现在这里。',edition?`ISSUE / ${fmt(edition.date)}`:'LATEST');
  if(edition){const list=edition.itemIds.map(id=>db.items.find(i=>i.id===id)).filter(Boolean).filter(matches);html=`<div class="issue-bar"><span>${esc(edition.title)}</span><label class="sr-only" for="edition-select">选择往期精选</label><select id="edition-select">${db.editions.map(e=>`<option value="${esc(e.id)}" ${e.id===edition.id?'selected':''}>${fmt(e.date)} · ${esc(e.title)}</option>`).join('')}</select></div>${list.map((i,n)=>story(i,n,n===0)).join('')||empty()}`;}else html=empty();
 }
 if(query)html=`<p class="results-note" role="status">当前关键词：${esc(query)} · 在本页范围内筛选</p>`+html;
 $('#view').innerHTML=html; document.title=`${view==='archive'?'每日归档':view==='sources'?'消息来源':view==='all'?'全部资讯':'两日精选'} · Code Radar`;
}
document.addEventListener('click',e=>{
 const c=e.target.closest('[data-category]');if(c){selected=c.dataset.category;render();}
 const d=e.target.closest('[data-detail]');if(d){const i=db.items.find(i=>i.id===d.dataset.detail);if(!i)return;$('#detail-body').innerHTML=`<div class="story-top"><span class="tag">${esc(i.category)}</span><span>${esc(i.kind)}</span></div><h2>${esc(i.title)}</h2><p class="original-title">${esc(i.originalTitle)}</p><p class="detail-meta">${esc(i.author||i.source)} · 发布于 ${fmt(i.publishedAt)} · 收录于 ${fmt(i.collectedAt)}</p><p>${esc(i.summary)}</p>${i.takeaway?`<p class="takeaway"><strong>实践启发 / </strong>${esc(i.takeaway)}</p>`:''}<a class="original-link" href="${esc(i.url)}" target="_blank" rel="noopener noreferrer">阅读原文 ↗</a>`;$('#detail').showModal();}
 if(e.target.closest('#clear-date'))location.hash='/archive';
});
$('#search').addEventListener('input',e=>{query=e.target.value;render();});
document.addEventListener('change',e=>{if(e.target.id==='edition-select')location.hash=`/latest/${encodeURIComponent(e.target.value)}`;if(e.target.id==='archive-date')location.hash=`/archive/${e.target.value}`;});
$('#detail .close').onclick=()=>$('#detail').close();
$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
window.addEventListener('hashchange',render);
const loadData=window.RADAR_DATA?Promise.resolve(window.RADAR_DATA):fetch('./data.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.json();});
loadData.then(data=>{db=data;if(db.status.lastSuccessAt)$('#updated').textContent=`最近更新 · ${fmt(db.status.lastSuccessAt)}`;render();}).catch(()=>{$('#view').innerHTML=empty('内容暂时加载失败，请刷新页面重试。');});
