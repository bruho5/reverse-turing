import {prompts, examples, promptsEn, examplesEn} from './content.js';
const questions = new Map(prompts.map(p=>[p.id,p.text]));
const questionsEn = new Map(promptsEn.map(p=>[p.id,p.text]));
const demos = new Map([...examples,...examplesEn].map(c=>[c.id,c]));
const visitorKey='rt_visitor';
const uuidRe=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const idRe=/^(?:[a-f0-9-]{36}|demo-(?:en-)?[0-9]{1,3})$/;
const security={
  'content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'x-content-type-options':'nosniff','referrer-policy':'no-referrer'
};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{...security,'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const EN={
 '数据库还没连上，请稍后再试。':'The database is unavailable. Please try again shortly.',
 '请求来源无效。':'Invalid request origin.',
 '请选择题目和回答来源，正文最多 300 字。':'Choose a prompt and source. Answers may have up to 300 characters.',
 '为保护隐私，回答暂不接受网址。':'Please remove links or contact details before posting.',
 '这一小时投稿有点多，过会儿再试。':'Too many posts this hour. Please try again later.',
 '没有找到这张卡。':'Card not found.',
 '这张卡不存在，或已经被作者撤下。':'This card is missing or no longer available.',
 '需要原浏览器或作者的私用管理链接。':'Use the original browser or the author’s private management link.',
 '找不到这个页面。':'Page not found.',
 '不能给自己的回答投票。':'You can’t vote on your own answer.',
 '请选择人写或 AI。':'Choose Human or AI.',
 '这张卡已撤下。':'This card has been removed.',
 '请填举报原因。':'Choose a reason for reporting.',
 '找不到这个操作。':'Action not found.',
 '暂时没能保存或读取，请稍后再试。':'Could not load or save. Please try again.'
};
const failure=(lang,message,status=400)=>json({error:lang==='en'?(EN[message]??message):message},status);
const now=()=>Math.floor(Date.now()/1000);
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
const currentVisitor=req=>{ const x=req.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(visitorKey+'='))?.slice(visitorKey.length+1);return uuidRe.test(x??'')?x:null };
const withCookie=(resp,req,id)=>{if(!currentVisitor(req)){const secure=new URL(req.url).protocol==='https:'?'; Secure':'';resp.headers.append('set-cookie',visitorKey+'='+id+'; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax'+secure);}return resp;};
const one=(db,sql,...args)=>db.prepare(sql).bind(...args).first();
const run=(db,sql,...args)=>db.prepare(sql).bind(...args).run();
const all=async(db,sql,...args)=>(await db.prepare(sql).bind(...args).all()).results;
const readCard=(db,id)=>demos.get(id)??one(db,'SELECT * FROM cards WHERE id = ? AND deleted = 0',id);
const publicCard=(card,lang)=>({id:card.id,question:(lang==='en'?questionsEn:questions).get(card.prompt_id??card.promptId),answer:card.answer});
async function stats(db,id){
  const r=await one(db,"SELECT COUNT(CASE WHEN choice = 'human' THEN 1 END) AS human, COUNT(CASE WHEN choice = 'ai' THEN 1 END) AS ai FROM votes WHERE card_id = ?",id);
  return {human:Number(r?.human??0),ai:Number(r?.ai??0)};
}
const result=async(db,c,choice)=>({...await stats(db,c.id),source:c.source,provenance:c.provenance??'self-reported',choice});
const ownerCard=(c,counts,lang)=>({...publicCard(c,lang),source:c.source,...counts,deleted:Boolean(c.deleted)});
async function body(req){
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get('content-type')??''))return null;
  if(Number(req.headers.get('content-length')??0)>4096)return null;
  const reader=req.body?.getReader();if(!reader)return null;
  const decoder=new TextDecoder();let size=0,raw='';
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>4096){await reader.cancel();return null;}raw+=decoder.decode(value,{stream:true});}return JSON.parse(raw+decoder.decode())}catch{return null}
}
async function api(req,db,url,visitor,lang){
  const fail=(message,status)=>failure(lang,message,status);
  if(!db)return fail('数据库还没连上，请稍后再试。',503);
  const p=url.pathname,m=req.method;
  if(m!=='GET' && ((req.headers.get('origin')&&req.headers.get('origin')!==url.origin)||req.headers.get('sec-fetch-site')==='cross-site'))return fail('请求来源无效。',403);
  if(p==='/api/prompts'&&m==='GET')return json({prompts:lang==='en'?promptsEn:prompts});
  if(p==='/api/next'&&m==='GET'){
    const skip = url.searchParams.get('skip') ?? '';
    const pool = await one(db,`WITH candidates AS (
      SELECT c.id,c.answer,c.prompt_id,c.created FROM cards c
      WHERE c.lang=? AND c.listed=1 AND c.deleted=0 AND c.owner<>? AND c.id<>?
        AND NOT EXISTS (SELECT 1 FROM votes v WHERE v.card_id=c.id AND v.visitor=?)
        AND (SELECT COUNT(*) FROM reports r WHERE r.card_id=c.id AND r.reason IN ('privacy','abuse','spam'))<2
      ORDER BY c.created DESC, c.id LIMIT 48
    ) SELECT c.* FROM candidates c ORDER BY
        (SELECT COUNT(*) FROM votes v WHERE v.card_id=c.id), c.created DESC, c.id LIMIT 1`,lang,visitor,skip,visitor);
    if(pool)return json({card:publicCard(pool,lang)});
    const deck=lang==='en'?examplesEn:examples;
    const seen=new Set((await all(db,"SELECT card_id FROM votes WHERE visitor=? AND card_id LIKE 'demo-%'",visitor)).map(x=>x.card_id));
    const index=deck.findIndex(c=>c.id===skip);
    const c=(index<0?deck:[...deck.slice(index+1),...deck.slice(0,index)]).find(x=>!seen.has(x.id));
    return json({card:c?publicCard(c,lang):null});
  }
  if(p==='/api/mine'&&m==='GET'){
    const cards=await all(db,"SELECT c.*, (SELECT COUNT(*) FROM votes v WHERE v.card_id=c.id AND v.choice='human') AS human, (SELECT COUNT(*) FROM votes v WHERE v.card_id=c.id AND v.choice='ai') AS ai FROM cards c WHERE c.owner=? AND c.deleted=0 ORDER BY c.created DESC LIMIT 100",visitor);
    return json({cards:cards.map(c=>ownerCard(c,{human:Number(c.human),ai:Number(c.ai)},lang))});
  }
  if(p==='/api/cards'&&m==='POST'){
    const x=await body(req), answer=typeof x?.answer==='string'?x.answer.trim():'';
    if(!x||!questions.has(x.promptId)|| !['human','ai'].includes(x.source)||answer.length<1||[...answer].length>300)return fail('请选择题目和回答来源，正文最多 300 字。');
    if(/https?:\/\/|www\.|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?86[ -]?)?1[3-9]\d(?:[ -]?\d){8}/i.test(answer))return fail('为保护隐私，回答暂不接受网址。');
    const recent=await one(db,'SELECT COUNT(*) AS n FROM cards WHERE owner = ? AND created >= ?',visitor,now()-3600);
    if(recent.n>=8)return fail('这一小时投稿有点多，过会儿再试。',429);
    const id=crypto.randomUUID(),manageToken=crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');
    await run(db,'INSERT INTO cards (id,prompt_id,answer,source,owner,manage_hash,created,lang,listed) VALUES (?,?,?,?,?,?,?,?,1)',id,x.promptId,answer,x.source,visitor,await hash(manageToken),now(),['zh','en'].includes(x.language)?x.language:lang);
    return json({id,manageToken},201);
  }
  const match=p.match(/^\/api\/(cards|manage)\/([^/]+)(?:\/(vote|report))?$/);
  if(!match||!idRe.test(match[2]))return fail('没有找到这张卡。',404);
  const [,section,id,action]=match,c=await readCard(db,id);
  if(!c)return fail('这张卡不存在，或已经被作者撤下。',404);
  if(section==='manage'&&!action&&(m==='GET'||m==='DELETE')){
    const token=req.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if(!c.owner||(c.owner!==visitor&&(!token||await hash(token)!==c.manage_hash)))return fail('需要原浏览器或作者的私用管理链接。',403);
    if(m==='GET')return json({card:ownerCard(c,await stats(db,id),lang)});
    // Retain only owner/time for hourly throttling; immediately remove the submitted text and votes.
    await db.batch([
      db.prepare("UPDATE cards SET deleted=1,answer='',manage_hash='' WHERE id=?").bind(id),
      db.prepare("DELETE FROM votes WHERE card_id=?").bind(id),
      db.prepare("DELETE FROM reports WHERE card_id=?").bind(id)
    ]);
    return json({ok:true});
  }
  if(section!=='cards')return fail('找不到这个页面。',404);
  if(!action&&m==='GET'){
    const vote=await one(db,'SELECT choice FROM votes WHERE card_id=? AND visitor=?',id,visitor);
    return json({card:publicCard(c,lang),...(vote?{result:await result(db,c,vote.choice)}:{})});
  }
  if(action==='vote'&&m==='POST'){
    if(c.owner===visitor)return fail('不能给自己的回答投票。',403);
    const x=await body(req);if(!['ai','human'].includes(x?.choice))return fail('请选择人写或 AI。');
    if(c.owner){
      await run(db,'INSERT OR IGNORE INTO votes (card_id,visitor,choice) SELECT id,?,? FROM cards WHERE id=? AND deleted=0',visitor,x.choice,id);
    }else{await run(db,'INSERT OR IGNORE INTO votes (card_id,visitor,choice) VALUES (?,?,?)',id,visitor,x.choice);}
    const v=await one(db,'SELECT choice FROM votes WHERE card_id=? AND visitor=?',id,visitor);
    return v?json({result:await result(db,c,v.choice)}):fail('这张卡已撤下。',404);
  }
  if(action==='report'&&m==='POST'){
    const x=await body(req), reason=typeof x?.reason==='string'?x.reason.trim().slice(0,120):'';
    if(!reason)return fail('请填举报原因。');
    await run(db,'INSERT OR IGNORE INTO reports (card_id,visitor,reason,created) VALUES (?,?,?,?)',id,visitor,reason,now());
    return json({ok:true});
  }
  return fail('找不到这个操作。',404);
}
export function makeWorker(assets){return {async fetch(req,env){
  const url=new URL(req.url), p=url.pathname, lang=url.searchParams.get('lang')==='en'?'en':'zh';
  const fail=(message,status)=>failure(lang,message,status);
  if(p.startsWith('/api/')){
    const visitor=currentVisitor(req)||crypto.randomUUID();
    try{return withCookie(await api(req,env.DB,url,visitor,lang),req,visitor);}catch(e){console.error('Reverse Turing API',e?.name);return fail('暂时没能保存或读取，请稍后再试。',503);}
  }
  if(req.method!=='GET'&&req.method!=='HEAD')return fail('找不到这个操作。',404);
  let asset=assets[p];if(!asset && (/^\/(?:|write|mine)$/.test(p)||/^\/(?:c|manage)\/[a-z0-9-]+$/.test(p)))asset=assets['/index.html'];
  if(!asset)return new Response('Not found',{status:404,headers:security});
  return new Response(req.method==='HEAD'?null:asset[1],{headers:{...security,'content-type':asset[0],'cache-control':'no-cache','x-robots-tag':p.startsWith('/manage/')?'noindex, nofollow':'noindex'}});
}}}
