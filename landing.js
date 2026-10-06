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
    clearPlaceSelection();
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

const DESTINATION_AREAS={
  london:{s:51.27,n:51.72,w:-0.57,e:0.37},
  oxford:{s:51.68,n:51.82,w:-1.35,e:-1.12},
  brighton:{s:50.78,n:50.90,w:-0.25,e:-0.05}
};
const DESTINATION_HUBS={
  london:[
    {name:"Paddington",cat:"paddington",lat:51.5154,lng:-0.1755},
    {name:"King's Cross St Pancras",cat:"kings",lat:51.5308,lng:-0.1238},
    {name:"Victoria",cat:"victoria",lat:51.4952,lng:-0.1439},
    {name:"Liverpool Street",cat:"city",lat:51.5178,lng:-0.0823},
    {name:"Farringdon",cat:"city",lat:51.5202,lng:-0.1053},
    {name:"Tottenham Court Road",cat:"westend",lat:51.5165,lng:-0.1309},
    {name:"Canary Wharf",cat:"canary",lat:51.5054,lng:-0.0235},
    {name:"Stratford",cat:"stratford",lat:51.5413,lng:-0.0032},
    {name:"Wembley Park",cat:"wembley",lat:51.5632,lng:-0.2795}
  ],
  oxford:[
    {name:"Oxford railway station",cat:"oxford",lat:51.7534,lng:-1.2701},
    {name:"Gloucester Green coach station",cat:"oxford",lat:51.7547,lng:-1.2636}
  ],
  brighton:[
    {name:"Brighton railway station",cat:"brighton",lat:50.8290,lng:-0.1410}
  ]
};

function insideArea(lat,lng,box){
  return Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=box.s&&lat<=box.n&&lng>=box.w&&lng<=box.e;
}
function destinationArea(lat,lng){
  if(insideArea(lat,lng,DESTINATION_AREAS.london)) return "london";
  if(insideArea(lat,lng,DESTINATION_AREAS.oxford)) return "oxford";
  if(insideArea(lat,lng,DESTINATION_AREAS.brighton)) return "brighton";
  return "";
}
function haversineKm(aLat,aLng,bLat,bLng){
  const r=6371,rad=Math.PI/180;
  const dLat=(bLat-aLat)*rad,dLng=(bLng-aLng)*rad;
  const x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(aLat*rad)*Math.cos(bLat*rad)*Math.sin(dLng/2)*Math.sin(dLng/2);
  return 2*r*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
function lastMileFor(lat,lng){
  const area=destinationArea(lat,lng);
  if(!area) return null;
  const hubs=DESTINATION_HUBS[area]||[];
  if(!hubs.length) return null;
  let best=null;
  hubs.forEach(function(h){
    const km=haversineKm(lat,lng,h.lat,h.lng);
    if(!best||km<best.distanceKm) best={area:area,name:h.name,cat:h.cat,distanceKm:km};
  });
  if(!best) return null;
  if(best.distanceKm<=0.6){
    best.label="Short final walk likely";
    best.detail="The selected destination is close to a major arrival hub in our planning model. Check the exact walking route and step-free access before travel.";
  }else if(best.distanceKm<=1.8){
    best.label="Short final connection";
    best.detail="A short taxi, bus or walk may be easier than adding another rail interchange, especially with luggage.";
  }else{
    best.label="Onward connection matters";
    best.detail="Your destination is not beside the nearest major arrival hub, so include the final Tube, bus or taxi leg when comparing options.";
  }
  return best;
}

function destinationCategory(text,lat,lng){
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
  const lm=lastMileFor(lat,lng);
  if(lm) return lm.cat;
  if(hasAny(s,["central london","london"])) return "london";
  return "exact";
}

function clearPlaceSelection(){
  ["#placeId","#placeLat","#placeLng","#placeAddress"].forEach(function(sel){
    const el=$(sel); if(el) el.value="";
  });
}
function loadGoogleMaps(apiKey){
  if(window.google&&window.google.maps&&window.google.maps.importLibrary) return Promise.resolve(window.google.maps);
  if(window.__t2cMapsPromise) return window.__t2cMapsPromise;
  window.__t2cMapsPromise=new Promise(function(resolve,reject){
    const cb="__t2cGoogleMapsReady";
    window[cb]=function(){resolve(window.google.maps);delete window[cb];};
    const script=document.createElement("script");
    script.async=true;script.defer=true;
    script.src="https://maps.googleapis.com/maps/api/js?key="+encodeURIComponent(apiKey)+"&v=weekly&loading=async&callback="+cb;
    script.onerror=function(){reject(new Error("Google Maps JavaScript API failed to load"));};
    document.head.appendChild(script);
  });
  return window.__t2cMapsPromise;
}
async function initGoogleDestinationSearch(){
  const config=window.T2C_GOOGLE_MAPS||{};
  const key=(config.apiKey||"").trim();
  const host=$("#placeHost"),fallback=$("#ds"),hint=$("#destinationHint");
  if(!host||!fallback) return;

  fallback.addEventListener("input",function(){
    clearPlaceSelection();
    if(hint) hint.textContent="Hotel, address, station or postcode";
  });

  if(!key) return;

  try{
    await loadGoogleMaps(key);
    const lib=await google.maps.importLibrary("places");
    const autocomplete=new lib.PlaceAutocompleteElement({includedRegionCodes:[config.region||"gb"]});
    autocomplete.placeholder="Hotel, address, station or postcode";
    autocomplete.setAttribute("aria-label","Exact destination in the United Kingdom");
    host.appendChild(autocomplete);
    host.hidden=false;
    fallback.hidden=true;
    if(hint){
      hint.textContent="Search powered by Google Places · select a result";
      hint.classList.add("google-ready");
    }

    autocomplete.addEventListener("gmp-select",async function(event){
      try{
        const prediction=event.placePrediction;
        if(!prediction) return;
        const place=prediction.toPlace();
        await place.fetchFields({fields:["id","displayName","formattedAddress","location","types"]});
        const display=place.displayName||String(prediction.text||"")||"";
        const address=place.formattedAddress||display;
        const lat=place.location&&place.location.lat?place.location.lat():NaN;
        const lng=place.location&&place.location.lng?place.location.lng():NaN;
        fallback.value=display||address;
        $("#placeId").value=place.id||prediction.placeId||"";
        $("#placeLat").value=Number.isFinite(lat)?String(lat):"";
        $("#placeLng").value=Number.isFinite(lng)?String(lng):"";
        $("#placeAddress").value=address;
        if(hint){
          hint.textContent=address?"Selected: "+address:"Destination selected";
          hint.classList.add("google-selected");
        }
      }catch(err){
        console.warn("Terminal2City: could not read selected Google Place",err);
        if(hint) hint.textContent="Select a suggested place or enter the destination manually";
      }
    });

    autocomplete.addEventListener("gmp-error",function(){
      host.hidden=true;
      fallback.hidden=false;
      if(hint) hint.textContent="Enter hotel, address, station or postcode";
    });
  }catch(err){
    console.warn("Terminal2City: Google Places unavailable",err);
    host.hidden=true;
    fallback.hidden=false;
  }
}
initGoogleDestinationSearch();

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

function recommend(ap,destination,pax,bags,late,lat,lng){
  const lastMile=lastMileFor(lat,lng);
  const cat=destinationCategory(destination,lat,lng);
  const heavy=bags>=3;
  const group=pax>=4;
  const publicOpt=directPublic(ap,cat);
  const privateOpt=privateOption(pax,bags);
  const hybridOpt=hybridOption();
  let primary=publicOpt;
  let alternatives=[hybridOpt,privateOpt];
  let rationale=lastMile
    ? "Your exact destination is being matched to "+lastMile.name+", the closest major arrival hub in our planning model."
    : "Your destination is well matched to a public-transport first leg.";

  if(late.level==="high"){
    primary=privateOpt;
    alternatives=[publicOpt,coachOption()];
    rationale="Your estimated terminal-exit time creates a high late-arrival risk, so a pre-booked door-to-door option is the most resilient plan.";
  }else if(group&&heavy){
    primary=privateOpt;
    alternatives=[hybridOpt,publicOpt];
    rationale="A larger group with several large bags makes changes, stairs and the final hotel walk much more important.";
  }else if(lastMile&&lastMile.distanceKm>1.3&&bags>=2){
    primary=hybridOpt;
    alternatives=[publicOpt,privateOpt];
    rationale="Your selected destination is not right beside "+lastMile.name+" and you have luggage, so rail plus a short final taxi can reduce walking and extra interchanges.";
  }else if((bags>=2||group)&&["exact","wembley","westend","victoria"].indexOf(cat)!==-1){
    primary=hybridOpt;
    alternatives=[publicOpt,privateOpt];
    rationale="Your group or luggage profile makes a rail-plus-final-taxi journey a strong balance between speed and door-to-door simplicity.";
  }else if(late.level==="medium"&&bags>=2){
    primary=hybridOpt;
    alternatives=[publicOpt,privateOpt];
    rationale="A later terminal exit plus luggage makes it sensible to reduce London changes while keeping a backup if public transport is disrupted.";
  }
  return {cat:cat,primary:primary,alternatives:alternatives,rationale:rationale,guide:routeGuide(ap,cat),lastMile:lastMile};
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
  const address=$("#placeAddress").value.trim();
  const placeId=$("#placeId").value.trim();
  const lat=parseFloat($("#placeLat").value);
  const lng=parseFloat($("#placeLng").value);
  const hasCoords=Number.isFinite(lat)&&Number.isFinite(lng);
  const ready=readiness(ap,$("#dt").value,n,bags);
  const late=lateStatus(ap,ready);
  const rec=recommend(ap,dest,n,bags,late,lat,lng);
  const terminal=$("#tm").value;
  const range=ready?(fmtTime(ready.low)+"–"+fmtTime(ready.high)):"Add landing time";
  const bagLabel=bags===0?"no large bags":(bags>=4?"4+":bags)+" large bag"+(bags===1?"":"s");
  const displayDestination=address||dest;
  let lastMileHtml="";
  if(rec.lastMile){
    const km=rec.lastMile.distanceKm;
    const mapsQuery=encodeURIComponent(displayDestination);
    const mapsUrl="https://www.google.com/maps/search/?api=1&query="+mapsQuery+(placeId?"&query_place_id="+encodeURIComponent(placeId):"");
    lastMileHtml=
      '<div class="last-mile-card">'+
        '<div class="last-mile-icon">📍</div>'+
        '<div><span>Exact-destination check</span><h4>'+esc(rec.lastMile.name)+' · ~'+(km<1?km.toFixed(1):km.toFixed(1))+' km straight-line</h4><p><b>'+esc(rec.lastMile.label)+'.</b> '+esc(rec.lastMile.detail)+'</p><small>Distance is to a major arrival hub in our comparison model, not a live walking or driving route.</small></div>'+
        '<a href="'+mapsUrl+'" target="_blank" rel="noopener">Open destination ↗</a>'+
      '</div>';
  }else if(hasCoords){
    lastMileHtml=
      '<div class="last-mile-card neutral">'+
        '<div class="last-mile-icon">📍</div>'+
        '<div><span>Exact destination recognised</span><h4>'+esc(displayDestination)+'</h4><p>This address is outside the London, Oxford and Brighton destination clusters currently modelled for last-mile scoring. We will keep the recommendation conservative until the corridor is verified.</p></div>'+
      '</div>';
  }

  $("#results").style.display="block";
  $("#results").innerHTML=
    '<div class="result-heading">'+
      '<div><span class="eyebrow">Personalised planning result</span><h3>'+esc(AIRPORT_NAME[ap])+' → '+esc(displayDestination)+'</h3><p>'+esc(terminal)+' · '+n+' traveller'+(n===1?'':'s')+' · '+esc(bagLabel)+(hasCoords?' · exact place selected':'')+'</p></div>'+
      '<span class="risk-badge '+late.level+'">'+esc(late.label)+'</span>'+
    '</div>'+
    '<div class="planning-strip">'+
      '<div><small>Flight lands</small><b>'+(ready?fmtTime(ready.landing):'—')+'</b></div>'+
      '<div><small>Estimated ready to leave terminal</small><b>'+range+'</b><span>Planning estimate, not live queue data</span></div>'+
      '<div><small>Late-arrival check</small><b>'+(late.level==='high'?'Backup strongly advised':late.level==='medium'?'Check last service':'Normal live check')+'</b><span>'+esc(late.text)+'</span></div>'+
    '</div>'+
    lastMileHtml+
    '<div class="recommendation-callout"><span>Why this wins for your trip</span><p>'+esc(rec.rationale)+'</p></div>'+
    '<div class="journey-grid">'+optionMarkup(rec.primary,true)+rec.alternatives.map(function(o){return optionMarkup(o,false);}).join("")+'</div>'+
    '<div class="result-footer"><div><b>Planning note</b><p>Terminal exit time includes a buffer for passport control, baggage reclaim and walking through the airport. Last-mile distance is an approximate straight-line comparison to selected major hubs. Live queues, walking routes, traffic, engineering work and timetables must be checked before booking.</p></div><a class="guide-link" href="'+rec.guide+'">Open detailed route guide →</a></div>';

  try{
    if(typeof gtag==="function") gtag("event","transfer_recommendation_generated",{airport:ap,destination_category:rec.cat,travellers:n,large_bags:bags,late_risk:late.level,recommended_mode:rec.primary.type,exact_place_selected:hasCoords});
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
