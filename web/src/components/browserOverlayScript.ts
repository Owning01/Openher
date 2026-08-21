// Script de inspección visual que se INYECTA dentro del sub-WebView nativo
// (vía /shell/browser/eval) sin recargar la página. Los picks vuelven al host
// por HTTP: POST /shell/browser/pick desde el propio documento inyectado.
// También se usa (sin la parte HTTP) como fallback del iframe proxy.

export function buildOverlayScript(apiBase: string): string {
  const api = apiBase.replace(/'/g, "")
  return `(function(){
  var W=window;
  if(W.__opencode_overlay_active)return;
  W.__opencode_overlay_active=true;
  W.__opencode_escape=false;
  var API='${api}';
  var cur=null;
  var style=document.createElement('style');
  style.id='__oc_vs_style';
  style.textContent='.__oc_hover{outline:2px solid #58a6ff !important;outline-offset:1px !important;cursor:crosshair !important}.__oc_badge{position:absolute;z-index:2147483647;background:#58a6ff;color:#fff;font:bold 11px system-ui;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px;box-shadow:0 1px 6px rgba(0,0,0,.45);cursor:pointer;pointer-events:auto}.__oc_badge:hover{background:#79c0ff}#__oc_vs_hint{position:fixed;top:8px;left:50%;transform:translateX(-50%);background:rgba(88,166,255,.95);color:#fff;padding:6px 12px;border-radius:999px;font:600 12px system-ui;z-index:2147483647;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.25)}';
  document.head.appendChild(style);
  var hl=document.createElement('div');
  hl.id='__oc_vs_hl';
  hl.style.cssText='position:fixed;pointer-events:none;border:2px dashed #58a6ff;background:rgba(88,166,255,.12);z-index:2147483646;display:none;border-radius:6px';
  document.body.appendChild(hl);
  var hint=document.createElement('div');
  hint.id='__oc_vs_hint';
  hint.textContent='\\u25C8 Modo selecci\\u00F3n \\u2014 clic para anotar \\u2022 Esc para salir';
  document.body.appendChild(hint);
  function post(path,body){try{fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).catch(function(){})}catch(e){}}
  function findSource(el){try{
    var k=Object.keys(el).find(function(x){return x.indexOf('__reactFiber$')===0});
    if(k){var f=el[k];while(f){if(f._debugSource)return{file:String(f._debugSource.fileName),line:f._debugSource.lineNumber||null};f=f.return}}
    if(el.__vueParentComponent&&el.__vueParentComponent.type&&el.__vueParentComponent.type.__file)return{file:String(el.__vueParentComponent.type.__file),line:null};
  }catch(e){}return null}
  function buildSelector(el){var parts=[],c=el;while(c&&c.tagName&&c.tagName.toLowerCase()!=='html'&&parts.length<4){var s=c.tagName.toLowerCase();if(c.id){s+='#'+c.id;parts.unshift(s);break}if(typeof c.className==='string'&&c.className.trim()){s+='.'+c.className.trim().split(/\\s+/).filter(Boolean).slice(0,2).join('.')}if(c.parentElement){var sib=Array.prototype.filter.call(c.parentElement.children,function(x){return x.tagName===c.tagName});if(sib.length>1)s+=':nth-of-type('+(Array.prototype.indexOf.call(sib,c)+1)+')'}parts.unshift(s);c=c.parentElement}return parts.join(' > ')}
  function buildXPath(el){var segs=[],c=el;while(c&&c.nodeType===1&&segs.length<6){var i=1,s=c.previousElementSibling;while(s){if(s.tagName===c.tagName)i++;s=s.previousElementSibling}segs.unshift(c.tagName.toLowerCase()+'['+i+']');c=c.parentElement}return '/'+segs.join('/')}
  W.__oc_sendPick=function(target){
    if(!target||target.id==='__oc_vs_hl'||target.id==='__oc_vs_hint'||(target.classList&&target.classList.contains('__oc_badge')))return;
    var r=target.getBoundingClientRect();
    post('/shell/browser/pick',{type:'pick',outerHTML:String(target.outerHTML||'').slice(0,4000),innerText:((target.innerText||target.textContent||'')).slice(0,500),selector:buildSelector(target),xpath:buildXPath(target),tag:(target.tagName||'div').toLowerCase(),boundingRect:{x:r.left,y:r.top,w:r.width,h:r.height},bx:r.left+(W.scrollX||0),by:r.top+(W.scrollY||0),url:location.href,source:findSource(target)});
  };
  W.__oc_addBadge=function(id,label,bx,by){
    var b=document.createElement('div');
    b.className='__oc_badge';b.setAttribute('data-ocid',String(id));b.textContent=label;
    b.style.left=(bx||0)+'px';b.style.top=(by||0)+'px';
    b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();post('/shell/browser/pick',{type:'remove',id:id})},true);
    document.body.appendChild(b);
  };
  W.__oc_removeBadge=function(id){
    var el=document.querySelector('[data-ocid="'+id+'"]');
    if(el)el.remove();
  };
  W.__oc_clearBadges=function(){Array.prototype.forEach.call(document.querySelectorAll('.__oc_badge'),function(b){b.remove()})};
  document.addEventListener('mouseover',function(e){var t=e.target;if(!t||(t.closest&&t.closest('.__oc_badge'))||t.id==='__oc_vs_hl'||t.id==='__oc_vs_hint'){if(t&&(t.id==='__oc_vs_hl'))hl.style.display='none';return}
    if(cur)cur.classList.remove('__oc_hover');cur=t;cur.classList.add('__oc_hover');
    var r=t.getBoundingClientRect();hl.style.display='block';hl.style.left=r.left+'px';hl.style.top=r.top+'px';hl.style.width=r.width+'px';hl.style.height=r.height+'px'},true);
  document.addEventListener('mouseout',function(e){if(e.target===cur){cur.classList.remove('__oc_hover');cur=null;hl.style.display='none'}},true);
  document.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();W.__oc_sendPick(e.target)},true);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')post('/shell/browser/pick',{type:'escape'})},true);
})()`
}

export const badgeScript = (id: string, label: string, bx: number, by: number): string =>
  `window.__oc_addBadge && window.__oc_addBadge('${id.replace(/'/g, "")}','${label.replace(/'/g, "")}',${Math.round(bx)},${Math.round(by)})`

export const removeBadgeScript = (id: string): string =>
  `window.__oc_removeBadge && window.__oc_removeBadge('${id.replace(/'/g, "")}')`

export const clearBadgesScript = `window.__oc_clearBadges && window.__oc_clearBadges()`

export const cleanupOverlayScript = `(function(){
  var W=window;
  W.__opencode_overlay_active=false;
  W.__opencode_escape=false;
  var s=document.getElementById('__oc_vs_style');if(s)s.remove();
  var h=document.getElementById('__oc_vs_hint');if(h)h.remove();
  var hl=document.getElementById('__oc_vs_hl');if(hl)hl.remove();
})()`
