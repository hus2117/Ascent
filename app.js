'use strict';

const A = 'assets/';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
function readStore(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function writeStore(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
const products = [
  { id: 'mountain-dept', name: 'Mountain Department Tee', short: 'Mountain Department', category: 'tees', line: 'Make Caucasus Great Again', edition: '001 / 2026', price: 3500, variants: { black: 'tee-mountain-black.webp', cream: 'tee-mountain-cream.webp' } },
  { id: 'highland-origins', name: 'Highland Origins Tee', short: 'Highland Origins', category: 'tees', line: 'Born closer to the sky', edition: '002 / 2026', price: 3500, variants: { black: 'tee-highland-black.webp', cream: 'tee-highland-cream.webp' } },
  { id: 'origin-hoodie', name: 'Origin Hoodie', short: 'Origin', category: 'hoodies', line: 'A quieter kind of statement', edition: 'STUDIO / 01', price: null, concept: true, variants: { black: 'concept-hoodie.webp' } },
  { id: 'identity-longsleeve', name: 'Identity Long Sleeve', short: 'Identity', category: 'longsleeves', line: 'Everyday, with a sense of place', edition: 'STUDIO / 02', price: null, concept: true, variants: { cream: 'concept-longsleeve.webp' } }
];
const state = {
  lang: readStore('ascent-language', 'en') === 'ru' ? 'ru' : 'en',
  cart: readStore('ascent-cart-v2', []), favorites: readStore('ascent-favorites', []),
  filter: 'all', sort: 'curated', size: '', overlay: null, search: '', order: null
};
if (!Array.isArray(state.cart)) state.cart = [];
state.cart = state.cart.filter(x => products.some(p => p.id === x.id && p.price !== null && p.variants[x.color]) && ['XS','S','M','L','XL'].includes(x.size) && Number.isInteger(x.qty) && x.qty > 0 && x.qty <= 99).map(x => ({...x, key: `${x.id}:${x.color}:${x.size}`}));
if (!Array.isArray(state.favorites)) state.favorites = [];
const tr = (en, ru) => state.lang === 'ru' ? ru : en;
const money = n => new Intl.NumberFormat(state.lang === 'ru' ? 'ru-RU' : 'en-US').format(n) + ' ₽';
const colorName = c => c === 'black' ? tr('Black', 'Чёрный') : tr('Off-white', 'Молочный');
const icon = {
  bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>',
  menu: '<span class="menu-lines"><i></i><i></i></span>'
};
const arrow = '<span class="arrow" aria-hidden="true">↗</span>';
const getProduct = id => products.find(p => p.id === id);
const itemCount = () => state.cart.reduce((n, x) => n + x.qty, 0);
const total = () => state.cart.reduce((n, x) => n + getProduct(x.id).price * x.qty, 0);
function currentRoute() { const [path, params] = (location.hash.slice(1) || '/').split('?'); return { path, params: new URLSearchParams(params || '') }; }
function currentItem() { const r = currentRoute(), p = getProduct(r.path.split('/')[2]); return p ? { p, color: p.variants[r.params.get('color')] ? r.params.get('color') : Object.keys(p.variants)[0] } : null; }
function productLink(p, color) { return `#/product/${p.id}?color=${color}`; }
function mark(extra = '') { return `<img class="brand-symbol ${extra}" src="${A}ascent-mountain-mark.jpg" alt="ASCENT">`; }
function brand() { return `<a class="brand" href="#/" aria-label="${tr('ASCENT home','ASCENT — главная')}">${mark()}<span><span class="brand-name">ASCENT</span><span class="brand-sub">Origin &amp; Identity</span></span></a>`; }
function langSwitch() { return `<div class="lang-switch" aria-label="${tr('Language','Язык')}"><button data-lang="en" class="${state.lang === 'en' ? 'active' : ''}" aria-pressed="${state.lang === 'en'}">EN</button><span>/</span><button data-lang="ru" class="${state.lang === 'ru' ? 'active' : ''}" aria-pressed="${state.lang === 'ru'}">RU</button></div>`; }
function header() {
  return `<div class="announcement">${tr('DROP 001 &nbsp; — &nbsp; HIGHLAND ORIGINS','ДРОП 001 &nbsp; — &nbsp; HIGHLAND ORIGINS')}</div><div class="header-inner"><nav class="main-nav" aria-label="${tr('Main navigation','Главная навигация')}"><a class="nav-link" href="#/catalog">${tr('Shop','Магазин')}</a><a class="nav-link" href="#/about">${tr('About','О бренде')}</a></nav>${brand()}<div class="header-actions">${langSwitch()}<button class="icon-button" data-action="cart" aria-label="${tr('Open bag','Открыть корзину')}">${icon.bag}<span class="bag-count">${itemCount()}</span></button><button class="icon-button menu-toggle" data-action="menu" aria-label="${tr('Open menu','Открыть меню')}">${icon.menu}</button></div></div>`;
}
function footer() {
  return `<div class="footer-inner"><div class="footer-brand">${brand()}<p class="footer-copy">${tr('Origin, character and identity. Expressed in simple, everyday pieces.','Происхождение, характер и идентичность — в простых вещах на каждый день.')}</p></div><div><p class="footer-title">${tr('Explore','Навигация')}</p><div class="footer-links"><a href="#/catalog">${tr('Collection','Коллекция')}</a><a href="#/about">${tr('Our story','О бренде')}</a><a href="#/cart">${tr('Shopping bag','Корзина')}</a></div></div><div><p class="footer-title">${tr('The first chapter','Первая глава')}</p><div class="footer-links"><span>Mountain Department</span><span>Highland Origins</span><span class="muted">${tr('Design preview · 2026','Дизайн-прототип · 2026')}</span></div></div></div><div class="footer-bottom"><span>© ASCENT 2026</span><span>ORIGIN &amp; IDENTITY</span>${langSwitch()}</div>`;
}
function card(p, color, index = 0) {
  const key = `${p.id}:${color}`, favored = state.favorites.includes(key);
  return `<article class="product-card reveal" style="--delay:${index % 3 * 60}ms"><div class="product-card-image"><a href="${productLink(p,color)}" aria-label="${p.name} — ${colorName(color)}"><img loading="lazy" src="${A+p.variants[color]}" alt="${p.name}, ${colorName(color)}"></a><span class="card-index">${p.concept ? tr('Studio concept','Студийный концепт') : p.edition}</span><button class="favorite ${favored ? 'on' : ''}" data-favorite="${key}" aria-label="${tr('Save item','В избранное')}" aria-pressed="${favored}">${favored ? '♥' : '♡'}</button><a class="card-view" href="${productLink(p,color)}">${tr('Explore piece','Смотреть вещь')} ${arrow}</a></div><div class="card-info"><div><h3 class="card-title"><a href="${productLink(p,color)}">${p.name}</a></h3><div class="card-meta">${colorName(color)} · ${p.concept ? tr('Design study','Дизайн-концепт') : tr('Oversized fit','Оверсайз')}</div></div><span class="card-price">${p.price === null ? tr('Preview','Концепт') : money(p.price)}</span></div></article>`;
}
function home() {
  return `<div class="page"><section class="mountain-hero" id="mountainHero"><img class="mountain-image" src="${A}highland-hero.webp" alt="${tr('Misty Caucasus mountains and ancient stone towers','Туманные горы Кавказа и старинные каменные башни')}"><div class="hero-shade"></div><div class="mountain-copy"><h1 class="mountain-title">ORIGIN &amp; IDENTITY</h1><p>${tr('DROP 001 — HIGHLAND ORIGINS','ДРОП 001 — HIGHLAND ORIGINS')}</p><a class="button hero-button" href="#/catalog">${tr('Explore collection','Смотреть коллекцию')} ${arrow}</a></div><div class="hero-bottom"><span>${tr('Born closer to the sky. Made for the everyday.','Рождены ближе к небу. Созданы для каждого дня.')}</span><span>EST. 2026</span></div></section><section class="collection-intro wrap" id="collection"><p class="eyebrow">ASCENT / 2026</p><div class="section-head"><h2 class="section-title">${tr('The first collection','Первая коллекция')}</h2><a class="text-link" href="#/catalog">${tr('View all pieces','Весь каталог')} ↗</a></div><div class="product-grid home-grid">${card(products[0],'black',0)}${card(products[0],'cream',1)}${card(products[1],'black',2)}${card(products[1],'cream',3)}</div></section><section class="studio-section wrap"><p class="eyebrow">${tr('A glimpse of what comes next','Взгляд на следующую главу')}</p><div class="section-head"><h2 class="section-title">${tr('In the making.','В разработке.')}</h2><a class="text-link" href="#/catalog">${tr('Studio concepts','Студийные концепты')} ↗</a></div><div class="product-grid studio-grid">${card(products[2],'black',0)}${card(products[3],'cream',1)}</div></section><section class="brand-note"><div class="brand-note-inner">${mark('note-mark')}<div><div class="eyebrow">Origin &amp; identity</div><h2 class="note-heading">${tr('Carry your origins.','Носить свои истоки.')}</h2><p class="note-copy">${tr('Heritage and a contemporary point of view, brought together in simple things.','Наследие и современная эстетика, соединённые в простых вещах.')}</p></div><a class="button button-light" href="#/about">${tr('Our story','О бренде')} ${arrow}</a></div></section></div>`;
}
function catalog() {
  let entries = products.filter(p => state.filter === 'all' || p.category === state.filter).flatMap(p => Object.keys(p.variants).map(color => ({p,color})));
  if (state.sort === 'az') entries.sort((a,b) => a.p.name.localeCompare(b.p.name));
  if (state.sort === 'price') entries.sort((a,b) => (a.p.price ?? Infinity) - (b.p.price ?? Infinity));
  const filters = [['all',tr('All pieces','Все вещи')],['tees',tr('T-shirts','Футболки')],['hoodies',tr('Hoodies','Худи')],['longsleeves',tr('Long sleeves','Лонгсливы')]];
  return `<div class="page"><div class="wrap"><section class="catalog-head"><div class="eyebrow">ASCENT / 2026</div><div class="catalog-heading-row"><h1 class="catalog-title">${tr('The collection.','Коллекция.')}</h1><span class="collection-number">01</span></div><p class="catalog-subtitle">${tr('Two signatures. Two shades. Everyday pieces with a sense of origin.','Два принта. Два оттенка. Повседневные вещи с ощущением своих истоков.')}</p></section><div class="catalog-toolbar"><div class="filters">${filters.map(([id,label])=>`<button class="filter-button ${state.filter===id?'active':''}" data-filter="${id}" aria-pressed="${state.filter===id}">${label}</button>`).join('')}</div><label class="sort-label"><span class="eyebrow">${entries.length} ${tr('pieces','вещей')}</span><select class="sort-select" id="sortSelect" aria-label="${tr('Sort collection','Сортировать коллекцию')}"><option value="curated" ${state.sort==='curated'?'selected':''}>${tr('Curated order','Выбор бренда')}</option><option value="az" ${state.sort==='az'?'selected':''}>${tr('Name A–Z','Название А–Я')}</option><option value="price" ${state.sort==='price'?'selected':''}>${tr('Price: low to high','Сначала дешевле')}</option></select></label></div><section class="product-grid catalog-grid">${entries.map(({p,color},i)=>card(p,color,i)).join('')}</section><p class="catalog-disclaimer">${tr('Hoodie and long sleeve are studio concepts. Product images are visual mockups based on the supplied collection.','Худи и лонгслив — студийные концепты. Изображения вещей — визуальные макеты на основе предоставленной коллекции.')}</p></div></div>`;
}
function detail(title, content, open=false) { return `<details class="product-detail" ${open?'open':''}><summary>${title}<span>+</span></summary><p>${content}</p></details>`; }
function productPage() {
  const item = currentItem();
  if (!item) return notFound();
  const {p,color} = item, image = p.variants[color];
  const gallery = [image, ...(p.concept ? [] : ['garment-label.webp'])];
  return `<div class="page"><div class="wrap product-layout"><section class="gallery"><div class="thumbs">${gallery.map((src,i)=>`<button class="thumb ${i===0?'active':''}" data-thumb="${src}" aria-label="${i===0 ? tr('Full garment','Вещь целиком') : tr('Fabric and label detail','Ткань и маркировка')}" aria-pressed="${i===0}"><img src="${A+src}" alt=""></button>`).join('')}</div><div class="gallery-main" id="galleryMain"><img id="galleryImage" src="${A+image}" alt="${p.name}, ${colorName(color)}"><span class="gallery-label">${p.concept ? tr('Studio concept','Студийный концепт') : tr('Product visualisation','Визуализация вещи')}</span></div></section><section class="product-info"><div class="breadcrumb"><a href="#/catalog">${tr('Collection','Коллекция')}</a> &nbsp; / &nbsp; ${p.short}</div><div class="eyebrow">${p.concept ? tr('An idea for the next chapter','Идея для следующей главы') : tr('First collection','Первая коллекция')} · ${p.edition}</div><h1 class="product-name">${p.name}</h1><p class="product-slogan">${p.line}</p><div class="product-price">${p.price === null ? tr('Studio concept — price to be confirmed','Студийный концепт — цена уточняется') : money(p.price)}</div><div class="option-label">${tr('Colour','Цвет')} — ${colorName(color)}</div><div class="color-line">${Object.keys(p.variants).map(c=>`<a href="${productLink(p,c)}" class="swatch ${c} ${color===c?'selected':''}" aria-label="${colorName(c)}" ${color===c?'aria-current="true"':''}></a>`).join('')}</div>${p.concept ? `<p class="concept-note">${tr('A design exploration for the next ASCENT collection. Shape, fabric and production details are still being developed.','Дизайн-идея для следующей коллекции ASCENT. Форма, материал и детали производства находятся в разработке.')}</p><button class="button add-button" disabled>${tr('Concept preview · Not for sale','Концепт · Не в продаже')}</button>` : `<div class="option-label">${tr('Select size','Выберите размер')}</div><div class="size-row">${['XS','S','M','L','XL'].map(s=>`<button class="size-button ${state.size===s?'selected':''}" data-size="${s}" aria-pressed="${state.size===s}">${s}</button>`).join('')}</div><div class="size-error" id="sizeError" role="status"></div><button class="button add-button" data-action="add">${tr('Add to bag','Добавить в корзину')} ${arrow}</button><p class="purchase-note">${tr('Design preview. Checkout is a demonstration.','Дизайн-прототип. Оформление заказа — демонстрационное.')}</p>`}<div class="product-details">${detail(tr('The piece','О вещи'),p.concept ? tr('A relaxed silhouette, a restrained palette and the signature ASCENT mark. A continuation of the visual language of the first drop.','Свободный силуэт, спокойная палитра и фирменный знак ASCENT. Продолжение визуального языка первого дропа.') : tr('An oversized T-shirt with signature artwork. Available in black and off-white. A simple everyday piece, rooted in origin and identity.','Футболка свободного кроя с фирменной графикой. Доступна в чёрном и молочном цветах. Простая повседневная вещь, отражающая происхождение и идентичность.'),true)}${!p.concept ? detail(tr('Fabric & care','Материал и уход'),tr('100% cotton · 260 g/m². Wash inside out at a maximum of 40°C. Do not iron on the print.','100% хлопок · 260 г/м². Стирать наизнанку при температуре до 40°C. Не гладить по принту.')) + detail(tr('Size & fit','Размер и посадка'),tr('Oversized fit. XS–XL shown for this preview. Exact garment measurements and available sizes will be confirmed before launch.','Оверсайз-посадка. В прототипе показаны XS–XL. Точные замеры и доступные размеры будут уточнены перед запуском.')) : ''}</div></section></div><section class="wrap related-section"><div class="section-head"><h2 class="section-title">${tr('In good company.','Рядом в коллекции.')}</h2><a class="text-link" href="#/catalog">${tr('Explore all','Смотреть всё')} ↗</a></div><div class="product-grid home-grid">${products.filter(x=>x.id!==p.id).slice(0,3).map((x,i)=>card(x,Object.keys(x.variants)[0],i)).join('')}</div></section></div>`;
}
function about() {
  return `<div class="page"><div class="wrap"><section class="story-hero"><div><div class="eyebrow">ASCENT / Origin &amp; identity</div><h1 class="story-title">${tr('Origin.<br>Character.<br><em>Identity.</em>','Истоки.<br>Характер.<br><em>Идентичность.</em>')}</h1><p class="story-copy">${tr('ASCENT brings heritage and contemporary aesthetics together in simple things. A sense of place, expressed through shape, texture and graphic details.','ASCENT соединяет наследие и современную эстетику в простых вещах. Ощущение места, выраженное через форму, фактуру и графику.')}</p><p class="story-copy">${tr('The first chapter begins with black and off-white T-shirts, oversized silhouettes and the stories we carry with us.','Первая глава начинается с чёрных и молочных футболок, свободных силуэтов и историй, которые мы носим с собой.')}</p><a class="button button-light magnetic" href="#/catalog">${tr('Explore the collection','Смотреть коллекцию')} ${arrow}</a></div><div class="story-image label-story"><img src="${A}garment-label.webp" alt="${tr('ASCENT printed collar label on cotton','Маркировка ASCENT на хлопке')}"></div></section><section class="story-details"><article class="story-detail"><div class="eyebrow">01 / ${tr('Form','Форма')}</div><h3>${tr('Room to move.','Свобода движения.')}</h3><p>${tr('An oversized shape and 260 g/m² cotton form the foundation of our T-shirts.','Свободный крой и хлопок плотностью 260 г/м² — основа наших футболок.')}</p></article><article class="story-detail"><div class="eyebrow">02 / ${tr('Origin','Истоки')}</div><h3>${tr('A sense of place.','Ощущение места.')}</h3><p>${tr('The Caucasus is part of the brand’s visual language, from the collection names to the artwork.','Кавказ — часть визуального языка бренда: от названий коллекций до графики.')}</p></article><article class="story-detail"><div class="eyebrow">03 / ${tr('Identity','Идентичность')}</div><h3>${tr('Our signature.','Наш знак')}</h3><p>${tr('A mountain line within the letter A. The ASCENT symbol carries the idea of ascent in one compact form.','Горная линия внутри буквы A. Знак ASCENT выражает идею восхождения в одной лаконичной форме.')}</p></article></section></div><div class="signature-section">${mark()}<p>Origin &amp; Identity</p><span class="eyebrow">EST. 2026</span></div></div>`;
}
function cartRows(compact=false) {
  return state.cart.map(item=>{ const p=getProduct(item.id); return `<article class="${compact?'drawer-row':'cart-row'}"><a href="${productLink(p,item.color)}"><img class="cart-thumb" src="${A+p.variants[item.color]}" alt="${p.name}"></a><div><h2 class="cart-row-title"><a href="${productLink(p,item.color)}">${p.name}</a></h2><div class="cart-row-meta">${colorName(item.color)} · ${tr('Size','Размер')} ${item.size}</div><div class="cart-row-actions"><div class="quantity"><button data-qty="${item.key}" data-delta="-1" aria-label="${tr('Decrease quantity','Уменьшить количество')}">−</button><span>${item.qty}</span><button data-qty="${item.key}" data-delta="1" aria-label="${tr('Increase quantity','Увеличить количество')}">+</button></div><button class="remove-link" data-remove="${item.key}">${tr('Remove','Убрать')}</button></div></div><span class="card-price">${money(p.price*item.qty)}</span></article>`; }).join('');
}
function emptyBag() { return `<div class="empty-cart">${tr('Your next everyday favourite is waiting.','Ваша следующая любимая вещь уже ждёт.')}<br>${tr('Your bag is currently empty.','В корзине пока пусто.')}</div><a class="button" href="#/catalog">${tr('Explore collection','Смотреть коллекцию')} ${arrow}</a>`; }
function summary(checkout=false) {
  return `<aside class="cart-summary"><h2 class="summary-title">${tr('Order summary','Ваш заказ')}</h2>${checkout?state.cart.map(x=>`<div class="summary-line"><span>${getProduct(x.id).short}<br>${colorName(x.color)} · ${x.size} × ${x.qty}</span><span>${money(getProduct(x.id).price*x.qty)}</span></div>`).join(''):''}<div class="summary-line"><span>${tr('Subtotal','Товары')}</span><span>${money(total())}</span></div><div class="summary-line"><span>${tr('Delivery','Доставка')}</span><span>${tr('To be confirmed','Уточняется')}</span></div><div class="summary-line total"><span>${tr('Items total','Итого за товары')}</span><span>${money(total())}</span></div><p class="summary-note">${tr('Demo store. Delivery and payment are not connected.','Демонстрационный магазин. Доставка и оплата не подключены.')}</p>${checkout?'':`<a class="button" href="#/checkout">${tr('Continue to checkout','К оформлению')} ${arrow}</a>`}</aside>`;
}
function cartPage() { return `<div class="page"><div class="wrap cart-page"><div class="eyebrow">ASCENT / ${tr('Bag','Корзина')}</div><h1 class="cart-title">${tr('Your bag.','Ваша корзина.')} <sup>${itemCount()}</sup></h1>${state.cart.length?`<div class="cart-layout"><div>${cartRows()}</div>${summary()}</div>`:emptyBag()}</div></div>`; }
function checkout() {
  if (!state.cart.length) return cartPage();
  return `<div class="page"><div class="wrap checkout"><div class="eyebrow">ASCENT / ${tr('Checkout','Оформление')}</div><h1 class="checkout-title">${tr('Almost yours.','Почти ваши.')}</h1><div class="checkout-grid"><form class="checkout-form" id="checkoutForm"><p class="form-intro">${tr('Preview the order journey. Nothing is sent or charged.','Посмотрите, как будет выглядеть оформление. Данные не отправляются, деньги не списываются.')}</p><div class="field"><label for="customerName">${tr('Name','Имя')}</label><input id="customerName" name="name" autocomplete="given-name" required placeholder="${tr('Your name','Ваше имя')}"></div><div class="field"><label for="phone">${tr('Phone','Телефон')}</label><input id="phone" type="tel" name="phone" autocomplete="tel" required placeholder="+7 …"></div><div class="field full"><label for="email">${tr('Email','Электронная почта')}</label><input id="email" type="email" name="email" autocomplete="email" required placeholder="name@example.com"></div><div class="field full"><label for="address">${tr('Delivery address','Адрес доставки')}</label><input id="address" name="address" autocomplete="street-address" required placeholder="${tr('City, street, building','Город, улица, дом')}"></div><div class="field full"><label for="delivery">${tr('Delivery method','Способ доставки')}</label><select id="delivery" name="delivery"><option value="courier">${tr('Courier · Details to be confirmed','Курьер · Детали уточняются')}</option><option value="pickup">${tr('Pickup · Details to be confirmed','Самовывоз · Детали уточняются')}</option></select></div><div class="field full"><button class="button" type="submit">${tr('Preview confirmation','Посмотреть подтверждение')} ${arrow}</button></div></form>${summary(true)}</div></div></div>`;
}
function confirmation() { return `<div class="page"><section class="confirmation wrap">${mark()}<div class="eyebrow">${tr('Preview complete','Демонстрация завершена')}</div><h1 class="story-title">${tr('A new chapter.','Новая глава.')}</h1><p>${tr('This is how your order confirmation will look. No real order has been placed and no payment has been taken.','Так будет выглядеть подтверждение заказа. Реальный заказ не создан, оплата не проводилась.')}</p>${state.order?`<div class="confirmation-total">${tr('Items total','Итого за товары')} <strong>${money(state.order.total)}</strong></div>`:''}<a class="button" href="#/catalog">${tr('Back to collection','Вернуться в каталог')} ${arrow}</a></section></div>`; }
function notFound() { return `<div class="page"><section class="confirmation wrap"><h1 class="story-title">404</h1><p>${tr('This piece could not be found.','Эта вещь не найдена.')}</p><a class="button" href="#/catalog">${tr('Explore collection','Смотреть коллекцию')} ${arrow}</a></section></div>`; }

let revealObserver, lastFocus;
function render(resetScroll=true) {
  const oldScroll = scrollY, formValues = $('#checkoutForm') ? new FormData($('#checkoutForm')) : null;
  document.documentElement.lang = state.lang;
  $('.skip-link').textContent = tr('Skip to content','К содержимому');
  $('#siteHeader').innerHTML=header(); $('#siteFooter').innerHTML=footer();
  const {path}=currentRoute();
  const views={'/':home,'/catalog':catalog,'/about':about,'/cart':cartPage,'/checkout':checkout,'/confirmation':confirmation};
  $('#main').innerHTML=path.startsWith('/product/')?productPage():(views[path]||notFound)();
  document.title = (path==='/'?'ASCENT — Origin & Identity':`${path==='/catalog'?tr('Collection','Коллекция'):path==='/about'?tr('Our story','О бренде'):path==='/cart'?tr('Your bag','Корзина'):path==='/checkout'?tr('Checkout','Оформление'):currentItem()?.p.name||'ASCENT'} — ASCENT`);
  if(formValues && path==='/checkout') for(const [key,value] of formValues) { const field=$(`[name="${key}"]`); if(field) field.value=value; }
  requestAnimationFrame(()=>$('.page')?.classList.add('ready'));
  revealObserver?.disconnect(); revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');revealObserver.unobserve(e.target)}}),{threshold:.04});
  $$('.reveal').forEach(el=>revealObserver.observe(el));
  renderOverlays(); window.scrollTo({top:resetScroll?0:oldScroll,behavior:'instant'});
}
function renderOverlays() {
  const focusBefore=document.activeElement;
  const restoreFocus=!!state.overlay && ['cartDrawer','menuOverlay','searchOverlay'].some(id=>$('#'+id).contains(focusBefore));
  const focusLang=focusBefore?.dataset.lang;
  const focusQty=focusBefore?.dataset.qty;
  const focusDelta=focusBefore?.dataset.delta;
  $('#cartDrawer').innerHTML=`<div class="drawer-head"><h2 class="drawer-title">${tr('Your bag','Корзина')} <span class="eyebrow">(${itemCount()})</span></h2><button class="overlay-close" data-action="close-overlay" aria-label="${tr('Close','Закрыть')}">×</button></div><div class="drawer-body">${state.cart.length?cartRows(true):emptyBag()}</div>${state.cart.length?`<div class="drawer-footer"><div class="drawer-total"><span>${tr('Subtotal','Товары')}</span><span>${money(total())}</span></div><a class="button" href="#/checkout">${tr('Checkout','Оформить заказ')} ${arrow}</a><a class="drawer-link" href="#/cart">${tr('View bag','Открыть корзину')}</a></div>`:''}`;
  const menuLinks=[['/',tr('Home','Главная')],['/catalog',tr('Collection','Коллекция')],['/about',tr('Our story','О бренде')],['/cart',tr('Your bag','Корзина')]];
  $('#menuOverlay').innerHTML=`<div class="menu-top">${brand()}<div class="menu-top-actions">${langSwitch()}<button class="overlay-close" data-action="close-overlay" aria-label="${tr('Close menu','Закрыть меню')}">×</button></div></div><div class="menu-content"><nav aria-label="${tr('All pages','Все страницы')}">${menuLinks.map(([href,label],i)=>`<a class="menu-link" style="--i:${i}" href="#${href}"><span class="menu-index">0${i+1}</span><span class="menu-word">${label}</span><span class="menu-arrow">↗</span></a>`).join('')}</nav><div class="menu-art" aria-hidden="true">${mark()}<span>ORIGIN &amp; IDENTITY</span></div></div><div class="menu-bottom"><span>ASCENT / EST. 2026</span><span>${tr('Born closer to the sky.','Рождены ближе к небу.')}</span></div>`;
  $('#searchOverlay').innerHTML=`<button class="search-close" data-action="close-overlay" aria-label="${tr('Close search','Закрыть поиск')}">×</button><div class="search-box"><label class="eyebrow" for="searchInput">${tr('Find your next everyday piece','Найдите свою повседневную вещь')}</label><input id="searchInput" class="search-input" type="search" autocomplete="off" placeholder="${tr('Search the collection…','Поиск по коллекции…')}"><div id="searchResults" aria-live="polite"></div></div>`;
  $('#searchInput').value=state.search; updateSearch();
  $('#cartDrawer').setAttribute('aria-label',tr('Shopping bag','Корзина'));
  $('#menuOverlay').setAttribute('aria-label',tr('Navigation','Навигация'));
  $('#searchOverlay').setAttribute('aria-label',tr('Search','Поиск'));
  syncOverlay();
  if(restoreFocus){const root=$(state.overlay==='cart'?'#cartDrawer':state.overlay==='menu'?'#menuOverlay':'#searchOverlay');const target=focusLang?root.querySelector(`[data-lang="${focusLang}"]`):focusQty?root.querySelector(`[data-qty="${CSS.escape(focusQty)}"][data-delta="${focusDelta}"]`):null;(target||root.querySelector('button,input,a[href]'))?.focus();}
}
function syncOverlay() {
  [['cart','#cartDrawer'],['menu','#menuOverlay'],['search','#searchOverlay']].forEach(([name,selector])=>{const el=$(selector),open=state.overlay===name;el.classList.toggle('open',open);el.inert=!open;});
  $('#drawerBackdrop').classList.toggle('open',state.overlay==='cart');
  document.body.classList.toggle('no-scroll',!!state.overlay);
  $('#main').inert=!!state.overlay; $('#siteHeader').inert=!!state.overlay; $('#siteFooter').inert=!!state.overlay;
  $('.skip-link').inert=!!state.overlay;
}
function openOverlay(name) { lastFocus=document.activeElement; state.overlay=name;syncOverlay();requestAnimationFrame(()=>$(name==='search'?'#searchInput':name==='menu'?'#menuOverlay .overlay-close':'#cartDrawer .overlay-close')?.focus()); }
function closeOverlay() { state.overlay=null;syncOverlay();if(lastFocus?.isConnected)lastFocus.focus(); }
function saveCart() { writeStore('ascent-cart-v2',state.cart); $$('.bag-count').forEach(el=>el.textContent=itemCount()); }
function toast(message) { $('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),2600); }
function updateSearch() {
  const query=state.search.trim().toLocaleLowerCase(),list=products.filter(p=>(p.name+' '+p.line+' '+({tees:'футболка футболки t-shirt tee',hoodies:'худи hoodie',longsleeves:'лонгслив лонгсливы long sleeve'}[p.category])).toLocaleLowerCase().includes(query));
  $('#searchResults').innerHTML=query?(list.length?list.map(p=>`<a class="search-result" href="${productLink(p,Object.keys(p.variants)[0])}"><img src="${A+Object.values(p.variants)[0]}" alt=""><span>${p.name}<small>${p.price===null?tr('Studio concept','Студийный концепт'):money(p.price)}</small></span>${arrow}</a>`).join(''):`<p class="search-empty">${tr('No pieces found. Try “tee” or “hoodie”.','Ничего не найдено. Попробуйте «футболка» или «худи».')}</p>`):`<p class="search-empty">${tr('Explore T-shirts, hoodies and long sleeves.','Футболки, худи и лонгсливы.')}</p>`;
}

document.addEventListener('click',e=>{
  if(e.target.closest('.skip-link')){e.preventDefault();$('#main').focus();$('#main').scrollIntoView();return;}
  const language=e.target.closest('[data-lang]');
  if(language){state.lang=language.dataset.lang;writeStore('ascent-language',state.lang);render(false);return;}
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(['menu','cart','search'].includes(action)){openOverlay(action);return;}
  if(action==='close-overlay'){closeOverlay();return;}
  if(action==='scroll-collection'){e.preventDefault();$('#collection')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
  if(action==='add'){
    const item=currentItem();if(!item||item.p.concept)return;
    if(!state.size){$('#sizeError').textContent=tr('Please select a size.','Выберите размер.');$('[data-size]')?.focus();return;}
    const key=`${item.p.id}:${item.color}:${state.size}`,existing=state.cart.find(x=>x.key===key);
    if(existing)existing.qty=Math.min(existing.qty+1,99);else state.cart.push({id:item.p.id,color:item.color,size:state.size,qty:1,key});
    saveCart();renderOverlays();openOverlay('cart');return;
  }
  const size=e.target.closest('[data-size]');if(size){state.size=size.dataset.size;$$('[data-size]').forEach(b=>{b.classList.toggle('selected',b===size);b.setAttribute('aria-pressed',b===size)});$('#sizeError').textContent='';return;}
  const filter=e.target.closest('[data-filter]');if(filter){state.filter=filter.dataset.filter;render(false);return;}
  const favorite=e.target.closest('[data-favorite]');if(favorite){const key=favorite.dataset.favorite,exists=state.favorites.includes(key);state.favorites=exists?state.favorites.filter(x=>x!==key):[...state.favorites,key];writeStore('ascent-favorites',state.favorites);favorite.classList.toggle('on',!exists);favorite.textContent=exists?'♡':'♥';favorite.setAttribute('aria-pressed',!exists);toast(exists?tr('Removed from saved pieces','Убрано из избранного'):tr('Piece saved','Добавлено в избранное'));return;}
  const thumb=e.target.closest('[data-thumb]');if(thumb){$$('[data-thumb]').forEach(x=>{x.classList.toggle('active',x===thumb);x.setAttribute('aria-pressed',x===thumb)});const image=$('#galleryImage');image.classList.add('changing');clearTimeout(thumb.timer);thumb.timer=setTimeout(()=>{image.src=A+thumb.dataset.thumb;image.classList.remove('changing')},130);return;}
  const quantity=e.target.closest('[data-qty]'),remove=e.target.closest('[data-remove]');
  if(quantity||remove){
    const key=quantity?.dataset.qty||remove.dataset.remove,item=state.cart.find(x=>x.key===key);
    if(quantity&&item)item.qty=Math.min(99,item.qty+Number(quantity.dataset.delta));
    state.cart=state.cart.filter(x=>x.qty>0&&(!remove||x.key!==key));saveCart();
    if(['/cart','/checkout'].includes(currentRoute().path))render(false);else renderOverlays();return;
  }
  if(e.target.closest('a[href^="#/"]'))closeOverlay();
});
document.addEventListener('input',e=>{if(e.target.id==='searchInput'){state.search=e.target.value;updateSearch();}});
document.addEventListener('change',e=>{if(e.target.id==='sortSelect'){state.sort=e.target.value;render(false);}});
document.addEventListener('submit',e=>{if(e.target.id==='checkoutForm'){e.preventDefault();state.order={total:total()};location.hash='/confirmation';}});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeOverlay();return;}
  if(e.key==='Tab'&&state.overlay){const root=$(state.overlay==='cart'?'#cartDrawer':state.overlay==='menu'?'#menuOverlay':'#searchOverlay');const focusables=$$('a[href],button:not([disabled]),input,select',root),first=focusables[0],last=focusables.at(-1);if(!root.contains(document.activeElement)){e.preventDefault();first?.focus();}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
});
window.addEventListener('hashchange',()=>{const next=currentItem();if(next?.p.id!==window.lastProductId)state.size='';window.lastProductId=next?.p.id;closeOverlay();render();});

window.lastProductId=currentItem()?.p.id;
render();
