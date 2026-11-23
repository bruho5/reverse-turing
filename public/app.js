(() => {
'use strict';
const main = document.querySelector('main'), toast = document.querySelector('.toast'), toggle = document.querySelector('#locale');
const read=k=>{try{return localStorage.getItem(k)}catch{return null}};
const write=(k,v)=>{try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch{}};
let lang=read('rt-language') || (navigator.language?.startsWith('zh')?'zh':'en'), serial=0, timer, posted;
const t=(zh,en)=>lang==='en'?en:zh;
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const idPath=id=>encodeURIComponent(id);
const source=x=>x==='ai'?t('AI 生成','AI-generated'):t('人写的','Human-written');
const manage=(id,token)=>'/manage/'+idPath(id)+(token?'#'+encodeURIComponent(token):'');
const ownerKey=id=>'rt-owner:'+id;
const draftKey=()=> 'rt-draft:'+lang;
function shell(){
 document.documentElement.lang=t('zh-CN','en'); document.title=t('反向图灵','Reverse Turing');
 document.querySelector('#brandtext').textContent=document.title;
 document.querySelector('.skip').textContent=t('跳到游戏内容','Skip to game');
 document.querySelector('nav').setAttribute('aria-label',t('游戏导航','Game navigation'));
 ['猜一条','写一条','我的回答'].forEach((text,i)=>document.querySelectorAll('nav a')[i].textContent=t(text,['Guess','Write','My answers'][i]));
 document.querySelectorAll('footer span')[0].textContent=t('反向图灵 · 别靠直觉撑太久','Reverse Turing · Trust your gut, briefly.');
 document.querySelectorAll('footer span')[1].textContent=t('无积分 · 无榜单 · 免登录','No scores · No leaderboard · No sign-in');
 toggle.textContent=t('EN','中文'); toggle.lang=t('en','zh-CN'); toggle.setAttribute('aria-label',t('Switch to English','切换到简体中文'));
}
function notice(message){clearTimeout(timer);toast.textContent=message;toast.hidden=false;timer=setTimeout(()=>toast.hidden=true,3200)}
async function api(path,method='GET',data,token){
 const headers={Accept:'application/json'};
 if(data!==undefined) headers['Content-Type']='application/json';
 if(token) headers.Authorization='Bearer '+token;
 let response;try{response=await fetch('/api'+path+(path.includes('?')?'&':'?')+'lang='+lang,{method,headers,...(data!==undefined?{body:JSON.stringify(data)}:{})})}catch{throw new Error(t('网络没连上，稍后再试。','Could not connect. Try again shortly.'))}
 const body=await response.json().catch(()=>({}));
 if(!response.ok)throw new Error(typeof body.error==='string'?body.error:t('服务暂时不可用，稍后再试。','The service is temporarily unavailable.'));
 return body;
}
const hero=(k,h,l)=>`<header class="hero"><div class="eyebrow"><span></span>${k}</div><h1>${h}</h1><p class="lede">${l}</p></header>`;
const button=(label,href,cls='')=>`<a class="btn ${cls}" href="${esc(href)}">${label}</a>`;
const promptHeader=q=>`<header class="sheethead"><span class="stamp">${t('题面 / PROMPT','PROMPT')}</span><h2>${esc(q)}</h2></header>`;
const responseText=a=>`<div class="response"><span class="answer-title">${t('收到的匿名回答','ANONYMOUS ANSWER')}</span><blockquote>${esc(a)}</blockquote></div>`;
const poolNote=()=>`<p class="hint pool-note">${t('题库示例由 AI 生成；玩家投稿由作者自行标注，票数来自玩家。','Starter examples are AI-generated. Players label their own submissions; the tally reflects community votes.')}</p>`;
function loading(){main.innerHTML=`<section class="loading" aria-busy="true">${t('正在打开…','Loading…')}</section>`;}
function errorPage(error){
 main.innerHTML=hero('REVERSE TURING',t('这条没打开','Couldn’t open this'), '')+`<section class="sheet"><p role="alert">${esc(error.message)}</p><div class="ctas">${button(t('回大厅','Back to guessing'),'/', 'primary')}<button type="button" class="btn" id="retry">${t('重试','Try again')}</button></div></section>`;
 main.querySelector('#retry').onclick=()=>route(true);
}
function tally({human=0,ai=0}){
 human=+human||0;ai=+ai||0;const count=human+ai;
 return `<p class="result-caption">${count?t(count+' 票里，'+ai+' 票判成 AI。',ai+' of '+count+' votes said AI.'):t('还没有人投票。','No votes yet.')}</p><progress class="bar" aria-hidden="true" value="${ai}" max="${count||1}"></progress><div class="tally"><div>${source('human')}<span class="tallynum">${human} ${t('票',human===1?'vote':'votes')}</span></div><div>${source('ai')}<span class="tallynum">${ai} ${t('票',ai===1?'vote':'votes')}</span></div></div>`;
}
async function copyLink(el,url){
 try{await navigator.clipboard.writeText(url);notice(t('私用链接已复制','Private link copied'))}catch{
  el.parentElement.querySelector('.manual-copy')?.remove();
  const field=document.createElement('input');field.className='manual-copy';field.readOnly=true;field.value=url;field.setAttribute('aria-label',t('私用链接，长按复制','Private link. Press and hold to copy.'));el.parentElement.append(field);field.focus();field.select();
 }
}
function copyPrivate(id,token){
 main.querySelector('#private-copy')?.addEventListener('click',e=>copyLink(e.currentTarget,location.origin+manage(id,token)));
}
function reportUI(){return `<details><summary>${t('举报这条回答','Report answer')}</summary><form class="report-form"><label for="report-reason">${t('原因','Reason')}</label><select id="report-reason"><option value="privacy">${t('包含个人信息','Personal information')}</option><option value="abuse">${t('骚扰或攻击','Harassment or abuse')}</option><option value="spam">${t('垃圾内容','Spam')}</option><option value="other">${t('其他','Other')}</option></select><button type="submit" class="btn small">${t('发送举报','Send report')}</button></form><p class="error" id="report-error" role="alert"></p></details>`}
function renderCard(card,result,deep=false,focus=false){
 main.innerHTML=hero('THE GUESSING ROOM',t('谁写的？','Who wrote it?'),t('看一条匿名回答，猜它是人写的还是 AI 生成的。','Read an anonymous answer. Decide whether it was written by a person or generated by AI.'))+`<article class="sheet">${promptHeader(card.question)}${responseText(card.answer)}
 ${result?`<section class="results" aria-label="${t('投票结果','Vote results')}" tabindex="-1"><p class="result-title">${result.provenance==='demo-ai'?t('题库示例','Starter example'):t('作者自报','Author’s label')}${t('：',': ')}<b>${source(result.source)}</b></p>${result.choice?`<p class="hint">${t('你投的是「'+source(result.choice)+'」。','You voted: '+source(result.choice)+'.')}</p>`:''}${tally(result)}<div class="ctas"><a href="/" class="btn primary" data-next>${t('下一题','Next answer')}</a>${button(t('我也写一条','Write an answer'),'/write')}</div></section>`:`<div class="votes" aria-label="${t('你认为是谁写的？','Who do you think wrote it?')}"><button class="btn" type="button" data-vote="human">${source('human')}<small aria-hidden="true">${t('人','H')}</small></button><button class="btn dark" type="button" data-vote="ai">${source('ai')}<small aria-hidden="true">AI</small></button></div><p class="error" id="vote-error" role="alert"></p>`}
 <div class="meta">${poolNote()}${result?'':`<a class="quiet" href="/" data-next>${t('跳过这题','Skip this one')}</a>`}</div>${reportUI()}</article>`;
 main.querySelector('[data-next]')?.addEventListener('click',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.shiftKey)return;e.preventDefault();if(deep)history.pushState(null,'','/'); next(false,card.id)});
 main.querySelectorAll('[data-vote]').forEach(el=>el.onclick=async()=>{
  const stamp=serial, buttons=main.querySelectorAll('[data-vote]'), err=main.querySelector('#vote-error');buttons.forEach(b=>b.disabled=true);err.textContent='';
  try{const data=await api('/cards/'+idPath(card.id)+'/vote','POST',{choice:el.dataset.vote});if(stamp===serial)renderCard(card,data.result,deep,true)}
  catch(e){if(stamp===serial){err.textContent=e.message;buttons.forEach(b=>b.disabled=false)}}
 });
 main.querySelector('.report-form').onsubmit=async e=>{
  e.preventDefault();const form=e.target,el=form.querySelector('button'),err=main.querySelector('#report-error');el.disabled=true;err.textContent='';
  try{await api('/cards/'+idPath(card.id)+'/report','POST',{reason:form.querySelector('select').value});notice(t('举报已收到','Report received'))}
  catch(e){err.textContent=e.message;el.disabled=false}
 };
 if(focus)main.querySelector('.results').focus();
}
async function next(fromRoute=false,skip=''){
 const stamp=fromRoute?serial:++serial;loading();
 try{const {card}=await api('/next'+(skip?'?skip='+idPath(skip):''));if(stamp!==serial)return;
  if(card){renderCard(card);main.focus();return;}
  main.innerHTML=hero('THE GUESSING ROOM',t('暂时没新题了','No new answers yet'),t('可以写一条，让下一位陌生人来猜。','Write one for the next stranger to guess.'))+`<section class="sheet"><div class="ctas">${button(t('我也写一条','Write an answer'),'/write','primary')}<button type="button" class="btn" id="retry">${t('再看看','Check again')}</button></div>${poolNote()}</section>`;
  main.querySelector('#retry').onclick=()=>next();
 }catch(e){if(stamp===serial)errorPage(e)}
}
function renderPosted(id,token){
 main.innerHTML=hero('ANSWER DESK',t('发出去了。','You’re in.'),t('现在，陌生玩家可以在题库里猜你的回答了。','Other players can now find and guess your answer in the public pool.'))+`<section class="sheet"><div class="stack"><div><h2>${t('看看大家怎么猜','See how people vote')}</h2><p class="hint">${t('票数会记在「我的回答」里，之后可以回来查看。','You can check your tally later under My answers.')}</p><div class="ctas">${button(t('查看结果','View results'),manage(id),'primary')}${button(t('继续猜题','Keep guessing'),'/')}</div></div><div><h2>${t('私用管理链接','Private management link')}</h2><p class="hint">${t('自己收藏。换手机也能查票数或撤稿，不要发给别人。','Save this for yourself. It lets you view votes or withdraw your answer on another device. Don’t share it.')}</p><button type="button" class="btn" id="private-copy">${t('复制私用链接','Copy private link')}</button></div></div></section>`;
 copyPrivate(id,token);main.focus();
}
function renderWrite(prompts){
 if(!prompts?.length){errorPage(new Error(t('现在还没有可以回答的题。','There are no prompts available.')));return;}
 let draft={};try{draft=JSON.parse(read(draftKey()))||{}}catch{}
 let index=prompts.findIndex(p=>p.id===draft.promptId);if(index<0)index=Math.floor(Math.random()*prompts.length);
 main.innerHTML=hero('ANSWER DESK',t('写一条。','Write an answer.'),t('自己写，或者贴一段 AI 的回答。别预告来源。','Write it yourself or paste AI output. Let strangers make the call.'))+`<section class="sheet"><form id="write-form"><header class="sheethead"><span class="stamp">${t('题面 / PROMPT','PROMPT')}</span><div class="actionline"><h2 id="question" aria-live="polite"></h2><button type="button" id="swap" class="btn small">${t('换一道','Another prompt')}</button></div></header><div class="form-row"><label for="answer">${t('你的匿名回答','Your anonymous answer')}</label><textarea id="answer" name="answer" rows="5" maxlength="300" required placeholder="${t('直接写在这里…','Write or paste here…')}"></textarea><small class="hint counter">0 / 300</small></div><fieldset><legend>${t('这段回答是谁写的？','Who wrote this answer?')}</legend><div class="picker"><label class="choice"><input type="radio" name="source" value="human" required>${t('我自己写的','I wrote it')}</label><label class="choice"><input type="radio" name="source" value="ai" required>${source('ai')}</label></div></fieldset><p class="notice">${t('投稿会匿名加入公开题库，任何玩家都可能看到。别写姓名或联系方式。投票后才会显示你标注的来源。','Your answer joins the public pool anonymously, where anyone can see it. Don’t include names or contact details. Your label is shown only after somebody votes.')}</p><p class="error" role="alert" id="write-error"></p><button type="submit" class="btn primary">${t('匿名投稿','Post anonymously')}</button></form></section>`;
 const form=main.querySelector('form'), answer=form.elements.answer, question=form.querySelector('#question'), radio=form.elements.source, error=form.querySelector('#write-error');
 const state=()=>({promptId:prompts[index].id,answer:answer.value,source:radio.value,language:lang});
 const update=()=>{question.textContent=prompts[index].text;form.querySelector('.counter').textContent=answer.value.length+' / 300';};
 answer.value=draft.answer||'';if(['human','ai'].includes(draft.source))radio.value=draft.source;update();
 form.oninput=()=>{update();write(draftKey(),JSON.stringify(state()));};
 form.querySelector('#swap').onclick=()=>{if(prompts.length<2)return;if(answer.value.trim()&&!confirm(t('换题会清除这条草稿，继续吗？','Changing prompts will clear this draft. Continue?')))return;index=(index+1)%prompts.length;answer.value='';radio.value='';update();write(draftKey(),JSON.stringify(state()));};
 form.onsubmit=async e=>{
  e.preventDefault();const button=form.querySelector('[type=submit]'),stamp=serial,key=draftKey(),data=state();button.disabled=true;error.textContent='';
  try{const {id,manageToken}=await api('/cards','POST',{...data,answer:data.answer.trim()});write(key,null);if(manageToken)write(ownerKey(id),manageToken);if(stamp===serial){posted={id,token:manageToken};renderPosted(id,manageToken)}else notice(t('回答已投稿，可在「我的回答」查看。','Answer posted. Find it under My answers.'))}
  catch(e){error.textContent=e.message;button.disabled=false}
 };
}
function renderMine(cards){
 const content=cards.filter(c=>!c.deleted).map(c=>{const ai=+c.ai||0,total=(+c.human||0)+ai;return `<article class="sheet post"><h2>${esc(c.question)}</h2><p>${esc(c.answer)}</p><p class="stats">${source(c.source)} · ${t(total+' 票，'+ai+' 票判成 AI',ai+' of '+total+' votes said AI')}</p>${button(t('管理回答','Manage answer'),manage(c.id),'small')}</article>`}).join('');
 main.innerHTML=hero('YOUR ARCHIVE',t('我的回答','My answers'),t('回来看看最新票数。换设备时，请用投稿后保存的私用链接。','Check back for fresh tallies. On a new device, use the private link you saved when you posted.'))+`<div class="stack">${content||`<section class="sheet"><p>${t('这个浏览器还没有投稿。','No answers from this browser yet.')}</p>${button(t('写第一条','Write one'),'/write','primary')}</section>`}</div>`;
}
function renderManage(card,token){
 if(card.deleted){main.innerHTML=hero('PRIVATE VIEW',t('已经撤下。','Answer withdrawn.'),t('其他玩家不会再看到这条回答。','Other players will no longer see this answer.'))+button(t('回我的回答','Back to my answers'),'/mine');return;}
 main.innerHTML=hero('PRIVATE VIEW',t('管理回答','Manage answer'),t('这个页面是私用的。别把管理链接发给别人。','This is a private view. Don’t share your management link.'))+`<article class="sheet">${promptHeader(card.question)}${responseText(card.answer)}<section class="results"><p class="result-title">${t('作者自报','Author’s label')}${t('：',': ')}<b>${source(card.source)}</b></p>${tally(card)}</section><div class="ctas">${token?`<button type="button" class="btn" id="private-copy">${t('复制私用链接','Copy private link')}</button>`:''}<button type="button" class="btn danger" id="delete">${t('撤下回答','Withdraw answer')}</button></div><p class="error" id="manage-error" role="alert"></p></article>`;
 copyPrivate(card.id,token);
 main.querySelector('#delete').onclick=async e=>{
  if(!confirm(t('撤下后其他玩家不会再看到这条回答。确定撤下？','Withdraw this answer so other players will no longer see it?')))return;
  const stamp=serial,el=e.currentTarget;el.disabled=true;
  try{await api('/manage/'+idPath(card.id),'DELETE',undefined,token);write(ownerKey(card.id),null);if(stamp===serial)renderManage({...card,deleted:true});}
  catch(error){if(stamp===serial){main.querySelector('#manage-error').textContent=error.message;el.disabled=false}}
 };
}
async function route(focus=false){
 const stamp=++serial,path=location.pathname.replace(/\/+$/,'')||'/';
 document.querySelectorAll('nav a').forEach(a=>a.getAttribute('href')===(path.startsWith('/c/')?'/':path)?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));
 loading();
 try{
  if(path==='/')return next(true);
  if(path==='/write'){if(posted){renderPosted(posted.id,posted.token);return;}const {prompts}=await api('/prompts');if(stamp===serial)renderWrite(prompts);}
  else if(path==='/mine'){const {cards}=await api('/mine');if(stamp===serial)renderMine(cards||[]);}
  else if(path.startsWith('/c/')){const {card,result}=await api('/cards/'+idPath(decodeURIComponent(path.slice(3))));if(stamp===serial)renderCard(card,result,true);}
  else if(path.startsWith('/manage/')){const id=decodeURIComponent(path.slice(8)),token=decodeURIComponent(location.hash.slice(1))||read(ownerKey(id));const {card}=await api('/manage/'+idPath(id),'GET',undefined,token);if(stamp===serial){if(token)write(ownerKey(id),token);renderManage(card,token);}}
  else throw new Error(t('这里没有你要找的题卡。','This answer was not found.'));
 }catch(e){if(stamp===serial)errorPage(e)}
 if(focus&&stamp===serial){window.scrollTo(0,0);main.focus();}
}
window.addEventListener('popstate',()=>{posted=null;route(true)});
document.addEventListener('click',e=>{
 const link=e.target.closest('a');
 if(!link||e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||link.hasAttribute('download')||link.target||link.origin!==location.origin||link.getAttribute('href').startsWith('#'))return;
 e.preventDefault();posted=null;history.pushState(null,'',link.pathname+link.search+link.hash);route(true);
});
toggle.addEventListener('click',()=>{lang=t('en','zh');write('rt-language',lang);toast.hidden=true;shell();route()});
shell();route();
})();
