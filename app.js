'use strict';
const authKey='polina-cv-demo-auth';
const routes=new Set(['index','account','benefits','year','charity','lead','concepts']);
const form=document.querySelector('#login-form'),password=document.querySelector('#password'),error=document.querySelector('#password-error'),toggle=document.querySelector('#toggle-password'),main=document.querySelector('#main'),login=document.querySelector('#login');
const pageNames={index:'Главная',account:'Редизайн ЛК',benefits:'Редизайн выгод',year:'Итоги',charity:'Благотворительность',lead:'Лодовство',concepts:'Концепты'};
let generation=0;
function isAuthenticated(){try{return sessionStorage.getItem(authKey)==='1'}catch{return false}}
toggle.addEventListener('click',()=>{const visible=password.type==='password';password.type=visible?'text':'password';toggle.textContent=visible?'Скрыть':'Показать';toggle.setAttribute('aria-label',visible?'Скрыть пароль':'Показать пароль');toggle.setAttribute('aria-pressed',String(visible));});
password.addEventListener('input',()=>{error.textContent='';password.removeAttribute('aria-invalid')});
form.addEventListener('submit',async e=>{e.preventDefault();if(loginTransitionRunning)return;if(password.value!=='PolinaCV_26'){error.textContent='Неверный пароль. Попробуйте ещё раз.';password.setAttribute('aria-invalid','true');password.focus();return}try{sessionStorage.setItem(authKey,'1')}catch{error.textContent='Разрешите хранилище вкладки, чтобы сохранить вход.';return}loginTransitionRunning=true;form.setAttribute('aria-busy','true');form.querySelector('[type="submit"]').disabled=true;try{if(await showPage(true,true))password.value='';}finally{loginTransitionRunning=false;form.removeAttribute('aria-busy');form.querySelector('[type="submit"]').disabled=false;}});
async function showPage(focus=false,fromLogin=false){
 if(photoViewer?.open)photoViewer.close();
 const request=++generation;
 const route=location.pathname.endsWith('/')?'index':location.pathname.split('/').pop().replace(/\.html$/,'');
 if(fromLogin){main.classList.add('auth-preparing');main.inert=true;}else{login.hidden=true;main.classList.remove('auth-preparing','auth-arriving');main.inert=false;}
 main.hidden=false;
 try{
  if(!routes.has(route))throw Error('not found');
  const response=await fetch(new URL('pages/'+route+'.html',new URL('./',location.href)));
  if(!response.ok)throw Error('load failed');
  const page=await response.text();if(request!==generation)return false;
  cleanupMedia();main.innerHTML=page;document.title=pageNames[route]+' — Полина Романенко';
  if(route!=='index')for(const header of main.querySelectorAll('.site-header')){const nav=document.createElement('nav');nav.className='breadcrumbs';nav.setAttribute('aria-label','Хлебные крошки');nav.innerHTML='<a href="./">Главная</a><span aria-hidden="true">/</span><span aria-current="page">'+pageNames[route]+'</span>';header.after(nav);}
  if(focus&&!fromLogin)window.scrollTo({top:0,left:0,behavior:'instant'});
  setupHeader();await setupMedia(request);if(request!==generation)return false;
  if(fromLogin){await document.fonts.ready;await finishLoginTransition();}
  if(focus){window.scrollTo({top:0,left:0,behavior:'instant'});main.focus({preventScroll:true});}
  return true;
 }catch{
  main.inert=false;main.classList.remove('auth-preparing','auth-arriving');
  if(fromLogin){main.hidden=true;error.textContent='Не удалось загрузить страницу. Попробуйте ещё раз.';}
  else main.innerHTML='<section class="page-error"><h1>Не удалось открыть страницу</h1><p>Проверьте подключение или вернитесь на главную.</p><a href="./">На главную ↗</a></section>';
  return false;
 }
}
let loginTransitionRunning=false;
const reducedMotionPreference=matchMedia('(prefers-reduced-motion: reduce)');
function startLoginPortrait(){
 const video=document.querySelector('.login-portrait video');
 if(!video||reducedMotionPreference.matches)return;
 video.muted=true;video.defaultMuted=true;video.src=video.dataset.src;video.play().catch(()=>{});
}
async function finishLoginTransition(){
 const hand=document.querySelector('.login-hand');
 const portrait=document.querySelector('.login-portrait');
 const desktop=matchMedia('(min-width:1101px)').matches;
 const scope=main.querySelector(desktop?'.desktop-view':'.mobile-view');
 const targetHand=scope?.querySelector('[data-node-id="'+(desktop?'1:17599':'1:17633')+'"]');
 const targetPortrait=scope?.querySelector('[data-node-id="'+(desktop?'1:17602':'1:17636')+'"]');
 const canFly=hand&&portrait&&targetHand&&targetPortrait&&!reducedMotionPreference.matches;
 const sourceVideo=portrait?.querySelector('video');
 const reveal=()=>{login.hidden=true;main.classList.remove('auth-preparing');main.classList.add('auth-arriving');window.scrollTo(0,0);};
 if(!canFly){
  sourceVideo?.pause();
  if(!reducedMotionPreference.matches)await login.animate([{opacity:1},{opacity:0}],{duration:160,easing:'ease-out'}).finished.catch(()=>{});
  reveal();main.inert=false;return;
 }
 for(const animation of form.getAnimations())animation.finish();
 const flights=[];
 for(const [source,target]of [[hand,targetHand],[portrait,targetPortrait]]){
  const from=source.getBoundingClientRect(),to=target.getBoundingClientRect();
  const originalParent=source.parentElement;
  const wrapper=document.createElement('div');wrapper.className='auth-flight';wrapper.setAttribute('aria-hidden','true');
  Object.assign(wrapper.style,{left:from.left+'px',top:from.top+'px',width:from.width+'px',height:from.height+'px'});
  document.body.append(wrapper);wrapper.append(source);target.style.visibility='hidden';
  const animation=wrapper.animate([{transform:'translate(0,0) scale(1,1)'},{transform:`translate(${to.left-from.left}px,${to.top-from.top}px) scale(${to.width/from.width},${to.height/from.height})`}],{duration:760,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
  flights.push({source,target,wrapper,animation,originalParent});
 }
 const fade=login.animate([{opacity:1},{opacity:0}],{duration:180,easing:'ease-out',fill:'forwards'});
 await fade.finished.catch(()=>{});reveal();fade.cancel();
 try{
  await Promise.all(flights.map(f=>f.animation.finished.catch(()=>{})));
  // Move the playing video itself so the portrait does not restart at landing.
  const previous=targetPortrait.querySelector('video');
  if(sourceVideo&&previous){
   mediaObserver?.unobserve(previous);mediaPlayers.delete(previous);previous.pause();
   sourceVideo.className='site-video';sourceVideo.dataset.src=previous.dataset.src;sourceVideo.dataset.background='true';sourceVideo.setAttribute('aria-hidden','true');
   targetPortrait.replaceChildren(sourceVideo);mediaPlayers.add(sourceVideo);mediaObserver?.observe(sourceVideo);
  }
 }finally{
  for(const flight of flights){flight.target.style.removeProperty('visibility');flight.originalParent.append(flight.source);flight.wrapper.remove();}
  main.inert=false;
 }
}

let onScroll;
function setupHeader(){if(onScroll)window.removeEventListener('scroll',onScroll);let lastY=window.scrollY,travel=0,direction=0;onScroll=()=>{const y=Math.max(0,window.scrollY),delta=y-lastY;lastY=y;if(y<40){document.querySelectorAll('.site-header').forEach(h=>h.classList.remove('header-hidden'));travel=0;return}if(Math.abs(delta)<2)return;const next=Math.sign(delta);if(next!==direction){travel=0;direction=next}travel+=Math.abs(delta);if(travel<18)return;document.querySelectorAll('.site-header').forEach(h=>{if(!h.contains(document.activeElement))h.classList.toggle('header-hidden',direction>0)});travel=0};window.addEventListener('scroll',onScroll,{passive:true});}
let mediaObserver;
let mediaManifest;
const mediaPlayers=new Set();
function cleanupMedia(){mediaObserver?.disconnect();for(const video of mediaPlayers)video.pause();mediaPlayers.clear();}
async function setupMedia(request){
 try{
  mediaManifest??=fetch(new URL('media.json',new URL('./',location.href))).then(response=>{if(!response.ok)throw Error('Media manifest unavailable');return response.json()});
  const config=await mediaManifest;if(request!==generation)return;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const loadVideo=video=>{if(!video.hasAttribute('src')){video.src=video.dataset.src;video.load();}};
  mediaObserver=new IntersectionObserver(entries=>{for(const {target:video,isIntersecting}of entries){if(isIntersecting){if(video.dataset.background==='true'&&reducedMotion.matches)continue;loadVideo(video);if(video.dataset.background==='true')video.play().catch(()=>{});}else video.pause();}},{rootMargin:'200px 0px',threshold:0});
  for(const item of config){
   for(const el of main.querySelectorAll('[data-node-id="'+CSS.escape(item.node)+'"]')){
    el.classList.add('media-slot');if(['benefits','charity'].includes(item.page))el.classList.add('case-demo-media');if(item.mask)el.classList.add('portrait-media');
    const overlay=item.overlay?[...el.children].find(child=>child.dataset.nodeId===item.overlay):null;
    el.replaceChildren();
    const video=document.createElement('video');video.className='site-video';video.dataset.src=item.src;video.dataset.background=String(!!item.background);video.width=item.width;video.height=item.height;video.preload='none';video.playsInline=true;video.muted=true;video.defaultMuted=true;video.setAttribute('playsinline','');video.setAttribute('muted','');video.controls=!item.background;video.loop=!!item.background;video.autoplay=!!item.background&&!reducedMotion.matches;
    video.controls=false;video.disablePictureInPicture=true;video.disableRemotePlayback=true;video.tabIndex=-1;if(item.mask)video.setAttribute('aria-hidden','true');else video.setAttribute('aria-label',item.label);
    if(item.poster)video.poster=item.poster;
    video.addEventListener('pointerdown',()=>loadVideo(video),{once:true});video.addEventListener('focus',()=>loadVideo(video),{once:true});
    video.addEventListener('error',()=>{if(!video.hasAttribute('src')||el.querySelector('.media-error'))return;const message=document.createElement('p');message.className='media-error';message.setAttribute('role','status');message.textContent='Не удалось загрузить видео. Обновите страницу.';el.append(message);});
    el.append(video);if(overlay){overlay.dataset.mediaOverlay='';el.append(overlay);}
    mediaPlayers.add(video);mediaObserver.observe(video);
   }
  }
 }catch{/* Optional media errors must not block navigation or the resume. */}
}

const photoViewer=document.querySelector('#dog-photo-viewer');
let photoOpener;
let photoClosing=false;
let bodyPhotoStyles;
function openDogPhoto(opener){
 if(!photoViewer||photoViewer.open)return;
 photoOpener=opener;
 const image=photoViewer.querySelector('img');if(!image.src)image.src=image.dataset.src;
 bodyPhotoStyles={overflow:document.body.style.overflow,paddingRight:document.body.style.paddingRight};
 const gutter=window.innerWidth-document.documentElement.clientWidth;
 document.body.style.overflow='hidden';if(gutter>0)document.body.style.paddingRight=gutter+'px';
 photoViewer.showModal();
 if(!reducedMotionPreference.matches)photoViewer.animate([{opacity:0},{opacity:1}],{duration:180,easing:'ease-out'});
}
async function closeDogPhoto(){
 if(!photoViewer?.open||photoClosing)return;
 photoClosing=true;
 try{if(!reducedMotionPreference.matches)await photoViewer.animate([{opacity:1},{opacity:0}],{duration:140,easing:'ease-in'}).finished.catch(()=>{});photoViewer.close();}finally{photoClosing=false;}
}
photoViewer?.querySelector('.photo-viewer-close').addEventListener('click',closeDogPhoto);
photoViewer?.addEventListener('click',event=>{if(event.target===photoViewer)closeDogPhoto();});
photoViewer?.addEventListener('cancel',event=>{event.preventDefault();closeDogPhoto();});
photoViewer?.addEventListener('close',()=>{if(bodyPhotoStyles){document.body.style.overflow=bodyPhotoStyles.overflow;document.body.style.paddingRight=bodyPhotoStyles.paddingRight;}if(photoOpener?.isConnected)photoOpener.focus({preventScroll:true});});
let dogOpening=false;
const dogIcon=new Image();dogIcon.src='./assets/dog-emoji.png';
async function burstDogIcons(button){
 if(reducedMotionPreference.matches)return;
 const box=button.getBoundingClientRect(),layer=document.createElement('div');layer.className='dog-burst';layer.setAttribute('aria-hidden','true');document.body.append(layer);
 const cx=box.left+box.width/2,cy=box.top+box.height/2;
 const points=[[-145,-65],[-85,-110],[10,-130],[130,-75],[-135,75],[-45,100],[65,90],[145,65]];
 try{await Promise.all(points.map(([dx,dy],i)=>{const icon=new Image();icon.src=dogIcon.src;icon.alt='';const size=20+(i%3)*5;Object.assign(icon.style,{left:(cx-size/2)+'px',top:(cy-size/2)+'px',width:size+'px',height:size+'px'});layer.append(icon);dx=Math.max(8-cx,Math.min(innerWidth-8-cx,dx));dy=Math.max(8-cy,Math.min(innerHeight-8-cy,dy));return icon.animate([{transform:'translate(0,0) scale(.3)',opacity:0},{opacity:1,offset:.18},{transform:'translate('+(dx*.85)+'px,'+(dy*.85)+'px) scale(1)',opacity:1,offset:.7},{transform:'translate('+dx+'px,'+dy+'px) rotate('+(i%2?18:-18)+'deg) scale(1)',opacity:0}],{duration:620,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'}).finished.catch(()=>{});}));}finally{layer.remove();}
}
document.addEventListener('click',async event=>{const button=event.target.closest('[data-action="view-dog-photo"]');if(!button)return;event.preventDefault();if(dogOpening||photoViewer?.open)return;dogOpening=true;button.setAttribute('aria-busy','true');try{await burstDogIcons(button);if(button.isConnected)openDogPhoto(button);}finally{dogOpening=false;button.removeAttribute('aria-busy');}});

document.addEventListener('click',e=>{const link=e.target.closest('a[href]');if(!link||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||link.target==='_blank')return;if(link.hasAttribute('data-native-link'))return;const url=new URL(link.href,location.href);if(!['http:','https:'].includes(url.protocol))return;if(url.origin!==location.origin||url.hash||!isAuthenticated())return;if(url.pathname===new URL('./',location.href).pathname||routes.has(url.pathname.split('/').pop().replace(/\.html$/,''))){e.preventDefault();history.pushState({},'',url.pathname);showPage(true)}});
window.addEventListener('popstate',()=>{if(isAuthenticated())showPage(true)});
const backToTop=document.createElement('button');backToTop.type='button';backToTop.className='back-to-top';backToTop.hidden=true;backToTop.setAttribute('aria-label','Наверх');backToTop.title='Наверх';backToTop.innerHTML='<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';document.body.append(backToTop);
function updateBackToTop(){backToTop.hidden=main.hidden||!login.hidden||scrollY<Math.max(400,innerHeight*.6);}
window.addEventListener('scroll',updateBackToTop,{passive:true});window.addEventListener('resize',updateBackToTop);
backToTop.addEventListener('click',()=>{window.scrollTo({top:0,left:0,behavior:reducedMotionPreference.matches?'instant':'smooth'});main.focus({preventScroll:true});});
if(isAuthenticated())showPage();else{startLoginPortrait();password.focus();}
