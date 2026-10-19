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
  cart: readStore('ascent-cart-v2', []),
  filter: 'all', sort: 'curated', size: '', overlay: null, search: '', order: null
};
if (!Array.isArray(state.cart)) state.cart = [];
state.cart = state.cart.filter(x => x && products.some(p => p.id === x.id && p.price !== null && Object.hasOwn(p.variants, x.color)) && ['XS','S','M','L','XL'].includes(x.size) && Number.isInteger(x.qty) && x.qty > 0 && x.qty <= 99).map(x => ({id:x.id, color:x.color, size:x.size, qty:x.qty, key: `${x.id}:${x.color}:${x.size}`}));
const tr = (en, ru) => state.lang === 'ru' ? ru : en;
const money = n => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
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
function currentItem() {
  const route = currentRoute(), p = getProduct(route.path.split('/')[2]);
  return p ? { p, color: Object.hasOwn(p.variants, route.params.get('color')) ? route.params.get('color') : Object.keys(p.variants)[0] } : null;
}
function productLink(p, color) { return `#/product/${p.id}?color=${color}`; }
function mark(extra = '') { return `<img class="brand-symbol ${extra}" src="${A}ascent-mountain-mark.jpg" alt="" width="40" height="40">`; }
function brand() { return `<a class="brand" href="#/" aria-label="${tr('ASCENT home','ASCENT — главная')}">${mark()}<span><span class="brand-name">ASCENT</span><span class="brand-sub">Origin &amp; Identity</span></span></a>`; }
function langSwitch() { return `<div class="lang-switch" aria-label="${tr('Language','Язык')}"><button data-lang="en" class="${state.lang === 'en' ? 'active' : ''}" aria-pressed="${state.lang === 'en'}">EN</button><span>/</span><button data-lang="ru" class="${state.lang === 'ru' ? 'active' : ''}" aria-pressed="${state.lang === 'ru'}">RU</button></div>`; }
function header() {
  const path = currentRoute().path;
  return `<div class="announcement">${tr('FIRST COLLECTION', 'ПЕРВАЯ КОЛЛЕКЦИЯ')} <span aria-hidden="true">—</span> 2026</div>
    <div class="header-inner"><nav class="main-nav" aria-label="${tr('Main navigation', 'Главная навигация')}">
      <a class="nav-link" href="#/catalog" ${path === '/catalog' ? 'aria-current="page"' : ''}>${tr('Shop', 'Каталог')}</a>
      <a class="nav-link" href="#/about" ${path === '/about' ? 'aria-current="page"' : ''}>${tr('About', 'О бренде')}</a>
    </nav>${brand()}<div class="header-actions">${langSwitch()}
      <button class="icon-button header-search" data-action="search" aria-haspopup="dialog" aria-label="${tr('Search', 'Поиск')}">${icon.search}</button>
      <button class="icon-button" data-action="cart" aria-haspopup="dialog" aria-label="${tr('Open bag', 'Открыть корзину')}">${icon.bag}<span class="bag-count" ${itemCount() ? '' : 'hidden'}>${itemCount()}</span></button>
      <button class="icon-button menu-toggle" data-action="menu" aria-haspopup="dialog" aria-label="${tr('Open menu', 'Открыть меню')}">${icon.menu}</button>
    </div></div>`;
}
function footer() {
  return `<div class="footer-inner"><div class="footer-brand">${brand()}
    <p class="footer-copy">${tr('Contemporary clothing. Caucasian roots.', 'Современная одежда. Кавказские корни.')}</p></div>
    <div><p class="footer-title">${tr('Explore', 'Навигация')}</p><div class="footer-links">
      <a href="#/catalog">${tr('Collection', 'Коллекция')}</a><a href="#/about">${tr('About ASCENT', 'О бренде ASCENT')}</a><a href="#/cart">${tr('Shopping bag', 'Корзина')}</a>
    </div></div><div><p class="footer-title">${tr('Collections', 'Линии')}</p><div class="footer-links">
      <a href="${productLink(products[0], 'black')}">Mountain Department</a><a href="${productLink(products[1], 'cream')}">Highland Origins</a><a href="#/catalog">ASCENT Studio</a>
    </div></div></div><div class="footer-bottom"><span>© ASCENT 2026</span><span>ORIGIN &amp; IDENTITY</span>${langSwitch()}</div>`;
}
function typeName(p) {
  return {tees:tr('T-shirt','Футболка'),hoodies:tr('Hoodie','Худи'),longsleeves:tr('Long sleeve','Лонгслив')}[p.category];
}
function card(p, color, index = 0) {
  return `<article class="product-card reveal" style="--delay:${index % 4 * 40}ms">
    <div class="product-card-image"><a href="${productLink(p, color)}" aria-label="${p.short} — ${typeName(p)}, ${colorName(color)}">
      <img loading="lazy" decoding="async" width="1100" height="1100" src="${A + p.variants[color]}" alt="${p.short}, ${colorName(color)}">
    </a>${p.concept ? `<span class="card-index">${tr('In development', 'В разработке')}</span>` : ''}
    <a class="card-view" tabindex="-1" aria-hidden="true" href="${productLink(p, color)}">${tr('View piece', 'Подробнее')} ${arrow}</a></div>
    <div class="card-info"><div><h3 class="card-title"><a href="${productLink(p, color)}">${p.short}</a></h3>
      <div class="card-meta">${typeName(p)} · ${colorName(color)}</div></div>
      <span class="card-price">${p.price === null ? tr('Studio', 'Студия') : money(p.price)}</span>
    </div></article>`;
}
function home() {
  return `<div class="page">
    <section class="mountain-hero" id="mountainHero" aria-labelledby="heroTitle">
      <img class="mountain-image" src="${A}highland-hero.webp" fetchpriority="high" width="1891" height="831" alt="${tr('Caucasus mountains in mist with ancient stone towers', 'Горы Кавказа в тумане и старинные каменные башни')}">
      <div class="hero-shade"></div><div class="mountain-copy">
        <h1 class="mountain-title" id="heroTitle">ORIGIN &amp; IDENTITY</h1><p>ASCENT — HIGHLAND ORIGINS</p>
        <a class="button hero-button" href="#/catalog">${tr('Explore collection', 'Смотреть коллекцию')} ${arrow}</a>
      </div><div class="hero-bottom"><span>${tr('The Caucasus. Our point of origin.', 'Кавказ. Наше начало.')}</span><span>EST. 2026</span></div>
    </section>
    <section class="collection-intro wrap" id="collection" aria-labelledby="collectionTitle">
      <div class="section-head"><div><p class="eyebrow">ASCENT / 2026</p><h2 class="section-title" id="collectionTitle">${tr('The first collection', 'Первая коллекция')}</h2></div>
        <a class="text-link" href="#/catalog">${tr('Shop all', 'Весь каталог')} ${arrow}</a></div>
      <div class="product-grid home-grid">${card(products[0], 'black', 0)}${card(products[0], 'cream', 1)}${card(products[1], 'black', 2)}${card(products[1], 'cream', 3)}</div>
    </section>
    <section class="home-story wrap reveal" aria-labelledby="fabricTitle">
      <div class="home-story-image"><img src="${A}garment-label.webp" loading="lazy" decoding="async" width="960" height="1280" alt="${tr('Cotton texture and printed ASCENT label', 'Фактура хлопка и маркировка ASCENT')}"></div>
      <div class="home-story-copy"><p class="eyebrow">${tr('The details', 'Детали')}</p><h2 class="section-title" id="fabricTitle">${tr('100% cotton.', '100% хлопок.')}</h2>
        <p class="material-facts">260 ${tr('g/m²', 'г/м²')} <span aria-hidden="true">/</span> ${tr('Oversized fit', 'Свободный крой')}</p>
        <p>${tr('A substantial cotton jersey, a relaxed silhouette and our signature print. The same foundation for every T-shirt in the collection.', 'Плотный хлопковый трикотаж, свободный силуэт и фирменный принт. Основа каждой футболки в коллекции.')}</p>
        <a class="text-link" href="#/about">${tr('About ASCENT', 'О бренде ASCENT')} ${arrow}</a>
      </div>
    </section>
    <section class="studio-section wrap" aria-labelledby="studioTitle"><div class="studio-layout">
      <div class="studio-copy"><p class="eyebrow">ASCENT STUDIO</p><h2 class="section-title" id="studioTitle">${tr('In development', 'В разработке')}</h2>
        <p>${tr('A hoodie and a long sleeve. A first look at the next pieces taking shape in the studio.', 'Худи и лонгслив. Первый взгляд на вещи, над которыми мы сейчас работаем.')}</p>
        <span class="eyebrow">${tr('Design concepts · Not yet for sale', 'Дизайн-концепты · Пока не в продаже')}</span>
      </div><div class="product-grid studio-grid">${card(products[2], 'black', 0)}${card(products[3], 'cream', 1)}</div>
    </div></section>
  </div>`;
}
function catalogEntries() {
  const entries = products.filter(p => state.filter === 'all' || p.category === state.filter)
    .flatMap(p => Object.keys(p.variants).map(color => ({p, color})));
  if (state.sort === 'az') entries.sort((a, b) => a.p.name.localeCompare(b.p.name));
  if (state.sort === 'price') entries.sort((a, b) => (a.p.price ?? Infinity) - (b.p.price ?? Infinity));
  return entries;
}
function catalog() {
  const entries = catalogEntries();
  const filters = [['all',tr('All','Все')],['tees',tr('T-shirts','Футболки')],['hoodies',tr('Hoodies','Худи')],['longsleeves',tr('Long sleeves','Лонгсливы')]];
  return `<div class="page"><div class="wrap">
    <section class="catalog-head"><p class="eyebrow">ASCENT / 2026</p><h1 class="catalog-title">${tr('Collection', 'Коллекция')}</h1>
      <p class="catalog-subtitle">${tr('Signature prints. Black and off-white. An oversized silhouette.', 'Фирменные принты. Чёрный и молочный. Свободный силуэт.')}</p></section>
    <div class="catalog-toolbar"><div class="filters" role="group" aria-label="${tr('Product categories', 'Категории товаров')}">
      ${filters.map(([id,label]) => `<button class="filter-button ${state.filter === id ? 'active' : ''}" data-filter="${id}" aria-pressed="${state.filter === id}">${label}</button>`).join('')}
    </div><label class="sort-label"><span class="eyebrow" id="catalogCount" aria-live="polite">${entries.length} ${tr('items','моделей')}</span>
      <select class="sort-select" id="sortSelect" aria-label="${tr('Sort collection','Сортировать коллекцию')}">
        <option value="curated" ${state.sort === 'curated' ? 'selected' : ''}>${tr('Featured','По умолчанию')}</option>
        <option value="az" ${state.sort === 'az' ? 'selected' : ''}>${tr('Name A–Z','По названию')}</option>
        <option value="price" ${state.sort === 'price' ? 'selected' : ''}>${tr('Price: low to high','Сначала дешевле')}</option>
      </select></label></div>
    <section class="product-grid catalog-grid" id="catalogGrid" aria-label="${tr('Collection','Коллекция')}">${entries.map(({p,color},i) => card(p,color,i)).join('')}</section>
    <p class="catalog-disclaimer">${tr('ASCENT Studio pieces are in development and are not available to order.', 'Вещи ASCENT Studio находятся в разработке и пока недоступны для заказа.')}</p>
  </div></div>`;
}
function detail(title, content, open=false) { return `<details class="product-detail" ${open?'open':''}><summary>${title}<span>+</span></summary><p>${content}</p></details>`; }
function productPage() {
  const item = currentItem();
  if (!item) return notFound();
  const {p, color} = item, image = p.variants[color];
  const gallery = [image, ...(p.concept ? [] : ['garment-label.webp'])];
  const related = products.filter(x => x.category === 'tees' && x.id !== p.id)
    .flatMap(x => Object.keys(x.variants).map(c => ({p:x, color:c}))).slice(0, 4);
  return `<div class="page"><div class="wrap product-layout">
    <section class="gallery" aria-label="${tr('Product photographs','Фотографии товара')}">
      <div class="thumbs">${gallery.map((src,i) => `<button class="thumb ${i === 0 ? 'active' : ''}" data-thumb="${src}" data-caption="${i === 0 ? `${p.short}, ${colorName(color)}` : tr('Cotton and label detail','Хлопок и маркировка')}" aria-label="${i === 0 ? tr('Full garment','Вещь целиком') : tr('Cotton and label detail','Хлопок и маркировка')}" aria-pressed="${i === 0}"><img src="${A+src}" width="80" height="80" alt=""></button>`).join('')}</div>
      <div class="gallery-main" id="galleryMain"><img id="galleryImage" src="${A+image}" width="1100" height="1100" fetchpriority="high" alt="${p.short}, ${colorName(color)}">
        ${p.concept ? `<span class="gallery-label">${tr('In development','В разработке')}</span>` : ''}
        <button class="icon-button zoom-button" data-action="image" aria-haspopup="dialog" aria-label="${tr('Enlarge photograph','Увеличить фотографию')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg></button>
      </div>
    </section>
    <section class="product-info"><div class="breadcrumb"><a href="#/catalog">${tr('Collection','Коллекция')}</a> / ${typeName(p)}</div>
      <p class="eyebrow">${p.concept ? 'ASCENT STUDIO' : p.edition}</p><h1 class="product-name">${p.short}</h1>
      <p class="product-slogan">${typeName(p)}${p.concept ? '' : ` · ${tr('Oversized fit','Оверсайз')}`}</p>
      <div class="product-price">${p.price === null ? tr('In development','В разработке') : money(p.price)}</div>
      <div class="option-label">${tr('Colour','Цвет')} — ${colorName(color)}</div>
      <div class="color-line">${Object.keys(p.variants).map(c => `<a href="${productLink(p,c)}" class="swatch ${c} ${color === c ? 'selected' : ''}" aria-label="${colorName(c)}" ${color === c ? 'aria-current="true"' : ''}></a>`).join('')}</div>
      ${p.concept ? `<p class="concept-note">${tr('A design concept from the ASCENT studio. Fabric, sizing and release date will be announced when the piece is ready.', 'Дизайн-концепт студии ASCENT. Материал, размерную сетку и дату выхода объявим, когда вещь будет готова.')}</p><button class="button add-button" disabled>${tr('Not yet available','Пока недоступно')}</button>` : `
        <div class="size-label-row"><div class="option-label">${tr('Size','Размер')}</div><button class="text-link" data-action="size-info">${tr('Fit details','О посадке')}</button></div>
        <div class="size-row" role="group" aria-label="${tr('Select size','Выберите размер')}">${['XS','S','M','L','XL'].map(s => `<button class="size-button ${state.size === s ? 'selected' : ''}" data-size="${s}" aria-pressed="${state.size === s}">${s}</button>`).join('')}</div>
        <div class="size-error" id="sizeError" role="status"></div><button class="button add-button" data-action="add">${tr('Add to bag','Добавить в корзину')} ${arrow}</button>
        <p class="purchase-note">${tr('100% cotton · 260 g/m²','100% хлопок · 260 г/м²')}</p>`}
      <div class="product-details">
        ${detail(tr('Details','О вещи'), p.concept ? tr('A relaxed silhouette with the ASCENT mark. Part of our ongoing work on the next collection.', 'Свободный силуэт с фирменным знаком ASCENT. Часть работы над следующей коллекцией.') : tr(`Oversized cotton T-shirt with the “${p.line}” artwork. Available in black and off-white.`, `Футболка свободного кроя из хлопка с принтом «${p.line}». Доступна в чёрном и молочном цветах.`), true)}
        ${!p.concept ? detail(tr('Fabric & care','Материал и уход'), tr('100% cotton, 260 g/m². Wash inside out at a maximum of 40°C. Do not iron directly on the print.', '100% хлопок, 260 г/м². Стирать наизнанку при температуре до 40°C. Не гладить по принту.')) + detail(tr('Size & fit','Размер и посадка'), tr('Oversized fit with dropped shoulders. XS–XL are shown in this preview. Exact measurements and available sizes will be confirmed before orders open.', 'Свободный крой со спущенной линией плеча. В прототипе показаны XS–XL. Точные замеры и наличие размеров будут опубликованы перед началом продаж.')).replace('class="product-detail"', 'class="product-detail" id="fitDetails"') : ''}
      </div>
    </section>
  </div><section class="wrap related-section"><div class="section-head"><h2 class="section-title">${tr('Also in the collection','Также в коллекции')}</h2><a class="text-link" href="#/catalog">${tr('Shop all','Весь каталог')} ${arrow}</a></div>
    <div class="product-grid related-grid">${related.map(({p,color},i) => card(p,color,i)).join('')}</div>
  </section></div>`;
}
function about() {
  return `<div class="page"><div class="wrap"><section class="story-hero"><div>
    <p class="eyebrow">${tr('ABOUT ASCENT','О БРЕНДЕ ASCENT')}</p><h1 class="story-title">Origin &amp;<br><em>Identity.</em></h1>
    <p class="story-copy">${tr('ASCENT is about origin, character and identity. We bring heritage and contemporary aesthetics together in simple things.', 'ASCENT — про происхождение, характер и идентичность. Мы соединяем наследие и современную эстетику в простых вещах.')}</p>
    <p class="story-copy">${tr('Our first collection starts with two prints, black and off-white cotton, and an oversized fit. Mountain Department and Highland Origins share the same point of departure: the Caucasus.', 'В первой коллекции — два принта, чёрный и молочный хлопок, свободный крой. Mountain Department и Highland Origins объединяет одна точка отсчёта — Кавказ.')}</p>
    <a class="text-link" href="#/catalog">${tr('Explore the collection','Смотреть коллекцию')} ${arrow}</a>
    </div><div class="story-image"><img src="${A}garment-label.webp" width="960" height="1280" alt="${tr('ASCENT label printed on cotton','Маркировка ASCENT на хлопке')}"></div></section>
    <section class="story-details" aria-label="${tr('Collection details','Детали коллекции')}">
      <article class="story-detail"><p class="eyebrow">${tr('Fabric','Материал')}</p><h3>${tr('100% cotton','100% хлопок')}</h3><p>${tr('260 g/m² cotton jersey. A substantial texture that holds the oversized silhouette.', 'Хлопковый трикотаж плотностью 260 г/м². Плотная фактура, которая держит свободный силуэт.')}</p></article>
      <article class="story-detail"><p class="eyebrow">${tr('Fit','Посадка')}</p><h3>${tr('Oversized','Оверсайз')}</h3><p>${tr('A wide body and dropped shoulders. The same relaxed proportions across both T-shirt designs.', 'Широкий корпус и спущенная линия плеча. Одинаковые свободные пропорции у обеих моделей футболок.')}</p></article>
      <article class="story-detail"><p class="eyebrow">${tr('Signature','Наш знак')}</p><h3>ASCENT</h3><p>${tr('The letter A and a mountain silhouette. A reference to the place that shaped the brand.', 'Буква A и силуэт гор. Отсылка к месту, с которого началась история бренда.')}</p></article>
    </section></div><div class="signature-section">${mark()}<p>Origin &amp; Identity</p><span class="eyebrow">EST. 2026</span></div></div>`;
}
function cartRows(compact=false) {
  return state.cart.map(item=>{ const p=getProduct(item.id); return `<article class="${compact?'drawer-row':'cart-row'}"><a href="${productLink(p,item.color)}"><img class="cart-thumb" src="${A+p.variants[item.color]}" alt="${p.name}"></a><div><h2 class="cart-row-title"><a href="${productLink(p,item.color)}">${p.name}</a></h2><div class="cart-row-meta">${colorName(item.color)} · ${tr('Size','Размер')} ${item.size}</div><div class="cart-row-actions"><div class="quantity"><button data-qty="${item.key}" data-delta="-1" aria-label="${tr('Decrease quantity','Уменьшить количество')}">−</button><span>${item.qty}</span><button data-qty="${item.key}" data-delta="1" aria-label="${tr('Increase quantity','Увеличить количество')}">+</button></div><button class="remove-link" data-remove="${item.key}">${tr('Remove','Убрать')}</button></div></div><span class="card-price">${money(p.price*item.qty)}</span></article>`; }).join('');
}
function emptyBag() { return `<div class="empty-cart">${tr('Explore the first ASCENT collection.','Откройте первую коллекцию ASCENT.')}<br>${tr('Your bag is currently empty.','В корзине пока пусто.')}</div><a class="button" href="#/catalog">${tr('Explore collection','Смотреть коллекцию')} ${arrow}</a>`; }
function summary(checkout=false) {
  return `<aside class="cart-summary"><h2 class="summary-title">${tr('Order summary','Ваш заказ')}</h2>${checkout?state.cart.map(x=>`<div class="summary-line"><span>${getProduct(x.id).short}<br>${colorName(x.color)} · ${x.size} × ${x.qty}</span><span>${money(getProduct(x.id).price*x.qty)}</span></div>`).join(''):''}<div class="summary-line"><span>${tr('Subtotal','Товары')}</span><span>${money(total())}</span></div><div class="summary-line"><span>${tr('Delivery','Доставка')}</span><span>${tr('To be confirmed','Уточняется')}</span></div><div class="summary-line total"><span>${tr('Items total','Итого за товары')}</span><span>${money(total())}</span></div><p class="summary-note">${tr('Demo store. Delivery and payment are not connected.','Демонстрационный магазин. Доставка и оплата не подключены.')}</p>${checkout?'':`<a class="button" href="#/checkout">${tr('Continue to checkout','К оформлению')} ${arrow}</a>`}</aside>`;
}
function cartPage() { return `<div class="page"><div class="wrap cart-page"><div class="eyebrow">ASCENT / ${tr('Bag','Корзина')}</div><h1 class="cart-title">${tr('Shopping bag','Корзина')} <sup>${itemCount()}</sup></h1>${state.cart.length?`<div class="cart-layout"><div>${cartRows()}</div>${summary()}</div>`:emptyBag()}</div></div>`; }
function checkout() {
  if (!state.cart.length) return cartPage();
  return `<div class="page"><div class="wrap checkout"><div class="eyebrow">ASCENT / ${tr('Checkout','Оформление')}</div><h1 class="checkout-title">${tr('Checkout','Оформление')}</h1><div class="checkout-grid"><form class="checkout-form" id="checkoutForm"><a class="text-link checkout-back" href="#/cart">← ${tr('Back to bag','В корзину')}</a><p class="form-intro">${tr('Preview the order journey. Nothing is sent or charged.','Посмотрите, как будет выглядеть оформление. Данные не отправляются, деньги не списываются.')}</p><div class="field"><label for="customerName">${tr('Name','Имя')}</label><input id="customerName" name="name" autocomplete="given-name" required placeholder="${tr('Your name','Ваше имя')}"></div><div class="field"><label for="phone">${tr('Phone','Телефон')}</label><input id="phone" type="tel" name="phone" autocomplete="tel" required placeholder="+7 …"></div><div class="field full"><label for="email">${tr('Email','Электронная почта')}</label><input id="email" type="email" name="email" autocomplete="email" required placeholder="name@example.com"></div><div class="field full"><label for="address">${tr('Delivery address','Адрес доставки')}</label><input id="address" name="address" autocomplete="street-address" required placeholder="${tr('City, street, building','Город, улица, дом')}"></div><div class="field full"><label for="delivery">${tr('Delivery method','Способ доставки')}</label><select id="delivery" name="delivery"><option value="courier">${tr('Courier · Details to be confirmed','Курьер · Детали уточняются')}</option><option value="pickup">${tr('Pickup · Details to be confirmed','Самовывоз · Детали уточняются')}</option></select></div><div class="field full"><button class="button" type="submit">${tr('Preview confirmation','Посмотреть подтверждение')} ${arrow}</button></div></form>${summary(true)}</div></div></div>`;
}
function confirmation() { return `<div class="page"><section class="confirmation wrap">${mark()}<div class="eyebrow">${tr('Preview complete','Демонстрация завершена')}</div><h1 class="story-title">${tr('Thank you.','Спасибо.')}</h1><p>${tr('This is how your order confirmation will look. No real order has been placed and no payment has been taken.','Так будет выглядеть подтверждение заказа. Реальный заказ не создан, оплата не проводилась.')}</p>${state.order?`<div class="confirmation-total">${tr('Items total','Итого за товары')} <strong>${money(state.order.total)}</strong></div>`:''}<a class="button" href="#/catalog">${tr('Back to collection','Вернуться в каталог')} ${arrow}</a></section></div>`; }
function notFound() { return `<div class="page"><section class="confirmation wrap"><h1 class="story-title">404</h1><p>${tr('This piece could not be found.','Эта вещь не найдена.')}</p><a class="button" href="#/catalog">${tr('Explore collection','Смотреть коллекцию')} ${arrow}</a></section></div>`; }

let revealObserver, lastFocus, lastFocusAction, galleryVersion = 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
// Observe below-fold content once; no continuous scroll or cursor animation.
function initReveals(root = document) {
  revealObserver?.disconnect();
  const elements = $$('.reveal', root);
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;
  revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.remove('reveal-pending');
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  }), {threshold:0.02, rootMargin:'0px 0px 24px 0px'});
  elements.forEach(element => {
    if (element.getBoundingClientRect().top < innerHeight) return;
    element.classList.add('reveal-pending');
    revealObserver.observe(element);
  });
}
function render(resetScroll = true) {
  const oldScroll = scrollY;
  const focused = document.activeElement;
  const focusedId = focused?.id;
  const focusedLang = focused?.dataset.lang;
  const focusedQty = focused?.dataset.qty;
  const focusedRemove = focused?.dataset.remove;
  const focusedDelta = focused?.dataset.delta;
  const focusedHref = focused?.getAttribute('href');
  const focusedInFooter = !!focused?.closest('.site-footer');
  const formValues = $('#checkoutForm') ? new FormData($('#checkoutForm')) : null;
  galleryVersion++;
  revealObserver?.disconnect();
  document.documentElement.lang = state.lang;
  $('.skip-link').textContent = tr('Skip to content', 'К содержимому');
  $('#siteHeader').innerHTML = header();
  $('#siteFooter').innerHTML = footer();
  const {path} = currentRoute();
  const views = {'/':home, '/catalog':catalog, '/about':about, '/cart':cartPage, '/checkout':checkout, '/confirmation':confirmation};
  $('#main').innerHTML = path.startsWith('/product/') ? productPage() : (views[path] || notFound)();
  const titles = {'/catalog':tr('Collection','Коллекция'), '/about':tr('About','О бренде'), '/cart':tr('Bag','Корзина'), '/checkout':tr('Checkout','Оформление'), '/confirmation':tr('Confirmation','Подтверждение')};
  document.title = path === '/' ? 'ASCENT — Origin & Identity' : `${currentItem()?.p.short || titles[path] || '404'} — ASCENT`;
  if (formValues && path === '/checkout') for (const [key, value] of formValues) {
    const field = $('#checkoutForm')?.elements.namedItem(key);
    if (field) field.value = value;
  }
  if (resetScroll && !reducedMotion.matches) $('.page')?.classList.add('page-enter');
  renderOverlays();
  window.scrollTo({top:resetScroll ? 0 : oldScroll, behavior:'instant'});
  initReveals();
  if (!resetScroll && !state.overlay) {
    const root = focusedInFooter ? $('#siteFooter') : document;
    const target = focusedId ? $('#' + CSS.escape(focusedId))
      : focusedLang ? root.querySelector(`[data-lang="${focusedLang}"]`)
      : focusedQty ? $$('[data-qty]').find(el => el.dataset.qty === focusedQty && el.dataset.delta === focusedDelta)
      : focusedHref ? $$('a[href]').find(el => el.getAttribute('href') === focusedHref) : null;
    (target || (focusedRemove ? $('[data-remove]') : null) || (focusedQty || focusedRemove ? $('#main') : null))?.focus({preventScroll:true});
  }
}
function updateCatalog() {
  const entries = catalogEntries();
  $('#catalogGrid').innerHTML = entries.map(({p,color},index) => card(p,color,index)).join('');
  $('#catalogCount').textContent = `${entries.length} ${tr('items','моделей')}`;
  $$('[data-filter]').forEach(button => {
    const active = button.dataset.filter === state.filter;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', active);
  });
  if (!reducedMotion.matches) $('#catalogGrid').animate([{opacity:.5},{opacity:1}], {duration:220,easing:'ease-out'});
  initReveals($('#catalogGrid'));
}
async function selectImage(thumb) {
  const version = ++galleryVersion;
  const image = $('#galleryImage');
  const source = A + thumb.dataset.thumb;
  const preload = new Image();
  preload.src = source;
  try { await preload.decode(); }
  catch { if (version === galleryVersion) toast(tr('The photograph could not be loaded.','Не удалось загрузить фотографию.')); return; }
  if (version !== galleryVersion || !image?.isConnected) return;
  if (!reducedMotion.matches) {
    const fade = image.animate([{opacity:1},{opacity:0}], {duration:120,fill:'forwards'});
    try { await fade.finished; } catch { return; }
    if (version !== galleryVersion || !image.isConnected) { fade.cancel(); return; }
    image.src = source;
    fade.cancel();
    image.animate([{opacity:0},{opacity:1}], {duration:220});
  } else image.src = source;
  image.alt = thumb.dataset.caption;
  $$('[data-thumb]').forEach(button => {
    button.classList.toggle('active', button === thumb);
    button.setAttribute('aria-pressed', button === thumb);
  });
}
function renderOverlays() {
  const focusBefore=document.activeElement;
  const restoreFocus=!!state.overlay && ['cartDrawer','menuOverlay','searchOverlay','imageOverlay'].some(id=>$('#'+id).contains(focusBefore));
  const focusLang=focusBefore?.dataset.lang;
  const focusQty=focusBefore?.dataset.qty;
  const focusDelta=focusBefore?.dataset.delta;
  const drawerScroll = $('#cartDrawer .drawer-body')?.scrollTop || 0;
  $('#cartDrawer').innerHTML=`<div class="drawer-head"><h2 class="drawer-title">${tr('Your bag','Корзина')} <span class="eyebrow">(${itemCount()})</span></h2><button class="overlay-close" data-action="close-overlay" aria-label="${tr('Close','Закрыть')}">×</button></div><div class="drawer-body">${state.cart.length?cartRows(true):emptyBag()}</div>${state.cart.length?`<div class="drawer-footer"><div class="drawer-total"><span>${tr('Subtotal','Товары')}</span><span>${money(total())}</span></div><a class="button" href="#/checkout">${tr('Checkout','Оформить заказ')} ${arrow}</a><a class="drawer-link" href="#/cart">${tr('View bag','Открыть корзину')}</a></div>`:''}`;
  const menuLinks=[['/',tr('Home','Главная')],['/catalog',tr('Collection','Коллекция')],['/about',tr('Our story','О бренде')],['/cart',tr('Your bag','Корзина')]];
  $('#menuOverlay').innerHTML=`<div class="menu-top">${brand()}<div class="menu-top-actions">${langSwitch()}<button class="overlay-close" data-action="close-overlay" aria-label="${tr('Close menu','Закрыть меню')}">×</button></div></div><div class="menu-content"><nav aria-label="${tr('All pages','Все страницы')}">${menuLinks.map(([href,label],i)=>`<a class="menu-link" style="--i:${i}" href="#${href}"><span class="menu-word">${label}</span><span class="menu-arrow">↗</span></a>`).join('')}</nav><div class="menu-art" aria-hidden="true">${mark()}<span>ORIGIN &amp; IDENTITY</span></div></div><div class="menu-bottom"><span>ASCENT / EST. 2026</span><span>${tr('The first collection','Первая коллекция')}</span></div>`;
  $('#searchOverlay').innerHTML=`<button class="search-close" data-action="close-overlay" aria-label="${tr('Close search','Закрыть поиск')}">×</button><div class="search-box"><label class="eyebrow" for="searchInput">${tr('Search ASCENT','Поиск ASCENT')}</label><input id="searchInput" class="search-input" type="search" autocomplete="off" placeholder="${tr('Search the collection…','Поиск по коллекции…')}"><div id="searchResults" aria-live="polite"></div></div>`;
  $('#searchInput').value=state.search; updateSearch();
  $('#cartDrawer').setAttribute('aria-label',tr('Shopping bag','Корзина'));
  $('#menuOverlay').setAttribute('aria-label',tr('Navigation','Навигация'));
  $('#searchOverlay').setAttribute('aria-label',tr('Search','Поиск'));
  $('#imageOverlay').setAttribute('aria-label',tr('Enlarged photograph','Фотография крупным планом'));
  $('#imageOverlay .overlay-close').setAttribute('aria-label',tr('Close photograph','Закрыть фотографию'));
  const menuSearch = document.createElement('button');
  menuSearch.className = 'text-link menu-search';
  menuSearch.dataset.action = 'search';
  menuSearch.textContent = tr('Search the collection', 'Поиск по коллекции');
  $('#menuOverlay nav').append(menuSearch);
  syncOverlay();
  $('#cartDrawer .drawer-body').scrollTop = drawerScroll;
  if(restoreFocus){const root=$(state.overlay==='cart'?'#cartDrawer':state.overlay==='menu'?'#menuOverlay':state.overlay==='image'?'#imageOverlay':'#searchOverlay');const target=focusLang?root.querySelector(`[data-lang="${focusLang}"]`):focusQty?root.querySelector(`[data-qty="${CSS.escape(focusQty)}"][data-delta="${focusDelta}"]`):null;(target||root.querySelector('button,input,a[href]'))?.focus();}
}
function syncOverlay() {
  [['cart','#cartDrawer'],['menu','#menuOverlay'],['search','#searchOverlay'],['image','#imageOverlay']].forEach(([name,selector])=>{const el=$(selector),open=state.overlay===name;el.classList.toggle('open',open);el.inert=!open;el.setAttribute('aria-hidden',String(!open));});
  $('#drawerBackdrop').classList.toggle('open',state.overlay==='cart');
  document.body.classList.toggle('no-scroll',!!state.overlay);
  $('#main').inert=!!state.overlay; $('#siteHeader').inert=!!state.overlay; $('#siteFooter').inert=!!state.overlay;
  $('.skip-link').inert=!!state.overlay;
}
function openOverlay(name) {
  if (!state.overlay) {
    lastFocus = document.activeElement;
    lastFocusAction = lastFocus?.dataset.action;
  }
  if (name === 'image') {
    const original = $('#galleryImage');
    if (!original) return;
    const image = original.cloneNode();
    image.removeAttribute('id');
    image.removeAttribute('style');
    $('#imageOverlay .image-overlay-stage').replaceChildren(image);
    $('#imageOverlay .image-overlay-caption').textContent = original.alt;
  }
  state.overlay = name;
  syncOverlay();
  requestAnimationFrame(() => {
    if (state.overlay !== name) return;
    $(name === 'search' ? '#searchInput' : name === 'menu' ? '#menuOverlay .overlay-close' : name === 'image' ? '#imageOverlay .overlay-close' : '#cartDrawer .overlay-close')?.focus({preventScroll:true});
  });
}
function closeOverlay(restore = true) {
  if (!state.overlay) return;
  state.overlay = null;
  syncOverlay();
  if (restore) {
    const target = lastFocus?.isConnected ? lastFocus
      : lastFocusAction ? $$('[data-action]').find(element => element.dataset.action === lastFocusAction && !element.closest('[inert]')) : null;
    (target || $('#main')).focus({preventScroll:true});
  }
}
function saveCart() { writeStore('ascent-cart-v2',state.cart); $$('.bag-count').forEach(el=>{el.textContent=itemCount();el.hidden=!itemCount()}); }
function toast(message) { $('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),2600); }
function updateSearch() {
  const query = state.search.trim().toLocaleLowerCase();
  const list = products.filter(p => (p.name+' '+p.line+' '+({tees:'футболка футболки t-shirt tee',hoodies:'худи hoodie',longsleeves:'лонгслив лонгсливы long sleeve'}[p.category])).toLocaleLowerCase().includes(query));
  $('#searchResults').innerHTML = list.length
    ? `${!query ? `<p class="search-empty">${tr('Explore the collection','В коллекции')}</p>` : ''}${list.map(p => `<a class="search-result" href="${productLink(p,Object.keys(p.variants)[0])}"><img src="${A+Object.values(p.variants)[0]}" width="64" height="72" alt=""><span>${p.short}<small>${typeName(p)} · ${p.price === null ? tr('In development','В разработке') : money(p.price)}</small></span>${arrow}</a>`).join('')}`
    : `<p class="search-empty">${tr('No results. Try “T-shirt”, “Mountain” or “hoodie”.','Ничего не найдено. Попробуйте «футболка», «Mountain» или «худи».')}</p>`;
}
document.addEventListener('click',e=>{
  if(e.target.closest('.skip-link')){e.preventDefault();$('#main').focus();$('#main').scrollIntoView();return;}
  const language=e.target.closest('[data-lang]');
  if(language){if(state.lang===language.dataset.lang)return;state.lang=language.dataset.lang;writeStore('ascent-language',state.lang);render(false);return;}
  const action=e.target.closest('[data-action]')?.dataset.action;
  if(['menu','cart','search','image'].includes(action)){openOverlay(action);return;}
  if(action==='close-overlay'){closeOverlay();return;}
  if(action==='size-info'){
    const detail=$('#fitDetails');if(!detail)return;detail.open=true;
    $('summary',detail).focus({preventScroll:true});
    detail.scrollIntoView({block:'nearest',behavior:reducedMotion.matches?'instant':'smooth'});return;
  }
  if(e.target.id==='imageOverlay'||e.target.classList.contains('image-overlay-stage')){closeOverlay();return;}
  if(action==='scroll-collection'){e.preventDefault();$('#collection')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}
  if(action==='add'){
    const item=currentItem();if(!item||item.p.concept)return;
    if(!state.size){$('#sizeError').textContent=tr('Please select a size.','Выберите размер.');$('[data-size]')?.focus();return;}
    const key=`${item.p.id}:${item.color}:${state.size}`,existing=state.cart.find(x=>x.key===key);
    if(existing)existing.qty=Math.min(existing.qty+1,99);else state.cart.push({id:item.p.id,color:item.color,size:state.size,qty:1,key});
    saveCart();renderOverlays();openOverlay('cart');return;
  }
  const size=e.target.closest('[data-size]');if(size){state.size=size.dataset.size;$$('[data-size]').forEach(b=>{b.classList.toggle('selected',b===size);b.setAttribute('aria-pressed',b===size)});$('#sizeError').textContent='';return;}
  const filter=e.target.closest('[data-filter]');if(filter){if(state.filter===filter.dataset.filter)return;state.filter=filter.dataset.filter;updateCatalog();return;}
  const thumb=e.target.closest('[data-thumb]');
  if(thumb){selectImage(thumb);return;}
  const quantity=e.target.closest('[data-qty]'),remove=e.target.closest('[data-remove]');
  if(quantity||remove){
    const key=quantity?.dataset.qty||remove.dataset.remove,item=state.cart.find(x=>x.key===key);
    if(quantity&&item)item.qty=Math.min(99,item.qty+Number(quantity.dataset.delta));
    state.cart=state.cart.filter(x=>x.qty>0&&(!remove||x.key!==key));saveCart();
    if(['/cart','/checkout'].includes(currentRoute().path))render(false);else renderOverlays();return;
  }
  const link=e.target.closest('a[href^="#/"]');
  if(link){const wasOpen=!!state.overlay;closeOverlay(false);if(wasOpen&&link.getAttribute('href')===location.hash)$('#main').focus({preventScroll:true});}
});
document.addEventListener('input',e=>{if(e.target.id==='searchInput'){state.search=e.target.value;updateSearch();}});
document.addEventListener('change',e=>{if(e.target.id==='sortSelect'){state.sort=e.target.value;updateCatalog();}});
document.addEventListener('submit',e=>{if(e.target.id==='checkoutForm'){e.preventDefault();state.order={total:total()};location.hash='/confirmation';}});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeOverlay();return;}
  if(e.key==='Tab'&&state.overlay){const root=$(state.overlay==='cart'?'#cartDrawer':state.overlay==='menu'?'#menuOverlay':state.overlay==='image'?'#imageOverlay':'#searchOverlay');const focusables=$$('a[href],button:not([disabled]),input,select',root).filter(el=>el.getClientRects().length && el.tabIndex>=0),first=focusables[0],last=focusables.at(-1);if(!root.contains(document.activeElement)){e.preventDefault();first?.focus();}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
});
window.addEventListener('hashchange',()=>{
  const path=currentRoute().path,next=currentItem();
  const colorChange=!!next&&path===window.lastRoutePath;
  if(next?.p.id!==window.lastProductId)state.size='';
  window.lastProductId=next?.p.id;window.lastRoutePath=path;
  closeOverlay(false);render(!colorChange);
  if(!colorChange)$('#main').focus({preventScroll:true});
});
reducedMotion.addEventListener('change',()=>{
  if(!reducedMotion.matches)return;
  revealObserver?.disconnect();
  $$('.reveal-pending').forEach(el=>el.classList.remove('reveal-pending'));
});
window.lastProductId=currentItem()?.p.id;
window.lastRoutePath=currentRoute().path;
render();
