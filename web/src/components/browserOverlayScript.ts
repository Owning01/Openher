// Script de inspección visual que se INYECTA dentro del sub-WebView nativo
// (vía /shell/browser/eval) sin recargar la página. Los picks vuelven al host
// por HTTP: POST /shell/browser/pick desde el propio documento inyectado.
//
// Incluye los 3 patrones robados de od-web:
//   1. Pod: selección de área por trazo libre (drag → bbox → elementos enclosed)
//   2. Inspect con ALLOWED_PROPS + UNSAFE_VALUE (sanitización de CSS en vivo)
//   3. Runtime state capture (scroll + form fields vía sessionStorage en pagehide)

export type InspectTool = "picker" | "pod"

export function buildOverlayScript(apiBase: string, initialTool: InspectTool = "picker"): string {
  const apiJson = JSON.stringify(apiBase)
  const toolJson = JSON.stringify(initialTool === "pod" ? "pod" : "picker")
  return `(function(){
  var W=window;
  var TOOL=${toolJson};
  if(W.__opencode_overlay_active){ if(W.__oc_setTool)W.__oc_setTool(TOOL); return }
  W.__opencode_overlay_active=true;
  var API=${apiJson};
  var cur=null;
  var suppressClick=false;
  var style=document.createElement('style');
  style.id='__oc_vs_style';
  style.setAttribute('data-oc-vs','1');
  style.textContent='.__oc_hover{outline:2px solid #58a6ff !important;outline-offset:1px !important;cursor:crosshair !important}.__oc_badge{position:absolute;z-index:2147483647;background:#58a6ff;color:#fff;font:bold 11px system-ui;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 1px 6px rgba(0,0,0,.45);cursor:pointer;pointer-events:auto}.__oc_badge:hover{background:#79c0ff}[data-oc-tmp]{cursor:crosshair !important}#__oc_vs_hint{position:fixed;top:8px;left:50%;transform:translateX(-50%);background:rgba(88,166,255,.95);color:#fff;padding:6px 12px;border-radius:999px;font:600 12px system-ui;z-index:2147483647;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.25)}';
  document.head.appendChild(style);
  var hl=document.createElement('div');
  hl.id='__oc_vs_hl';hl.setAttribute('data-oc-vs','1');
  hl.style.cssText='position:fixed;pointer-events:none;border:2px dashed #58a6ff;background:rgba(88,166,255,.12);z-index:2147483646;display:none;border-radius:6px';
  document.body.appendChild(hl);
  var hint=document.createElement('div');
  hint.id='__oc_vs_hint';hint.setAttribute('data-oc-vs','1');
  document.body.appendChild(hint);
  // SVG para el trazo libre del pod
  var svgNS='http://www.w3.org/2000/svg';
  var svg=document.createElementNS(svgNS,'svg');
  svg.setAttribute('data-oc-vs','1');
  svg.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483645;display:none';
  var podPath=document.createElementNS(svgNS,'path');
  podPath.setAttribute('fill','rgba(255,166,87,.10)');
  podPath.setAttribute('stroke','#ffa657');
  podPath.setAttribute('stroke-width','2');
  podPath.setAttribute('stroke-dasharray','6 4');
  svg.appendChild(podPath);
  document.body.appendChild(svg);
  function setHint(){hint.textContent=TOOL==='pod'?'\\u2B1A Arrastr\\u00E1 para marcar un \\u00E1rea \\u2022 Esc sale':'\\u25C8 Clic en un elemento para anotar \\u2022 Esc sale'}
  W.__oc_setTool=function(t){TOOL=t;setHint()};
  setHint();
  function post(path,body){try{fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).catch(function(){})}catch(e){}}
  function findSource(el){try{
    var k=Object.keys(el).find(function(x){return x.indexOf('__reactFiber$')===0});
    if(k){var f=el[k];while(f){if(f._debugSource)return{file:String(f._debugSource.fileName),line:f._debugSource.lineNumber||null};f=f.return}}
    if(el.__vueParentComponent&&el.__vueParentComponent.type&&el.__vueParentComponent.type.__file)return{file:String(el.__vueParentComponent.type.__file),line:null};
  }catch(e){}return null}
  function buildSelector(el){var parts=[],c=el;while(c&&c.tagName&&c.tagName.toLowerCase()!=='html'&&parts.length<4){var s=c.tagName.toLowerCase();if(c.id){s+='#'+c.id;parts.unshift(s);break}if(typeof c.className==='string'&&c.className.trim()){s+='.'+c.className.trim().split(/\\s+/).filter(Boolean).slice(0,2).join('.')}if(c.parentElement){var sib=Array.prototype.filter.call(c.parentElement.children,function(x){return x.tagName===c.tagName});if(sib.length>1)s+=':nth-of-type('+(Array.prototype.indexOf.call(sib,c)+1)+')'}parts.unshift(s);c=c.parentElement}return parts.join(' > ')}
  function buildXPath(el){var segs=[],c=el;while(c&&c.nodeType===1&&segs.length<6){var i=1,s=c.previousElementSibling;while(s){if(s.tagName===c.tagName)i++;s=s.previousElementSibling}segs.unshift(c.tagName.toLowerCase()+'['+i+']');c=c.parentElement}return '/'+segs.join('/')}
  var genN=0;
  function genId(){genN++;return 'oc'+Date.now().toString(36)+genN}
  function visibleEnough(el,r){
    if(!r||r.width<=0||r.height<=0)return false;
    try{var cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return false}catch(e){}
    return true;
  }
  function snapshot(el){
    var r=el.getBoundingClientRect();
    var id=genId();
    try{el.setAttribute('data-oc-tmp',id)}catch(e){}
    return {id:id,rect:r,el:el};
  }
  W.__oc_sendPick=function(target){
    if(!target||!target.tagName)return;
    if(target.closest&&(target.closest('[data-oc-vs]')||target.closest('.__oc_badge')))return;
    var sn=snapshot(target);
    post('/shell/browser/pick',{type:'pick',mode:'picker',tmpId:sn.id,outerHTML:String(target.outerHTML||'').slice(0,4000),innerText:((target.innerText||target.textContent||'')).slice(0,500),selector:buildSelector(target),xpath:buildXPath(target),tag:(target.tagName||'div').toLowerCase(),boundingRect:{x:sn.rect.left,y:sn.rect.top,w:sn.rect.width,h:sn.rect.height},bx:sn.rect.left+(W.scrollX||0),by:sn.rect.top+(W.scrollY||0),url:location.href,source:findSource(target)});
  };
  // ---- Pod: trazo libre -> bbox -> elementos enclosed ----
  var drawing=false,pts=[],raf=null;
  function ptsBounds(){
    var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(var i=0;i<pts.length;i++){var p=pts[i];if(p[0]<minX)minX=p[0];if(p[0]>maxX)maxX=p[0];if(p[1]<minY)minY=p[1];if(p[1]>maxY)maxY=p[1]}
    return {x:minX,y:minY,w:maxX-minX,h:maxY-minY};
  }
  function drawPath(){
    var d='';
    for(var i=0;i<pts.length;i++){d+=(i===0?'M':'L')+pts[i][0].toFixed(1)+' '+pts[i][1].toFixed(1)}
    podPath.setAttribute('d',d);
  }
  function elementsInRegion(b){
    var out=[];
    var all=document.body.querySelectorAll('*');
    for(var i=0;i<all.length&&i<4000;i++){
      var el=all[i];
      if(el.closest&&(el.closest('[data-oc-vs]')||el.closest('.__oc_badge')))continue;
      var tag=(el.tagName||'').toLowerCase();
      if(tag==='script'||tag==='style'||tag==='link'||tag==='meta'||tag==='noscript')continue;
      var r=el.getBoundingClientRect();
      if(!visibleEnough(el,r))continue;
      var cx=r.left+r.width/2,cy=r.top+r.height/2;
      if(cx<b.x||cx>b.x+b.w||cy<b.y||cy>b.y+b.h)continue;
      var covered=false;
      for(var j=0;j<out.length;j++){if(out[j]!==el&&out[j].contains(el)){covered=true;break}}
      if(covered)continue;
      out.push(el);
      if(out.length>=8)break;
    }
    return out;
  }
  document.addEventListener('pointerdown',function(e){
    if(TOOL!=='pod'||e.button!==0)return;
    var t=e.target;
    if(t&&t.closest&&(t.closest('[data-oc-vs]')||t.closest('.__oc_badge')))return;
    drawing=true;pts=[[e.clientX,e.clientY]];
    svg.style.display='block';
  },true);
  document.addEventListener('pointermove',function(e){
    if(!drawing)return;
    pts.push([e.clientX,e.clientY]);
    if(!raf)raf=requestAnimationFrame(function(){raf=null;drawPath()});
  },true);
  document.addEventListener('pointerup',function(e){
    if(!drawing)return;
    drawing=false;
    svg.style.display='none';
    if(raf){cancelAnimationFrame(raf);raf=null}
    var b=ptsBounds();pts=[];
    if(b.w<24&&b.h<24)return;
    suppressClick=true;setTimeout(function(){suppressClick=false},350);
    var members=elementsInRegion(b);
    if(members.length===0)return;
    var ms=[];var zoneSource=null;
    for(var i=0;i<members.length;i++){
      var m=members[i];
      var src=findSource(m);
      if(!zoneSource&&src)zoneSource=src;
      var r=m.getBoundingClientRect();
      var snm=snapshot(m);
      ms.push({tmpId:snm.id,tag:(m.tagName||'div').toLowerCase(),selector:buildSelector(m),outerHTML:String(m.outerHTML||'').slice(0,1200),innerText:((m.innerText||'')).slice(0,200),source:src,boundingRect:{x:r.left,y:r.top,w:r.width,h:r.height}});
    }
    post('/shell/browser/pick',{type:'pick',mode:'pod',tmpId:ms[0]?ms[0].tmpId:undefined,members:ms,boundingRect:{x:b.x,y:b.y,w:b.w,h:b.h},bx:b.x+(W.scrollX||0),by:b.y+(W.scrollY||0),url:location.href,source:zoneSource});
  },true);
  W.__oc_addBadge=function(id,label,bx,by,sel){
    if(sel){try{var t=document.querySelector(sel);if(t){var rr=t.getBoundingClientRect();bx=rr.left+(W.scrollX||0);by=rr.top+(W.scrollY||0)}}catch(e){}}
    var b=document.createElement('div');
    b.className='__oc_badge';b.setAttribute('data-ocid',String(id));b.setAttribute('data-oc-vs','1');b.textContent=label;
    b.style.left=(bx||0)+'px';b.style.top=(by||0)+'px';
    // sin listener propio: el click-handler global de capture postea 'remove'
    // (stopPropagation de document impide que este nodo reciba la fase target)
    document.body.appendChild(b);
  };
  W.__oc_removeBadge=function(id){
    var el=document.querySelector('[data-ocid="'+id+'"]');
    if(el)el.remove();
  };
  W.__oc_clearBadges=function(){Array.prototype.forEach.call(document.querySelectorAll('.__oc_badge'),function(b){b.remove()})};
  // ---- Inspect: overrides CSS con allow-list (patrón od-web) ----
  var ALLOWED_PROPS={'color':1,'background-color':1,'font-size':1,'font-weight':1,'font-family':1,'line-height':1,'text-align':1,'padding':1,'padding-top':1,'padding-right':1,'padding-bottom':1,'padding-left':1,'border-radius':1};
  var UNSAFE_VALUE=/[;{}<>\\n\\r]/;
  var overrides=Object.create(null);
  var ovrStyle=null;
  function renderOverrides(){
    if(ovrStyle)ovrStyle.remove();
    var css='';
    for(var id in overrides){
      var props=overrides[id];var decl='';
      for(var k in props){decl+=k+':'+props[k]+';'}
      if(decl)css+='[data-oc-tmp="'+id+'"]{'+decl+'}';
    }
    if(!css)return;
    ovrStyle=document.createElement('style');
    ovrStyle.id='__oc_vs_ovr';ovrStyle.setAttribute('data-oc-vs','1');
    ovrStyle.textContent=css;
    document.head.appendChild(ovrStyle);
  }
  W.__oc_applyStyle=function(id,props){
    var el=document.querySelector('[data-oc-tmp="'+id+'"]');
    if(!el)return;
    var clean={};var keys=Object.keys(props||{});
    for(var i=0;i<keys.length;i++){
      var k=keys[i];if(!ALLOWED_PROPS[k])continue;
      var v=props[k];if(v===''||v==null)continue;
      v=String(v);if(UNSAFE_VALUE.test(v))continue;
      clean[k]=v;
    }
    if(!overrides[id]){
      overrides[id]=Object.create(null);
      var before={};var ks=Object.keys(clean);
      for(var j=0;j<ks.length;j++){try{before[ks[j]]=getComputedStyle(el).getPropertyValue(ks[j])}catch(e){before[ks[j]]=null}}
      post('/shell/browser/pick',{type:'style-snapshot',id:id,before:before});
    }
    var has=Object.keys(clean).length>0;
    if(has)overrides[id]=clean;else delete overrides[id];
    renderOverrides();
  };
  W.__oc_clearStyle=function(id){delete overrides[id];renderOverrides()};
  W.__oc_unbind=function(id){
    try{var el=document.querySelector('[data-oc-tmp="'+id+'"]');if(el)el.removeAttribute('data-oc-tmp')}catch(e){}
    delete overrides[id];renderOverrides();
  };
  // ---- Eventos globales ----
  document.addEventListener('mouseover',function(e){var t=e.target;if(!t||(t.closest&&(t.closest('[data-oc-vs]')||t.closest('.__oc_badge')))){return}
    if(cur)cur.classList.remove('__oc_hover');cur=t;cur.classList.add('__oc_hover');
    var r=t.getBoundingClientRect();hl.style.display='block';hl.style.left=r.left+'px';hl.style.top=r.top+'px';hl.style.width=r.width+'px';hl.style.height=r.height+'px'},true);
  document.addEventListener('mouseout',function(e){if(e.target===cur){cur.classList.remove('__oc_hover');cur=null;hl.style.display='none'}},true);
  document.addEventListener('click',function(e){
    e.preventDefault();e.stopPropagation();
    var t=e.target;
    // Badge: postear remove AQUÍ mismo — el listener del badge nunca corre
    // porque stopPropagation en capture de document mata la fase target.
    var b=t&&t.closest?t.closest('.__oc_badge'):null;
    if(b){post('/shell/browser/pick',{type:'remove',id:b.getAttribute('data-ocid')});return}
    if(suppressClick)return;
    if(TOOL!=='picker')return;
    W.__oc_sendPick(t);
  },true);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')post('/shell/browser/pick',{type:'escape'})},true);
  // ---- Runtime state capture (scroll + forms via sessionStorage) ----
  var applyForms=function(){
    try{
      var raw=sessionStorage.getItem('__oc_state');
      if(!raw)return;
      var s=JSON.parse(raw);
      sessionStorage.removeItem('__oc_state');
      if(!s||typeof s!=='object')return;
      if(typeof s.x==='number'||typeof s.y==='number')setTimeout(function(){try{W.scrollTo(s.x||0,s.y||0)}catch(e){}},60);
      if(!s.f)return;
      var els=document.querySelectorAll('input,textarea,select');
      var applied=0;
      for(var i=0;i<els.length&&applied<200;i++){
        var el=els[i];var key=el.name||el.id;if(!key)continue;
        if(!(key in s.f))continue;
        var v=s.f[key];
        if(v==null||el.type==='password')continue;
        if(el.type==='checkbox'){el.checked=v===true;continue}
        if(el.value!==v){el.value=v;applied++}
      }
    }catch(e){}
  };
  applyForms();
  window.addEventListener('pagehide',function(){
    try{
      var s={x:W.scrollX||0,y:W.scrollY||0,f:{}};
      var els=document.querySelectorAll('input,textarea,select');
      var n=0;
      for(var i=0;i<els.length&&n<200;i++){
        var el=els[i];var key=el.name||el.id;if(!key)continue;
        s.f[key]=el.type==='password'?null:(el.type==='checkbox'?!!el.checked:(el.value||''));
        n++;
      }
      sessionStorage.setItem('__oc_state',JSON.stringify(s));
    }catch(e){}
  });
})()`
}

export const badgeScript = (id: string, label: string, bx: number, by: number, selector?: string): string =>
  `window.__oc_addBadge && window.__oc_addBadge(${JSON.stringify(id)},${JSON.stringify(label)},${Math.round(bx)},${Math.round(by)},${selector ? JSON.stringify(selector) : "null"})`

export const removeBadgeScript = (id: string): string =>
  `window.__oc_removeBadge && window.__oc_removeBadge(${JSON.stringify(id)})`

export const clearBadgesScript = `window.__oc_clearBadges && window.__oc_clearBadges()`

export const applyStyleScript = (id: string, props: Record<string, string | null>): string =>
  `window.__oc_applyStyle && window.__oc_applyStyle(${JSON.stringify(id)},${JSON.stringify(props)})`

export const clearStyleScript = (id: string): string =>
  `window.__oc_clearStyle && window.__oc_clearStyle(${JSON.stringify(id)})`

export const unbindScript = (id: string): string =>
  `window.__oc_unbind && window.__oc_unbind(${JSON.stringify(id)})`

export const setToolScript = (tool: InspectTool): string =>
  `window.__oc_setTool && window.__oc_setTool(${JSON.stringify(tool === "pod" ? "pod" : "picker")})`

export const cleanupOverlayScript = `(function(){
  var W=window;
  W.__opencode_overlay_active=false;
  var s=document.getElementById('__oc_vs_style');if(s)s.remove();
  var h=document.getElementById('__oc_vs_hint');if(h)h.remove();
  var hl=document.getElementById('__oc_vs_hl');if(hl)hl.remove();
  var sv=document.querySelector('svg[data-oc-vs]');if(sv)sv.remove();
  var ov=document.getElementById('__oc_vs_ovr');if(ov)ov.remove();
})()`
