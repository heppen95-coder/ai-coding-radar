import {test} from 'node:test';import assert from 'node:assert/strict';
import {dateInShanghai,parseFeed,editionDue,makeEdition,safeUrl,validateItem} from './core.mjs';
test('北京时间跨日归档',()=>assert.equal(dateInShanghai(new Date('2026-10-16T17:00:00Z')),'2026-10-17'));
test('RSS 与 Atom 保留原文、日期和转义文本',()=>{
 const rss=parseFeed('<rss><channel><item><title>A &amp; B</title><link>https://example.com/a?utm_source=rss</link><pubDate>Fri, 16 Oct 2026 09:00:00 GMT</pubDate><description><![CDATA[<p>Hello &amp; bye</p>]]></description></item></channel></rss>');assert.equal(rss[0].url,'https://example.com/a');assert.equal(rss[0].body,'Hello & bye');
 const atom=parseFeed('<feed><entry><title>Agent</title><link rel="self" href="https://example.com/feed"/><link rel="alternate" href="https://example.com/post"/><published>2026-10-16T10:00:00Z</published><content>Text</content></entry></feed>');assert.equal(atom[0].url,'https://example.com/post');
});
test('双日精选跨月保持两天节奏，重复执行不新建',()=>{const e=[{date:'2026-10-31',itemIds:[]}];assert.equal(editionDue('2026-11-01','2026-10-17',e),false);assert.equal(editionDue('2026-11-02','2026-10-17',e),true);assert.equal(editionDue('2026-11-02','2026-10-17',[...e,{date:'2026-11-02',itemIds:[]}]),false);});
test('补录旧文章可进入新一期，已精选文章不重复',()=>{const items=[{id:'new',publishedAt:'2026-09-01',collectedAt:'2026-10-19',importance:4},{id:'old',publishedAt:'2026-10-17',collectedAt:'2026-10-17'}];assert.deepEqual(makeEdition('2026-10-19',items,[{date:'2026-10-17',itemIds:['old']}]).itemIds,['new']);});
test('拒绝危险来源链接和无效内容',()=>{assert.equal(safeUrl('javascript:alert(1)'),null);assert.throws(()=>validateItem({id:'bad'}));});
