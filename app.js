'use strict';

const A = 'assets/';
const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
function readStore(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function writeStore(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
let products = [];
let catalogStatus = 'loading';
let liveCatalog = false;
let pendingCatalogRead;
const catalogService = window.AscentCatalogService;
const basket = window.AscentBasket.create(products);
const state = {
  lang: readStore('ascent-catalog-language', 'ru') === 'en' ? 'en' : 'ru',
  filter: 'all', sort: 'curated', size: '', overlay: null, search: ''
};
const tr = (en, ru) => state.lang === 'ru' ? ru : en;
const money = n => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';
const sizes = ['XS', 'S', 'M', 'L', 'XL'];
const categories = ['tees', 'hoodies', 'longsleeves'];
function escapeHtml(value) {
  const entities = {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'};
  return String(value ?? '').replace(/[&<>"']/g, character => entities[character]);
}
function normalizeProduct(product) {
  if (!product || typeof product.id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,99}$/i.test(product.id) || !categories.includes(product.category)) return null;
  const variants = {};
  for (const color of Object.keys(window.ASCENT_COLORS)) {
    const raw = product.variants?.[color];
    const src = typeof raw === 'string' ? catalogService.photoUrl(raw) : '';
    if (src) variants[color] = src;
  }
  if (!Object.keys(variants).length || typeof product.short !== 'string' || !product.short.trim()) return null;
  const availableSizes = Array.isArray(product.sizes) ? sizes.filter(size => product.sizes.includes(size)) : sizes.slice();
  const photos = Array.isArray(product.photos) ? product.photos.map(src => catalogService.photoUrl(src)).filter(Boolean) : [];
  return {
    id:product.id, short:product.short, name:String(product.name || product.short), category:product.category,
    edition:String(product.edition || ''), line:String(product.line || ''), concept:product.concept === true,
    description:{ru:String(product.description?.ru || ''), en:String(product.description?.en || '')},
    price:Number.isFinite(product.price) && product.price >= 0 ? product.price : null,
    variants, sizes:availableSizes, photos
  };
}
function refreshCatalog() {
  if (pendingCatalogRead) return pendingCatalogRead;
  pendingCatalogRead = (async () => {
    try {
      liveCatalog = await catalogService.init();
      const rows = liveCatalog ? await catalogService.list() : window.ASCENT_CATALOG;
      const next = rows.map(normalizeProduct).filter(Boolean);
      if (catalogStatus === 'ready' && JSON.stringify(next) === JSON.stringify(products)) return true;
      catalogStatus = 'ready';
      products = next;
    } catch {
      catalogStatus = 'error';
      products = [];
    }
    basket.setProducts(products);
    const item = currentItem();
    if (!item?.p.sizes.includes(state.size)) state.size = '';
    window.lastProductId = item?.p.id;
    closeOverlay(false);
    render(false);
    return catalogStatus === 'ready';
  })().finally(() => { pendingCatalogRead = null; });
  return pendingCatalogRead;
}
function catalogNotice() {
  if (catalogStatus === 'loading') return `<div class="wrap confirmation"><p role="status">${tr('Loading the collection…','Загружаем коллекцию…')}</p></div>`;
  return `<div class="wrap confirmation"><p role="alert">${tr('Couldn’t load the collection. Please try again.','Не удалось загрузить коллекцию. Попробуйте ещё раз.')}</p><button class="button" data-action="retry-catalog">${tr('Try again','Повторить')}</button></div>`;
}
const colorName = color => window.ASCENT_COLORS[color][state.lang];
const icon = {
  bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>',
  menu: '<span class="menu-lines"><i></i><i></i></span>'
};
const arrow = '<span class="arrow" aria-hidden="true">↗</span>';
const getProduct = id => products.find(p => p.id === id);
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
  const count = basket.total().count;
  return `<div class="announcement">${tr('ASCENT · FIRST COLLECTION', 'ASCENT · ПЕРВАЯ КОЛЛЕКЦИЯ')}</div>
    <div class="header-inner"><nav class="main-nav" aria-label="${tr('Main navigation','Главная навигация')}">
      <a class="nav-link" href="#/catalog" ${path === '/catalog' ? 'aria-current="page"' : ''}>${tr('Collection','Коллекция')}</a>
      <a class="nav-link" href="#/about" ${path === '/about' ? 'aria-current="page"' : ''}>${tr('About','О бренде')}</a>
    </nav>${brand()}<div class="header-actions">${langSwitch()}
      <button class="icon-button header-search" data-action="search" aria-haspopup="dialog" aria-label="${tr('Search','Поиск')}">${icon.search}</button>
      <a class="icon-button basket-link" href="#/cart" aria-label="${basketLabel(count)}" ${path === '/cart' ? 'aria-current="page"' : ''}>${icon.bag}<span class="basket-count" aria-hidden="true">${count || ''}</span></a>
      <button class="icon-button menu-toggle" data-action="menu" aria-haspopup="dialog" aria-label="${tr('Open menu','Открыть меню')}">${icon.menu}</button>
    </div></div>`;
}
function footer() {
  return `<div class="footer-inner"><div class="footer-brand">${brand()}
    <p class="footer-copy">${tr('Contemporary clothing. Caucasian roots.', 'Современная одежда. Кавказские корни.')}</p></div>
    <div><p class="footer-title">${tr('Explore','Навигация')}</p><div class="footer-links">
      <a href="#/catalog">${tr('Collection','Коллекция')}</a><a href="#/about">${tr('About ASCENT','О бренде ASCENT')}</a>
    </div></div>${products.length ? `<div><p class="footer-title">${tr('Pieces','Модели')}</p><div class="footer-links">
      ${products.slice(0, 3).map(p => `<a href="${productLink(p,Object.keys(p.variants)[0])}">${escapeHtml(p.short)}</a>`).join('')}
    </div></div>` : ''}</div><div class="footer-bottom"><span>© ASCENT 2026</span><span>ORIGIN &amp; IDENTITY</span>${langSwitch()}</div>`;
}
function typeName(p) {
  return {tees:tr('T-shirt','Футболка'),hoodies:tr('Hoodie','Худи'),longsleeves:tr('Long sleeve','Лонгслив')}[p.category];
}
function card(p, color, index = 0) {
  const title = escapeHtml(p.short);
  return `<article class="product-card reveal" style="--delay:${index % 4 * 40}ms">
    <div class="product-card-image"><a href="${productLink(p, color)}" aria-label="${title} — ${typeName(p)}, ${colorName(color)}">
      <img loading="lazy" decoding="async" width="1100" height="1100" src="${escapeHtml(p.variants[color])}" alt="${title}, ${colorName(color)}">
    </a>${p.concept ? `<span class="card-index">${tr('In development', 'В разработке')}</span>` : ''}
    <a class="card-view" tabindex="-1" aria-hidden="true" href="${productLink(p, color)}">${tr('View piece', 'Подробнее')} ${arrow}</a></div>
    <div class="card-info"><div><h3 class="card-title"><a href="${productLink(p, color)}">${title}</a></h3>
      <div class="card-meta">${typeName(p)} · ${colorName(color)}</div></div>
      <span class="card-price">${p.price === null ? tr('On request', 'По запросу') : money(p.price)}</span>
    </div></article>`;
}

function catalogEntries() {
  const entries = products.filter(p => state.filter === 'all' || p.category === state.filter)
    .flatMap(p => Object.keys(p.variants).map(color => ({p, color})));
  if (state.sort === 'az') entries.sort((a, b) => a.p.name.localeCompare(b.p.name));
  if (state.sort === 'price') entries.sort((a, b) => (a.p.price ?? Infinity) - (b.p.price ?? Infinity));
  return entries;
}
function home() {
  return `<div class="page">
    <section class="mountain-hero" aria-labelledby="heroTitle">
      <img class="mountain-image" src="${A}highland-hero.webp" width="1891" height="831" alt="" fetchpriority="high">
      <div class="hero-shade"></div>
      <div class="mountain-copy"><h1 class="mountain-title" id="heroTitle" lang="en">Origin &amp; Identity</h1>
        <p>Drop 001 — Highland Origins</p>
        <a class="button hero-button" href="#/catalog" data-action="scroll-collection">${tr('Explore collection','Смотреть коллекцию')}</a>
      </div>
    </section>
    ${collectionGrid()}
  </div>`;
}
function catalog() {
  return `<div class="page">${collectionGrid()}</div>`;
}
function countLabel(count) {
  const labels = { one:'позиция', few:'позиции', many:'позиций', other:'позиции' };
  const plural = new Intl.PluralRules('ru').select(count);
  return `${count} ${tr(count === 1 ? 'item' : 'items', labels[plural])}`;
}
function collectionGrid() {
  if (catalogStatus !== 'ready') return `<div id="collection" tabindex="-1">${catalogNotice()}</div>`;
  const entries = catalogEntries();
  const filters = [['all',tr('All items','Все вещи')],['tees',tr('T-shirts','Футболки')],['hoodies',tr('Hoodies','Худи')],['longsleeves',tr('Long sleeves','Лонгсливы')]];
  return `<div class="wrap" id="collection" tabindex="-1" role="region" aria-label="${tr('Collection','Коллекция')}">
    <div class="catalog-toolbar"><div class="filters" role="group" aria-label="${tr('Product categories','Категории товаров')}">
      ${filters.map(([id,label]) => `<button class="filter-button ${state.filter === id ? 'active' : ''}" data-filter="${id}" aria-pressed="${state.filter === id}">${label}</button>`).join('')}
    </div><label class="sort-label"><span class="eyebrow" id="catalogCount" aria-live="polite">${countLabel(entries.length)}</span>
      <select class="sort-select" id="sortSelect" aria-label="${tr('Sort collection','Сортировка')}">
        <option value="curated" ${state.sort === 'curated' ? 'selected' : ''}>${tr('Featured','По умолчанию')}</option>
        <option value="az" ${state.sort === 'az' ? 'selected' : ''}>${tr('Name A–Z','По названию')}</option>
        <option value="price" ${state.sort === 'price' ? 'selected' : ''}>${tr('Price: low to high','По цене')}</option>
      </select></label></div>
    <section class="product-grid catalog-grid" id="catalogGrid" aria-label="${tr('Clothing','Одежда')}">${gridContents(entries)}</section>
  </div>`;
}
function gridContents(entries) {
  if (entries.length) return entries.map(({p,color},i) => card(p,color,i)).join('');
  return `<p class="catalog-disclaimer">${products.length ? tr('No pieces in this category yet.','В этой категории пока нет вещей.') : tr('The collection will be available soon.','Коллекция скоро появится.')}</p>`;
}
function detail(title, content, open=false) { return `<details class="product-detail" ${open?'open':''}><summary>${title}<span>+</span></summary><p>${content}</p></details>`; }
function productPage() {
  const item = currentItem();
  if (!item) return notFound();
  const {p, color} = item, image = p.variants[color];
  const gallery = [...new Set([image, ...p.photos])];
  const title = escapeHtml(p.short);
  const classicTee = p.category === 'tees' && ['mountain-dept','highland-origins'].includes(p.id) && !p.concept;
  const description = p.description[state.lang] || p.description.ru || p.description.en;
  const related = products.filter(x => x.id !== p.id)
    .flatMap(x => Object.keys(x.variants).map(c => ({p:x, color:c}))).slice(0, 4);
  return `<div class="page"><div class="wrap product-layout">
    <section class="gallery" aria-label="${tr('Product photographs','Фотографии товара')}" data-product-gallery>
      <div class="thumbs">${gallery.map((src,i) => {
        const caption = i === 0 ? `${title}, ${colorName(color)}` : `${title} · ${tr('Photo','Фото')} ${i + 1}`;
        return `<button class="thumb ${i === 0 ? 'active' : ''}" data-thumb="${escapeHtml(src)}" data-caption="${caption}" aria-label="${caption}" aria-pressed="${i === 0}"><img src="${escapeHtml(src)}" width="80" height="80" alt=""></button>`;
      }).join('')}</div>
      <div class="gallery-main" id="galleryMain"><img id="galleryImage" src="${escapeHtml(image)}" width="1100" height="1100" fetchpriority="high" alt="${title}, ${colorName(color)}">
        ${p.concept ? `<span class="gallery-label">${tr('Design concept','Дизайн-концепт')}</span>` : ''}
        <button class="icon-button zoom-button" data-action="image" aria-haspopup="dialog" aria-label="${tr('Enlarge photograph','Увеличить фотографию')}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg></button>
      </div>
    </section>
    <section class="product-info"><div class="breadcrumb"><a href="#/catalog">${tr('Collection','Коллекция')}</a> / ${typeName(p)}</div>
      <p class="eyebrow">${p.concept ? 'ASCENT STUDIO' : escapeHtml(p.edition)}</p><h1 class="product-name">${title}</h1>
      <p class="product-slogan">${typeName(p)}${p.concept ? ` · ${tr('Design concept','Дизайн-концепт')}` : classicTee ? ` · ${tr('Oversized fit','Оверсайз')}` : ''}</p>
      <div class="product-price">${p.price === null ? tr('Ask about availability','Наличие уточняйте') : money(p.price)}</div>
      <div class="option-label">${tr('Colour','Цвет')} — ${colorName(color)}</div>
      <div class="color-line">${Object.keys(p.variants).map(c => `<a href="${productLink(p,c)}" class="swatch ${color === c ? 'selected' : ''}" style="--swatch-color:${window.ASCENT_COLORS[c].hex}" title="${colorName(c)}" aria-label="${colorName(c)}" ${color === c ? 'aria-current="true"' : ''}></a>`).join('')}</div>
      ${classicTee ? `<ul class="product-facts"><li>${tr('100% cotton','100% хлопок')}</li><li>260 ${tr('g/m²','г/м²')}</li></ul>` : ''}
      <div class="size-label-row"><div class="option-label">${tr('Size','Размер')}</div>${classicTee ? `<button class="text-link" data-action="size-info">${tr('Fit details','О посадке')}</button>` : ''}</div>
      <div class="size-row" role="group" aria-label="${tr('Select size','Выберите размер')}">${p.sizes.map(s => `<button class="size-button ${state.size === s ? 'selected' : ''}" data-size="${s}" aria-pressed="${state.size === s}">${s}</button>`).join('')}</div>
      <div class="size-error" id="sizeError" role="status"></div>
      <button class="button add-button" data-action="add-to-basket" ${p.sizes.length ? '' : 'disabled'}><span class="add-label">${p.sizes.length ? tr('Add to bag','Добавить в корзину') : tr('No sizes available','Нет доступных размеров')}</span><span class="add-mark" aria-hidden="true">+</span></button>
      <a class="basket-after-add text-link" href="#/cart" ${basket.total().count ? '' : 'hidden'}>${tr('View bag','Перейти в корзину')} ${arrow}</a>
      <div class="product-details">
        ${description ? detail(tr('Details','О вещи'), escapeHtml(description).replace(/\r?\n/g, '<br>'), true) : ''}
        ${classicTee ? detail(tr('Fabric & care','Материал и уход'), tr('100% cotton, 260 g/m². Wash inside out at a maximum of 40°C. Do not iron directly on the print.', '100% хлопок, 260 г/м². Стирать наизнанку при температуре до 40°C. Не гладить по принту.')) + detail(tr('Size & fit','Размер и посадка'), tr('Oversized fit with dropped shoulders. Ask us in Telegram about available sizes and exact measurements.', 'Свободный крой со спущенной линией плеча. Доступные размеры и точные замеры уточняйте в Telegram.')).replace('class="product-detail"', 'class="product-detail" id="fitDetails"') : ''}
      </div>
    </section>
  </div>${related.length ? `<section class="wrap related-section"><div class="section-head"><h2 class="section-title">${tr('Also in the collection','Также в коллекции')}</h2><a class="text-link" href="#/catalog">${tr('View all','Все вещи')} ${arrow}</a></div>
    <div class="product-grid related-grid">${related.map(({p,color},i) => card(p,color,i)).join('')}</div>
  </section>` : ''}</div>`;
}
function basketLabel(count) {
  return tr(`Shopping bag, ${count} selected`, `Корзина. Количество вещей: ${count}`);
}
function basketRow(row) {
  const { id, color, size, qty } = row;
  const product = getProduct(id);
  const link = productLink(product, color);
  const title = escapeHtml(product.short);
  const description = `${title}, ${colorName(color)}, ${size}`;
  const linePrice = product.price === null ? tr('On request','По запросу') : money(product.price * qty);
  return `<article class="basket-row" data-id="${id}" data-color="${color}" data-size-value="${size}">
    <a href="${link}" class="basket-photo" tabindex="-1" aria-hidden="true"><img src="${escapeHtml(product.variants[color])}" alt="" width="130" height="130"></a>
    <div class="basket-item">
      <h2 class="basket-name"><a href="${link}">${title}</a></h2>
      <p class="basket-meta">${typeName(product)} · ${colorName(color)} · ${tr('Size','Размер')} ${size}</p>
      <button class="basket-remove" data-basket-edit="remove" aria-label="${tr('Remove','Удалить')} · ${description}">${tr('Remove','Удалить')}</button>
    </div>
    <div class="basket-quantity" role="group" aria-label="${tr('Quantity','Количество')} · ${description}">
      <button data-basket-edit="minus" aria-label="${tr('Decrease quantity','Уменьшить количество')}" ${qty <= 1 ? 'disabled' : ''}>−</button>
      <span>${qty}</span>
      <button data-basket-edit="plus" aria-label="${tr('Increase quantity','Увеличить количество')}" ${qty >= basket.maxQuantity ? 'disabled' : ''}>+</button>
    </div>
    <span class="basket-line-price">${linePrice}</span>
  </article>`;
}
function basketPage() {
  const rows = basket.read();
  const heading = `<div class="basket-heading"><h1>${tr('Shopping bag','Корзина')}</h1></div>`;
  const back = `<a class="text-link" href="#/catalog">${tr('Continue shopping','Продолжить выбор')} ${arrow}</a>`;
  if (!rows.length) {
    return `<div class="page wrap basket-page">${heading}<div class="basket-empty"><p>${tr('Your bag is empty.','Корзина пока пуста.')}</p>${back}</div></div>`;
  }
  const { amount, hasUnpriced } = basket.total();
  const hasPriced = rows.some(row => getProduct(row.id).price !== null);
  const summaryLabel = hasUnpriced && hasPriced ? tr('Subtotal for priced items','За вещи с указанной ценой') : tr('Total','Итого');
  return `<div class="page wrap basket-page">${heading}<div class="basket-layout">
    <div class="basket-lines">${rows.map(basketRow).join('')}${back}</div>
    <aside class="basket-summary" aria-label="${tr('Order summary','Сумма заказа')}">
      <p class="basket-total"><span>${summaryLabel}</span><strong>${hasPriced ? money(amount) : tr('On request','По запросу')}</strong></p>
      ${hasUnpriced ? `<p>${tr('We’ll confirm the price of items marked “On request” in chat.', 'Цену вещей с пометкой «По запросу» уточним в чате.')}</p>` : ''}
      <a class="button basket-submit" data-action="send-order" href="${escapeHtml(basket.url(state.lang))}" target="_blank" rel="noopener noreferrer">${tr('Message on Telegram','Написать в Telegram')} ${arrow}</a>
      <p class="purchase-note">${tr('Review the list in the chat and tap Send.','Проверьте список в чате и нажмите «Отправить».')}</p>
    </aside></div></div>`;
}
function updateBasketControls() {
  const count = basket.total().count;
  const link = $('.basket-link');
  link.setAttribute('aria-label', basketLabel(count));
  $('.basket-count', link).textContent = count || '';
  const viewLink = $('.basket-after-add');
  if (viewLink) viewLink.hidden = !count;
}
function editBasket(button) {
  const row = button.closest('.basket-row');
  const { id, color, sizeValue: size } = row.dataset;
  const action = button.dataset.basketEdit;
  const position = $$('.basket-row').indexOf(row);
  if (action === 'remove') basket.remove(id, color, size);
  else basket.changeQuantity(id, color, size, action === 'plus' ? 1 : -1);
  $('#main').innerHTML = basketPage();
  updateBasketControls();
  const rows = $$('.basket-row');
  const next = rows[Math.min(position, rows.length - 1)];
  const target = next?.querySelector(`[data-basket-edit="${action}"]:not(:disabled)`)
    || next?.querySelector('[data-basket-edit="remove"]') || $('.basket-empty a');
  target?.focus({preventScroll:true});
}
function addSelectedItem(button) {
  const item = currentItem();
  if (!item) return;
  if (!state.size) {
    $('#sizeError').textContent = tr('Please select a size first.', 'Сначала выберите размер.');
    $('[data-size]')?.focus({preventScroll:true});
    return;
  }
  if (!basket.add(item.p.id, item.color, state.size)) {
    toast(tr('The maximum quantity for this option is already in your bag.', 'В корзине уже максимальное количество этого варианта.'));
    return;
  }
  updateBasketControls();
  toast(tr(`Added to bag: ${item.p.short}, ${state.size}`, `В корзине: ${item.p.short}, ${state.size}`));
  button.classList.add('is-added');
  $('.add-label', button).textContent = tr('Added to bag', 'Добавлено');
  $('.add-mark', button).textContent = '✓';
  clearTimeout(addSelectedItem.timer);
  addSelectedItem.timer = setTimeout(() => {
    if (!button.isConnected) return;
    button.classList.remove('is-added');
    $('.add-label', button).textContent = tr('Add to bag','Добавить в корзину');
    $('.add-mark', button).textContent = '+';
  }, 1100);
}
function about() {
  return `<div class="page"><div class="wrap"><section class="story-hero"><div>
    <p class="eyebrow">${tr('ABOUT ASCENT','О БРЕНДЕ ASCENT')}</p><h1 class="story-title">Origin &amp;<br><em>Identity.</em></h1>
    <p class="story-copy">${tr('ASCENT is about origin, character and identity. We bring heritage and contemporary aesthetics together in simple things.', 'ASCENT про происхождение, характер и идентичность. Мы соединяем наследие и современную эстетику в простых вещах.')}</p>
    <p class="story-copy">${tr('Our first collection starts with two prints, black and off-white cotton, and an oversized fit. Mountain Department and Highland Origins share the same point of departure: the Caucasus.', 'В первой коллекции два принта, чёрный и молочный хлопок, свободный крой. Mountain Department и Highland Origins объединяет одна точка отсчёта Кавказ.')}</p>
    <a class="text-link" href="#/catalog">${tr('Explore the collection','Смотреть коллекцию')} ${arrow}</a>
    </div><div class="story-image"><img src="${A}garment-label.webp" width="960" height="1280" alt="${tr('ASCENT label printed on cotton','Маркировка ASCENT на хлопке')}"></div></section>
    <section class="story-details" aria-label="${tr('Collection details','Детали коллекции')}">
      <article class="story-detail"><p class="eyebrow">${tr('Fabric','Материал')}</p><h3>${tr('100% cotton','100% хлопок')}</h3><p>${tr('260 g/m² cotton jersey. A substantial texture that holds the oversized silhouette.', 'Хлопковый трикотаж плотностью 260 г/м². Плотная фактура, которая держит свободный силуэт.')}</p></article>
      <article class="story-detail"><p class="eyebrow">${tr('Fit','Посадка')}</p><h3>${tr('Oversized','Оверсайз')}</h3><p>${tr('A wide body and dropped shoulders. The same relaxed proportions across both T-shirt designs.', 'Широкий корпус и спущенная линия плеча. Одинаковые свободные пропорции у обеих моделей футболок.')}</p></article>
      <article class="story-detail"><p class="eyebrow">${tr('Signature','Наш знак')}</p><h3>ASCENT</h3><p>${tr('The letter A and a mountain silhouette. A reference to the place that shaped the brand.', 'Буква A и силуэт гор. Отсылка к месту, с которого началась история бренда.')}</p></article>
    </section></div><div class="signature-section">${mark()}<p>Origin &amp; Identity</p><span class="eyebrow">EST. 2026</span></div></div>`;
}

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
  const focusedHref = focused?.getAttribute('href');
  const focusedInFooter = !!focused?.closest('.site-footer');
  galleryVersion++;
  revealObserver?.disconnect();
  document.documentElement.lang = state.lang;
  $('.skip-link').textContent = tr('Skip to content', 'К содержимому');
  $('#siteHeader').innerHTML = header();
  $('#siteFooter').innerHTML = footer();
  const {path} = currentRoute();
  const views = {'/':home, '/catalog':catalog, '/about':about, '/cart':basketPage};
  const needsCatalog = path.startsWith('/product/') || path === '/cart';
  if (needsCatalog && catalogStatus !== 'ready') $('#main').innerHTML = catalogNotice();
  else $('#main').innerHTML = path.startsWith('/product/') ? productPage() : (views[path] || notFound)();
  const titles = {'/':'Origin & Identity', '/catalog':tr('Collection','Коллекция'), '/about':tr('About','О бренде'), '/cart':tr('Shopping bag','Корзина')};
  document.title = `${currentItem()?.p.short || titles[path] || '404'} — ASCENT`;
  if (resetScroll && !reducedMotion.matches) $('.page')?.classList.add('page-enter');
  renderOverlays();
  window.scrollTo({top:resetScroll ? 0 : oldScroll, behavior:'instant'});
  initReveals();
  if (!resetScroll && !state.overlay) {
    const root = focusedInFooter ? $('#siteFooter') : document;
    const target = focusedId ? $('#' + CSS.escape(focusedId))
      : focusedLang ? root.querySelector(`[data-lang="${focusedLang}"]`)
      : focusedHref ? $$('a[href]').find(el => el.getAttribute('href') === focusedHref) : null;
    target?.focus({preventScroll:true});
  }
}
function updateCatalog() {
  const entries = catalogEntries();
  $('#catalogGrid').innerHTML = gridContents(entries);
  $('#catalogCount').textContent = countLabel(entries.length);
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
  const source = thumb.dataset.thumb;
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
  const restoreFocus=!!state.overlay && ['menuOverlay','searchOverlay','imageOverlay'].some(id=>$('#'+id).contains(focusBefore));
  const focusLang=focusBefore?.dataset.lang;
  const menuLinks=[['/',tr('Home','Главная')],['/catalog',tr('Collection','Коллекция')],['/about',tr('Our story','О бренде')]];
  $('#menuOverlay').innerHTML=`<div class="menu-top">${brand()}<div class="menu-top-actions">${langSwitch()}<button class="overlay-close" data-action="close-overlay" aria-label="${tr('Close menu','Закрыть меню')}">×</button></div></div><div class="menu-content"><nav aria-label="${tr('All pages','Все страницы')}">${menuLinks.map(([href,label],i)=>`<a class="menu-link" style="--i:${i}" href="#${href}"><span class="menu-word">${label}</span><span class="menu-arrow">↗</span></a>`).join('')}</nav><div class="menu-art" aria-hidden="true">${mark()}<span>ORIGIN &amp; IDENTITY</span></div></div><div class="menu-bottom"><span>ASCENT / EST. 2026</span><span>${tr('The first collection','Первая коллекция')}</span></div>`;
  $('#searchOverlay').innerHTML=`<button class="search-close" data-action="close-overlay" aria-label="${tr('Close search','Закрыть поиск')}">×</button><div class="search-box"><label class="eyebrow" for="searchInput">${tr('Search ASCENT','Поиск ASCENT')}</label><input id="searchInput" class="search-input" type="search" autocomplete="off" placeholder="${tr('Search the collection…','Поиск по коллекции…')}"><div id="searchResults" aria-live="polite"></div></div>`;
  $('#searchInput').value=state.search; updateSearch();
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
  if(restoreFocus){const root=$(state.overlay==='menu'?'#menuOverlay':state.overlay==='image'?'#imageOverlay':'#searchOverlay');const target=focusLang?root.querySelector(`[data-lang="${focusLang}"]`):null;(target||root.querySelector('button,input,a[href]'))?.focus();}
}
function syncOverlay() {
  [['menu','#menuOverlay'],['search','#searchOverlay'],['image','#imageOverlay']].forEach(([name,selector])=>{const el=$(selector),open=state.overlay===name;el.classList.toggle('open',open);el.inert=!open;el.setAttribute('aria-hidden',String(!open));});
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
    const target = name === 'search' ? '#searchInput' : name === 'image' ? '#imageOverlay .overlay-close' : '#menuOverlay .overlay-close';
    $(target)?.focus({preventScroll:true});
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
function toast(message) { $('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),2600); }
function updateSearch() {
  const query = state.search.trim().toLocaleLowerCase();
  const list = products.filter(p => [p.name, p.short, p.line, p.description[state.lang], {tees:'футболка футболки t-shirt tee',hoodies:'худи hoodie',longsleeves:'лонгслив лонгсливы long sleeve'}[p.category]].join(' ').toLocaleLowerCase().includes(query));
  $('#searchResults').innerHTML = list.length
    ? `${!query ? `<p class="search-empty">${tr('Explore the collection','В коллекции')}</p>` : ''}${list.map(p => `<a class="search-result" href="${productLink(p,Object.keys(p.variants)[0])}"><img src="${escapeHtml(Object.values(p.variants)[0])}" width="64" height="72" alt=""><span>${escapeHtml(p.short)}<small>${typeName(p)} · ${p.price === null ? tr('On request','По запросу') : money(p.price)}</small></span>${arrow}</a>`).join('')}`
    : `<p class="search-empty">${tr('No results. Try “T-shirt”, “Mountain” or “hoodie”.','Ничего не найдено. Попробуйте «футболка», «Mountain» или «худи».')}</p>`;
}
document.addEventListener('click',e=>{
  if(e.target.closest('.skip-link')){e.preventDefault();$('#main').focus();$('#main').scrollIntoView();return;}
  const language=e.target.closest('[data-lang]');
  if(language){if(state.lang===language.dataset.lang)return;state.lang=language.dataset.lang;writeStore('ascent-catalog-language',state.lang);render(false);return;}
  const action=e.target.closest('[data-action]')?.dataset.action;
  if (action === 'retry-catalog') { refreshCatalog(); return; }
  if (action === 'send-order' && liveCatalog) {
    e.preventDefault();
    confirmCurrentOrder(e.target.closest('[data-action]'));
    return;
  }
  if(['menu','search','image'].includes(action)){openOverlay(action);return;}
  if(action==='close-overlay'){closeOverlay();return;}
  if(action==='size-info'){
    const detail=$('#fitDetails');if(!detail)return;detail.open=true;
    $('summary',detail).focus({preventScroll:true});
    detail.scrollIntoView({block:'nearest',behavior:reducedMotion.matches?'instant':'smooth'});return;
  }
  if(e.target.id==='imageOverlay'||e.target.classList.contains('image-overlay-stage')){closeOverlay();return;}
  if (action === 'scroll-collection') {
    e.preventDefault();
    const collection = $('#collection');
    collection.focus({preventScroll:true});
    collection.scrollIntoView({behavior:reducedMotion.matches ? 'instant' : 'smooth'});
    return;
  }
  if (action === 'add-to-basket') {
    addSelectedItem(e.target.closest('[data-action]'));
    return;
  }
  const edit = e.target.closest('[data-basket-edit]');
  if (edit) {
    editBasket(edit);
    return;
  }
  const size=e.target.closest('[data-size]');if(size){state.size=size.dataset.size;$$('[data-size]').forEach(b=>{b.classList.toggle('selected',b===size);b.setAttribute('aria-pressed',b===size)});$('#sizeError').textContent='';return;}
  const filter=e.target.closest('[data-filter]');if(filter){if(state.filter===filter.dataset.filter)return;state.filter=filter.dataset.filter;updateCatalog();return;}
  const thumb=e.target.closest('[data-thumb]');
  if(thumb){selectImage(thumb);return;}
  const link=e.target.closest('a[href^="#/"]');
  if(link){const wasOpen=!!state.overlay;closeOverlay(false);if(wasOpen&&link.getAttribute('href')===location.hash)$('#main').focus({preventScroll:true});}
});
document.addEventListener('input',e=>{if(e.target.id==='searchInput'){state.search=e.target.value;updateSearch();}});
document.addEventListener('change',e=>{if(e.target.id==='sortSelect'){state.sort=e.target.value;updateCatalog();}});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closeOverlay();return;}
  if(e.key==='Tab'&&state.overlay){const root=$(state.overlay==='menu'?'#menuOverlay':state.overlay==='image'?'#imageOverlay':'#searchOverlay');const focusables=$$('a[href],button:not([disabled]),input,select',root).filter(el=>el.getClientRects().length && el.tabIndex>=0),first=focusables[0],last=focusables.at(-1);if(!root.contains(document.activeElement)){e.preventDefault();first?.focus();}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
});
let confirmingOrder = false;
async function confirmCurrentOrder(button) {
  if (confirmingOrder) return;
  confirmingOrder = true;
  const previous = button.href;
  button.setAttribute('aria-busy','true');
  try {
    if (!await refreshCatalog() || currentRoute().path !== '/cart') return;
    const url = basket.url(state.lang);
    if (!url || url !== previous) {
      render(false);
      toast(tr('The order has changed. Please review the updated bag.', 'Заказ изменился. Проверьте обновлённую корзину.'));
      return;
    }
    location.assign(url);
  } finally {
    confirmingOrder = false;
    button.removeAttribute('aria-busy');
  }
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && liveCatalog) refreshCatalog();
});
window.addEventListener('pageshow', event => {
  if (event.persisted && liveCatalog) refreshCatalog();
});
window.addEventListener('storage', event => {
  if (event.key !== basket.storageKey && event.key !== null) return;
  if (currentRoute().path === '/cart' && catalogStatus === 'ready') $('#main').innerHTML = basketPage();
  updateBasketControls();
});
window.addEventListener('hashchange',()=>{
  const path=currentRoute().path,next=currentItem();
  const colorChange=!!next&&path===window.lastRoutePath;
  if(next?.p.id!==window.lastProductId)state.size='';
  window.lastProductId=next?.p.id;window.lastRoutePath=path;
  closeOverlay(false);render(!colorChange);
  if(!colorChange)$('#main').focus({preventScroll:true});
  if (liveCatalog && (path === '/cart' || path === '/catalog' || path.startsWith('/product/'))) refreshCatalog();
});
reducedMotion.addEventListener('change',()=>{
  if(!reducedMotion.matches)return;
  revealObserver?.disconnect();
  $$('.reveal-pending').forEach(el=>el.classList.remove('reveal-pending'));
});
window.lastProductId=currentItem()?.p.id;
window.lastRoutePath=currentRoute().path;
render();
refreshCatalog();
