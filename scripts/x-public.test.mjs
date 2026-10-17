import {test} from 'node:test';import assert from 'node:assert/strict';
import {discoverXPosts,parseXEmbed,xPostTimestamp,xPostUrl} from './x-public.mjs';
const url='https://x.com/ClaudeDevs/status/2111209208012210409';
const embed={url,author_name:'ClaudeDevs',author_url:'https://x.com/ClaudeDevs',provider_name:'X',html:`<blockquote><p lang="en">Claude Code now gzips the conversation.<br>Faster delivery.</p>&mdash; ClaudeDevs <a href="${url}?ref_src=twsrc">October 16, 2026</a></blockquote>`};
test('X 免费发现仅接受关注账号，统一旧域名并去重',()=>{
 assert.deepEqual(discoverXPosts(`href="${url}" https://twitter.com/ClaudeDevs/status/2111209208012210409 https://x.com/unknown/status/2111209208012210409`,['ClaudeDevs']),[url]);
 assert.equal(xPostUrl('https://x.com.evil/ClaudeDevs/status/2111209208012210409'),null);
 assert.equal(new Date(xPostTimestamp(url)).toISOString().slice(0,10),'2026-10-16');
});
test('官方公开嵌入保留可见文本和真实日期，不混入脚本或作者说明',()=>{
 const result=parseXEmbed(embed,url);assert.equal(result.publishedAt,'2026-10-16T00:00:00.000Z');assert.equal(result.platform,'x');assert.match(result.body,/gzips/);assert.doesNotMatch(result.body,/<blockquote>/);assert.equal(result.author,'ClaudeDevs');
 assert.throws(()=>parseXEmbed({...embed,author_url:'https://x.com/someone'},url));
 assert.throws(()=>parseXEmbed({...embed,html:'<p>Missing date</p>'},url));
});
