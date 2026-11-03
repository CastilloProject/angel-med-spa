const defaults={businessName:'Angel Med Spa & Wellness',address:'Orlando, Florida',instagram:'https://www.instagram.com/angelmedspa/',instagramReel:'https://www.instagram.com/reel/De9bdqOJ9yF/',videoUrl:'',photos:{}};
const cfg={...defaults,...JSON.parse(document.getElementById('siteDefaultConfig').textContent)};
const $=id=>document.getElementById(id);
const validUrl=v=>{try{return ['https:','http:'].includes(new URL(v).protocol)}catch{return false}};
const instagramUrl=v=>{try{const u=new URL(v);return u.protocol==='https:'&&/^(www\.)?instagram\.com$/.test(u.hostname)}catch{return false}};
const profile=instagramUrl(cfg.instagram)?cfg.instagram:defaults.instagram;
function setSocial(id,value,hosts){const a=$(id);if(!a)return;try{const u=new URL(value);if(u.protocol!=='https:'||!hosts.includes(u.hostname.toLowerCase()))return;a.href=u.href;a.hidden=false}catch{}}
setSocial('socialInstagram',profile,['instagram.com','www.instagram.com']);
setSocial('socialTikTok',cfg.tiktok,['tiktok.com','www.tiktok.com']);
const serviceCatalog=AngelServices.catalog(cfg);
const serviceGrid=document.querySelector('.treatment-grid');
const serviceTemplates=Object.fromEntries([...serviceGrid.querySelectorAll('.treatment')].map(card=>[card.dataset.category,card.cloneNode(true)]));
serviceGrid.replaceChildren();
const serviceSelect=$('service');
for(const option of [...serviceSelect.options])if(Object.values(AngelServices.defaults).some(base=>base.title===option.value))option.remove();
let serviceIndex=0;
for(const [id,item] of Object.entries(serviceCatalog)){
 const card=(serviceTemplates[id]||serviceTemplates.skin).cloneNode(true);card.dataset.serviceId=id;card.dataset.category=item.category||(id==='recovery'?'recovery':id==='skin'?'skin':'wellness');
 card.querySelector('.treatment-number').textContent=String(++serviceIndex).padStart(2,'0');
 const img=card.querySelector('img');
 if(item.imageUrl){img.src=item.imageUrl;img.removeAttribute('data-photo-id')}
 else if(!serviceTemplates[id]){img.src='/assets/photo-2.webp';img.removeAttribute('data-photo-id')}
 img.alt=item.title;serviceGrid.append(card);
 const option=new Option(item.title,item.title);option.dataset.serviceId=id;serviceSelect.insertBefore(option,serviceSelect.lastElementChild);
}
const emptyServices=document.createElement('p');emptyServices.dataset.t='';emptyServices.textContent='Consulta con el equipo los servicios disponibles.';emptyServices.hidden=serviceIndex>0;serviceGrid.after(emptyServices);
const wellnessFilter=document.createElement('button');wellnessFilter.type='button';wellnessFilter.className='filter-button';wellnessFilter.dataset.filter='wellness';wellnessFilter.dataset.t='';wellnessFilter.textContent='Bienestar';wellnessFilter.setAttribute('aria-pressed','false');document.querySelector('.service-filters').append(wellnessFilter);
for(const button of document.querySelectorAll('[data-filter]'))button.hidden=button.dataset.filter!=='all'&&![...serviceGrid.children].some(card=>card.dataset.category===button.dataset.filter);

document.querySelectorAll('[data-photo-id]').forEach(img=>{const item=cfg.photos?.[img.dataset.photoId];if(item){if(/^data:image\/(jpeg|png|webp);base64,/.test(item.src||''))img.src=item.src;img.style.objectFit=item.fit==='contain'?'contain':'cover';img.style.objectPosition=`${item.x??50}% ${item.y??50}%`}});
$('address').textContent=cfg.address||defaults.address;
$('copyright').textContent=`© ${new Date().getFullYear()} ${cfg.businessName||defaults.businessName}`;
const whatsappDigits=(cfg.whatsapp||'').replace(/\D/g,'');
const phone=/^[1-9]\d{7,14}$/.test(whatsappDigits)?whatsappDigits:'';
function contactLink(id,url){const a=$(id);a.hidden=!url;if(url)a.href=url}
contactLink('whatsappLink',phone?'https://wa.me/'+phone:'');
contactLink('phoneLink',cfg.phone?'tel:'+cfg.phone.replace(/[^+\d]/g,''):'');
contactLink('mapsLink',validUrl(cfg.maps)?cfg.maps:'');
contactLink('emailLink',/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.email||'')?'mailto:'+cfg.email:'');
contactLink('reviewsLink',validUrl(cfg.googleReviews||cfg.googleBusiness)?cfg.googleReviews||cfg.googleBusiness:'');
$('menuToggle').onclick=()=>{const open=$('navLinks').classList.toggle('open');$('menuToggle').setAttribute('aria-expanded',open)};
$('navLinks').querySelectorAll('a').forEach(a=>a.onclick=()=>{$('navLinks').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false')});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('navLinks').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false')}});
function renderServices(){
 document.querySelectorAll('.treatment[data-category]').forEach(card=>{
  const id=card.dataset.serviceId,base=AngelServices.defaults[id]||serviceCatalog[id];if(!base)return;
  const custom=cfg.services?.[id]||{};
  const values={};
  for(const field of ['title','summary','details']){
   const text=custom[field]||base[field];
   values[field]=language==='en'?(custom[field+'En']||(custom[field]&&custom[field]!==base[field]?text:(base[field+'En']||text))):text;
   card.querySelector('[data-service-field="'+field+'"]').textContent=values[field];
  }
  const anchor=card.querySelector('[data-service]');anchor.dataset.service=custom.title||base.title;
  const option=$('service').querySelector('[data-service-id="'+id+'"]');if(option){option.value=custom.title||base.title;option.textContent=values.title}
 });
}
function setupServiceVideos(){
 document.querySelectorAll('.treatment[data-category]').forEach(card=>{
  const details=card.querySelector('details'),holder=card.querySelector('.service-video');
  if(!details||!holder)return;
  const source=AngelServices.videoSource(serviceCatalog[card.dataset.serviceId]?.videoUrl);
  if(!source)return;
  details.addEventListener('toggle',()=>{
   holder.replaceChildren();holder.hidden=!details.open;if(!details.open)return;
   const media=document.createElement(source.type==='youtube'?'iframe':'video');media.src=source.src;
   if(source.type==='youtube'){media.title=card.querySelector('h3').textContent;media.allow='encrypted-media; fullscreen; picture-in-picture';media.allowFullscreen=true;media.referrerPolicy='strict-origin-when-cross-origin'}
   else{media.controls=true;media.playsInline=true;media.preload='none';media.addEventListener('error',()=>{const note=document.createElement('p');note.textContent=translate('El video no está disponible por el momento.');holder.replaceChildren(note)})}
   holder.append(media);
  });
 });
}

document.querySelectorAll('[data-service]').forEach(a=>a.onclick=()=>{$('service').value=a.dataset.service});
setupServiceVideos();
const hasChannel=Boolean(phone);
const appointmentForm=$('appointmentForm');
let bookingUnavailable=$('bookingUnavailable');
// Older running servers may still serve the previous HTML template.
const legacyBooking=$('instagramBooking');
if(!bookingUnavailable&&appointmentForm){
 bookingUnavailable=document.createElement('div');
 bookingUnavailable.id='bookingUnavailable';
 bookingUnavailable.className='appointment-form';
 const heading=document.createElement('h3'),message=document.createElement('p');
 heading.dataset.t='';heading.textContent='Agenda por WhatsApp';
 message.dataset.t='';message.textContent='La agenda por WhatsApp estará disponible próximamente.';
 bookingUnavailable.append(heading,message);
 appointmentForm.after(bookingUnavailable);
}
legacyBooking?.remove();
if(appointmentForm)appointmentForm.hidden=!hasChannel;
if(bookingUnavailable)bookingUnavailable.hidden=hasChannel;
appointmentForm?.addEventListener('submit',e=>{
 e.preventDefault();
 if(!phone||!e.currentTarget.reportValidity())return;
 const f=new FormData(e.currentTarget);
 const message=`Hola ${cfg.businessName}, quisiera solicitar una cita.\nNombre: ${f.get('name')}\nTeléfono: ${f.get('phone')}\nServicio: ${f.get('service')}\n${f.get('message')||''}`;
 $('formStatus').textContent=translate('Abriremos WhatsApp con tu solicitud. Pulsa Enviar allí para contactar al equipo.');
 window.location.assign('https://wa.me/'+phone+'?text='+encodeURIComponent(message));
});
const translations={en:{"Redes sociales": "Social media", "Nuestra comunidad": "Our community", "Conectemos también en redes.": "Let’s connect on social media.", "Sigue nuestras novedades, conoce al equipo y acompáñanos en el día a día.": "Follow our updates, meet our team and share our everyday moments.", "Momentos, novedades y nuestra comunidad.": "Moments, updates and our community.", "Noticias y publicaciones del equipo.": "News and posts from our team.", "Ver detalles del servicio": "View service details", "El video no está disponible por el momento.": "The video is currently unavailable.","Completa tus datos y envía tu solicitud al WhatsApp del equipo.": "Enter your details and send your request to our team on WhatsApp.", "Enviar solicitud por WhatsApp": "Send request via WhatsApp", "Agenda por WhatsApp": "Appointments via WhatsApp", "La agenda por WhatsApp estará disponible próximamente.": "WhatsApp appointment requests will be available soon.", "Abriremos WhatsApp con tu solicitud. Pulsa Enviar allí para contactar al equipo.": "We will open WhatsApp with your request. Tap Send there to contact our team.","También en nuestro Instagram": "Also on our Instagram", "Explora los destacados oficiales.": "Explore our official highlights.", "Consulta con el equipo la disponibilidad y los detalles de cada opción.": "Ask our team about availability and details for each option.", "Faciales anunciados en nuestro Instagram oficial. Consulta con el equipo las opciones y la disponibilidad.": "Facials featured on our official Instagram. Ask the team about options and availability.", "Cuéntanos qué buscas para tu piel. Consulta directamente con el equipo qué facial está disponible y cómo preparar tu visita.": "Tell us what you are looking for in skin care. Ask the team which facial is available and how to prepare for your visit.","Todos": "All treatments", "Conoce este cuidado": "Explore this treatment", "Acompañamiento para tu recuperación y masaje linfático. Cuéntanos en qué etapa estás para que el equipo pueda orientarte.": "Support for your recovery and lymphatic massage. Tell us about your stage of recovery so the team can guide you.", "Consulta las zonas que deseas tratar. El equipo te explicará la valoración previa y los cuidados de la sesión.": "Ask about the areas you would like to treat. The team will explain the initial assessment and care for your session.", "Explora opciones de cuidado facial, Dermapen y microneedling. El protocolo se define según la valoración de tu piel.": "Explore facial care, Dermapen and microneedling options. Your protocol is determined following a skin assessment.",'Imágenes de tratamientos creadas con IA con fines ilustrativos.':'AI-generated treatment images for illustrative purposes.','Tratamientos':'Treatments','Nuestra esencia':'Our approach','En primera persona':'A closer look','Contacto':'Contact','Agenda tu visita':'Book your visit','Orlando, Florida · Atención con cita previa':'Orlando, Florida · Visits by appointment','Un espacio para ti':'A space for you','Tu bienestar,':'Your wellbeing,','en buenas manos.':'in caring hands.','Cuidado estético, recuperación y bienestar en Orlando. Un equipo cercano para acompañarte en cada etapa.':'Aesthetic care, recovery and wellness in Orlando. A caring team to support you at every step.','Explora los tratamientos':'Explore treatments','Atención personalizada · Orlando, FL':'Personalized care · Orlando, FL','EL CUIDADO EMPIEZA CONTIGO':'CARE STARTS WITH YOU','Recuperación':'Recovery','Estética':'Aesthetics','Bienestar':'Wellness','Cuidado personalizado':'Personalized care','Encuentra tu momento':'Find your moment','de cuidado.':'of care.','Conoce nuestras áreas de atención y consulta con el equipo el tratamiento adecuado para ti.':'Explore our areas of care and talk with the team about the right treatment for you.','Cuidado postoperatorio':'Post-operative care','Acompañamiento y masaje linfático durante tu recuperación. Consulta el cuidado indicado para tu etapa.':'Support and lymphatic massage during recovery. Ask about care appropriate for your stage.','Consultar tratamiento':'Ask about this treatment','Depilación láser':'Laser hair removal','Atención para la reducción del vello, con una valoración de tu piel y tus necesidades.':'Hair reduction care with an assessment of your skin and individual needs.','Faciales y piel':'Facials & skin','Faciales, Dermapen y protocolos de cuidado para darle a tu piel la atención que merece.':'Facials, Dermapen and care protocols to give your skin the attention it deserves.','Personas que cuidan':'People who care','La confianza empieza':'Trust begins','con conocernos.':'with getting to know us.','En Angel Med Spa & Wellness creemos en una atención cercana. Queremos que te sientas escuchada, acompañada y a gusto desde tu primera visita.':'At Angel Med Spa & Wellness, we believe in personal care. We want you to feel heard, supported and comfortable from your first visit.','Nuestro equipo · Angel Med Spa & Wellness':'Our team · Angel Med Spa & Wellness','Te escuchamos':'We listen','Conversamos sobre lo que buscas y tus necesidades.':'We discuss your goals and needs.','Orientamos tu cuidado':'We guide your care','Te explicamos las opciones y los cuidados de cada tratamiento.':'We explain the options and care involved in each treatment.','Te acompañamos':'We support you','Resolvemos tus dudas para que sepas cuál es el siguiente paso.':'We answer your questions so you understand the next step.','Conversemos':'Let’s talk','Dentro de Angel Med Spa':'Inside Angel Med Spa','Conoce nuestra esencia,':'Discover our approach,','más de cerca.':'up close.','Ver @angelmedspa':'Visit @angelmedspa','Una mirada a Angel Med Spa':'A look at Angel Med Spa','Ver publicación de Instagram':'View Instagram post','Conecta con nuestro día a día.':'Connect with our everyday moments.','Conoce al equipo, explora nuestras publicaciones y descubre más sobre el cuidado que nos inspira.':'Meet the team, explore our posts and discover more about the care that inspires us.','Síguenos en Instagram':'Follow us on Instagram','Antes de tu visita':'Before your visit','Todo empieza':'It all starts','con una conversación.':'with a conversation.','¿Cómo solicito una cita?':'How do I request an appointment?','Escríbenos para consultar disponibilidad y el servicio que te interesa. El equipo te confirmará el día y la hora de tu visita.':'Contact us about availability and the service you are interested in. The team will confirm the day and time of your visit.','¿Cómo elijo un tratamiento?':'How do I choose a treatment?','Cuéntanos qué estás buscando. El equipo te orientará sobre las opciones y la valoración que corresponda antes de comenzar.':'Tell us what you are looking for. The team will guide you through the options and any assessment needed before starting.','¿Dónde están ubicados?':'Where are you located?','Estamos en Orlando, Florida. Consulta con el equipo la ubicación y las indicaciones antes de tu visita.':'We are in Orlando, Florida. Contact the team for the address and directions before your visit.','Tu próximo paso':'Your next step','Regálate un momento':'Take a moment','para ti.':'for yourself.','Hablemos de lo que necesitas. Estamos aquí para orientarte y ayudarte a planear tu visita.':'Let’s talk about what you need. We are here to guide you and help you plan your visit.','Visítanos':'Visit us','Atención con cita previa':'By appointment','Llamar':'Call','Cómo llegar':'Directions','Leer reseñas':'Read reviews','Solicita tu cita':'Request your appointment','Completa tus datos para continuar por nuestro canal de contacto.':'Enter your details to continue through our contact channel.','Nombre':'Name','Teléfono':'Phone','Servicio de interés':'Service of interest','Selecciona un tratamiento':'Select a treatment','Quiero orientación':'I would like guidance','¿Qué te gustaría contarnos?':'What would you like us to know?','Continuar con mi solicitud':'Continue with my request','Tu solicitud no confirma una reserva. Coordinaremos contigo la disponibilidad.':'Your request does not confirm a booking. We will coordinate availability with you.','Conversemos por Instagram':'Let’s talk on Instagram','Visita nuestro perfil oficial y envíanos un mensaje para consultar tratamientos y disponibilidad.':'Visit our official profile and send us a message about treatments and availability.','Ir a @angelmedspa':'Go to @angelmedspa','Acceso del equipo':'Team access','Ver en Instagram ↗':'View on Instagram ↗','Si Instagram no carga aquí, puedes abrir la publicación directamente.':'If Instagram does not load here, you can open the post directly.','Te llevamos al canal de contacto. La cita se confirma directamente con el equipo.':'Opening our contact channel. Your appointment is confirmed directly with the team.'}};
let language='es';const original=new Map();document.querySelectorAll('[data-t]').forEach(el=>original.set(el,el.textContent));
function translate(s){return translations[language]?.[s]||s}
function setLanguage(lang){language=lang==='en'?'en':'es';document.documentElement.lang=language;original.forEach((value,el)=>el.textContent=translate(value));$('language').value=language;$('menuToggle').setAttribute('aria-label',language==='es'?'Abrir menú':'Open menu');renderServices();try{localStorage.setItem('angelmedspa_lang',language)}catch{}}
$('language').onchange=e=>setLanguage(e.target.value);let saved='es';try{saved=localStorage.getItem('angelmedspa_lang')||'es'}catch{}setLanguage(saved);
