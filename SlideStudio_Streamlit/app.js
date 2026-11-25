'use strict';
const $ = id => document.getElementById(id);
const W = 13.333333, H = 7.5;
const layouts = ['standard','cover','columns','imageRight','imageLeft','center'];
const styles = ['modern','minimal','academic','creative','professional'];
const deckTypes = ['general','clase','informe','proyecto','ventas','capacitacion'];
const defaults = {font:'Arial',titleSize:36,subSize:20,bodySize:20,bg:'#f7f5f1',titleColor:'#18243c',textColor:'#344158',accent:'#6657d9',style:'modern',defaultLayout:'standard'};
let project = {
  version:1,
  topic:'Mi presentación',
  brief:'',
  deckType:'general',
  instantMode:true,
  theme:{...defaults},
  slides:[{title:'Mi presentación',subtitle:'Subtítulo de la presentación',body:'Escribe aquí el contenido de tu presentación.',body2:'',layout:'cover',image:''}],
  reference:'',
  palette:[],
  analysis:''
};
let selected = 0, presentIndex = 0, autoTimer = null;

const current = () => project.slides[selected];
const msg = t => { $('notice').textContent = t; };
const clamp = (n,min,max) => Math.min(max, Math.max(min,n));
const rgb = h => h.slice(1).match(/../g).map(v => parseInt(v,16));
const toHex = a => '#' + a.map(v => Math.round(clamp(v,0,255)).toString(16).padStart(2,'0')).join('');
const blend = (a,b,k) => toHex(rgb(a).map((v,i) => v*(1-k) + rgb(b)[i]*k));
const lum = h => rgb(h).map(v => { v/=255; return v<=.04045 ? v/12.92 : ((v+.055)/1.055)**2.4; }).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
const contrast = (a,b) => (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
const titleCase = s => String(s||'').replace(/\s+/g,' ').trim().replace(/(^|[\s(\-])([a-záéíóúñ])/gi,(m,p1,p2)=>p1+p2.toUpperCase());
const clean = s => String(s||'').trim();
const slug = () => (project.topic || 'presentacion').trim().replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').slice(0,90) || 'presentacion';

function geometry(s,t,index){
  const a=[];
  const rect=(x,y,w,h,fill)=>a.push({kind:'rect',x,y,w,h,fill});
  const circle=(x,y,w,h,fill)=>a.push({kind:'ellipse',x,y,w,h,fill});
  const text=(value,x,y,w,h,size,color,bold=false,align='left')=>{ if(value) a.push({kind:'text',value,x,y,w,h,size,color,bold,align}); };
  const img=(x,y,w,h)=>{
    if(s.image) a.push({kind:'image',x,y,w,h,data:s.image});
    else {
      rect(x,y,w,h,blend(t.bg,t.accent,.12));
      text('Añade una imagen',x+.15,y+h/2-.2,w-.3,.5,14,t.textColor,false,'center');
    }
  };
  const accent=t.accent, bg=t.bg, cover=s.layout==='cover'||s.layout==='center';
  if(t.style==='modern'){rect(0,0,.17,H,accent);rect(.65,.45,.75,.09,accent);rect(W-1.12,H-.38,.52,.07,accent);}
  if(t.style==='minimal')rect(.75,H-.48,W-1.5,.035,accent);
  if(t.style==='academic'){rect(0,0,W,.14,accent);if(!cover)rect(.75,2.35,W-1.5,.025,blend(bg,accent,.55));rect(.75,H-.45,W-1.5,.025,accent);}
  if(t.style==='professional'){rect(0,0,W,.22,accent);rect(0,H-.25,W,.25,accent);rect(.75,.53,.9,.08,accent);}
  if(t.style==='creative'){circle(W-1.65,-.56,2.1,2.1,blend(bg,accent,.22));circle(-.48,H-1.2,1.75,1.75,blend(bg,accent,.28));rect(.75,.48,1.15,.12,accent);}
  if(cover){
    let align=s.layout==='center'?'center':'left';
    text(s.title,.86,1.52,W-1.72,1.65,t.titleSize,t.titleColor,true,align);
    rect(s.layout==='center'?W/2-.5:.86,3.2,1,.09,accent);
    text(s.subtitle,.86,3.45,W-1.72,.9,t.subSize,t.textColor,false,align);
    text(s.body,.86,4.38,W-1.72,1.95,t.bodySize,t.textColor,false,align);
  } else {
    text(s.title,.75,.72,W-1.5,1.05,t.titleSize,t.titleColor,true);
    text(s.subtitle,.75,1.77,W-1.5,.57,t.subSize,t.textColor);
    let top=2.48,bh=4.35;
    if(s.layout==='columns'){
      rect(.75,top,5.65,bh,blend(bg,accent,.075));rect(6.72,top,5.86,bh,blend(bg,accent,.075));
      rect(.75,top,.07,bh,accent);rect(6.72,top,.07,bh,accent);
      text(s.body,1.02,top+.22,5.15,bh-.44,t.bodySize,t.textColor);
      text(s.body2,6.99,top+.22,5.35,bh-.44,t.bodySize,t.textColor);
    } else if(s.layout==='imageRight') {
      text(s.body,.75,top,6,bh,t.bodySize,t.textColor); img(7.05,top,5.53,bh);
    } else if(s.layout==='imageLeft') {
      img(.75,top,5.53,bh); text(s.body,6.64,top,5.94,bh,t.bodySize,t.textColor);
    } else {
      text(s.body,.75,top,W-1.5,bh,t.bodySize,t.textColor);
    }
  }
  text(String(index+1).padStart(2,'0'),W-1.02,H-.47,.32,.3,10,t.textColor,false,'right');
  return a;
}

function renderSlide(el,s,i){
  el.replaceChildren();
  const t=project.theme;
  el.style.background=t.bg;
  for(const v of geometry(s,t,i)){
    const d=document.createElement('div');
    d.className='slide-element '+v.kind;
    Object.assign(d.style,{left:v.x/W*100+'%',top:v.y/H*100+'%',width:v.w/W*100+'%',height:v.h/H*100+'%'});
    if(v.kind==='text'){
      d.textContent=v.value;
      Object.assign(d.style,{fontFamily:`${t.font}, Arial, sans-serif`,fontSize:`${v.size/72/W*100}cqw`,fontWeight:v.bold?'700':'400',color:v.color,textAlign:v.align,display:'block'});
    } else if(v.kind==='image') {
      const im=document.createElement('img'); im.src=v.data; im.alt='Imagen de diapositiva'; d.append(im);
    } else {
      d.style.background=v.fill;
      if(v.kind==='ellipse') d.style.borderRadius='50%';
    }
    el.append(d);
  }
}

function syncSettings(){
  for(const k of Object.keys(defaults)) $(k).value = project.theme[k];
  $('topic').value = project.topic;
  $('brief').value = project.brief || '';
  $('count').value = project.slides.length;
  $('deckType').value = project.deckType || 'general';
  $('instantMode').checked = project.instantMode !== false;
  showReference();
}
function syncEditor(){
  const s=current();
  for(const [id,key] of Object.entries({slideTitle:'title',subtitle:'subtitle',body:'body',body2:'body2',layout:'layout'})) $(id).value=s[key]||'';
  $('slideImage').value='';
  $('removeImage').disabled=!s.image;
}
function render(){
  const n=project.slides.length;
  $('deckName').textContent = project.topic || 'Sin título';
  $('position').textContent = `${selected+1} / ${n}`;
  renderSlide($('canvas'), current(), selected);
  const film=$('film'), scroll=film.scrollLeft;
  film.replaceChildren();
  project.slides.forEach((s,i)=>{
    const b=document.createElement('button'); b.className='thumb'+(i===selected?' active':'');
    b.setAttribute('aria-label',`Diapositiva ${i+1}: ${s.title}`);
    const d=document.createElement('div'); d.className='slide'; renderSlide(d,s,i);
    const label=document.createElement('span'); label.textContent=`${i+1}. ${s.title||'Sin título'}`;
    b.append(d,label); b.onclick=()=>choose(i); film.append(b);
  });
  film.scrollLeft=scroll;
  $('prev').disabled=$('moveLeft').disabled=selected===0;
  $('next').disabled=$('moveRight').disabled=selected===n-1;
  $('remove').disabled=n===1;
  $('add').disabled=$('duplicate').disabled=n>=100;
}
function choose(i){ selected=clamp(i,0,project.slides.length-1); syncEditor(); render(); $('film').children[selected]?.scrollIntoView({block:'nearest',inline:'nearest'}); }

function showReference(){
  const im=$('referencePreview');
  im.hidden=!project.reference;
  $('referencePlaceholder').hidden=!!project.reference;
  if(project.reference) im.src=project.reference; else im.removeAttribute('src');
  $('analysis').textContent=project.analysis||'Extrae colores y propone una composición a partir de tu imagen.';
  const p=$('palette'); p.replaceChildren();
  project.palette.forEach(c=>{
    const b=document.createElement('button');
    b.style.background=c; b.title=`${c}: usar como acento`; b.setAttribute('aria-label',b.title);
    b.onclick=()=>{ project.theme.accent=c; $('accent').value=c; render(); scheduleGenerate(); };
    p.append(b);
  });
}

async function readImage(file){
  if(!file || !['image/png','image/jpeg','image/webp'].includes(file.type)) throw Error('Selecciona una imagen PNG, JPG o WebP.');
  if(file.size>25*1024*1024) throw Error('La imagen supera 25 MB.');
  const url=URL.createObjectURL(file);
  try{
    const im=new Image(); im.src=url; await im.decode();
    const scale=Math.min(1,1600/Math.max(im.width,im.height));
    const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(im.width*scale)); c.height=Math.max(1,Math.round(im.height*scale));
    const cx=c.getContext('2d'); cx.fillStyle='#ffffff'; cx.fillRect(0,0,c.width,c.height); cx.drawImage(im,0,0,c.width,c.height);
    return {data:c.toDataURL('image/jpeg',.92), im:c};
  } finally { URL.revokeObjectURL(url); }
}
function analyzeImage(im){
  const c=document.createElement('canvas'); c.width=120; c.height=80;
  const ctx=c.getContext('2d'); ctx.drawImage(im,0,0,120,80);
  const data=ctx.getImageData(0,0,120,80).data, bins=new Map(), edges=new Map();
  const px=(x,y)=>{ const i=(y*120+x)*4; return [data[i],data[i+1],data[i+2]]; };
  const add=(m,a)=>{ const k=a.map(v=>Math.floor(v/32)).join(','); const b=m.get(k)||{n:0,s:[0,0,0]}; b.n++; a.forEach((v,i)=>b.s[i]+=v); m.set(k,b); };
  for(let y=0;y<80;y++) for(let x=0;x<120;x++){ const a=px(x,y); add(bins,a); if(x<5||x>=115||y<5||y>=75) add(edges,a); }
  const ranked=m=>[...m.values()].sort((a,b)=>b.n-a.n).map(b=>({n:b.n,c:toHex(b.s.map(v=>v/b.n))}));
  const all=ranked(bins), bg=ranked(edges)[0].c, dist=(a,b)=>Math.hypot(...rgb(a).map((v,i)=>v-rgb(b)[i]));
  const colors=[]; for(const {c} of [{c:bg},...all]) if(colors.every(v=>dist(v,c)>48)&&colors.length<7) colors.push(c);
  const sat=h=>Math.max(...rgb(h))-Math.min(...rgb(h));
  const text=all.filter(v=>contrast(v.c,bg)>=5&&sat(v.c)<45).sort((a,b)=>contrast(b.c,bg)-contrast(a.c,bg))[0]?.c || (contrast('#152033',bg)>contrast('#ffffff',bg)?'#152033':'#ffffff');
  const accent=all.filter(v=>dist(v.c,bg)>55&&contrast(v.c,bg)>1.5&&sat(v.c)>40).sort((a,b)=>b.n*Math.sqrt(sat(b.c))-a.n*Math.sqrt(sat(a.c)))[0]?.c || (lum(bg)>.35?'#475569':'#b8c8e5');
  let left=0,right=0,middle=0,active=0;
  for(let y=12;y<68;y++) for(let x=8;x<112;x++){
    if(dist(toHex(px(x,y)),bg)>78){ active++; if(x<47)left++; else if(x>73)right++; else middle++; }
  }
  const density=active/(56*104);
  let layout='standard';
  if(left>right*1.65&&left>250) layout='imageLeft';
  else if(right>left*1.65&&right>250) layout='imageRight';
  else if(middle>left+right&&middle>200) layout='center';
  else if(left>450&&right>450&&middle<Math.min(left,right)*.8) layout='columns';
  const style=density<.13?'minimal':sat(accent)>105&&density>.32?'creative':lum(bg)<.15?'professional':'modern';
  return {palette:colors,theme:{bg,titleColor:contrast(accent,bg)>=4.5?accent:text,textColor:text,accent,defaultLayout:layout,style},description:`Paleta detectada · estilo ${({minimal:'minimalista',creative:'creativo',professional:'profesional',modern:'moderno'})[style]} · composición estimada: ${$('defaultLayout').querySelector(`option[value=${layout}]`).textContent}. Puedes ajustarla libremente.`};
}

function parseKeywords(){
  const raw=clean(project.brief);
  if(!raw) return [];
  const list = raw.split(/[\n,;•\-]+/).map(v=>clean(v)).filter(v=>v.length>1);
  const unique=[];
  for(const item of list) if(!unique.some(v=>v.toLowerCase()===item.toLowerCase())) unique.push(item);
  return unique.slice(0,12);
}

function firstWords(topic, max=3){
  return clean(topic).split(/\s+/).slice(0,max).join(' ');
}

function sectionCopy(title, topic, deckType, keyword, index){
  const base = keyword || topic;
  const packs = {
    general:[
      [`Explica de forma breve qué es ${base}.`,`Señala los elementos más importantes.`,`Relaciona la idea con el objetivo de la presentación.`],
      [`Resume los puntos centrales de ${base}.`,`Incluye un dato, ejemplo o evidencia clara.`,`Destaca qué debe recordar la audiencia.`],
      [`Describe cómo se aplica ${base}.`,`Menciona ventajas, límites o condiciones.`,`Cierra con una idea práctica.`]
    ],
    clase:[
      [`Define ${base} con palabras sencillas.`,`Explica sus características principales.`,`Indica por qué es importante en clase.`],
      [`Describe el procedimiento o desarrollo de ${base}.`,`Usa un ejemplo guiado o caso simple.`,`Señala el error más común y cómo evitarlo.`],
      [`Propón una aplicación de ${base}.`,`Relaciona la teoría con la práctica.`,`Incluye una idea para repasar o evaluar.`]
    ],
    informe:[
      [`Presenta el contexto de ${base}.`,`Señala el criterio de análisis empleado.`,`Resume el hallazgo o situación observada.`],
      [`Describe la información clave de ${base}.`,`Incluye resultados, evidencias o indicadores.`,`Explica su implicancia principal.`],
      [`Interpreta el comportamiento de ${base}.`,`Menciona riesgos, oportunidades o brechas.`,`Conecta el análisis con una recomendación.`]
    ],
    proyecto:[
      [`Explica el propósito de ${base}.`,`Describe el problema o necesidad que atiende.`,`Resume el alcance del proyecto.`],
      [`Detalla las acciones clave de ${base}.`,`Menciona recursos o etapas principales.`,`Indica el resultado esperado.`],
      [`Señala beneficios de ${base}.`,`Resume tiempos, impacto o entregables.`,`Propón el siguiente paso.`]
    ],
    ventas:[
      [`Presenta el valor principal de ${base}.`,`Explica el problema que resuelve.`,`Destaca el beneficio para el cliente.`],
      [`Describe las características más fuertes de ${base}.`,`Incluye una ventaja competitiva.`,`Refuerza por qué es una buena opción.`],
      [`Muestra el impacto esperado de ${base}.`,`Señala resultados o promesas realistas.`,`Termina con una invitación a la acción.`]
    ],
    capacitacion:[
      [`Introduce ${base} y su utilidad práctica.`,`Explica el objetivo del aprendizaje.`,`Aclara cuándo se aplica.`],
      [`Detalla los pasos o buenas prácticas de ${base}.`,`Incluye un ejemplo operativo.`,`Destaca recomendaciones para ejecutarlo bien.`],
      [`Resume lo aprendido sobre ${base}.`,`Refuerza los puntos críticos.`,`Sugiere una acción o práctica final.`]
    ]
  };
  const group = packs[deckType] || packs.general;
  const set = group[index % group.length];
  return set.map(v=>'• '+titleCase(v)).join('\n');
}

function agendaLines(items){ return items.map(v=>'• '+v).join('\n'); }

function chooseLayout(i,n,base){
  if(i===0) return 'cover';
  if(i===1) return 'columns';
  if(i===n-1) return base === 'cover' ? 'standard' : base;
  const cycle = [base,'standard','imageRight','imageLeft','columns','center'].filter((v,idx,arr)=>arr.indexOf(v)===idx && layouts.includes(v) && v!=='cover');
  return cycle[(i-2) % cycle.length] || 'standard';
}

function buildSlides(){
  const topic = clean(project.topic);
  if(!topic) throw Error('Escribe un tema para comenzar.');
  const n = clamp(Math.round(Number($('count').value)||1),1,30);
  const deckType = $('deckType').value;
  const keywords = parseKeywords();
  const typeLabels = {
    general:'Presentación general', clase:'Clase', informe:'Informe', proyecto:'Proyecto', ventas:'Propuesta', capacitacion:'Capacitación'
  };
  const genericSections = {
    general:['Panorama general','Conceptos principales','Desarrollo del tema','Aplicación o ejemplo','Resultados o hallazgos'],
    clase:['Objetivos de aprendizaje','Conceptos clave','Procedimiento o desarrollo','Ejemplo aplicado','Actividad o repaso'],
    informe:['Contexto y propósito','Datos relevantes','Análisis principal','Interpretación','Recomendaciones'],
    proyecto:['Problema u oportunidad','Objetivos','Plan de trabajo','Recursos y alcance','Impacto esperado'],
    ventas:['Problema del cliente','Propuesta de valor','Beneficios','Diferenciadores','Cierre comercial'],
    capacitacion:['Propósito de la sesión','Contenidos clave','Paso a paso','Buenas prácticas','Cierre y evaluación']
  };
  const sections = keywords.length ? keywords.map(titleCase) : genericSections[deckType] || genericSections.general;
  const agenda = sections.slice(0, Math.max(2, Math.min(sections.length, n-2)));
  const slides = [];
  slides.push({
    title:titleCase(topic),
    subtitle:`${typeLabels[deckType]} · Diseño ${$('style').selectedOptions[0].textContent}`,
    body:clean(project.brief) ? 'Enfoque: ' + clean(project.brief) : 'Generado automáticamente. Puedes editar cualquier texto antes de exportar.',
    body2:'', layout:'cover', image:''
  });
  if(n===1) return slides;
  slides.push({
    title:'Agenda', subtitle:firstWords(topic,4), body:agendaLines(agenda), body2:keywords.length ? agendaLines(keywords.slice(Math.max(0, agenda.length), Math.min(keywords.length, agenda.length+4))) : '• Introducción\n• Desarrollo\n• Cierre', layout:'columns', image:''
  });
  const remaining = n - slides.length - 1;
  const bodyTitles = [];
  for(let i=0;i<remaining;i++) bodyTitles.push(titleCase(sections[i % sections.length]));
  bodyTitles.forEach((title, idx)=>{
    const pos = slides.length;
    const body = sectionCopy(title, topic, deckType, keywords[idx], idx);
    const secondary = deckType==='ventas'
      ? '• Valor diferencial\n• Beneficio para el usuario\n• Evidencia o prueba\n• Próximo paso'
      : deckType==='informe'
      ? '• Dato relevante\n• Hallazgo observado\n• Interpretación\n• Acción sugerida'
      : '• Idea complementaria\n• Ejemplo\n• Aplicación\n• Mensaje clave';
    slides.push({
      title,
      subtitle:titleCase(topic),
      body,
      body2:secondary,
      layout:chooseLayout(pos,n,project.theme.defaultLayout),
      image:''
    });
  });
  slides.push({
    title: deckType==='ventas' ? 'Cierre y llamada a la acción' : deckType==='clase' ? 'Conclusiones y repaso' : 'Conclusiones',
    subtitle:titleCase(topic),
    body: deckType==='ventas'
      ? '• Resume el valor de la propuesta.\n• Reafirma por qué conviene elegirla.\n• Define el siguiente paso comercial.'
      : '• Resume las ideas más importantes.\n• Destaca el aprendizaje o hallazgo principal.\n• Añade recomendaciones o próximos pasos.',
    body2:'', layout:chooseLayout(n-1,n,project.theme.defaultLayout), image:''
  });
  return slides.slice(0,n);
}

function generateDeck(fromAuto=false){
  project.topic = clean($('topic').value);
  project.brief = $('brief').value;
  project.deckType = $('deckType').value;
  project.instantMode = $('instantMode').checked;
  project.theme.style = $('style').value;
  if(!project.topic){ if(!fromAuto) { msg('Escribe un tema para comenzar.'); $('topic').focus(); } return; }
  project.slides = buildSlides();
  selected = 0;
  syncSettings(); syncEditor(); render();
  msg(fromAuto ? 'Presentación actualizada automáticamente.' : 'Presentación generada automáticamente. Ya puedes revisar, editar y exportar.');
}

function scheduleGenerate(){
  project.instantMode = $('instantMode').checked;
  if(!project.instantMode) return;
  clearTimeout(autoTimer);
  autoTimer = setTimeout(()=>{ try{ generateDeck(true); }catch(err){ msg(err.message); } }, 450);
}

$('reference').onchange = async e => {
  try{
    const r=await readImage(e.target.files[0]);
    const a=analyzeImage(r.im);
    project.reference=r.data; project.palette=a.palette; project.analysis=a.description;
    Object.assign(project.theme,a.theme);
    project.slides.forEach((s,i)=>{ if(s.layout!=='cover') s.layout = i===0 ? 'cover' : a.theme.defaultLayout; });
    syncSettings(); syncEditor(); render();
    msg('Diseño aproximado aplicado.');
    scheduleGenerate();
  } catch(err){ msg(err.message); }
  finally{ e.target.value=''; }
};

$('create').onclick = ()=>{ try{ generateDeck(false); } catch(err){ msg(err.message); } };
$('topic').addEventListener('input', ()=>{ project.topic=$('topic').value; render(); scheduleGenerate(); });
$('brief').addEventListener('input', ()=>{ project.brief=$('brief').value; scheduleGenerate(); });
$('count').addEventListener('input', scheduleGenerate);
$('deckType').addEventListener('change', scheduleGenerate);
$('instantMode').addEventListener('change', ()=>{ project.instantMode=$('instantMode').checked; if(project.instantMode) scheduleGenerate(); });

for(const k of Object.keys(defaults)){
  const el=$(k), isSize=k.endsWith('Size');
  el.addEventListener(isSize?'change':'input', ()=>{
    project.theme[k] = isSize ? clamp(Number(el.value)||defaults[k], Number(el.min), Number(el.max)) : el.value;
    if(isSize) el.value = project.theme[k];
    render();
    if(k==='style' || k==='defaultLayout') scheduleGenerate();
  });
}

$('applyAll').onclick = ()=>{ project.slides.forEach((s,i)=>s.layout=i===0?'cover':project.theme.defaultLayout); syncEditor(); render(); msg('Diseño aplicado a todas las diapositivas.'); };
for(const [id,key] of Object.entries({slideTitle:'title',subtitle:'subtitle',body:'body',body2:'body2',layout:'layout'})) $(id).addEventListener('input',()=>{ current()[key]=$(id).value; render(); });
$('add').onclick = ()=>{ if(project.slides.length>=100) return; project.slides.splice(selected+1,0,{title:'Nueva diapositiva',subtitle:'',body:'Escribe aquí tu contenido.',body2:'',layout:project.theme.defaultLayout,image:''}); choose(selected+1); };
$('duplicate').onclick = ()=>{ if(project.slides.length>=100) return; project.slides.splice(selected+1,0,{...current()}); choose(selected+1); };
$('remove').onclick = ()=>{ if(project.slides.length>1){ project.slides.splice(selected,1); choose(selected); } };
$('prev').onclick = ()=>choose(selected-1); $('next').onclick = ()=>choose(selected+1);
function move(delta){ const i=selected+delta; if(i>=0&&i<project.slides.length){ [project.slides[i],project.slides[selected]]=[project.slides[selected],project.slides[i]]; choose(i); } }
$('moveLeft').onclick=()=>move(-1); $('moveRight').onclick=()=>move(1);
$('slideImage').onchange = async e => {
  const target=current();
  try{
    target.image=(await readImage(e.target.files[0])).data;
    if(!['imageLeft','imageRight'].includes(target.layout)) target.layout='imageRight';
    syncEditor(); render(); msg('Imagen añadida.');
  } catch(err){ msg(err.message); }
};
$('removeImage').onclick = ()=>{ current().image=''; syncEditor(); render(); };

function showPresent(){ renderSlide($('presentCanvas'), project.slides[presentIndex], presentIndex); $('presentPosition').textContent=`${presentIndex+1} / ${project.slides.length}`; $('presentPrev').disabled=presentIndex===0; $('presentNext').disabled=presentIndex===project.slides.length-1; }
function stepPresent(d){ presentIndex=clamp(presentIndex+d,0,project.slides.length-1); showPresent(); }
$('present').onclick = ()=>{ presentIndex=selected; $('presentation').showModal(); showPresent(); };
$('closePresent').onclick = ()=>$('presentation').close(); $('presentPrev').onclick=()=>stepPresent(-1); $('presentNext').onclick=()=>stepPresent(1);
document.addEventListener('keydown', e=>{ if(!$('presentation').open) return; if(e.key==='ArrowLeft') stepPresent(-1); if(e.key==='ArrowRight'||e.key===' '){ e.preventDefault(); stepPresent(1); } });

function download(blob,name){ const u=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=u; a.download=name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),3000); }
$('saveProject').onclick = ()=>{ download(new Blob([JSON.stringify({version:1,...project},null,2)],{type:'application/json'}), slug()+'.json'); msg('Proyecto descargado; podrás abrirlo para continuar editando.'); };
$('openProject').onclick = ()=>$('projectFile').click();
const safeImage=v=>typeof v==='string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v) ? v : '';
function validate(p){
  if(!p || !Array.isArray(p.slides) || !p.slides.length || p.slides.length>100) throw Error('El archivo no es un proyecto SlideStudio válido.');
  const t={...defaults};
  for(const k of Object.keys(t)){
    const v=p.theme?.[k];
    if(k.endsWith('Size')){ if(Number.isFinite(v)) t[k]=clamp(v, k==='titleSize'?12:9, k==='titleSize'?72:k==='subSize'?44:36); }
    else if(['bg','accent','textColor','titleColor'].includes(k)){ if(/^#[0-9a-f]{6}$/i.test(v)) t[k]=v; }
    else if(k==='style'){ if(styles.includes(v)) t[k]=v; }
    else if(k==='defaultLayout'){ if(layouts.includes(v)) t[k]=v; }
    else if([...$('font').options].some(o=>o.value===v)) t[k]=v;
  }
  const str=v=>typeof v==='string' ? v.slice(0,20000) : '';
  return {
    version:1,
    topic:str(p.topic)||'Mi presentación', brief:str(p.brief), deckType:deckTypes.includes(p.deckType)?p.deckType:'general', instantMode:p.instantMode!==false,
    theme:t, reference:safeImage(p.reference), palette:Array.isArray(p.palette)?p.palette.filter(v=>/^#[0-9a-f]{6}$/i.test(v)).slice(0,7):[], analysis:str(p.analysis),
    slides:p.slides.map(s=>({title:str(s?.title),subtitle:str(s?.subtitle),body:str(s?.body),body2:str(s?.body2),layout:layouts.includes(s?.layout)?s.layout:'standard',image:safeImage(s?.image)}))
  };
}
$('projectFile').onchange = async e => {
  try{
    const f=e.target.files[0]; if(!f) return; if(f.size>80*1024*1024) throw Error('El archivo supera 80 MB.');
    project=validate(JSON.parse(await f.text())); selected=0; syncSettings(); syncEditor(); render(); msg('Proyecto abierto.');
  } catch(err){ msg(err.message); }
  finally { e.target.value=''; }
};

$('export').onclick = async ()=>{
  const button=$('export'); button.disabled=true; button.textContent='Exportando…';
  try{
    if(typeof PptxGenJS==='undefined') throw Error('No se encontró la biblioteca de PowerPoint.');
    const pptx=new PptxGenJS(); pptx.layout='LAYOUT_WIDE'; pptx.author='SlideStudio'; pptx.title=project.topic;
    const t=project.theme;
    for(const [i,s] of project.slides.entries()){
      const slide=pptx.addSlide(); slide.background={color:t.bg.slice(1)};
      for(const v of geometry(s,t,i)){
        const pos={x:v.x,y:v.y,w:v.w,h:v.h};
        if(v.kind==='text') slide.addText(v.value,{...pos,fontFace:t.font,fontSize:v.size,bold:v.bold,color:v.color.slice(1),margin:0,align:v.align,valign:'top',fit:'shrink',paraSpaceAfterPt:0});
        else if(v.kind==='image'){
          const im=new Image(); im.src=v.data; await im.decode();
          const ratio=Math.min(v.w/im.width,v.h/im.height), w=im.width*ratio, h=im.height*ratio;
          slide.addImage({data:v.data,x:v.x+(v.w-w)/2,y:v.y+(v.h-h)/2,w,h});
        } else slide.addShape(v.kind==='ellipse'?pptx.ShapeType.ellipse:pptx.ShapeType.rect,{...pos,fill:{color:v.fill.slice(1)},line:{color:v.fill.slice(1),transparency:100}});
      }
    }
    await pptx.writeFile({fileName:slug()+'.pptx'});
    msg('PowerPoint generado. Textos, formas e imágenes quedan editables.');
  } catch(err){ msg('No se pudo exportar: '+err.message); }
  finally { button.disabled=false; button.textContent='↓ PowerPoint editable'; }
};

function wrapText(ctx,text,maxWidth){
  const lines=[];
  const paragraphs=String(text||'').split('\n');
  for(const paragraph of paragraphs){
    const words=paragraph.split(/\s+/).filter(Boolean);
    if(!words.length){ lines.push(''); continue; }
    let line='';
    for(const word of words){
      const test=line ? line+' '+word : word;
      if(ctx.measureText(test).width<=maxWidth || !line) line=test;
      else { lines.push(line); line=word; }
    }
    if(line) lines.push(line);
  }
  return lines;
}
async function canvasForSlide(s,index,scale=2){
  const width=1600*scale/2, height=900*scale/2; // 16:9
  const pxPerIn = width / W;
  const c=document.createElement('canvas'); c.width=width; c.height=height;
  const ctx=c.getContext('2d');
  ctx.fillStyle=project.theme.bg; ctx.fillRect(0,0,width,height);
  for(const v of geometry(s,project.theme,index)){
    const x=v.x*pxPerIn, y=v.y*pxPerIn, w=v.w*pxPerIn, h=v.h*pxPerIn;
    if(v.kind==='rect'){
      ctx.fillStyle=v.fill; ctx.fillRect(x,y,w,h);
    } else if(v.kind==='ellipse'){
      ctx.fillStyle=v.fill; ctx.beginPath(); ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2); ctx.fill();
    } else if(v.kind==='image'){
      const im=new Image(); im.src=v.data; await im.decode();
      const ratio=Math.min(w/im.width,h/im.height), rw=im.width*ratio, rh=im.height*ratio;
      ctx.drawImage(im,x+(w-rw)/2,y+(h-rh)/2,rw,rh);
    } else if(v.kind==='text') {
      const fontPx = Math.max(10, v.size * pxPerIn / 72);
      ctx.fillStyle=v.color; ctx.font=`${v.bold?'700':'400'} ${fontPx}px ${project.theme.font}, Arial, sans-serif`; ctx.textBaseline='top';
      const maxWidth=w, lines=wrapText(ctx,v.value,maxWidth), lineHeight=fontPx*1.17;
      lines.forEach((line,idx)=>{
        let tx=x;
        const measure=ctx.measureText(line).width;
        if(v.align==='center') tx=x+(w-measure)/2; else if(v.align==='right') tx=x+w-measure;
        ctx.fillText(line,tx,y+idx*lineHeight,maxWidth);
      });
    }
  }
  return c;
}
async function exportSlidePng(index){
  const c=await canvasForSlide(project.slides[index], index, 2);
  const name=`${slug()}_${String(index+1).padStart(2,'0')}.png`;
  c.toBlob(blob=>download(blob,name),'image/png');
}
$('exportPng').onclick = async ()=>{
  const b=$('exportPng'); b.disabled=true; b.textContent='Exportando…';
  try{ await exportSlidePng(selected); msg('Diapositiva actual exportada como imagen PNG.'); }
  catch(err){ msg('No se pudo exportar la imagen: '+err.message); }
  finally { b.disabled=false; b.textContent='↓ Imagen PNG'; }
};
$('exportAllPng').onclick = async ()=>{
  const b=$('exportAllPng'); b.disabled=true; b.textContent='Exportando…';
  try{
    for(let i=0;i<project.slides.length;i++){
      await exportSlidePng(i);
      await new Promise(r=>setTimeout(r,180));
    }
    msg('Se descargaron todas las diapositivas como PNG.');
  } catch(err){ msg('No se pudieron exportar todas las imágenes: '+err.message); }
  finally { b.disabled=false; b.textContent='↓ Todas en PNG'; }
};

syncSettings(); syncEditor(); render();
if(project.instantMode) scheduleGenerate();
