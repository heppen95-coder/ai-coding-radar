import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {personalAgentConfig,parseAgentResult,summarizeWithOpenClaw} from './openclaw-summary.mjs';
const summary={relevant:true,title:'工具更新',summary:'更新改善代码审查。',takeaway:'使用真实任务验证效果。',category:'Agent 能力',importance:3};
test('实际调用 OpenClaw CLI，配置不写密钥，子进程不接收 GitHub 凭证',async()=>{
  const result=await summarizeWithOpenClaw({source:'test',originalTitle:'Agent',body:'Release notes'},{env:{BIGMODEL_API_KEY:'audit-fake-key',GITHUB_TOKEN:'never-forward',OPENCLAW_CLI_PATH:'/temporary/openclaw.mjs'},executeImpl:async(binary,args,opts)=>{
    assert.equal(binary,process.execPath);assert.deepEqual(args.slice(1,3),['agent','exec']);assert.equal(opts.env.GITHUB_TOKEN,undefined);assert.equal(opts.env.BIGMODEL_API_KEY,undefined);assert.equal(opts.env.ZAI_API_KEY,'audit-fake-key');
    const config=await readFile(args[args.indexOf('--config')+1],'utf8');assert.ok(!config.includes('audit-fake-key'));assert.deepEqual(JSON.parse(config).tools.deny,['*']);
    return{stdout:JSON.stringify({ok:true,status:'ok',final:JSON.stringify(summary)})};
  }});assert.deepEqual(result,summary);
});
test('失败的 Agent 输出不会被误认为完成',()=>{assert.throws(()=>parseAgentResult({ok:false,status:'error',final:JSON.stringify(summary)}));assert.equal(personalAgentConfig().models.providers.zai.baseUrl,'https://open.bigmodel.cn/api/coding/paas/v4');});
test('非法摘要JSON最多重试一次，成功结果才返回',async()=>{
  let calls=0;
  const result=await summarizeWithOpenClaw({source:'test',originalTitle:'test',body:'text'},{env:{BIGMODEL_API_KEY:'fake',OPENCLAW_CLI_PATH:'/fake'},executeImpl:async(_binary,args)=>{
    calls++;
    if(calls===2)assert.match(await readFile(args[args.indexOf('--message-file')+1],'utf8'),/合法JSON/);
    return {stdout:JSON.stringify({ok:true,status:'ok',final:calls===1?'broken JSON':JSON.stringify(summary)})};
  }});
  assert.equal(calls,2);assert.deepEqual(result,summary);
});
test('子进程错误日志不泄露密钥',async()=>{await assert.rejects(summarizeWithOpenClaw({source:'test',originalTitle:'test',body:'text'},{env:{BIGMODEL_API_KEY:'audit-sensitive',OPENCLAW_CLI_PATH:'/fake'},executeImpl:async()=>{throw Object.assign(Error('audit-sensitive'),{stderr:'audit-sensitive HTTP 429 {"code":"1302"}'});}}),e=>e.message.includes('1302')&&!e.message.includes('audit-sensitive'));});
