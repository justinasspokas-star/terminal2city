(function(){
  const routeMap = {
    'Heathrow Airport|Oxford':'heathrow-to-oxford.html',
    'Heathrow Airport|London':'heathrow-to-london.html',
    'Stansted Airport|London':'stansted-to-london.html',
    'Gatwick Airport|Brighton':'gatwick-to-brighton.html',
    'Luton Airport|London':'luton-to-london.html',
    'London City Airport|London':'london-city-airport-to-london.html',
    'Southend Airport|London':'southend-to-london.html'
  };
  const form = document.querySelector('[data-route-search]');
  const date = document.querySelector('[data-date]');
  if(date && !date.value){
    const d = new Date(); d.setDate(d.getDate()+1);
    date.value = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function normaliseText(value){
    return (value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }
  function coordinatesInside(lat,lng,b){
    return Number.isFinite(lat) && Number.isFinite(lng) && lat>=b.s && lat<=b.n && lng>=b.w && lng<=b.e;
  }
  function inferPublishedGuide(from, destination, address, lat, lng){
    const text = normaliseText(`${destination||''} ${address||''}`);
    if(from==='Heathrow Airport'){
      if(/\boxford\b|headington|summertown|cowley/.test(text) || coordinatesInside(lat,lng,{s:51.65,n:51.86,w:-1.42,e:-1.05})) return {city:'Oxford',page:'heathrow-to-oxford.html'};
      if(/\blondon\b|paddington|bond street|tottenham court road|farringdon|liverpool street|king'?s cross|piccadilly|victoria|westminster|canary wharf/.test(text) || coordinatesInside(lat,lng,{s:51.27,n:51.72,w:-0.57,e:0.37})) return {city:'London',page:'heathrow-to-london.html'};
    }
    if(from==='Gatwick Airport'){
      if(/\bbrighton\b|\bhove\b|kemp ?town/.test(text) || coordinatesInside(lat,lng,{s:50.77,n:50.92,w:-0.30,e:0.08})) return {city:'Brighton',page:'gatwick-to-brighton.html'};
    }
    if(from==='Stansted Airport'){
      if(/\blondon\b|liverpool street|stratford|victoria|king'?s cross|paddington/.test(text) || coordinatesInside(lat,lng,{s:51.27,n:51.72,w:-0.57,e:0.37})) return {city:'London',page:'stansted-to-london.html'};
    }
    if(from==='Luton Airport'){
      if(/\blondon\b|st pancras|king'?s cross|farringdon|blackfriars|victoria|paddington|westminster/.test(text) || coordinatesInside(lat,lng,{s:51.27,n:51.72,w:-0.57,e:0.37})) return {city:'London',page:'luton-to-london.html'};
    }
    if(from==='London City Airport'){
      if(/\blondon\b|bank|canary wharf|canning town|westminster|covent garden|west end|stratford/.test(text) || coordinatesInside(lat,lng,{s:51.27,n:51.72,w:-0.57,e:0.37})) return {city:'London',page:'london-city-airport-to-london.html'};
    }
    if(from==='Southend Airport'){
      if(/\blondon\b|stratford|liverpool street|canary wharf|victoria|westminster|king'?s cross|south bank|london bridge/.test(text) || coordinatesInside(lat,lng,{s:51.27,n:51.72,w:-0.57,e:0.37})) return {city:'London',page:'southend-to-london.html'};
    }
    return null;
  }

  function loadGoogleMaps(apiKey){
    if(window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps);
    if(window.__t2cMapsPromise) return window.__t2cMapsPromise;
    window.__t2cMapsPromise = new Promise((resolve,reject)=>{
      const cb='__t2cGoogleMapsReady';
      window[cb]=()=>{ resolve(window.google.maps); delete window[cb]; };
      const script=document.createElement('script');
      script.async=true; script.defer=true;
      script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&callback=${cb}`;
      script.onerror=()=>reject(new Error('Google Maps JavaScript API failed to load'));
      document.head.appendChild(script);
    });
    return window.__t2cMapsPromise;
  }

  const routeOrigins={
    'heathrow-oxford':{lat:51.4700,lng:-0.4543,name:'Heathrow Airport'},
    'heathrow-london':{lat:51.4700,lng:-0.4543,name:'Heathrow Airport'},
    'gatwick-brighton':{lat:51.1537,lng:-0.1821,name:'Gatwick Airport'},
    'stansted-london':{lat:51.8860,lng:0.2389,name:'Stansted Airport'},
    'luton-london':{lat:51.8747,lng:-0.3683,name:'Luton Airport'},
    'london-city-london':{lat:51.5053,lng:0.0553,name:'London City Airport'},
    'southend-london':{lat:51.5714,lng:0.6956,name:'London Southend Airport'}
  };
  async function renderExactDestinationMap(container,routeId,dLat,dLng,destination,mapsUrl){
    if(!container || !Number.isFinite(dLat) || !Number.isFinite(dLng)) return;
    const origin=routeOrigins[routeId]; if(!origin) return;
    container.innerHTML=`<div class="route-map-head"><div><span class="eyebrow">Location overview</span><h3>${escapeHtml(origin.name)} → ${escapeHtml(destination)}</h3><p>Airport and exact destination pins. This is a location overview, not a live driving route.</p></div><a class="source-link" href="${mapsUrl}" target="_blank" rel="noopener">Open route in Google Maps ↗</a></div><div class="route-map-canvas" data-map-canvas><div class="map-fallback">Interactive map preview appears after your Google Maps API key is configured.</div></div>`;
    const config=window.T2C_GOOGLE_MAPS||{}; const key=(config.apiKey||'').trim();
    if(!key) return;
    try{
      await loadGoogleMaps(key);
      const mapEl=container.querySelector('[data-map-canvas]');
      const center={lat:(origin.lat+dLat)/2,lng:(origin.lng+dLng)/2};
      const map=new google.maps.Map(mapEl,{center,zoom:9,mapTypeControl:false,streetViewControl:false,fullscreenControl:false});
      new google.maps.Marker({map,position:{lat:origin.lat,lng:origin.lng},title:origin.name});
      new google.maps.Marker({map,position:{lat:dLat,lng:dLng},title:destination});
      new google.maps.Polyline({map,path:[{lat:origin.lat,lng:origin.lng},{lat:dLat,lng:dLng}],geodesic:true,strokeOpacity:.65,strokeWeight:3});
      const bounds=new google.maps.LatLngBounds(); bounds.extend({lat:origin.lat,lng:origin.lng}); bounds.extend({lat:dLat,lng:dLng}); map.fitBounds(bounds,70);
    }catch(err){ console.warn('Terminal2City: map preview unavailable',err); }
  }

  async function initGoogleDestinationSearch(form){
    const config=window.T2C_GOOGLE_MAPS||{};
    const key=(config.apiKey||'').trim();
    const host=form.querySelector('[data-google-place-host]');
    const fallback=form.querySelector('[data-destination-fallback]');
    const hidden=form.querySelector('[data-destination-value]');
    const placeId=form.querySelector('[data-place-id]');
    const placeLat=form.querySelector('[data-place-lat]');
    const placeLng=form.querySelector('[data-place-lng]');
    const placeAddress=form.querySelector('[data-place-address]');
    const hint=form.querySelector('[data-destination-hint]');
    if(!host || !fallback || !hidden) return;

    const syncFallback=()=>{
      hidden.value=fallback.value.trim();
      placeId.value=''; placeLat.value=''; placeLng.value=''; placeAddress.value='';
    };
    fallback.addEventListener('input',syncFallback);
    fallback.addEventListener('change',syncFallback);

    if(!key){
      hint.textContent='Hotel, address, station, city or postcode · Google Places activates after API key setup';
      return;
    }
    try{
      await loadGoogleMaps(key);
      const {PlaceAutocompleteElement}=await google.maps.importLibrary('places');
      const autocomplete=new PlaceAutocompleteElement({
        includedRegionCodes:[config.region||'gb']
      });
      autocomplete.placeholder='Hotel, address, station, city or postcode';
      autocomplete.setAttribute('aria-label','Exact destination in the United Kingdom');
      host.appendChild(autocomplete);
      host.hidden=false;
      fallback.hidden=true;
      hidden.value=''; placeId.value=''; placeLat.value=''; placeLng.value=''; placeAddress.value='';
      hint.textContent='Google Places search · UK results';
      hint.classList.add('google-ready');

      autocomplete.addEventListener('gmp-select', async (event)=>{
        try{
          const prediction=event.placePrediction;
          if(!prediction) return;
          const place=prediction.toPlace();
          await place.fetchFields({fields:['id','displayName','formattedAddress','location','types']});
          const display=place.displayName || prediction.text?.toString() || '';
          const address=place.formattedAddress || display;
          const lat=place.location?.lat?.();
          const lng=place.location?.lng?.();
          hidden.value=display || address;
          placeId.value=place.id || prediction.placeId || '';
          placeLat.value=Number.isFinite(lat)?String(lat):'';
          placeLng.value=Number.isFinite(lng)?String(lng):'';
          placeAddress.value=address;
          hint.textContent=address ? `Selected: ${address}` : 'Destination selected';
          hint.classList.add('google-selected');
        }catch(err){
          console.warn('Terminal2City: could not read selected Google Place',err);
          hint.textContent='Destination selected · check the address before continuing';
        }
      });
      autocomplete.addEventListener('gmp-error',()=>{
        hint.textContent='Google Places is temporarily unavailable · use the destination field manually';
        host.hidden=true; fallback.hidden=false; fallback.focus();
      });
    }catch(err){
      console.warn('Terminal2City: Google Places not available',err);
      hint.textContent='Google Places unavailable · manual destination search remains active';
    }
  }

  if(form){
    initGoogleDestinationSearch(form);
    const airportSelect=form.querySelector('[data-airport-select]');
    const terminalSelect=form.querySelector('[data-terminal-select]');
    const terminalOptions={
      'Heathrow Airport':['Terminal 2','Terminal 3','Terminal 4','Terminal 5'],
      'Gatwick Airport':['South Terminal','North Terminal'],
      'Stansted Airport':['Main terminal'],
      'Luton Airport':['Main terminal'],
      'London City Airport':['Main terminal'],
      'Southend Airport':['Main terminal']
    };
    function syncTerminalOptions(){
      if(!terminalSelect || !airportSelect) return;
      const current=terminalSelect.value;
      terminalSelect.innerHTML=(terminalOptions[airportSelect.value]||[]).map(x=>`<option value="${x}">${x}</option>`).join('');
      if([...terminalSelect.options].some(o=>o.value===current)) terminalSelect.value=current;
    }
    syncTerminalOptions();
    const fallbackDefaults={'Heathrow Airport':'London','Gatwick Airport':'Brighton','Stansted Airport':'London','Luton Airport':'London','London City Airport':'London','Southend Airport':'London'};
    airportSelect?.addEventListener('change',()=>{
      syncTerminalOptions();
      const fallback=form.querySelector('[data-destination-fallback]');
      const hidden=form.querySelector('[data-destination-value]');
      if(fallback && !fallback.hidden){
        fallback.value=fallbackDefaults[airportSelect.value]||'';
        hidden.value=fallback.value;
        form.querySelector('[data-place-id]').value='';
        form.querySelector('[data-place-lat]').value='';
        form.querySelector('[data-place-lng]').value='';
        form.querySelector('[data-place-address]').value='';
      }else if(hidden){
        hidden.value='';
        form.querySelector('[data-destination-hint]').textContent='Google Places search · UK results';
      }
    });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const from=form.querySelector('[name="from"]')?.value||'';
      const fallback=form.querySelector('[data-destination-fallback]');
      const destinationValue=form.querySelector('[data-destination-value]');
      if(fallback && !fallback.hidden) destinationValue.value=fallback.value.trim();
      const to=destinationValue?.value?.trim()||'';
      if(!to){
        form.querySelector('[data-destination-hint]').textContent='Enter a hotel, address, station, city or postcode first.';
        fallback?.focus();
        return;
      }
      const address=form.querySelector('[name="placeAddress"]')?.value||'';
      const lat=parseFloat(form.querySelector('[name="placeLat"]')?.value||'');
      const lng=parseFloat(form.querySelector('[name="placeLng"]')?.value||'');
      const guide=inferPublishedGuide(from,to,address,lat,lng) || (routeMap[`${from}|${to}`] ? {city:to,page:routeMap[`${from}|${to}`]} : null);
      const qs=new URLSearchParams({
        date:form.querySelector('[name="date"]')?.value||'',
        time:form.querySelector('[name="time"]')?.value||'',
        passengers:form.querySelector('[name="passengers"]')?.value||'1',
        bags:form.querySelector('[name="bags"]')?.value||'0',
        terminal:form.querySelector('[name="terminal"]')?.value||'',
        destination:to,
        placeAddress:address,
        placeId:form.querySelector('[name="placeId"]')?.value||'',
        placeLat:Number.isFinite(lat)?String(lat):'',
        placeLng:Number.isFinite(lng)?String(lng):''
      });
      window.location.href = guide ? `${guide.page}?${qs}` : `results.html?from=${encodeURIComponent(from)}&${qs}`;
    });
  }

  function escapeHtml(value){
    return String(value||'').replace(/[&<>'\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }
  function inferLocalDestination(routeId,text){
    const t=normaliseText(text);
    if(routeId==='heathrow-oxford'){
      if(t.includes('headington')) return 'headington';
      if(t.includes('summertown')) return 'summertown';
      if(t.includes('cowley')) return 'cowley';
      if(/oxford (station|railway)|oxford city centre|carfax|gloucester green|high street/.test(t)) return 'oxford-centre';
      return 'outside';
    }
    if(routeId==='stansted-london'){
      if(t.includes('liverpool street')) return 'liverpool';
      if(t.includes('stratford')) return 'stratford';
      if(t.includes('victoria')) return 'victoria';
      if(/king'?s cross|st pancras/.test(t)) return 'kings-cross';
      if(t.includes('paddington')) return 'paddington';
      return 'other';
    }
    if(routeId==='gatwick-brighton'){
      if(/brighton (station|railway)/.test(t)) return 'station';
      if(t.includes('hove')) return 'hove';
      if(/kemp ?town/.test(t)) return 'kemp';
      if(/brighton pier|seafront|the lanes|royal pavilion/.test(t)) return 'seafront';
      return 'outside';
    }
    if(routeId==='luton-london'){
      if(/st pancras|king'?s cross/.test(t)) return 'stpancras';
      if(/farringdon|barbican|smithfield/.test(t)) return 'farringdon';
      if(/blackfriars|south bank|southwark/.test(t)) return 'blackfriars';
      if(/victoria|westminster/.test(t)) return 'victoria';
      if(/paddington|bayswater/.test(t)) return 'paddington';
      return 'other';
    }
    if(routeId==='london-city-london'){
      if(/bank|city of london|monument|liverpool street/.test(t)) return 'bank';
      if(/canary wharf|heron quays/.test(t)) return 'canary';
      if(/canning town|royal docks|excel|custom house/.test(t)) return 'canning';
      if(/westminster|waterloo/.test(t)) return 'westminster';
      if(/covent garden|soho|piccadilly|oxford circus|west end/.test(t)) return 'westend';
      if(/stratford/.test(t)) return 'stratford';
      return 'other';
    }
    if(routeId==='heathrow-london'){
      if(/paddington/.test(t)) return 'paddington';
      if(/bond street|oxford circus|mayfair/.test(t)) return 'bond';
      if(/tottenham court road|soho|covent garden|west end/.test(t)) return 'tcr';
      if(/farringdon|barbican|smithfield/.test(t)) return 'farringdon';
      if(/liverpool street|city of london|bank|monument/.test(t)) return 'liverpool';
      if(/king'?s cross|st pancras|piccadilly circus|leicester square/.test(t)) return 'piccadilly';
      if(/victoria|westminster/.test(t)) return 'victoria';
      if(/canary wharf/.test(t)) return 'canary';
      return 'other';
    }
    if(routeId==='southend-london'){
      if(/stratford|olympic park/.test(t)) return 'stratford';
      if(/liverpool street|city of london|bank|monument/.test(t)) return 'liverpool';
      if(/canary wharf/.test(t)) return 'canary';
      if(/london bridge|south bank|waterloo|southwark/.test(t)) return 'southbank';
      if(/king'?s cross|st pancras|west end|soho|covent garden/.test(t)) return 'westend';
      if(/victoria|westminster/.test(t)) return 'victoria';
      return 'other';
    }
    return '';
  }

  function isLate(time){ if(!time) return false; const h=parseInt(time.split(':')[0],10); return h>=23 || h<6; }
  function labelFor(select){ return select?.options[select.selectedIndex]?.text || ''; }
  function journeyMetrics(route,title,dest,terminal,pax,bags){
    const t=normaliseText(title); const heavy=bags>=3;
    let changes=0, walking='Low', luggage='Low', door='No', effort='Low';
    if(t.includes(' or ')){ return {changes:'Varies',walking:'Varies',luggage:heavy?'Medium':'Varies',door:'Varies',effort:'Medium'}; }
    if(t.includes('private transfer')){ door='Yes'; changes=0; walking='Low'; luggage='Low'; effort='Low'; }
    else if(t.includes('coach')){ changes=0; walking='Low'; luggage=heavy?'Medium':'Low'; effort='Low'; }
    else if(t.includes('one change') || t.includes('via tottenham')){ changes=1; walking='Medium'; luggage=heavy?'High':'Medium'; effort=heavy?'Higher':'Medium'; }
    else if(t.includes('local connection') || t.includes('onward london connection') || t.includes('onward connection')){ changes=1; walking='Medium'; luggage=heavy?'High':'Medium'; effort=heavy?'Higher':'Medium'; }
    else if(t.includes('train') || t.includes('stansted express')){ changes=0; walking='Low'; luggage=heavy?'Medium':'Low'; effort='Low'; }
    if(route==='heathrow-oxford' && terminal==='Terminal 4' && t.includes('coach')){
      changes=1; walking='Medium'; luggage=heavy?'High':'Medium'; effort='Medium';
    }
    if(route==='gatwick-brighton' && terminal==='North Terminal' && t.includes('train')){
      changes+=1; walking='Medium'; luggage=heavy?'High':'Medium'; effort=changes>1||heavy?'Higher':'Medium';
    }
    if(route==='stansted-london' && ['victoria','kings-cross','paddington','other'].includes(dest) && t.includes('stansted express')){
      changes=Math.max(changes,1); walking='Medium'; luggage=heavy?'High':'Medium'; effort=heavy?'Higher':'Medium';
    }
    if(route==='luton-london' && (t.includes('dart') || t.includes('train'))){
      changes=Math.max(changes,1); walking='Low'; luggage=heavy?'Medium':'Low'; effort='Medium';
      if(['victoria','paddington','other'].includes(dest)){ changes=Math.max(changes,2); walking='Medium'; luggage=heavy?'High':'Medium'; effort=heavy?'Higher':'Medium'; }
    }
    if(route==='london-city-london' && t.includes('dlr')){
      changes=(dest==='bank' || dest==='stratford')?0:1; walking=changes?'Medium':'Low'; luggage=heavy?(changes?'High':'Medium'):'Low'; effort=changes?'Medium':'Low';
    }
    if(route==='heathrow-london'){
      if(t.includes('heathrow express')){ changes=dest==='paddington'?0:1; walking=changes?'Medium':'Low'; luggage=heavy?(changes?'High':'Medium'):'Low'; effort=changes?'Medium':'Low'; }
      if(t.includes('elizabeth')){ changes=['paddington','bond','tcr','farringdon','liverpool'].includes(dest)?0:1; walking=changes?'Medium':'Low'; luggage=heavy?(changes?'High':'Medium'):'Low'; effort=changes?'Medium':'Low'; }
      if(t.includes('piccadilly')){ changes=dest==='piccadilly'?0:1; walking=changes?'Medium':'Low'; luggage=heavy?(changes?'High':'Medium'):'Low'; effort=changes?'Medium':'Low'; }
      if(t.includes('coach')){ changes=dest==='victoria'?0:1; walking=changes?'Medium':'Low'; luggage=heavy?'Medium':'Low'; effort=changes?'Medium':'Low'; }
    }
    if(route==='southend-london' && t.includes('train')){
      changes=['stratford','liverpool'].includes(dest)?0:1; walking=changes?'Medium':'Low'; luggage=heavy?(changes?'High':'Medium'):'Low'; effort=changes?'Medium':'Low';
    }
    return {changes,walking,luggage,door,effort};
  }
  function optionCard(title,subtitle,why,badges,kind='primary',context={}){
    const m=journeyMetrics(context.route,title,context.dest,context.terminal,context.pax,context.bags);
    const changeLabel=typeof m.changes==='number' ? (m.changes===0?'0':`${m.changes}+`) : m.changes;
    return `<article class="fit-card ${kind}"><div class="fit-top"><span class="fit-label">${kind==='primary'?'Best fit':'Also consider'}</span><h3>${title}</h3><p>${subtitle}</p></div><div class="fit-badges">${badges.map(x=>`<span>${x}</span>`).join('')}</div><div class="journey-effort"><div class="effort-head"><b>Journey effort</b><span class="effort-level effort-${m.effort.toLowerCase()}">${m.effort}</span></div><div class="effort-grid"><span><small>Changes</small><b>${changeLabel}</b></span><span><small>Walking</small><b>${m.walking}</b></span><span><small>Luggage effort</small><b>${m.luggage}</b></span><span><small>Door to door</small><b>${m.door}</b></span></div></div><div class="fit-why"><b>Why this fits your trip</b><p>${why}</p></div></article>`;
  }
  function getRecommendation(route,dest,time,pax,bags,terminal){
    const late=isLate(time), group=pax>=3, heavy=bags>=3;
    let primary, alt, note='';
    if(route==='heathrow-oxford'){
      const outlying=['headington','summertown','cowley','outside'].includes(dest);
      if(group && (heavy || outlying)){
        primary=['Private transfer','Door to door',`A group of ${pax}${heavy?' with several large bags':''} reduces the inconvenience of an interchange or a second local trip.`,['No changes','Final address','Group-friendly']];
        alt=['Direct Airline coach','Direct airport coach','The Heathrow–Oxford coach remains worth comparing because it avoids a rail change and runs day and night.',['Direct','24/7 service','Luggage-friendly']];
      } else {
        primary=['Direct Airline coach','Simple airport-to-Oxford option',late?'Your landing time is late. The Airline operates 24/7, so it is the first public-transport option to check against the live timetable.':'It is direct, avoids central London and removes the rail interchange from the journey.',['Direct','24/7 service','No London change']];
        alt=['Private transfer','Door to door',outlying?'Your final destination is outside the main city-centre arrival point, so door-to-door travel may remove another local connection.':'Useful when convenience matters more than the lowest public-transport fare.',['Final address','No changes']];
      }
      note='There is no direct train from Heathrow to Oxford. If you prefer rail, compare the full journey including the interchange and final trip from Oxford station.';
    }
    if(route==='stansted-london'){
      if(group && heavy){
        primary=['Private transfer','Door to door in London',`With ${pax} travellers and ${bags}+ large bags, avoiding a station change and the final Tube/taxi leg can be valuable.`,['No changes','Final address','Luggage-friendly']];
        alt=['Train or direct coach','Choose by London area','Liverpool Street strongly suits the train; several London districts also have direct coach stops.',['Area-specific','Check live times']];
      } else if(late){
        primary=['Direct coach','Strong late-arrival option','Your landing time falls in the late-night window. Stansted coach services operate across very late and early hours, while train patterns should be checked carefully.',['Late-night coverage','Multiple London stops']];
        alt=['Private transfer','Door to door','Useful if your hotel is not close to a late-night coach stop or you want to avoid onward night transport.',['Final address','No interchange']];
      } else if(dest==='liverpool'){
        primary=['Stansted Express','Direct to Liverpool Street','Your destination matches the rail terminus. The published average journey is about 48 minutes, so this is a strong first option to check.',['Direct','~48 min average','City of London']];
        alt=['Direct coach','Another direct option','Coach services also serve Liverpool Street and can be worth comparing on price, luggage and departure time.',['Direct stop','Luggage hold']];
      } else if(dest==='stratford'){
        primary=['Direct coach','Direct to Stratford on selected services','Your East London destination can be served directly by coach, avoiding a rail change at Tottenham Hale.',['Direct stop','East London']];
        alt=['Rail via Tottenham Hale','Train + one change','Stansted Express publishes Stratford journeys with a change at Tottenham Hale; compare the live timing against the direct coach.',['1 change','Rail option']];
      } else if(['victoria','kings-cross'].includes(dest)){
        primary=['Direct coach','Closer to your London destination','National Express lists direct Stansted coach stops including Victoria and King’s Cross/St Pancras, which can remove a cross-London transfer.',['Direct London stop','Less onward travel']];
        alt=['Stansted Express + London connection','Fast airport rail leg','The train to Liverpool Street can still work well, but count the onward Tube/taxi leg to your final area.',['Fast airport leg','Onward connection']];
      } else {
        primary=['Stansted Express + onward London connection','Predictable airport rail leg','For a destination not matched to a direct coach stop, start by comparing the fast rail leg to Liverpool Street/Tottenham Hale with the final London connection.',['Rail-first','Check final leg']];
        alt=['Private transfer','Door to door','Useful when your hotel is awkward by public transport, especially with luggage or several travellers.',['Final address','No changes']];
      }
      note='Stansted Express normally runs to Liverpool Street and also supports Stratford journeys via Tottenham Hale. Coach networks serve multiple London stops, so “London” alone is not enough to choose well.';
    }
    if(route==='gatwick-brighton'){
      const outlying=['hove','kemp','outside'].includes(dest);
      if(group && (heavy || outlying)){
        primary=['Private transfer','Door to door in Brighton & Hove',`A group of ${pax}${heavy?' with several large bags':''} heading beyond Brighton station can avoid the rail trip plus a local taxi/bus.`,['No changes','Final address','Group-friendly']];
        alt=['Direct train + local connection','Fast airport-to-Brighton leg','The direct train is still a strong benchmark; compare it with the cost and friction of the final local leg.',['Direct rail','~30 min average']];
      } else if(late){
        primary=['Check direct train first','Fast when a suitable service is running','Gatwick–Brighton has direct trains, but your late landing makes the live timetable especially important.',['Direct rail','Live check needed']];
        alt=['Coach or private transfer','Fallbacks for a late arrival','Use these when rail timing does not fit your flight or your final address adds another difficult connection.',['Late-arrival alternatives']];
      } else if(['station','seafront'].includes(dest)){
        primary=['Direct train','Strong fit for central Brighton','The airport publishes an average direct journey of about 30 minutes. For central Brighton, it usually gives a simple benchmark with no road-traffic dependency.',['Direct','~30 min average','South Terminal station']];
        alt=['Coach','Direct road alternative','Worth comparing when fare, luggage or your exact departure time matters more than rail predictability.',['Direct services','Luggage hold']];
      } else {
        primary=['Direct train + local connection','Fast first leg to Brighton','The train gets you to Brighton quickly, but include the final taxi/bus to Hove, Kemptown or your exact address.',['Direct rail','Add final leg']];
        alt=['Private transfer','Door to door','Can remove the local connection and becomes more attractive as passenger and luggage count rise.',['Final address','No changes']];
      }
      note='Gatwick Airport says contactless is not valid for travel south to Brighton. Buy the correct rail ticket rather than assuming London contactless rules apply.';
    }
    if(route==='luton-london'){
      if(group && heavy){
        primary=['Private transfer','Door to door in London',`With ${pax} travellers and ${bags}+ large bags, a vehicle removes the DART, station movement and any final London interchange.`,['No changes','Exact address','Group-friendly']];
        alt=['DART + train','Fast rail benchmark','Use the rail option as the price/time benchmark, especially if your destination is close to St Pancras, Farringdon or Blackfriars.',['DART included on through ticket','Central London rail']];
      } else if(late){
        primary=['Direct coach','Terminal-to-London option','Your landing time is late. National Express advertises services across the day and night, so check the live coach departure after allowing for baggage and immigration.',['From terminal','Multiple London stops','Late-arrival friendly']];
        alt=['Private transfer','Door to door','Useful if the next coach stop is far from your hotel or you prefer to avoid onward night transport.',['Exact address','No changes']];
      } else if(['stpancras','farringdon','blackfriars'].includes(dest)){
        primary=['DART + direct train','Strong fit for your London area','The DART connects the terminal to Luton Airport Parkway, then direct Thameslink services continue to this part of central London.',['DART under 4 min','Direct rail from Parkway','Through ticket available']];
        alt=['Direct coach','No rail-station connection','Coach leaves from the airport terminal and can be worth comparing on fare and luggage, but its London stop may leave more onward travel for this destination.',['From terminal','Luggage hold']];
      } else if(['victoria','paddington'].includes(dest)){
        primary=['Direct coach','Closer to your final London area','National Express serves central London stops including Victoria and Paddington on relevant services, potentially avoiding DART + train + Underground.',['From terminal','Useful London stop','Fewer changes']];
        alt=['DART + train + London connection','Fast rail first leg','Rail remains a strong benchmark, but include the final Tube/taxi leg from the central London rail station.',['Rail-first','Add final connection']];
      } else {
        primary=['DART + train + onward connection','Predictable rail first leg','Start with the DART + Thameslink route and compare the final London connection to your exact hotel or address.',['Central London rail','Check final leg']];
        alt=['Private transfer','Door to door','More attractive when your final address is awkward by public transport or several travellers can share the vehicle cost.',['Exact address','No changes']];
      }
      note='Luton Airport Parkway is reached from the terminal by the Luton DART. Thameslink says through-tickets to “Luton Airport” include the DART. Direct coaches leave from the airport terminal and serve several London stops.';
    }
    if(route==='london-city-london'){
      if(group && heavy){
        primary=['Private transfer','Shorter door-to-door road trip',`London City is already in east London. With ${pax} travellers and ${bags}+ large bags, a taxi or private transfer can be competitive against multiple public-transport tickets and an interchange.`,['No changes','Exact address','Group-friendly']];
        alt=['DLR + London connection','Step-free airport rail start','The airport has its own DLR station, so public transport still has relatively low airport-side friction.',['Airport DLR station','Step-free DLR']];
      } else if(dest==='bank'){
        primary=['Direct DLR to Bank','No interchange before the City','TfL lists direct DLR services from London City Airport towards Bank, which closely matches your destination area.',['Direct DLR','Step-free DLR','City of London']];
        alt=['Taxi / private transfer','Door to door','Useful when your final address is not close to Bank station or you have more luggage than you want to move through the station.',['Exact address','No changes']];
      } else if(dest==='canary'){
        primary=['DLR + Canary Wharf connection','Strong public-transport fit','London City Airport publishes about 25 minutes to Canary Wharf. Expect a short network interchange rather than assuming every DLR train is direct.',['~25 min reference','1 interchange','East London']];
        alt=['Taxi / private transfer','Short road distance','Canary Wharf is close enough that a vehicle quote is worth comparing, particularly for a group.',['Door to door','Group-friendly']];
      } else if(dest==='canning'){
        primary=['DLR','Very local east-London journey','Canning Town and the Royal Docks are on the airport’s immediate DLR corridor, keeping public-transport complexity low.',['DLR','Low complexity','East London']];
        alt=['Taxi / private transfer','Door to door','Useful for an exact hotel, ExCeL-related address or heavy luggage.',['Exact address','No changes']];
      } else if(dest==='stratford'){
        primary=['Direct DLR towards Stratford International','No central-London detour','TfL lists Stratford International services from the airport, which suits an east-London destination without travelling through the West End.',['Direct DLR service','East London','Step-free DLR']];
        alt=['Taxi / private transfer','Door to door','Worth comparing for multiple travellers or a final address away from the station.',['Exact address','No changes']];
      } else if(['westminster','westend'].includes(dest)){
        primary=['DLR + Underground','One planned interchange','For central/west London, the practical public-transport route is usually DLR plus the Underground. London City Airport publishes reference times around 44–50 minutes for several West End landmarks.',['1 interchange','TfL network','Check final walk']];
        alt=['Taxi / private transfer','Door to door','Useful if you want to remove the interchange and final walk, especially with bags or several travellers.',['Exact address','No changes']];
      } else {
        primary=['DLR + onward London connection','Low-friction airport start','Use the airport DLR station for the first leg, then choose the interchange that best matches your exact address.',['Airport DLR station','Step-free DLR']];
        alt=['Private transfer','Door to door','Useful when the final address would otherwise require several legs or substantial walking.',['Exact address','No changes']];
      }
      note='London City Airport is already on the DLR network. TfL lists direct services towards Bank and Stratford International; Canary Wharf and many West End destinations generally involve an interchange. Check live TfL status before travelling.';
    }
    if(route==='heathrow-london'){
      if(group && heavy){
        primary=['Private transfer','Door to door in London',`With ${pax} travellers and ${bags}+ large bags, removing the London station interchange and final hotel leg can be valuable.`,['No changes','Exact address','Group-friendly']];
        alt=['Elizabeth line or Heathrow Express','Choose by London area','Use the rail line that lands closest to your destination: Paddington for Heathrow Express, or several central/east London stations on the Elizabeth line.',['Fast rail','Area-specific']];
      } else if(dest==='paddington'){
        primary=['Heathrow Express','Non-stop to Paddington','Your destination matches the Heathrow Express terminus. Heathrow publishes a 15-minute journey from Terminals 2 & 3, with trains every 15 minutes.',['15 min from T2/3','Non-stop','Paddington']];
        alt=['Elizabeth line','Direct to Paddington','Usually slower than Heathrow Express to Paddington, but contactless/Oyster travel and onward Elizabeth-line connections can simplify the rest of the journey.',['Direct','Contactless/Oyster','Central London']];
      } else if(['bond','tcr','farringdon','liverpool'].includes(dest)){
        primary=['Elizabeth line','Direct to your central-London area','The Elizabeth line serves Paddington, Bond Street, Tottenham Court Road, Farringdon and Liverpool Street from Heathrow, reducing the need for a second London transfer.',['Direct central stations','Contactless/Oyster','Under 45 min to central London']];
        alt=['Heathrow Express + onward connection','Fast first leg to Paddington','The airport leg is very fast, but count the extra London connection from Paddington to your actual destination.',['15 min airport leg','1 London connection']];
      } else if(dest==='piccadilly'){
        primary=['Piccadilly line','Direct Tube toward King’s Cross and the West End','For King’s Cross, Leicester Square or Piccadilly Circus, the Piccadilly line can avoid a rail-to-Tube interchange.',['Direct Tube corridor','Lowest-cost rail option','All terminals']];
        alt=['Elizabeth line + London connection','Faster cross-London rail leg','Useful if your exact address is better served from Tottenham Court Road, Farringdon or another Elizabeth-line station.',['Fast central access','1 connection possible']];
      } else if(dest==='victoria'){
        primary=['Coach to Victoria','Direct road option to Victoria Coach Station','Heathrow lists coaches to Victoria from airport stops. For a Victoria-area hotel, this can remove a rail-plus-Tube interchange.',['Direct to Victoria','Luggage hold','Traffic-dependent']];
        alt=['Piccadilly / Elizabeth line + connection','Public-transport alternative','Rail can still work well, but Victoria is not a direct Heathrow rail terminus, so count the London interchange.',['1 connection','Check live TfL route']];
      } else if(dest==='canary'){
        primary=['Elizabeth line','Strong east-London option','Elizabeth line services connect Heathrow with east London; check the live train destination because service patterns differ by terminal.',['Fast cross-London rail','East London','Check service destination']];
        alt=['Private transfer','Door to door','Worth comparing for a group, lots of luggage or a late arrival because Canary Wharf is a long road journey from Heathrow.',['Exact address','No changes']];
      } else {
        primary=['Elizabeth line + final London connection','Best general starting point','For an exact London address not matched to one direct terminus, start with the Elizabeth line and compare the final Tube, rail, bus or taxi leg.',['Central London coverage','Check final leg']];
        alt=['Private transfer','Door to door','Useful when the final address is awkward by public transport or the group has several large bags.',['Exact address','No changes']];
      }
      note='Heathrow has three direct rail choices into London: Heathrow Express to Paddington, the Elizabeth line to several central/east-London stations, and the Piccadilly line through central London. The best choice depends much more on your final address than on the fastest airport segment alone.';
    }
    if(route==='southend-london'){
      if(group && heavy){
        primary=['Private transfer','Door to door from Southend',`With ${pax} travellers and ${bags}+ large bags, a vehicle avoids the London rail arrival plus any onward Tube or taxi leg.`,['No changes','Exact address','Group-friendly']];
        alt=['Direct Greater Anglia train','Strong benchmark to east/central London','The airport station is close to the terminal and direct trains serve Stratford and Liverpool Street.',['Direct rail','Station near terminal','East London']];
      } else if(dest==='stratford'){
        primary=['Direct Greater Anglia train','Direct to Stratford','Greater Anglia publishes about 46 minutes from Southend Airport to Stratford, with the station only a short walk from the terminal.',['Direct','~46 min reference','East London']];
        alt=['Private transfer','Door to door','Useful if your final East London address is not close to Stratford or you are travelling with several bags.',['Exact address','No changes']];
      } else if(dest==='liverpool'){
        primary=['Direct Greater Anglia train','Direct to Liverpool Street','Greater Anglia publishes about 55 minutes to central London and direct service to Liverpool Street, making this the natural first option for the City.',['Direct','~55 min reference','City of London']];
        alt=['Private transfer','Door to door','Worth comparing for groups or a final address that would require another London connection after Liverpool Street.',['Exact address','No changes']];
      } else if(dest==='canary'){
        primary=['Train to Stratford + London connection','Efficient east-London routing','Use the direct train to Stratford, then connect toward Canary Wharf rather than riding all the way to Liverpool Street and doubling back.',['1 connection','East London','Avoid central detour']];
        alt=['Private transfer','Door to door','Useful with heavy luggage or multiple travellers, especially if the exact Canary Wharf address is away from the station.',['Exact address','No changes']];
      } else if(['southbank','westend','victoria'].includes(dest)){
        primary=['Direct train + onward London connection','Fast airport-to-London rail first leg','Take the direct Greater Anglia train toward Stratford/Liverpool Street, then choose the London connection that best matches your final area.',['1+ connection','Check final leg']];
        alt=['Private transfer','Door to door','Worth comparing if the final London connection adds substantial walking, luggage handling or late-night complexity.',['Exact address','No changes']];
      } else {
        primary=['Direct train + final connection','Reliable first step','Southend Airport has a rail station close to the terminal with direct trains toward Stratford and Liverpool Street. Build the last London leg around your exact address.',['Direct rail first leg','Check final connection']];
        alt=['Private transfer','Door to door','Useful when your address is poorly matched to east-London rail arrival points.',['Exact address','No changes']];
      }
      note='Greater Anglia currently operates direct trains from Southend Airport to Stratford and London Liverpool Street. The airport station is about a two-minute walk from the terminal. For west or south London, include the onward London connection in your total journey.';
    }
    if(route==='heathrow-oxford' && terminal==='Terminal 4'){
      const terminalText=' Because you arrive at Heathrow Terminal 4, the direct Airline coach requires the airport’s free inter-terminal connection to reach the Central Bus Station area, so include that extra step.';
      if(primary && normaliseText(primary[0]).includes('coach')) primary[2]+=terminalText;
      if(alt && normaliseText(alt[0]).includes('coach')) alt[2]+=terminalText;
      note+=' Terminal 4 adds an airport connection before the direct coach; Terminals 2/3 use the Central Bus Station area and Terminal 5 has its own coach stop.';
    }
    if(route==='gatwick-brighton' && terminal==='North Terminal'){
      const terminalText=' You arrive at Gatwick North Terminal, so rail also includes the free terminal shuttle to South Terminal, where the station is located.';
      if(primary && normaliseText(primary[0]).includes('train')) primary[2]+=terminalText;
      if(alt && normaliseText(alt[0]).includes('train')) alt[2]+=terminalText;
      note+=' North Terminal passengers should include the free shuttle to South Terminal before using the railway station.';
    }
    return {primary,alt,note,late};
  }

  document.querySelectorAll('[data-route-planner]').forEach(box=>{
    const form=box.querySelector('[data-decision-form]'); const output=box.querySelector('[data-decision-output]');
    const qs=new URLSearchParams(window.location.search);
    const exactDestination=qs.get('destination')||'';
    const exactAddress=qs.get('placeAddress')||'';
    const exactPlaceId=qs.get('placeId')||'';
    const exactLat=parseFloat(qs.get('placeLat')||'');
    const exactLng=parseFloat(qs.get('placeLng')||'');
    if(qs.get('time')) form.elements.arrivalTime.value=qs.get('time');
    if(qs.get('terminal') && form.elements.arrivalTerminal && [...form.elements.arrivalTerminal.options].some(o=>o.value===qs.get('terminal'))) form.elements.arrivalTerminal.value=qs.get('terminal');
    if(qs.get('passengers')) form.elements.passengers.value=Math.min(parseInt(qs.get('passengers'),10)||1,5);
    if(qs.get('bags')) form.elements.bags.value=Math.min(parseInt(qs.get('bags'),10)||0,4);
    if(exactDestination){
      const inferred=inferLocalDestination(box.dataset.routeId,`${exactDestination} ${exactAddress}`);
      if(inferred && [...form.elements.localDestination.options].some(o=>o.value===inferred)) form.elements.localDestination.value=inferred;
      const mapsQuery=encodeURIComponent(exactAddress||exactDestination);
      const mapsUrl=`https://www.google.com/maps/search/?api=1&query=${mapsQuery}${exactPlaceId?`&query_place_id=${encodeURIComponent(exactPlaceId)}`:''}`;
      const banner=document.createElement('div');
      banner.className='exact-destination-banner';
      banner.innerHTML=`<span>📍</span><div><b>Your exact destination</b><small>${escapeHtml(exactAddress||exactDestination)} · <a href="${mapsUrl}" target="_blank" rel="noopener">Open in Google Maps ↗</a></small></div>`;
      form.parentNode.insertBefore(banner,form);
      if(Number.isFinite(exactLat) && Number.isFinite(exactLng)){
        const mapShell=document.createElement('div'); mapShell.className='route-map-shell';
        form.parentNode.insertBefore(mapShell,form);
        renderExactDestinationMap(mapShell,box.dataset.routeId,exactLat,exactLng,exactAddress||exactDestination,mapsUrl);
      }
    }
    function render(){
      const dest=form.elements.localDestination.value, destLabel=labelFor(form.elements.localDestination);
      const time=form.elements.arrivalTime.value, pax=parseInt(form.elements.passengers.value,10), bags=parseInt(form.elements.bags.value,10);
      const terminal=form.elements.arrivalTerminal?.value||'';
      const r=getRecommendation(box.dataset.routeId,dest,time,pax,bags,terminal);
      const context={route:box.dataset.routeId,dest,terminal,pax,bags};
      output.innerHTML=`<div class="decision-summary"><div><span class="eyebrow">Your inputs</span><b>${destLabel}</b><p>${terminal?`${terminal} · `:''}${time?`flight lands ${time} · `:''}${pax} traveller${pax===1?'':'s'} · ${bags} large bag${bags===1?'':'s'}</p></div>${r.late?'<span class="night-flag">Late-arrival check</span>':''}</div><div class="fit-grid">${optionCard(...r.primary,'primary',context)}${optionCard(...r.alt,'secondary',context)}</div><div class="route-note"><b>Route-specific detail</b><p>${r.note}</p></div>`;
    }
    form.addEventListener('submit',e=>{e.preventDefault();render(); output.scrollIntoView({behavior:'smooth',block:'nearest'});});
    render();
  });

  const resultsTitle=document.querySelector('[data-results-title]');
  if(resultsTitle){
    const qs=new URLSearchParams(window.location.search);
    const from=qs.get('from')||'Airport';
    const destination=qs.get('destination')||'your destination';
    const address=qs.get('placeAddress')||destination;
    const terminal=qs.get('terminal')||'';
    const placeId=qs.get('placeId')||'';
    const placeLat=parseFloat(qs.get('placeLat')||''); const placeLng=parseFloat(qs.get('placeLng')||'');
    resultsTitle.textContent=`${from} → ${destination}`;
    const sub=document.querySelector('[data-results-sub]');
    if(sub) sub.textContent=terminal ? `${terminal} · ${address}` : address;
    const exact=document.querySelector('[data-unpublished-route]');
    if(exact){
      const mapsQuery=encodeURIComponent(address);
      const mapsUrl=`https://www.google.com/maps/search/?api=1&query=${mapsQuery}${placeId?`&query_place_id=${encodeURIComponent(placeId)}`:''}`;
      exact.innerHTML=`<div class="unpublished-icon">📍</div><div><span class="eyebrow">Exact destination found</span><h2>We have not published a verified guide for this corridor yet.</h2><p>Terminal2City only publishes route advice after checking the real transport options. Your Google Places destination is <b>${escapeHtml(address)}</b>.</p><div class="cta-actions"><a class="button blue" href="${mapsUrl}" target="_blank" rel="noopener">Open destination in Google Maps</a><a class="button secondary" href="airport-transfers.html">Browse verified routes</a></div></div>`;
      if(Number.isFinite(placeLat) && Number.isFinite(placeLng)){
        const airportToRoute={'Heathrow Airport':'heathrow-london','Gatwick Airport':'gatwick-brighton','Stansted Airport':'stansted-london','Luton Airport':'luton-london','London City Airport':'london-city-london','Southend Airport':'southend-london'};
        const mapShell=document.createElement('div'); mapShell.className='route-map-shell generic-map'; exact.after(mapShell);
        renderExactDestinationMap(mapShell,airportToRoute[from],placeLat,placeLng,address,mapsUrl);
      }
    }
  }

  document.querySelectorAll('[data-split-calculator]').forEach(calc=>{
    const total=calc.querySelector('[name="quoteTotal"]'), people=calc.querySelector('[name="quotePeople"]'), out=calc.querySelector('[data-split-output]');
    function update(){ const t=parseFloat(total.value), p=parseInt(people.value,10)||1; out.textContent = t>0 ? `£${(t/p).toFixed(2)} per traveller` : 'Enter a transfer quote'; }
    total.addEventListener('input',update); people.addEventListener('change',update); update();

    const routeId=document.querySelector('[data-route-planner]')?.dataset.routeId||'';
    const labels={
      'heathrow-oxford':['Coach fare / person','Rail fare / person'],
      'heathrow-london':['Rail / Tube fare / person','Coach fare / person'],
      'stansted-london':['Train fare / person','Coach fare / person'],
      'gatwick-brighton':['Train fare / person','Coach fare / person'],
      'luton-london':['DART + train fare / person','Coach fare / person'],
      'london-city-london':['TfL fare / person','Other public option / person'],
      'southend-london':['Train fare / person','Onward London fare / person']
    }[routeId]||['Public transport fare / person','Second option fare / person'];
    const compare=document.createElement('div'); compare.className='group-cost-compare'; compare.dataset.groupCost='';
    compare.innerHTML=`<div class="group-cost-copy"><span class="eyebrow">Compare the whole group</span><h3>What does each option cost for everyone?</h3><p>Paste the live fares you find. We calculate group totals without pretending prices are permanently fixed.</p></div><div class="group-cost-fields"><label>Travellers<select name="groupPeople"><option>1</option><option>2</option><option>3</option><option selected>4</option><option>5</option><option>6</option><option>7</option><option>8</option></select></label><label>${labels[0]} (£)<input name="optionA" type="number" min="0" step="0.01" placeholder="e.g. 15"></label><label>${labels[1]} (£)<input name="optionB" type="number" min="0" step="0.01" placeholder="optional"></label><label>Private transfer total (£)<input name="privateTotal" type="number" min="0" step="0.01" placeholder="e.g. 95"></label></div><div class="group-cost-results" data-group-results><div><small>${labels[0]}</small><b>—</b></div><div><small>${labels[1]}</small><b>—</b></div><div><small>Private transfer</small><b>—</b></div></div>`;
    calc.parentNode.appendChild(compare);
    const q=new URLSearchParams(window.location.search); const qPeople=parseInt(q.get('passengers')||'',10); if(qPeople>=1) compare.querySelector('[name="groupPeople"]').value=String(Math.min(qPeople,8));
    const els={p:compare.querySelector('[name="groupPeople"]'),a:compare.querySelector('[name="optionA"]'),b:compare.querySelector('[name="optionB"]'),t:compare.querySelector('[name="privateTotal"]'),r:compare.querySelector('[data-group-results]')};
    function money(v){return `£${v.toFixed(2)}`;}
    function renderGroup(){ const p=parseInt(els.p.value,10)||1, a=parseFloat(els.a.value), b=parseFloat(els.b.value), t=parseFloat(els.t.value); const cards=els.r.children; cards[0].querySelector('b').textContent=Number.isFinite(a)?`${money(a*p)} total · ${money(a)} pp`:'—'; cards[1].querySelector('b').textContent=Number.isFinite(b)?`${money(b*p)} total · ${money(b)} pp`:'—'; cards[2].querySelector('b').textContent=Number.isFinite(t)?`${money(t)} total · ${money(t/p)} pp`:'—'; [0,1,2].forEach(i=>cards[i].classList.remove('lowest')); const totals=[Number.isFinite(a)?a*p:Infinity,Number.isFinite(b)?b*p:Infinity,Number.isFinite(t)?t:Infinity]; const min=Math.min(...totals); if(Number.isFinite(min)) totals.forEach((v,i)=>{if(Math.abs(v-min)<0.005) cards[i].classList.add('lowest')}); }
    ['input','change'].forEach(ev=>compare.addEventListener(ev,renderGroup)); renderGroup();
  });
})();


/* mobile-v21 hamburger navigation */
(() => {
  document.querySelectorAll('.site-header').forEach((header, i) => {
    const inner = header.querySelector('.header-inner');
    const nav = header.querySelector('.nav');
    if (!inner || !nav || header.querySelector('.mobile-menu-button')) return;

    if (!nav.id) nav.id = 'mobile-nav-' + i;
    const button = document.createElement('button');
    button.className = 'mobile-menu-button';
    button.type = 'button';
    button.setAttribute('aria-label', 'Open menu');
    button.setAttribute('aria-controls', nav.id);
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<span></span><span></span><span></span>';
    inner.appendChild(button);

    const setOpen = (open) => {
      header.classList.toggle('menu-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      setOpen(!header.classList.contains('menu-open'));
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
    document.addEventListener('click', event => {
      if (!header.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') setOpen(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 720) setOpen(false);
    });
  });
})();
