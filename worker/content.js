export const prompts=[
  ['cake','你吃了室友留在冰箱里的最后一口蛋糕。发条消息承认，不道歉，也别吵起来。'],
  ['elevator','电梯门快关了，外面有人喊“等一下”。你没按开门键。写一句那一秒的内心独白。'],
  ['weather','你和朋友约好出去散步，可你只想在家躺着。写一句你真正会发的消息。'],
  ['plants','你帮朋友浇花，把唯一一盆假的也浇了。现在朋友问你花怎么样。'],
  ['sleep','凌晨两点有人问你“睡了吗”，你其实两小时前就看见了。怎么回？'],
  ['gift','收到一件丑到舍不得退的礼物。写一句会发给送礼人的话。'],
  ['bus','公交开走时，你和司机对视了一秒。写一句当时脑子里闪过的话。'],
  ['dog','你在路上又认错了别人家的狗。主人问你是不是认识它。']
].map(([id,text])=>({id,text}));
const lines=[
 ['cake','冰箱里那口蛋糕是我吃的。你明天还想吃那个口味的话，我路过店里带一个回来。'],
 ['elevator','我按的是关门。其实也不用按的，这玩意儿自己会关。'],
 ['weather','你今天还特别想出去吗？我有点不想动，咱们明天走可以不。'],
 ['plants','都挺好，有一盆好得有点过头了，浇完水我才发现它叶子上有条模具缝。'],
 ['sleep','正准备睡，你说。'],
 ['gift','我已经给它腾出一个位置了。先不告诉你在哪。'],
 ['bus','他看见我了。我得承认这比他没看见我更难受一点。'],
 ['dog','不认识，它刚才回头的样子很像我家那只，我就下意识喊了。'],
 ['cake','你留的蛋糕在我肚子里。盒子还在，没敢扔。'],
 ['weather','说出来你可能不信，我鞋都穿上了，人又坐回去了。']
];
// These examples were authored by an AI. Do not seed synthetic human votes or claims.
export const examples=lines.map(([promptId,answer],i)=>({id:'demo-'+(i+1),promptId,answer,source:'ai',provenance:'demo-ai'}));
export const promptsEn=[
  ['cake',"You ate the last bite of cake your roommate had left in the fridge. Text them to admit it, without apologizing or starting a fight."],
  ['elevator','The elevator doors were closing and someone called “Hold it!” You did nothing. What went through your head right then?'],
  ['weather','You promised a friend you’d go for a walk, but you want to stay on the couch. Write the text you’d actually send.'],
  ['plants','You watered a friend’s plants, including the only fake one. They’ve just asked how the plants are doing.'],
  ['sleep','Someone texts “You asleep?” at 2 a.m. You saw the message two hours ago. What do you say?'],
  ['gift','Someone gave you a gift so ugly you can’t bring yourself to return it. Write a message to the person who gave it to you.'],
  ['bus','The driver made eye contact with you as the bus pulled away. What went through your head?'],
  ['dog','You mistook a stranger’s dog for one you know. Its owner asks if you’ve met.']
].map(([id,text])=>({id,text}));
const englishLines=[
  "The cake is gone and I know exactly where it went. That’s all I’m prepared to say until breakfast.",
  "I actually hit CLOSE. It would’ve closed on its own. I got involved for no reason.",
  "Still up for a walk? I put my shoes on and then sat back down. Can we do tomorrow?",
  "They’re all doing well. One of them was doing suspiciously well, so I checked the bottom.",
  "Just about to. What’s up?",
  "I’ve already found a spot for it. No, I won’t tell you where.",
  "I wish he hadn’t looked. Now it feels personal.",
  "No, sorry. Mine turns his head exactly like that when I say his name."
];
export const examplesEn=englishLines.map((answer,i)=>({id:'demo-en-'+(i+1),promptId:promptsEn[i].id,answer,source:'ai',provenance:'demo-ai'}));
