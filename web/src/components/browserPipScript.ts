// Selector Picture-in-Picture que se INYECTA dentro de la página (sub-WebView
// nativo vía /shell/browser/eval, o script tag en el iframe proxy).
// Un solo modo: el usuario hace CLIC en la página (gesto real, requerido por
// el navegador para permitir PiP) y según qué clickeó:
//   - <video> → requestPictureInPicture nativo (EN VIVO, con audio).
//   - otra región → Document PiP (requestWindow) con el nodo VIVO movido
//     adentro (sigue corriendo: canvas, video, animaciones) y restaurado a su
//     placeholder al cerrar la ventanita. <base> + copia best-effort de los
//     estilos same-origin para que se vea igual.
// Toggle: si ya está activo, reinyectar lo desarma (Esc también cancela).

export function buildPipScript(): string {
  return `(function(){
var W=window,D=document;
if(W.__oc_pip_active){if(W.__oc_pip_cleanup)W.__oc_pip_cleanup();return}
W.__oc_pip_active=true;
function toast(m){try{var t=D.createElement('div');t.setAttribute('data-oc-pip','1');t.style.cssText='position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:rgba(20,20,24,.95);color:#fff;padding:8px 14px;border-radius:999px;font:500 12px system-ui;z-index:2147483647;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.4)';t.textContent=m;(D.body||D.documentElement).appendChild(t);setTimeout(function(){t.remove()},2600)}catch(e){}}
function cleanup(){try{D.removeEventListener('mousemove',onMove,true);D.removeEventListener('click',onClick,true);D.removeEventListener('keydown',onKey,true);var q=D.querySelectorAll('[data-oc-pip]');for(var i=0;i<q.length;i++)q[i].remove()}catch(e){}W.__oc_pip_active=false;W.__oc_pip_cleanup=null}
W.__oc_pip_cleanup=cleanup;
if(!D.body){toast('La p\\u00E1gina a\\u00FAn no carg\\u00F3');cleanup();return}
var st=D.createElement('style');st.setAttribute('data-oc-pip','1');st.textContent='[data-oc-pip]{cursor:crosshair !important}';
(D.head||D.documentElement).appendChild(st);
var fr=D.createElement('div');fr.setAttribute('data-oc-pip','1');fr.style.cssText='position:fixed;pointer-events:none;border:2px solid #a371f7;background:rgba(163,113,247,.10);border-radius:6px;z-index:2147483646;display:none';
D.body.appendChild(fr);
var hint=D.createElement('div');hint.setAttribute('data-oc-pip','1');hint.style.cssText='position:fixed;top:10px;left:50%;transform:translateX(-50%);background:rgba(163,113,247,.95);color:#fff;padding:6px 12px;border-radius:999px;font:600 12px system-ui;z-index:2147483647;pointer-events:none;box-shadow:0 4px 16px rgba(0,0,0,.25);white-space:nowrap;max-width:92vw;overflow:hidden;text-overflow:ellipsis';
hint.textContent='Clic: video \\u2192 PiP en vivo \\u2022 regi\\u00F3n \\u2192 flotante \\u2022 Esc cancela';
D.body.appendChild(hint);
function own(n){return n&&n.closest?n.closest('[data-oc-pip]'):null}
function onMove(e){try{var el=D.elementFromPoint(e.clientX,e.clientY);if(!el||own(el)){fr.style.display='none';return}var r=el.getBoundingClientRect();if(r.width<2||r.height<2){fr.style.display='none';return}fr.style.display='block';fr.style.left=r.left+'px';fr.style.top=r.top+'px';fr.style.width=r.width+'px';fr.style.height=r.height+'px'}catch(x){}}
function pickVideo(el){if(!el||!el.tagName)return null;if(el.tagName==='VIDEO')return el;try{return el.querySelector('video')}catch(e){return null}}
function boxUp(el){var lvl=0,r=el.getBoundingClientRect();while(lvl<3&&(r.width<200||r.height<120)&&el.parentElement&&el.parentElement.tagName!=='BODY'){el=el.parentElement;r=el.getBoundingClientRect();lvl++}return{el:el,r:r}}
function openRegion(el,r){
if(!('documentPictureInPicture' in W)){toast('Este sitio no soporta PiP de regiones');return}
var w=Math.round(Math.min(760,Math.max(240,r.width)));
var h=Math.round(Math.min(600,Math.max(150,r.height)));
try{
W.documentPictureInPicture.requestWindow({width:w,height:h}).then(function(pw){
try{
var pd=pw.document;pd.title=D.title||'PiP';
var b=pd.createElement('base');try{b.href=location.href}catch(e){}pd.head.appendChild(b);
var sheets=D.styleSheets;for(var i=0;i<sheets.length;i++){try{var ss=sheets[i];if(!ss.cssRules)continue;var css='';var rules=ss.cssRules;for(var j=0;j<rules.length;j++){css+=rules[j].cssText+'\\n';if(css.length>200000)break}if(css){var s2=pd.createElement('style');s2.textContent=css;pd.head.appendChild(s2)}}catch(e){try{if(ss.href){var l=pd.createElement('link');l.rel='stylesheet';l.href=ss.href;pd.head.appendChild(l)}}catch(_){}}}
pd.body.style.cssText='margin:0;background:#0b0b0d;display:flex;align-items:flex-start;justify-content:center;min-height:100vh';
var ph=D.createComment('pip-restore');el.parentNode.insertBefore(ph,el);pd.body.appendChild(el);
pw.addEventListener('pagehide',function(){try{if(ph.parentNode){ph.parentNode.insertBefore(el,ph);ph.remove()}}catch(e){}});
}catch(err){toast('No se pudo abrir la regi\\u00F3n')}
}).catch(function(){toast('PiP cancelado o no permitido')});
}catch(e){toast('No se pudo abrir la regi\\u00F3n')}
}
function onClick(e){try{var el=e.target;if(own(el))return;e.preventDefault();e.stopPropagation();if(!el||!el.tagName)return;var v=pickVideo(el);if(v){cleanup();try{var p=v.requestPictureInPicture();if(p&&p.catch)p.catch(function(){toast('No se pudo abrir PiP del video')})}catch(err){toast('No se pudo abrir PiP del video')}return}var b=boxUp(el);cleanup();openRegion(b.el,b.r)}catch(x){try{cleanup()}catch(_){}}}
function onKey(e){if(e&&e.key==='Escape'){try{e.stopPropagation()}catch(_){}cleanup()}}
D.addEventListener('mousemove',onMove,true);
D.addEventListener('click',onClick,true);
D.addEventListener('keydown',onKey,true);
})()`
}
