import {test} from 'node:test';
import assert from 'node:assert/strict';
import {blueskyPosts,selectCandidates} from './social.mjs';
test('社交采集保持原作者、原帖日期和链接，排除转发、回复与冒名内容',()=>{
  const account={name:'Author',did:'did:plc:author'};
  const post={uri:'at://did:plc:author/app.bsky.feed.post/abc123',author:{did:account.did},record:{text:'Agent update',createdAt:'2026-10-16T23:00:00Z',embed:{external:{title:'Harness notes',description:'Original context',uri:'https://example.com/article'}}}};
  const data={feed:[{post},{post,reason:{$type:'app.bsky.feed.defs#reasonRepost'}},{post:{...post,record:{...post.record,reply:{}}}},{post:{...post,author:{did:'did:plc:other'}}}]};
  const rows=blueskyPosts(data,account);assert.equal(rows.length,1);assert.equal(rows[0].publishedAt,post.record.createdAt);assert.equal(rows[0].url,'https://bsky.app/profile/did:plc:author/post/abc123');assert.equal(rows[0].author,'Author');assert.match(rows[0].body,/Original context/);
});
test('有限处理名额兼顾社交与其他来源且不重复',()=>{
  const rows=[{url:'a',kind:'官方文章'},{url:'b',kind:'社交原帖'},{url:'c',kind:'社交原帖'},{url:'d',kind:'社交原帖'}];
  assert.deepEqual(selectCandidates(rows,3).map(x=>x.url),['b','c','a']);assert.equal(selectCandidates(rows,1).length,1);
});
test('媒体预留名额覆盖不同出版方，并遵守总上限',()=>{
  const rows=[{url:'a',source:'Blog'},{url:'b',media:true,source:'Media A'},{url:'c',media:true,source:'Media A'},{url:'d',media:true,source:'Media B'}];
  assert.deepEqual(selectCandidates(rows,3).map(x=>x.url),['b','d','a']);assert.deepEqual(selectCandidates(rows,1).map(x=>x.url),['b']);
});
