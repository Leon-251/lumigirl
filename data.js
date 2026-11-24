const styles = [
  {name:"甜系少女",alias:"元气蜜桃感",color:"#e6a9bd",tags:["甜美","俏皮","亲切"],scene:"春日野餐、周末咖啡馆",line:"你一笑就让人想跟着笑，甜里还带点俏皮劲儿。",tips:["靠近窗边的白墙，让反射光柔和地落在脸上。","双手轻扶杯子，在看向朋友时按下快门。"],palette:"蜜桃粉、奶油白、浅杏",outfit:"奶油色针织开衫搭浅杏长裙，领口留一点空隙。",hair:"低马尾绑细丝带，鬓角留下几缕碎发。"},
  {name:"高冷御姐",alias:"清冷女主感",color:"#8c92aa",tags:["清冷","利落","有气场"],scene:"城市街角、傍晚展厅",line:"你的眉眼很有存在感，安静站在人群里也容易被一眼认出来。",tips:["站在建筑转角，用墙面直线框住肩膀。","身体向镜头侧转，视线越过镜头，拍半身留白。"],palette:"石墨黑、雾银、冰蓝",outfit:"短款深灰西装搭直筒长裤，内搭选同色系。",hair:"将头发顺向耳后，露出耳饰的轮廓。"},
  {name:"知性优雅",alias:"温婉书卷气",color:"#c29c73",tags:["温婉","从容","耐看"],scene:"书店、午后会面",line:"你给人的第一眼印象很温柔，再看一眼，又会记住眉眼间的从容。",tips:["在书架前留出一步距离，让背景自然虚化。","侧坐在窗边，翻页时稍抬下巴，连拍两三张。"],palette:"燕麦、琥珀棕、象牙白",outfit:"象牙白衬衫搭燕麦色阔腿裤，加一条窄皮带。",hair:"松松挽起低发髻，轻提发顶增加弧度。"},
  {name:"清新自然",alias:"邻家初恋感",color:"#91b49a",tags:["清秀","自然","亲近"],scene:"公园散步、海边旅行",line:"你长得清清爽爽，笑起来像认识了很久的朋友，让人很想靠近。",tips:["站到树荫边缘，避开脸上太碎的光斑。","沿小路缓步前行，在回头的瞬间拍摄。"],palette:"鼠尾草绿、云白、浅牛仔蓝",outfit:"浅绿棉衫搭水洗牛仔裤，袖口随意卷起。",hair:"保留自然纹理，用小抓夹半束头发。"}
];
const femaleStars = [
  ["倪妮", "线条舒展，举手投足都很大方", ["利落肩线", "留白感", "自然侧影"]],
  ["周也", "清冷眉眼里，透着一丝轻盈", ["清透底妆", "淡色唇妆", "简洁轮廓"]],
  ["张子枫", "随性自然，笑起来很有亲和力", ["自然眉形", "柔和线条", "松弛笑容"]],
  ["赵露思", "甜美里带点俏皮，笑意很有感染力", ["圆润线条", "蜜桃色调", "明亮眼神"]],
  ["刘诗诗", "温婉从容，仪态轻盈舒展", ["舒展肩颈", "淡雅眉眼", "低盘发"]],
  ["迪丽热巴", "明艳又利落，眉眼很有存在感", ["浓郁眉眼", "红唇", "鲜明轮廓"]],
  ["田曦薇", "元气又俏皮，甜得很有活力", ["灵动眼神", "轻盈马尾", "暖调腮红"]],
  ["王楚然", "清雅端庄，自带古典韵味", ["柔和眉峰", "舒展轮廓", "素色衣领"]],
  ["白鹿", "明朗爽利，笑容里带着朝气", ["利落眉形", "自然唇色", "明快笑容"]],
  ["陈都灵", "清秀淡雅，有安静的书卷气", ["细致眉眼", "柔顺长发", "浅青色调"]]
];
const dimensions = ["对称","比例","骨相","肌肤","气质"];
function randomSource(seed){
  return function(){
    seed = (seed + 0x6D2B79F5) >>> 0;
    let x = Math.imul(seed ^ seed >>> 15, seed | 1);
    x ^= x + Math.imul(x ^ x >>> 7, x | 61);
    return ((x ^ x >>> 14) >>> 0) / 4294967296;
  };
}
function makeReport(seed,styleIndex){
  const rand=randomSource(seed);
  const bandRoll=randomSource(seed ^ 0x7be3014d)();
  let minTenths=800, maxTenths=899;
  if(bandRoll<0.25){
    minTenths=750; maxTenths=799;
  }else if(bandRoll>=0.65){
    minTenths=900; maxTenths=950;
  }
  const offsets=dimensions.map(()=>rand()-0.5);
  const total=(minTenths+Math.floor(rand()*(maxTenths-minTenths+1)))/10;
  // Center the radar on the chosen total while keeping every component in range.
  const mean=offsets.reduce((sum,value)=>sum+value,0)/offsets.length;
  const center=total/10;
  const spread=Math.min(1.6, center-6.5, 10-center);
  const scores=offsets.map(value=>Math.round((center+(value-mean)*spread)*10)/10);
  const rank=Math.max(50,Math.min(99,Math.round(total*.95+rand()*3)));
  const pool=[...femaleStars];
  const matches=[88,81,74].map(base=>({star:pool.splice(Math.floor(rand()*pool.length),1)[0],percent:base+Math.floor(rand()*5)}));
  const order=dimensions.map((name,i)=>({name,score:scores[i]})).sort((a,b)=>b.score-a.score);
  const sample=items=>items[Math.floor(rand()*items.length)];
  const face=Object.entries(features).map(([name,variants])=>[name,...sample(variants)]);
  const skin=sample(skinLooks), bone=sample(boneLooks);
  const regions=regionalLooks.map(([name,theme,tags,description])=>({
    name,theme,tags,description,score:70+Math.floor(rand()*26)
  }));
  return {scores,total,rank,matches,order,style:styles[styleIndex],face,skin,bone,regions};
}

// Each row describes a simulated look and a practical styling choice.
const features = {
  眼睛: [
    ["圆弧眼形","圆弧线条适合轻柔的眼妆，正面看更有亲近感。","把眼线收在眼尾以内，用浅棕色晕开边缘。"],
    ["细长眼形","横向线条适合做干净的眼尾延伸。","从外眼角平拉一小段眼线，眼头留白。"]
  ],
  鼻子: [
    ["柔和鼻尖","柔和过渡适合自然光下的近景。","在鼻梁中段点少量高光，鼻尖保留原本的光泽。"],
    ["清晰鼻梁","侧光容易勾出鼻梁的起伏。","向窗边转动一点，找到鼻侧阴影刚出现的角度。"]
  ],
  嘴唇: [
    ["唇峰清晰","唇峰适合用一抹亮色做妆面重点。","先沿唇峰轻描，再用指腹拍开两侧。"],
    ["柔软唇线","模糊的边缘适合柔雾唇妆。","将颜色集中在唇中央，向外轻轻抿匀。"]
  ],
  脸型: [
    ["柔和弧线","圆弧轮廓与轻盈的卷发很搭。","让脸侧第一道卷从颧骨下方开始。"],
    ["利落轮廓","干净的边线能撑起简洁的领口。","试一张露出一侧耳朵的半侧面照。"]
  ],
  眉毛: [
    ["舒展平眉","平缓眉线适合淡妆和日常近景。","眉头向上梳，眉尾顺着生长方向补几笔。"],
    ["轻挑眉峰","小幅眉峰能给表情增加起伏。","用眉粉轻扫眉峰下缘，保留眉头的毛流。"]
  ]
};
const skinLooks = [
  {traits:{肤质:"柔雾质感",肤色:"暖米色调",毛孔:"细腻观感",气色:"杏桃色调"},strength:"柔雾质感适合近景，暖调腮红容易与画面融合。",note:"粉底叠得太厚，近拍容易显出粉痕。",tip:"上妆前按日常习惯保湿，待吸收后薄涂底妆。"},
  {traits:{肤质:"自然光泽",肤色:"中性色调",毛孔:"自然纹理",气色:"清透色调"},strength:"保留局部光泽，侧光照片更有层次。",note:"拍照前看一眼鼻翼和额头的反光。",tip:"按日常习惯清洁保湿，上妆时只在需要的位置轻压散粉。"}
];
const boneLooks = [
  {traits:{骨相类型:"柔和型",颧骨:"弧线平缓",下颌线:"圆润过渡",额头:"平滑弧面"},strength:"柔和转折适合细腻的侧面光。",detail:"从太阳穴到下颌的线条连贯，适合留出侧脸轮廓。",tip:"把头发拨到一侧，借窗边柔光拍四分之三侧脸。"},
  {traits:{骨相类型:"立体型",颧骨:"转折清晰",下颌线:"线条利落",额头:"轮廓开阔"},strength:"轮廓转折能让简洁背景里的半身照更醒目。",detail:"颧骨和下颌形成两个视觉落点，斜侧光会强调层次。",tip:"使用浅色背景，转向光源，让下颌边缘保留一点阴影。"}
];
const regionalLooks = [
  ["中式审美","古典人像","舒展、柔和","素色衣领与柔光能留出干净的脸部轮廓。"],
  ["日韩审美","清透日常","轻盈、自然","浅色背景配细眉眼线，适合日常近景。"],
  ["欧美审美","时装肖像","立体、鲜明","侧面光与简洁色块容易凸显轮廓。"],
  ["东南亚审美","暖调街拍","浓郁、明快","暖色穿搭搭配绿植背景，画面更鲜活。"]
];
const styleExtras = {
  甜系少女:{compliments:["你长得好甜，让人第一眼就觉得亲切。", "你有一双会笑的眼睛，甜得让人心软。", "你甜得刚刚好，隔着屏幕都让人心动。"],examples:["赵露思","田曦薇"],strength:"腮红和唇色选相近的粉色，淡妆也能衬出好气色。",next:"上班时把蝴蝶结发夹换成细发圈，搭一件白衬衫。",makeup:["薄涂带自然光泽的底妆。","浅棕眉粉轻扫眉尾，睫毛向上夹翘。","蜜桃色由唇心向外晕开。","在苹果肌轻扫杏粉色。"],avoid:"大面积墨黑、深橄榄绿"},
  高冷御姐:{compliments:["你眉眼间那点清冷，特别好看。", "你漂亮得很有个性，让人一眼就记住你。", "你身上有种明艳又清冷的美，人群里一眼就会看见你。"],examples:["倪妮","迪丽热巴"],strength:"深色外套衬着红唇，第一眼就容易注意到眉眼和唇形。",next:"日常通勤可以把正红换成薄涂的豆沙红。",makeup:["底妆薄压成半哑光质感。","顺眉峰补出折线，眼尾微微延长。","选冷调浆果色轻描唇缘。","沿颧骨斜扫低饱和玫瑰色。"],avoid:"大面积荧光橙、糖果粉"},
  知性优雅:{compliments:["你安安静静的样子，格外耐看。", "你身上有种从容的美，让人看一眼，还想再看一眼。", "你美得很有韵味，连眼神里都透着优雅。"],examples:["刘诗诗","王楚然"],strength:"低发髻露出下颌和肩颈，配小耳钉也很醒目。",next:"约会时解开衬衫最上面一颗扣子，换一对细长耳坠。",makeup:["用薄底妆保留皮肤纹理。","灰棕色顺着眉形补空，眼尾贴根描细线。","选柔和玫瑰豆沙色。","轻扫裸杏色，从面中向外晕开。"],avoid:"大面积荧光黄、高饱和亮紫"},
  清新自然:{compliments:["你长得清清爽爽，看着特别舒服。", "你自自在在的样子就很漂亮，有种很亲切的美。", "你的美像雨后放晴，让人一眼就觉得世界都亮了。"],examples:["张子枫","白鹿"],strength:"淡妆能保留眉毛的纹理和嘴唇本来的颜色。",next:"出游时把头发半扎起来，配白色帆布鞋和浅蓝牛仔裤。",makeup:["在有需要的位置局部遮瑕。","梳开眉毛，用棕色轻描睫毛根部。","薄涂接近原唇色的润色唇膏。","用指腹把淡珊瑚色轻拍在面颊。"],avoid:"大面积金属银、荧光绿"}
};
const dimensionNotes = {
  对称:["正面构图容易呈现平衡感。","镜头对齐双眼中点，稍微调整肩膀高度。"],
  比例:["面部留白协调，适合干净的正面构图。","手机与眼睛同高，稍稍站远再取景。"],
  骨相:["侧光能强调轮廓线条。","尝试四分之三侧脸，用柔光强调轮廓转折。"],
  肌肤:["通透的画面适合淡妆近景。","试试窗边散射光，减少顶灯的硬阴影。"],
  气质:["鲜明的穿搭主题容易形成记忆点。","先定一个主色，让衣服、妆容和背景彼此呼应。"]
};

function scoreCompliment(styleName,total){
  const comments=styleExtras[styleName].compliments;
  if(total<80)return comments[0];
  if(total<90)return comments[1];
  return comments[2];
}
