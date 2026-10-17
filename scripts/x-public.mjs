import {decode,plain} from './core.mjs';
export function xPostUrl(raw){
  try{const u=new URL(raw);if(!['https:','http:'].includes(u.protocol)||!['x.com','twitter.com','www.x.com','www.twitter.com'].includes(u.hostname))return null;const m=u.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status\/(\d{10,25})\/?$/);return m?`https://x.com/${m[1]}/status/${m[2]}`:null;}catch{return null;}
}
export function discoverXPosts(text,accounts){
  const allowed=new Set(accounts.map(a=>a.toLowerCase()));
  return [...new Set((decode(text).match(/https?:\/\/(?:www\.)?(?:x|twitter)\.com\/[A-Za-z0-9_]+\/status\/\d+/g)||[]).map(xPostUrl).filter(u=>u&&allowed.has(u.split('/')[3].toLowerCase())))];
}
export function xPostTimestamp(url){
  const canonical=xPostUrl(url);if(!canonical)return NaN;
  return Number((BigInt(canonical.split('/')[5])>>22n)+1288834974657n);
}
export function parseXEmbed(data,expected){
  const url=xPostUrl(expected),actual=xPostUrl(data.url);
  if(!url||actual?.toLowerCase()!==url.toLowerCase()||!['X','Twitter'].includes(data.provider_name)||typeof data.html!=='string')throw Error('X 嵌入身份不匹配');
  const handle=url.split('/')[3];
  const authorUrl=new URL(data.author_url);
  if(!['x.com','twitter.com'].includes(authorUrl.hostname)||authorUrl.pathname.replace(/\/$/,'').toLowerCase()!=='/'+handle.toLowerCase())throw Error('X 原帖作者不匹配');
  const text=plain(data.html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1]||'');
  const dateLink=[...data.html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].find(m=>xPostUrl(decode(m[1]))?.toLowerCase()===url.toLowerCase());
  const stamp=Date.parse(plain(dateLink?.[2]||'')+' 00:00:00 GMT');
  if(!text||!Number.isFinite(stamp))throw Error('X 原帖正文或日期缺失');
  return {url,originalTitle:text.slice(0,150),body:'来源为 X 官方公开嵌入文本；可能缺少长帖后半段、引用帖、线程及图片内容。只概括可见文字，短帖应简短摘要，不得补全省略内容或推断图片。\n'+text,publishedAt:new Date(stamp).toISOString(),author:data.author_name||handle,platform:'x',handle};
}
