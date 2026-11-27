(() => {
 const bar=document.querySelector('.home-float'),form=document.getElementById('compare'),results=document.getElementById('results'),header=document.querySelector('header'),footer=document.querySelector('footer');
 if(!bar||!form||!results)return;
 const close=bar.querySelector('button'),link=bar.querySelector('a');
 let dismissed=false,queued=false;
 const mq=window.matchMedia('(max-width:720px)');
 function update(){
   queued=false;
   const h=window.innerHeight;
   const formPast=form.getBoundingClientRect().bottom<80;
   const r=results.getBoundingClientRect();
   const resultVisible=r.height>0&&r.top<h&&r.bottom>65;
   const footerVisible=footer&&footer.getBoundingClientRect().top<h;
   const active=!dismissed&&mq.matches&&formPast;
   document.body.classList.toggle('home-float-space',active);
   bar.hidden=!(active&&!resultVisible&&!footerVisible&&!header?.classList.contains('open'));
 }
 function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
 close.addEventListener('click',()=>{dismissed=true;update();});
 link.addEventListener('click',()=>{bar.hidden=true;schedule();});
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 document.addEventListener('click',schedule);
 form.addEventListener('submit',schedule);
 update();
})();