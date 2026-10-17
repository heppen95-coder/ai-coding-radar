import {test} from 'node:test';import assert from 'node:assert/strict';import {modelRepos} from './model-repos.mjs';
test('官方模型仓库以创建时间筛选，拒绝旧模型更新时间、冒名及非文本模型',()=>{
 const org={name:'Test',author:'official'},cutoff=Date.parse('2026-10-10');
 const good={id:'official/Model',author:'official',createdAt:'2026-10-16T00:00:00Z',pipeline_tag:'text-generation'};
 const rows=modelRepos([good,{...good,createdAt:'2025-01-01',lastModified:'2026-10-17'},{...good,author:'fake'},{...good,pipeline_tag:'text-to-audio'},{...good,id:'official/../unsafe'}],org,cutoff);
 assert.equal(rows.length,1);assert.equal(rows[0].publishedAt,good.createdAt);assert.match(rows[0].body,/不等于模型正式发布日期/);assert.equal(rows[0].url,'https://huggingface.co/official/Model');
});
