"use strict";
const $=id=>document.getElementById(id);
const sections=["home","scan","result","export"];
let current=null, revision=0, worker=null, detectionTimer=0, report=null;
const $home=$("home");
function show(id){
  for(const name of sections) $(name).hidden=name!==id;
  window.scrollTo(0,0);
  const heading=$(id).querySelector("h1,h2");
  heading.tabIndex=-1;
  heading.focus({preventScroll:true});
}
function options(id,items){
  $(id).innerHTML=items.map(([value,label,color],i)=>`<label><input type="radio" name="${id}" value="${value}" ${i===0?"checked":""}>${color?`<i class="dot" style="background:${color}"></i>`:""}${label}</label>`).join("");
}
options("gender",[["female","女生"],["male","男生"]]);
options("style",styles.map((s,i)=>[i,s.name,s.color]));
const choice=id=>$home.querySelector('input[name="'+id+'"]:checked').value;
function clearPoster(){
  $("poster").removeAttribute("src"); $("download").removeAttribute("href");
}
function stopDetection(){clearTimeout(detectionTimer);worker?.terminate();worker=null;}
function loadImage(src){
  return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
}
function loadScript(src){
  return new Promise((resolve,reject)=>{const el=document.createElement("script");el.onload=resolve;el.onerror=reject;el.src=src;document.head.append(el);});
}
let localDetector;
async function detect(photo,version){
  const scale=Math.min(1,560/Math.max(photo.width,photo.height));
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.round(photo.width*scale));canvas.height=Math.max(1,Math.round(photo.height*scale));
  const done=()=>{
    if(version!==revision)return;
    stopDetection();
  };
  try{
    const ctx=canvas.getContext("2d");ctx.drawImage(photo,0,0,canvas.width,canvas.height);
    const rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    if(location.protocol==="file:"){
      localDetector??=Promise.all(["vendor/pico.js","vendor/facefinder.js","detect.js"].map(loadScript)).catch(error=>{localDetector=null;throw error});
      await localDetector;
      if(version===revision)faceCount(rgba,canvas.width,canvas.height);
    }else{
      worker=new Worker("detect.js");
      worker.onmessage=done;worker.onerror=done;
      detectionTimer=setTimeout(done,12000);
      worker.postMessage({rgba,width:canvas.width,height:canvas.height},[rgba.buffer]);
    }
  }catch{done()}
}
async function acceptFile(file){
  if(!file)return;
  const version=++revision;
  stopDetection();clearPoster();report=null;
  if(current)URL.revokeObjectURL(current.url);
  current=null;$("start").disabled=true;$("preview").hidden=true;$("preview").removeAttribute("src");
  document.querySelector(".empty").hidden=false;$("pickText").textContent="点击上传照片";
  $("feedback").hidden=false;
  $("feedback").textContent="正在读取图片…";
  const url=URL.createObjectURL(file);
  try{
    const [img,buffer]=await Promise.all([loadImage(url),file.arrayBuffer()]);
    if(version!==revision){URL.revokeObjectURL(url);return}
    let seed=2166136261;
    for(const byte of new Uint8Array(buffer))seed=Math.imul(seed^byte,16777619);
    current={img,url,seed};$("preview").src=url;$("preview").hidden=false;document.querySelector(".empty").hidden=true;
    $("pickText").textContent="更换照片";$("feedback").textContent="";$("feedback").hidden=true;$("start").disabled=false;
    void detect(img,version);
  }catch{
    URL.revokeObjectURL(url);
    if(version===revision)$("feedback").textContent="这张图片无法读取，请重新选择 JPG、PNG 或 WebP 图片。";
  }
}
$("file").onchange=e=>{acceptFile(e.target.files[0]);e.target.value=""};
for(const name of ["dragover","dragleave","drop"])$("drop").addEventListener(name,e=>{
  e.preventDefault();$("drop").classList.toggle("over",name==="dragover");
  if(name==="drop")acceptFile(e.dataTransfer.files[0]);
});
function radar(scores){
  const cx=160, cy=143, radius=84;
  function vertex(i, distance){
    const angle=i*2*Math.PI/dimensions.length-Math.PI/2;
    return [cx+distance*Math.cos(angle),cy+distance*Math.sin(angle)];
  }
  const points=dimensions.map((_,i)=>vertex(i,radius*scores[i]/10));
  const grid=[10,8,6,4,2].map(value=>{
    const ring=dimensions.map((_,i)=>vertex(i,radius*value/10).join(",")).join(" ");
    return `<polygon points="${ring}" fill="hsl(284 45% ${95+value/4}%)" stroke="#d9cbdf" stroke-width=".8"/>`;
  }).join("");
  const axes=dimensions.map((_,i)=>{
    const [x,y]=vertex(i,radius);
    return `<path d="M${cx} ${cy}L${x} ${y}" stroke="#c7b7ce" stroke-dasharray="2 4"/>`;
  }).join("");
  const dots=points.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="5" fill="white" stroke="#985782" stroke-width="2"/>`).join("");
  const labels=dimensions.map((name,i)=>{
    const [x,y]=vertex(i,119);
    return `<text x="${x}" y="${y-4}" class="axis-name">${name}</text><text x="${x}" y="${y+17}" class="axis-value">${scores[i].toFixed(1)}</text>`;
  }).join("");
  return `<svg viewBox="0 0 320 271" class="radar" role="img" aria-label="五维模拟评分，满分十分。${dimensions.map((name,i)=>name+scores[i]).join("，")}">
    <defs><linearGradient id="radar-fill" x2="1" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="#ec92aa" stop-opacity=".76"/><stop offset=".55" stop-color="#cc92cb" stop-opacity=".56"/><stop offset="1" stop-color="#977dd0" stop-opacity=".66"/></linearGradient></defs>
    ${grid}${axes}<g class="radar-shape"><polygon points="${points.map(p=>p.join(",")).join(" ")}" fill="url(#radar-fill)" stroke="#a56093" stroke-width="2.2" stroke-linejoin="round"/>${dots}</g>${labels}</svg>`;
}
const tags=items=>items.map(x=>`<span class="tag">${x}</span>`).join("");
function renderReport(){
  const {total,rank,style:s,scores,order,matches,face,skin,bone,regions}=report;
  const extra=styleExtras[s.name];
  const line=(label,text)=>`<p><b>${label}</b>　${text}</p>`;
  const panel=(title,body,note="")=>`<section class="panel"><h2>${title}${note?` <small>${note}</small>`:""}</h2>${body}</section>`;
  const traits=look=>`<dl class="traits">${Object.entries(look.traits).map(([key,value])=>`<div><dt>${key}</dt><dd>${value}</dd></div>`).join("")}</dl>`;
  const ranked=(items,noteIndex)=>items.map(({name,score})=>line(name+" · "+score.toFixed(1)+" 分",dimensionNotes[name][noteIndex])).join("");
  const low=order.slice(-2).reverse();
  const hairNotes=low.map(({name})=>({比例:"试试侧分刘海，比较两侧不同的面部留白。",骨相:"在头顶和耳侧留出蓬松感，让发型呼应轮廓。"}[name])).filter(Boolean);
  $("report").innerHTML=[
    `<div class="scorecard"><span class="score-label">颜值分数</span><strong>${total.toFixed(1)}</strong><p class="compliment">${scoreCompliment(s.name,total)}</p><p class="rank">超越 ${rank}% 同龄人</p></div>`,
    panel("颜值风格定位",`<div class="style-profile" style="--style-color:${s.color}"><div class="style-name">${s.name}</div><h3>${s.alias}</h3>${tags(s.tags)}<p>${s.line}</p></div>`+
      line("适合场景",s.scene)+line("明星风格参考",extra.examples.join("、"))+line("风格优势",extra.strength)+line("发展方向",extra.next)),
    panel("五维颜值图",`<figure class="radar-sheet">${radar(scores)}<figcaption>每项满分 10 分</figcaption></figure><div class="radar-summary"><span>本次突出维度</span><strong>${order.slice(0,2).map(item=>item.name+" "+item.score.toFixed(1)).join("　·　")}</strong></div>`,"模拟评分"),
    panel("五官详细分析",face.map(([name,tag,strength,tip])=>
      `<div class="starrow"><h3>${name}　<span class="tag">${tag}</span></h3>${line("优势",strength)}${line("变化建议",tip)}</div>`).join(""),"模拟特征"),
    panel("皮肤分析",traits(skin)+line("皮肤优势",skin.strength)+line("注意事项",skin.note)+line("护肤建议",skin.tip),"模拟特征"),
    panel("骨相分析",traits(bone)+line("骨相优势",bone.strength)+line("轮廓特征",bone.detail)+line("优化建议",bone.tip),"模拟特征"),
    panel("明星相似度匹配",`<div class="match-list">${matches.map(({star,percent})=>{
      const [name,description,features]=star;
      return `<article class="match-card">
        <span class="match-icon" aria-hidden="true">✧</span>
        <div class="match-body"><div class="match-heading"><h3>${name}</h3><span>相似度 <b>${percent}%</b></span></div>
        <p>${description}</p><div class="match-caption">匹配特征</div><div class="match-tags">${tags(features)}</div></div>
      </article>`;
    }).join("")}</div>`,"娱乐匹配"),
    panel("国际化审美标准对比",regions.map(r=>`<div class="starrow"><b class="percent">${r.score} / 100</b><h3>${r.name}</h3><div class="region-meter" aria-hidden="true"><i style="width:${r.score}%"></i></div>${tags([r.theme,...r.tags.split("、")])}<p>${r.description}</p></div>`).join(""),"风格模拟"),
    panel("颜值加分项 TOP 2",ranked(order.slice(0,2),0)),
    panel("细微短板与提升指南",ranked(low,1)),
    panel("上镜与变美建议",`<ol>${s.tips.map(t=>`<li>${t}</li>`).join("")}</ol>`+line("穿搭",s.outfit)),
    panel("化妆建议",["底妆","眉眼","唇妆","腮红"].map((key,i)=>line(key,extra.makeup[i])).join("")),
    panel("发型建议",`<p>${[s.hair,...hairNotes].join("")}</p>`),
    panel("色彩搭配建议",line("适合的颜色",s.palette)+line("本风格少用的颜色",extra.avoid))
  ].join("");
}
$("start").onclick=async()=>{
  if(!current||$home.hidden)return;
  report=makeReport(current.seed,Number(choice("style")));
  $("scanPhoto").src=current.url;
  const stages=[
    [0,"正在读取照片尺寸 · "+current.img.naturalWidth+" × "+current.img.naturalHeight],
    [18,"正在生成五维娱乐评分"],
    [49,"正在匹配"+report.style.name+"风格"],
    [69,"正在整理明星相似度"],
    [88,"正在排版测评报告"]
  ];
  const progress=$("scanProgress"), percent=$("scanPercent"), phase=$("phase");
  const sweepMs=5300, completionHoldMs=200;
  show("scan");
  const started=performance.now();
  await new Promise(resolve=>{
    let stage=-1;
    function update(){
      const elapsed=performance.now()-started;
      const t=Math.min(1,elapsed/sweepMs);
      const value=100*t*t*(3-2*t);
      progress.value=value;
      percent.textContent=Math.floor(value)+"%";
      while(stage+1<stages.length && value>=stages[stage+1][0]){
        phase.textContent=stages[++stage][1];
      }
      if(elapsed>=sweepMs+completionHoldMs)resolve();
      else requestAnimationFrame(update);
    }
    update();
  });
  renderReport();show("result");
};
$("retry").onclick=()=>{clearPoster();show("home")};
$("back").onclick=()=>show("result");
function makePoster(){
  const c=document.createElement("canvas");c.width=1080;c.height=1440;
  const ctx=c.getContext("2d"),s=report.style;
  const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
  const write=(str,x,y,size,color="#32244a",family="sans-serif")=>{
    ctx.fillStyle=color;ctx.font=size+"px "+family;ctx.fillText(str,x,y);
  };
  rect(0,0,1080,1440,"#f8f4fa");write("LumiGirl颜值测评",66,95,54);
  rect(64,136,952,690,"#e7dced");const img=current.img;
  const scale=Math.min(952/img.width,690/img.height);
  const w=img.width*scale,h=img.height*scale;
  ctx.drawImage(img,64+(952-w)/2,136+(690-h)/2,w,h);
  write("颜值娱乐分",65,908,34);write(report.total.toFixed(1),60,1048,150,"#674298","Georgia");
  write(s.alias,498,970,68);write(s.tags.join(" · "),500,1035,32);
  write("模拟排名 · 超越 "+report.rank+"% 同龄人",65,1140,43);
  const match=report.matches[0];
  write("明星相似度 · "+match.star[0]+" "+match.percent+"%",65,1227,43);
  rect(65,1290,950,2,"#d8cfe1");write(s.name+"  /  娱乐匹配",65,1350,32);
  write($("report-note").textContent,65,1402,25,"#685e73");
  return c;
}
$("save").onclick=()=>{
  try{
    if(!$("poster").hasAttribute("src")){
      // A data URL also supports long-press saving in mobile webviews.
      const src=makePoster().toDataURL("image/png");
      $("poster").src=src;$("download").href=src;
    }
    show("export");
  }catch{alert("海报生成失败，请重新选择一张可在本机读取的图片。")}
};
