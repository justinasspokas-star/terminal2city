(function(){
var R={GBP:[1,"£"],EUR:[1.17,"€"],USD:[1.33,"$"]},K="t2c-cur",C="GBP",sel;
try{var s=localStorage.getItem(K);if(R[s])C=s}catch(e){}
var RE=/£\s?(\d+(?:[.,]\d+)?)/g,CALC="[data-split-calculator],.group-cost-compare,.split-controls";
function fmt(n){var v=parseFloat(String(n).replace(",","."))*R[C][0];return R[C][1]+(/[.,]/.test(n)?v.toFixed(2):Math.round(v))}
function one(t){if(t._o===undefined){if(t.nodeValue.indexOf("£")<0)return;t._o=t.nodeValue}
var calc=t.parentElement&&t.parentElement.closest(CALC);
t.nodeValue=calc?t._o.replace(/£/g,R[C][1]):t._o.replace(RE,function(m,n){return fmt(n)})}
function walk(n){if(n.nodeType===3){one(n);return}if(n.nodeType!==1)return;var g=n.tagName;if(g==="SCRIPT"||g==="STYLE"||(g==="SELECT"&&n.id==="cur"))return;for(var c=n.firstChild;c;c=c.nextSibling)walk(c)}
function run(){walk(document.body)}
function place(){var h=document.querySelector(".header-inner");if(!h||!sel)return;var b=h.querySelector(".mobile-menu-button");if(b){if(sel.nextElementSibling!==b)h.insertBefore(sel,b)}else if(sel.parentNode!==h)h.appendChild(sel)}
function build(){if(!document.querySelector(".header-inner"))return;sel=document.createElement("label");sel.className="cur";sel.innerHTML='<select id="cur" aria-label="Currency"><option value="GBP">£ GBP</option><option value="EUR">€ EUR</option><option value="USD">$ USD</option></select>';var o=sel.firstChild;o.value=C;o.onchange=function(e){C=e.target.value;try{localStorage.setItem(K,C)}catch(_){}run()};place()}
build();run();setTimeout(place,300);setTimeout(place,1200);
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(walk)})}).observe(document.body,{childList:true,subtree:true});
})();
