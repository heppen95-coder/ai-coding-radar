export function modelRepos(rows,account,cutoff){
  return rows.filter(m=>m.author===account.author&&m.id?.startsWith(account.author+'/')&&/^[\w.-]+\/[\w.-]+$/.test(m.id)&&!m.private&&['text-generation','image-text-to-text'].includes(m.pipeline_tag)&&Number.isFinite(Date.parse(m.createdAt))&&Date.parse(m.createdAt)>=cutoff).map(m=>({
    originalTitle:`${m.id} · 官方模型仓库新增`,url:`https://huggingface.co/${m.id}`,publishedAt:m.createdAt,
    author:account.name,modelId:m.id,
    body:`信息性质：官方组织新增公开模型仓库。仓库创建时间：${m.createdAt}。此时间不等于模型正式发布日期，不得写成今日发布。性能和能力来自下附模型卡的厂商自述，未经本站独立验证。\n模型：${m.id}\n任务：${m.pipeline_tag}\n`
  }));
}
