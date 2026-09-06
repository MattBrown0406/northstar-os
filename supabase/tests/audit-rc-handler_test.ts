import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { createHandler } from '../functions/revenuecat-webhook/index.ts';
const event={id:'evt-1',app_user_id:'11111111-1111-4111-8111-111111111111',app_id:'app-test',store:'APP_STORE',environment:'PRODUCTION',product_id:'intentus_executive_monthly',type:'RENEWAL',event_timestamp_ms:Date.now()-1000,expiration_at_ms:Date.now()+86400000};
const request=(e:unknown=event,secret='secret')=>new Request('http://local',{method:'POST',headers:{Authorization:`Bearer ${secret}`},body:JSON.stringify({event:e})});
Deno.test('real handler validates authentication and exact normalized RPC payload',async()=>{
 let calls=0;
 const h=createHandler({env:()=> 'secret',apply:async args=>{calls++;assertEquals(args.p_product_id,'intentus_executive_monthly');assertEquals(Object.keys(args).length,9);assertEquals(args.p_user_id,event.app_user_id);return {data:'applied',error:null};}});
 assertEquals((await h(request(event,'bad'))).status,401);
 for(const mutation of [{app_user_id:'anonymous'},{event_timestamp_ms:'1'},{event_timestamp_ms:Date.now()+900000},{store:'fake'},{environment:'fake'},{expiration_at_ms:'forever'}]) assertEquals((await h(request({...event,...mutation}))).status,400);
 assertEquals(calls,0);assertEquals((await h(request({...event,subscriber_attributes:{plan:'coach'}}))).status,200);assertEquals(calls,1);
});
Deno.test('real handler retries DB failures and denies unconfigured mappings',async()=>{
 for(const outcome of ['applied','duplicate','stale','ignored','unconfigured']){
 const h=createHandler({env:()=> 'secret',apply:async()=>({data:outcome,error:null})});
 assertEquals((await h(request())).status,outcome==='unconfigured'?503:200);
 }
 for(const code of ['22023','23503']){const h=createHandler({env:()=> 'secret',apply:async()=>({data:null,error:{code}})});assertEquals((await h(request())).status,code==='22023'?400:503);}
 const missing=createHandler({env:()=>undefined,apply:async()=>{throw Error('must not call');}});assertEquals((await missing(request())).status,503);
});
Deno.test('body limit and malformed JSON rejected',async()=>{
 const h=createHandler({env:()=> 'secret',apply:async()=>{throw Error('must not call');}});
 assertEquals((await h(request({padding:'x'.repeat(70000)}))).status,413);
 assertEquals((await h(new Request('http://local',{method:'POST',headers:{Authorization:'Bearer secret'},body:'{'}))).status,400);
});
