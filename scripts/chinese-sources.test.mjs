import {test} from 'node:test';import assert from 'node:assert/strict';import {baaiPreviews,ai53Links,ai53Preview} from './chinese-sources.mjs';
test('智源只解析公开摘要和社区分享时间，不执行页面脚本',()=>{
 const html='<script>window.__NUXT__=(function(a){return {story_info:{id:a,title:"Agent 实践",created_at:"2026-10-17 20:00 分享",summary:"社区公开摘要"},is_event:false}}(123));</script>';
 const [row]=baaiPreviews(html);assert.equal(row.url,'https://hub.baai.ac.cn/view/123');assert.equal(row.publishedAt,'2026-10-17T20:00:00+08:00');assert.match(row.kind,/分享时间/);
 assert.throws(()=>baaiPreviews(html.replace('(123));','(process.exit()));')));
});
test('53AI只读取公开元描述，不读取遮罩正文，限定站内文章',()=>{
 const html='<title>Agent 指南</title><meta name="Description" content="公开摘要"><span>发布日期：2026-10-16 08:33:58</span><div class="has-mask">不能读到的正文</div>';
 const row=ai53Preview(html,'https://www.53ai.com/news/agent/123.html');assert.match(row.body,/公开摘要/);assert.doesNotMatch(row.body,/不能读到/);assert.equal(ai53Preview('<title>无日期</title>',row.url),null);
 assert.deepEqual(ai53Links('<a href="/news/agent/123.html">文章</a><a href="https://evil.com/news/agent/123.html">外站</a>'),[row.url]);
});
