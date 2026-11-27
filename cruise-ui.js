(() => {
  const bar=document.querySelector('.cruise-sticky');
  const hero=document.querySelector('.route-page-hero');
  const card=document.querySelector('.cruise-affiliate-card');
  const footer=document.querySelector('.site-footer');
  const close=bar?.querySelector('.cruise-sticky-close');
  if(!bar||!hero||!close)return;
  let dismissed=false,queued=false;
  function update(){
    queued=false;
    const vh=window.innerHeight;
    const y=window.scrollY||document.documentElement.scrollTop;
    const rect=card?.getBoundingClientRect();
    const inlineVisible=rect&&rect.top<vh-120&&rect.bottom>75;
    const footerVisible=footer&&footer.getBoundingClientRect().top<vh;
    const menuOpen=document.querySelector('.site-header.menu-open');
    const focusInBar=bar.contains(document.activeElement);
    const show=!dismissed&&((y>Math.max(240,hero.offsetHeight*.65)&&!inlineVisible&&!footerVisible&&!menuOpen)||focusInBar);
    bar.hidden=!show;
    if(show){document.body.style.setProperty('--cr-bar-space',bar.offsetHeight+'px');}
    document.body.classList.toggle('cruise-sticky-active',!dismissed&&y>240);
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
  close.addEventListener('click',()=>{dismissed=true;document.body.classList.remove('cruise-sticky-active');document.querySelector('.cruise-jump-link')?.focus({preventScroll:true});update();});
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  document.addEventListener('click',schedule);
  document.addEventListener('focusout',schedule);
  update();
})();