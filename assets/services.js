(function(root){
 const defaults={
  recovery:{title:'Cuidado postoperatorio',titleEn:'Post-operative care',summary:'Acompañamiento y masaje de drenaje linfático durante tu recuperación.',summaryEn:'Support and lymphatic drainage massage during your recovery.',details:'Un espacio de atención para acompañarte después de un procedimiento estético. El drenaje linfático y los masajes postquirúrgicos forman parte de nuestros servicios.\n\nCuéntanos qué procedimiento te realizaste, en qué etapa de recuperación estás y qué indicaciones recibiste. El equipo te orientará sobre la atención y la disponibilidad antes de coordinar tu visita.',detailsEn:'Care to support you after an aesthetic procedure. Our services include lymphatic drainage and postoperative massage.\n\nTell us about your procedure, your stage of recovery and the instructions you received. Our team will discuss care and availability before arranging your visit.',videoUrl:''},
  skin:{title:'Faciales y piel',titleEn:'Facials & skin',summary:'Un momento de cuidado facial con atención personalizada para tu piel.',summaryEn:'A moment of facial care with personal attention for your skin.',details:'Conoce nuestras opciones de cuidado facial. Durante la consulta podrás compartir qué buscas para tu piel y resolver tus dudas con el equipo.\n\nAntes de agendar, consulta el facial disponible, en qué consiste y cómo preparar tu visita. El equipo confirmará contigo los detalles del servicio.',detailsEn:'Explore our facial care options. During your consultation, share your skin-care goals and discuss your questions with the team.\n\nBefore booking, ask which facial is available, what it involves and how to prepare. The team will confirm the service details with you.',videoUrl:''}
 };
 function videoSource(value){
  if(!value)return null;
  try{
   const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password)return null;
   const host=url.hostname.toLowerCase();let id;
   if(['tiktok.com','www.tiktok.com','m.tiktok.com'].includes(host)){
    const post=url.pathname.match(/^\/@[^/]+\/video\/(\d{15,25})\/?$/)||url.pathname.match(/^\/player\/v1\/(\d{15,25})\/?$/);
    if(post)return {type:'tiktok',src:'https://www.tiktok.com/player/v1/'+post[1]+'?autoplay=0&rel=0',original:url.href};
   }
   if(host==='youtu.be')id=url.pathname.slice(1);
   else if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host))id=url.pathname==='/watch'?url.searchParams.get('v'):url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)\/?$/)?.[1];
   if(id&&/^[\w-]{11}$/.test(id))return {type:'youtube',src:'https://www.youtube-nocookie.com/embed/'+id};
   if(/\.(mp4|webm)$/i.test(url.pathname))return {type:'video',src:url.href};
  }catch{}
  return null;
 }
 function normalize(input){
  if(input===undefined)return {};
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Los detalles de servicios no son válidos.');
  const output={};
  if(Object.keys(input).length>50)throw Error('Puedes guardar hasta 50 servicios.');
  for(const id of Object.keys(input)){
   if(!/^[a-z][a-z0-9-]{0,79}$/.test(id)||['constructor','prototype','__proto__'].includes(id))throw Error('Identificador de servicio inválido.');
   const item=input[id];if(item===undefined)continue;
   if(!item||typeof item!=='object'||Array.isArray(item))throw Error('Servicio inválido.');
   output[id]={};
   for(const [key,limit] of Object.entries({title:100,titleEn:100,summary:400,summaryEn:400,details:5000,detailsEn:5000,videoUrl:2000,imageUrl:2000,category:30})){
    if(item[key]===undefined)continue;
    if(typeof item[key]!=='string'||item[key].length>limit)throw Error('Revisa la longitud del contenido del servicio.');
    output[id][key]=item[key].trim();
   }
   if(output[id].category&&!['recovery','skin','wellness'].includes(output[id].category))throw Error('Categoría inválida.');
   if(output[id].imageUrl){try{const url=new URL(output[id].imageUrl);if(url.protocol!=='https:'||url.username||url.password)throw Error()}catch{throw Error('Usa una URL HTTPS pública para la imagen.')}}
   if(output[id].videoUrl&&!videoSource(output[id].videoUrl))throw Error('Usa un enlace HTTPS completo de TikTok (@usuario/video/…), YouTube o un archivo MP4/WebM para el video.');
  }
  return output;
 }
 function catalog(cfg){const custom=cfg.services||{};const ids=cfg.serviceCatalogVersion===1?Object.keys(custom):[...new Set([...Object.keys(defaults),...Object.keys(custom)])];return Object.fromEntries(ids.map(id=>[id,{...(defaults[id]||{}),...(custom[id]||{})}]))}
 const api={defaults,videoSource,normalize,catalog};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.AngelServices=api;
})(typeof window!=='undefined'?window:globalThis);
