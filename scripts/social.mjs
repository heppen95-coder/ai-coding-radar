// Public Bluesky AppView only: no login cookies or API credentials.
export function blueskyPosts(data,account){
  return (data.feed||[]).filter(entry=>!entry.reason&&!entry.post?.record?.reply&&entry.post?.author?.did===account.did).flatMap(({post})=>{
    const match=post.uri?.match(/^at:\/\/(did:[^/]+)\/app\.bsky\.feed\.post\/([a-zA-Z0-9]+)$/);
    if(!match||match[1]!==account.did||typeof post.record?.text!=='string')return [];
    const external=post.record.embed?.external||post.record.embed?.media?.external;
    const links=(post.record.facets||[]).flatMap(f=>(f.features||[]).filter(x=>x.$type==='app.bsky.richtext.facet#link').map(x=>x.uri));
    const text=post.record.text;
    const body=[text,external?`原帖附带链接预览：${external.title||''}\n${external.description||''}\n${external.uri||''}`:'',...links].filter(Boolean).join('\n');
    return [{originalTitle:text.slice(0,150),body,url:`https://bsky.app/profile/${account.did}/post/${match[2]}`,publishedAt:post.record.createdAt,author:account.name}];
  });
}
export function selectCandidates(candidates,maxItems){
  const socialPool=candidates.filter(c=>c.kind==='社交原帖');
  const x=socialPool.find(c=>c.platform==='x');
  const social=[...(x?[x]:[]),...socialPool.filter(c=>c!==x)].slice(0,Math.min(2,maxItems));
  const domestic=candidates.filter(c=>c.domestic&&!social.some(s=>s.url===c.url)).slice(0,Math.max(0,Math.min(1,maxItems-social.length)));
  const media=[];const publishers=new Set();for(const c of candidates){if(c.media&&!social.includes(c)&&!domestic.includes(c)&&!publishers.has(c.source)&&media.length<Math.min(2,Math.max(0,maxItems-social.length-domestic.length))){media.push(c);publishers.add(c.source);}}
  const selected=new Set([...social,...domestic,...media].map(c=>c.url));
  return [...social,...domestic,...media,...candidates.filter(c=>!selected.has(c.url))].slice(0,maxItems);
}
