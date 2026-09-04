// Reenvío Ctrl+rueda (zoom) desde la página al host + zoom instantáneo.
// El HWND hijo Win32 traga la rueda: el host nunca la ve. Se inyecta vía eval
// (idempotente, reinyectable tras cada navegación que lo borra): aplica el zoom
// EN LA PÁGINA al instante y avisa al host por /shell/browser/pick
// {type:'zoom-level'} para sincronizar label/estado. Los botones del host
// fuerzan nivel vía window.__oc_setZoom(v) para no duplicar lógica.

export function buildWheelScript(apiBase: string): string {
  const apiJson = JSON.stringify(apiBase)
  return `(function(){
var W=window,D=document,API=${apiJson};
try{
if(W.__oc_wheel_on)return;
if(!D||typeof D.addEventListener!=='function')return;
W.__oc_wheel_on=true;
function post(b){try{fetch(API+'/shell/browser/pick',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)}).catch(function(){})}catch(e){}}
function cur(){var z=1;try{var c=parseFloat(D.documentElement.style.zoom);if(c>0&&isFinite(c))z=c}catch(e){}return z}
function apply(v){v=Math.max(0.5,Math.min(2.5,Math.round(v*10)/10));try{D.documentElement.style.zoom=String(v);if(D.body)D.body.style.zoom=String(v)}catch(e){}return v}
W.__oc_setZoom=function(v){post({type:'zoom-level',value:apply(v)})};
D.addEventListener('wheel',function(e){
if(!(e.ctrlKey||e.metaKey))return;
try{e.preventDefault()}catch(_){}
try{e.stopPropagation()}catch(_){}
W.__oc_setZoom(cur()+((e.deltaY||0)>0?-0.1:0.1));
},{passive:false,capture:true});
}catch(e){}
})()`
}
