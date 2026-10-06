const IMG={r1:"assets/landing/route1.webp",r2:"assets/landing/route2.webp",r3:"assets/landing/route3.webp",r4:"assets/landing/route4.webp",m1:"assets/landing/mode1.webp",m2:"assets/landing/mode2.webp",m3:"assets/landing/mode3.webp"};
const $=function(s){return document.querySelector(s);};
const T={LHR:["Terminal 2","Terminal 3","Terminal 4","Terminal 5"],LGW:["North Terminal","South Terminal"],STN:["Main terminal"],LTN:["Main terminal"],LCY:["Main terminal"],SEN:["Main terminal"]};
const A=[["LHR","Heathrow"],["LGW","Gatwick"],["STN","Stansted"],["LTN","Luton"],["LCY","City"],["SEN","Southend"]];
const ROUTES=[["r1","Heathrow (LHR) → Central London",6,"LHR","Central London"],["r2","Gatwick (LGW) → Central London",8,"LGW","Central London"],["r3","Stansted (STN) → Canary Wharf",10,"STN","Canary Wharf"],["r4","Luton (LTN) → Wembley",8,"LTN","Wembley"]];
const MODES=[["m1","Bus & Coach","Great value, frequent services",6],["m2","Train","Fast and direct into London",12],["m3","Taxi & Private Transfer","Door-to-door comfort",45]];

$("#rt").innerHTML=ROUTES.map(function(r,i){
  return '<button class="card" data-i="'+i+'"><div class="ph"><img src="'+IMG[r[0]]+'" alt=""><span class="badge">✈️</span></div><div class="t"><b>'+r[1]+'</b><div class="row"><span>From <strong data-p="'+r[2]+'">£'+r[2]+'</strong></span><span class="arr">→</span></div></div></button>';
}).join("");
$("#md").innerHTML=MODES.map(function(m){
  return '<button class="card mode"><div class="ph"><img src="'+IMG[m[0]]+'" alt=""></div><div class="t"><b>'+m[1]+'</b><small>'+m[2]+'</small><div class="row"><span>From <strong data-p="'+m[3]+'">£'+m[3]+'</strong></span><span class="arr">→</span></div></div></button>';
}).join("");
$("#chips").innerHTML=A.map(function(a){
  return '<button class="chip" data-a="'+a[0]+'" aria-pressed="'+(a[0]==="LHR")+'">✈️ '+a[1]+'<small>'+a[0]+'</small></button>';
}).join("");

function terms(){
  $("#tm").innerHTML=T[$("#ap").value].map(function(t){return "<option>"+t+"</option>";}).join("");
  document.querySelectorAll(".chip").forEach(function(c){c.setAttribute("aria-pressed",c.dataset.a===$("#ap").value);});
}
$("#ap").onchange=terms;
terms();

const d=new Date(Date.now()+864e5);
d.setHours(10,0,0,0);
$("#dt").value=new Date(d-d.getTimezoneOffset()*6e4).toISOString().slice(0,16);

document.querySelectorAll(".chip").forEach(function(c){
  c.onclick=function(){
    $("#ap").value=c.dataset.a;
    terms();
    $("#compare").scrollIntoView({behavior:"smooth",block:"center"});
  };
});
document.querySelectorAll("#rt .card").forEach(function(c){
  c.onclick=function(){
    const r=ROUTES[c.dataset.i];
    $("#ap").value=r[3];
    terms();
    $("#ds").value=r[4];
    show();
  };
});

const EXIT_BASE={LHR:50,LGW:45,STN:40,LTN:40,LCY:25,SEN:25};
const LATE_THRESHOLD={LHR:[23,15],LGW:[23,30],STN:[23,15],LTN:[23,15],LCY:[23,0],SEN:[22,30]};
const AIRPORT_NAME={LHR:"Heathrow",LGW:"Gatwick",STN:"Stansted",LTN:"Luton",LCY:"London City",SEN:"Southend"};

function esc(s){
  return String(s||"").replace(/[&<>"']/g,function(m){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m];});
}
function norm(s){return String(s||"").toLowerCase().replace(/[’']/g,"").replace(/\s+/g," ").trim();}
function hasAny(s,arr){return arr.some(function(x){return s.indexOf(x)!==-1;});}
function fmtTime(date){return date.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});}
function addMin(date,m){return new Date(date.getTime()+m*60000);}

function destinationCategory(text){
  const s=norm(text);
  if(hasAny(s,["paddington"])) return "paddington";
  if(hasAny(s,["kings cross","st pancras","euston"])) return "kings";
  if(hasAny(s,["canary wharf","docklands"])) return "canary";
  if(hasAny(s,["victoria"])) return "victoria";
  if(hasAny(s,["liverpool street","city of london","bank"])) return "city";
  if(hasAny(s,["westminster","soho","covent garden","piccadilly","leicester square","west end"])) return "westend";
  if(hasAny(s,["stratford"])) return "stratford";
  if(hasAny(s,["brighton"])) return "brighton";
  if(hasAny(s,["oxford"])) return "oxford";
  if(hasAny(s,["wembley"])) return "wembley";
  if(hasAny(s,["central london","london"])) return "london";
  return "exact";
}

function readiness(ap,dt,pax,bags){
  const landing=new Date(dt);
  if(Number.isNaN(landing.getTime())) return null;
  let centre=EXIT_BASE[ap]||40;
  if(bags>=2) centre+=15;
  if(bags>=4) centre+=10;
  if(pax>=4) centre+=5;
  const mid=addMin(landing,centre);
  return {landing:landing,mid:mid,low:addMin(mid,-15),high:addMin(mid,15),buffer:centre};
}

function lateStatus(ap,ready){
  if(!ready) return {level:"unknown",label:"Check live service",text:"Add your landing time so we can flag when a last-service check matters."};
  const hm=LATE_THRESHOLD[ap]||[23,15];
  const threshold=new Date(ready.mid);
  threshold.setHours(hm[0],hm[1],0,0);
  let diff=(threshold-ready.mid)/60000;
  if(diff<-360) diff+=1440;
  if(diff<0) return {level:"high",label:"High late-arrival risk",text:"Your estimated terminal-exit window is late enough that some direct public-transport services may already be limited. Check the live timetable before relying on rail or Tube and keep coach/private transfer as a backup."};
  if(diff<90) return {level:"medium",label:"Last-service check recommended",text:"Your estimated terminal-exit window is close to late-evening service reductions. Check the live last train or coach for your exact date before booking a public-transport-only plan."};
  return {level:"low",label:"Low late-arrival risk",text:"Your planning time is comfortably before our late-service warning window. Still verify live operator times because engineering work and timetables change."};
}

function makeOption(icon,title,subtitle,why,meta,type){
  return {icon:icon,title:title,subtitle:subtitle,why:why,meta:meta,type:type};
}
function privateOption(pax,bags){
  return makeOption("🚕","Pre-booked private transfer","Door to door from the terminal",
    ["No London interchange for "+pax+" traveller"+(pax===1?"":"s"),bags?(bags>=4?"4+":bags)+" large bag"+(bags===1?"":"s")+" stay with you":"No luggage handling between services","Best when simplicity matters more than lowest fare"],
    {changes:"0",walk:"Very low",luggage:"Excellent",effort:"Very easy"},"private");
}
function hybridOption(){
  return makeOption("🚆","Rail + short taxi","Use fast public transport for the long leg, then taxi the final distance",
    ["Avoids dragging luggage through a second or third London interchange","Usually keeps most of the speed advantage of rail","Useful when your hotel is not beside a direct airport line"],
    {changes:"1 planned handoff",walk:"Low",luggage:"Good",effort:"Easy"},"hybrid");
}
function coachOption(label){
  return makeOption("🚌",label||"Coach","Direct road option where the route fits",
    ["Luggage stays in the hold on many airport coach services","Can remove a London rail interchange","Journey time is more exposed to road traffic"],
    {changes:"0–1",walk:"Low–medium",luggage:"Good",effort:"Easy"},"coach");
}
function railOption(title,subtitle,why,changes,walk,luggage,effort){
  return makeOption("🚆",title,subtitle,why,{changes:changes||"0–1",walk:walk||"Medium",luggage:luggage||"Moderate",effort:effort||"Moderate"},"rail");
}

function routeGuide(ap,cat){
  if(ap==="LHR"&&cat==="oxford") return "heathrow-to-oxford.html";
  if(ap==="LGW"&&cat==="brighton") return "gatwick-to-brighton.html";
  if(ap==="LHR") return "heathrow-to-london.html";
  if(ap==="STN") return "stansted-to-london.html";
  if(ap==="LTN") return "luton-to-london.html";
  if(ap==="LCY") return "london-city-airport-to-london.html";
  if(ap==="SEN") return "southend-to-london.html";
  return "airport-transfers.html";
}

function directPublic(ap,cat){
  if(ap==="LHR"&&cat==="oxford") return coachOption("The Airline coach");
  if(ap==="LHR"&&cat==="paddington") return railOption("Heathrow Express","Non-stop airport rail to Paddington",["Your destination matches the Heathrow Express terminus","No London rail change before Paddington","Strong choice when speed to Paddington matters"],"0","Low","Good","Easy");
  if(ap==="LHR"&&["canary","city"].indexOf(cat)!==-1) return railOption("Elizabeth line","Direct cross-London rail is usually the cleanest first choice",["Serves several central and east-London stations directly","Reduces the need to change at Paddington","Good balance of speed and simplicity"],"0–1","Medium","Good","Easy");
  if(ap==="LHR"&&["kings","westend"].indexOf(cat)!==-1) return railOption("Piccadilly line or Elizabeth line","Choose the line that lands closest to your exact address",["A direct Tube corridor can beat a faster airport train plus another London change","Exact hotel location matters more than headline airport-train time","Compare the final walk before deciding"],"0–1","Medium","Moderate","Moderate");
  if(ap==="LHR"&&cat==="victoria") return coachOption("Direct coach to Victoria");
  if(ap==="LGW"&&cat==="brighton") return railOption("Direct train to Brighton","The airport station is at South Terminal",["Direct rail avoids travelling into London first","North Terminal arrivals add the free terminal shuttle","Usually the simplest airport-to-Brighton public option"],"0","Low","Good","Easy");
  if(ap==="STN"&&["city","london"].indexOf(cat)!==-1) return railOption("Stansted Express","Direct rail toward Liverpool Street or Tottenham Hale",["Strong option for the City and east or central London","No road-traffic exposure on the airport leg","Final London leg still depends on your exact address"],"0–1","Medium","Good","Easy");
  if(ap==="LTN"&&["kings","london"].indexOf(cat)!==-1) return railOption("DART + train","Airport DART to Parkway, then rail toward St Pancras",["Fast rail corridor for north-central London","One airport transfer step is built into the journey","Count the final walk or Tube leg to your hotel"],"1","Medium","Moderate","Moderate");
  if(ap==="LCY"&&["canary","city","london"].indexOf(cat)!==-1) return railOption("DLR","Airport station is directly connected to the terminal",["Very strong fit for Canary Wharf and the City","Short airport access walk","Simple connection into the wider TfL network"],"0–1","Low","Good","Easy");
  if(ap==="SEN"&&["stratford","city","london"].indexOf(cat)!==-1) return railOption("Greater Anglia train","Direct rail toward Stratford and Liverpool Street",["Station is beside the terminal","Direct east-London rail avoids a road transfer","Final connection depends on your exact London address"],"0–1","Low–medium","Good","Easy");
  if(ap==="LGW") return railOption("Train","Use the rail service that lands closest to your London area",["Frequent airport rail choices","Avoids road congestion on the main airport leg","Compare the final London connection to your exact address"]);
  if(ap==="STN") return railOption("Stansted Express","Fast rail first leg into London",["Reliable airport rail benchmark","Good for solo travellers and light luggage","Your final London address may add another connection"]);
  if(ap==="LTN") return railOption("DART + train","Rail first leg via Luton Airport Parkway",["Fast public-transport benchmark","Includes the DART transfer","Final London leg may add walking or another train"]);
  if(ap==="LCY") return railOption("DLR","Simple airport-to-east-London first leg",["Station at the airport","Good for Canary Wharf or City connections","Check the final TfL connection"]);
  if(ap==="SEN") return railOption("Greater Anglia train","Direct rail first leg into east or central London",["Station close to terminal","Direct trains toward Stratford or Liverpool Street","Final London leg depends on your address"]);
  return railOption("Elizabeth line or Tube","Use the public option closest to your exact destination",["Compare the final leg, not only airport-to-centre time","Fewer changes usually matter more with luggage","Check live service before travel"]);
}

function recommend(ap,destination,pax,bags,late){
  const cat=destinationCategory(destination);
  const heavy=bags>=3;
  const group=pax>=4;
  const publicOpt=directPublic(ap,cat);
  const privateOpt=privateOption(pax,bags);
  const hybridOpt=hybridOption();
  let primary=publicOpt;
  let alternatives=[hybridOpt,privateOpt];
  let rationale="Your exact destination is well matched to a public-transport first leg.";

  if(late.level==="high"){
    primary=privateOpt;
    alternatives=[publicOpt,coachOption()];
    rationale="Your estimated terminal-exit time creates a high late-arrival risk, so a pre-booked door-to-door option is the most resilient plan.";
  }else if(group&&heavy){
    primary=privateOpt;
    alternatives=[hybridOpt,publicOpt];
    rationale="A larger group with several large bags makes changes, stairs and the final hotel walk much more important.";
  }else if((bags>=2||group)&&["exact","wembley","westend","victoria"].indexOf(cat)!==-1){
    primary=hybridOpt;
    alternatives=[publicOpt,privateOpt];
    rationale="Your group or luggage profile makes a rail-plus-final-taxi journey a strong balance between speed and door-to-door simplicity.";
  }else if(late.level==="medium"&&bags>=2){
    primary=hybridOpt;
    alternatives=[publicOpt,privateOpt];
    rationale="A later terminal exit plus luggage makes it sensible to reduce London changes while keeping a backup if public transport is disrupted.";
  }
  return {cat:cat,primary:primary,alternatives:alternatives,rationale:rationale,guide:routeGuide(ap,cat)};
}

function metric(label,value){
  return '<div><small>'+label+'</small><b>'+esc(value)+'</b></div>';
}
function optionMarkup(o,primary){
  return '<article class="journey-option '+(primary?'recommended':'')+'">'+
    '<div class="journey-option-top"><span class="journey-icon">'+o.icon+'</span><div><small>'+(primary?'Terminal2City recommends':'Alternative')+'</small><h4>'+esc(o.title)+'</h4><p>'+esc(o.subtitle)+'</p></div></div>'+
    '<ul>'+o.why.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ul>'+
    '<div class="journey-metrics">'+metric("Changes",o.meta.changes)+metric("Walking",o.meta.walk)+metric("Luggage",o.meta.luggage)+metric("Effort",o.meta.effort)+'</div>'+
  '</article>';
}

function show(){
  const ap=$("#ap").value;
  const n=+$("#tr").value;
  const bags=+$("#bg").value;
  const dest=$("#ds").value.trim()||"Central London";
  const ready=readiness(ap,$("#dt").value,n,bags);
  const late=lateStatus(ap,ready);
  const rec=recommend(ap,dest,n,bags,late);
  const terminal=$("#tm").value;
  const range=ready?(fmtTime(ready.low)+"–"+fmtTime(ready.high)):"Add landing time";
  const bagLabel=bags===0?"no large bags":(bags>=4?"4+":bags)+" large bag"+(bags===1?"":"s");

  $("#results").style.display="block";
  $("#results").innerHTML=
    '<div class="result-heading">'+
      '<div><span class="eyebrow">Personalised planning result</span><h3>'+esc(AIRPORT_NAME[ap])+' → '+esc(dest)+'</h3><p>'+esc(terminal)+' · '+n+' traveller'+(n===1?'':'s')+' · '+esc(bagLabel)+'</p></div>'+
      '<span class="risk-badge '+late.level+'">'+esc(late.label)+'</span>'+
    '</div>'+
    '<div class="planning-strip">'+
      '<div><small>Flight lands</small><b>'+(ready?fmtTime(ready.landing):'—')+'</b></div>'+
      '<div><small>Estimated ready to leave terminal</small><b>'+range+'</b><span>Planning estimate, not live queue data</span></div>'+
      '<div><small>Late-arrival check</small><b>'+(late.level==='high'?'Backup strongly advised':late.level==='medium'?'Check last service':'Normal live check')+'</b><span>'+esc(late.text)+'</span></div>'+
    '</div>'+
    '<div class="recommendation-callout"><span>Why this wins for your trip</span><p>'+esc(rec.rationale)+'</p></div>'+
    '<div class="journey-grid">'+optionMarkup(rec.primary,true)+rec.alternatives.map(function(o){return optionMarkup(o,false);}).join("")+'</div>'+
    '<div class="result-footer"><div><b>Planning note</b><p>Terminal exit time includes a buffer for passport control, baggage reclaim and walking through the airport. It cannot predict live queues, delays, engineering work or traffic. Always verify the live operator timetable before booking.</p></div><a class="guide-link" href="'+rec.guide+'">Open detailed route guide →</a></div>';

  try{
    if(typeof gtag==="function") gtag("event","transfer_recommendation_generated",{airport:ap,destination_category:rec.cat,travellers:n,large_bags:bags,late_risk:late.level,recommended_mode:rec.primary.type});
  }catch(_){}

  $("#results").scrollIntoView({behavior:"smooth",block:"start"});
}

$("#compare").onsubmit=function(e){e.preventDefault();show();};

const hd=document.querySelector("header"),mn=$("#mn");
mn.onclick=function(){
  const o=hd.classList.toggle("open");
  mn.setAttribute("aria-expanded",o);
  mn.textContent=o?"✕":"☰";
};
document.querySelectorAll("#nv a").forEach(function(a){
  a.onclick=function(){hd.classList.remove("open");mn.textContent="☰";mn.setAttribute("aria-expanded",false);};
});
document.querySelectorAll('a[href^="#"]').forEach(function(a){
  a.addEventListener("click",function(e){
    const t=document.querySelector(a.getAttribute("href"));
    if(t){
      e.preventDefault();
      t.scrollIntoView({behavior:"smooth",block:"start"});
      if(t.id==="compare") setTimeout(function(){$("#ap").focus({preventScroll:true});},500);
    }
  });
});

const R={GBP:[1,"£"],EUR:[1.17,"€"],USD:[1.33,"$"]};
let C="GBP";
try{const s=localStorage.getItem("t2c-cur");if(R[s])C=s;}catch(e){}
function fx(v){const r=R[C];return r[1]+Math.round(v*r[0]);}
function upd(){document.querySelectorAll("[data-p]").forEach(function(e){e.textContent=fx(+e.dataset.p);});}
$("#cur").value=C;
$("#cur").onchange=function(e){C=e.target.value;try{localStorage.setItem("t2c-cur",C);}catch(_){}upd();};
upd();
