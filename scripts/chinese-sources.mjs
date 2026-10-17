import {decode,plain,tag} from './core.mjs';
const literal='"(?:\\\\.|[^"\\\\])*"';
function field(text,name){const m=text.match(new RegExp('(?:^|,)'+name+':('+literal+')'));return m?JSON.parse(m[1]):'';}
export function baaiPreviews(html){
  const params=html.match(/window\.__NUXT__=\(function\(([^)]*)\)/)?.[1].split(',');
  const args=html.match(/\}\((\s*(?:false|true|null|"|\d)[\s\S]*?)\)\);<\/script>/)?.[1];
  if(!params||!args)throw Error('智源公开列表结构已变化');
  const values=JSON.parse('['+args+']'), bindings=new Map(params.map((p,i)=>[p,values[i]]));
  return [...html.matchAll(/\{story_info:\{([\s\S]*?)\},is_event:/g)].flatMap(([,b])=>{
    const token=b.match(/^id:(\w+),/)?.[1],id=/^\d+$/.test(token)?Number(token):bindings.get(token);
    const created=field(b,'created_at').match(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/)?.[0];
    const title=field(b,'title'),summary=field(b,'summary')||field(b,'content');
    return Number.isSafeInteger(id)&&created&&title&&summary?[{url:`https://hub.baai.ac.cn/view/${id}`,originalTitle:title,publishedAt:created.replace(' ','T')+':00+08:00',body:'以下为智源社区公开摘要；日期为社区分享时间，不等于原文发布日期。不可据此声称已读原文全文。\n'+plain(summary),kind:'中文编译（社区公开摘要／分享时间）'}]:[];
  });
}
export function ai53Links(html){return [...new Set([...html.matchAll(/href=["']([^"']+)["']/g)].map(m=>{try{return new URL(decode(m[1]),'https://www.53ai.com').href;}catch{return '';}}))].filter(u=>/^https:\/\/www\.53ai\.com\/news\/[^/]+\/\d+\.html$/.test(u));}
export function ai53Preview(html,url){
  const date=plain(html).match(/发布日期[：:]\s*(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})/);
  const description=html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)/i)?.[1];
  if(!date||!description)return null;
  return {url,originalTitle:plain(tag(html,'title')),publishedAt:`${date[1]}T${date[2]}+08:00`,body:'以下仅为53AI公开的页面摘要，未读取需展开或登录的正文，不得推断原帖内容、性能或未经证实的传言。\n'+plain(description),kind:'中文编译（仅公开摘要）'};
}
