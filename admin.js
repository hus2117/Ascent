(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const service = window.AscentCatalogService;
  const categories = { tees: 'Футболка', hoodies: 'Худи', longsleeves: 'Лонгслив' };
  const palette = window.ASCENT_COLORS;
  const sizes = ['XS', 'S', 'M', 'L', 'XL'];
  const currency = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 });
  const screens = ['auth', 'collection', 'editor'];
  let items = [];
  let current = null;
  let newItem = false;
  let dirty = false;
  let busy = false;
  let returnToDraft = false;
  let covers = {};
  let selectedColors = new Set();
  let gallery = [];
  const previews = new Map();
  const uploaded = new Map();

  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }

  function button(text, action, className) {
    const el = node('button', text, className);
    el.type = 'button';
    el.addEventListener('click', action);
    return el;
  }

  function showScreen(active) {
    for (const name of screens) byId(name).hidden = name !== active;
    byId('retry').hidden = true;
    byId('logout').hidden = !(service?.isOwner() && active !== 'auth');
    window.scrollTo(0, 0);
  }

  function notice(text) { byId('notice').textContent = text; }

  function report(error, field) {
    field.textContent = error.message || 'Не удалось выполнить действие. Попробуйте ещё раз.';
    field.scrollIntoView({ block: 'nearest' });
  }

  function lockEditor(locked) {
    busy = locked;
    byId('product-fields').disabled = locked;
    byId('back').disabled = locked;
    byId('logout').disabled = locked;
  }

  function source(value) {
    if (typeof value === 'string') return service.photoUrl(value);
    if (!value) return '';
    if (!previews.has(value)) previews.set(value, URL.createObjectURL(value));
    return previews.get(value);
  }

  function picture(value, alt) {
    const img = node('img');
    img.alt = alt;
    const url = source(value);
    if (url) img.src = url;
    return img;
  }

  function clearDraft() {
    previews.forEach(url => URL.revokeObjectURL(url));
    previews.clear();
    uploaded.clear();
    current = null;
    dirty = false;
    returnToDraft = false;
  }

  function drawCollection(readonly = false) {
    showScreen('collection');
    byId('new').hidden = readonly;
    byId('setup').hidden = !readonly;
    const rows = byId('products');
    rows.replaceChildren();
    if (!items.length) {
      rows.append(node('p', 'Коллекция пока пуста.'));
      return;
    }
    for (const product of items) {
      const row = node('article', undefined, 'product-row');
      const name = product.short || product.name;
      const caption = node('div');
      caption.append(node('h2', name), node('small', categories[product.category] || 'Одежда'));
      const price = product.price == null ? 'По запросу' : currency.format(product.price);
      row.append(picture(Object.values(product.variants || {})[0], ''), caption, node('p', price));
      if (!readonly) {
        const edit = button('Редактировать', () => openEditor(product), 'text-button');
        edit.setAttribute('aria-label', 'Редактировать ' + name);
        row.append(edit);
      }
      rows.append(row);
    }
  }

  async function loadCollection(message = '') {
    notice('Загружаем коллекцию…');
    showScreen(null);
    try {
      items = await service.list();
      drawCollection();
      notice(message);
      byId('collection-title').focus({ preventScroll: true });
    } catch (error) {
      notice(error.message || 'Не удалось загрузить коллекцию.');
      byId('retry').hidden = false;
    }
  }

  async function start() {
    notice('Подключаемся…');
    showScreen(null);
    try {
      const configured = await service.init();
      if (!configured) {
        items = window.ASCENT_CATALOG || [];
        drawCollection(true);
      } else if (service.isOwner()) {
        await loadCollection();
        return;
      } else {
        showScreen('auth');
      }
      notice('');
    } catch (error) {
      notice(error.message || 'Не удалось подключиться. Проверьте настройки проекта.');
      byId('retry').hidden = false;
    }
  }

  byId('retry').addEventListener('click', () => service?.isOwner() ? loadCollection() : start());
  byId('login-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (byId('login').disabled) return;
    byId('login').disabled = true;
    byId('login-error').textContent = '';
    try {
      await service.login(byId('email').value.trim(), byId('password').value);
      byId('password').value = '';
      if (returnToDraft && current) {
        returnToDraft = false;
        showScreen('editor');
        notice('Вход выполнен. Можно сохранить карточку.');
      } else {
        await loadCollection();
      }
    } catch (error) {
      report(error, byId('login-error'));
    } finally {
      byId('login').disabled = false;
    }
  });

  function canLeave() {
    return !dirty || window.confirm('Выйти без сохранения изменений?');
  }

  byId('logout').addEventListener('click', async () => {
    if (busy || !canLeave()) return;
    byId('logout').disabled = true;
    try {
      await service.logout();
      notice('');
    } catch {
      notice('Вы вышли из панели на этом устройстве. Сервер не подтвердил завершение сессии.');
    } finally {
      clearDraft();
      items = [];
      showScreen('auth');
      byId('email').focus();
      byId('logout').disabled = false;
    }
  });

  function drawSizes(selected) {
    const group = byId('sizes');
    group.replaceChildren();
    for (const size of sizes) {
      const label = node('label', undefined, 'pill');
      const check = node('input');
      check.type = 'checkbox';
      check.name = 'size';
      check.value = size;
      check.checked = selected.includes(size);
      label.append(check, document.createTextNode(size));
      group.append(label);
    }
  }

  function validFile(file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Выберите изображение в формате JPG, PNG или WebP.');
    }
    if (!file.size || file.size > 8 * 1024 * 1024) throw new Error('Файл должен быть непустым и весить не больше 8 МБ.');
  }

  function drawCovers() {
    const root = byId('covers');
    root.replaceChildren();
    const options = node('fieldset', undefined, 'color-options');
    options.append(node('legend', 'Цвета модели'));
    const chips = node('div', undefined, 'pills');
    options.append(chips);
    root.append(options);
    for (const [color, {ru: name, hex}] of Object.entries(palette)) {
      const label = node('label', undefined, 'pill');
      const check = node('input');
      check.type = 'checkbox';
      check.checked = selectedColors.has(color);
      check.addEventListener('change', () => {
        if (check.checked) selectedColors.add(color);
        else selectedColors.delete(color);
        dirty = true;
        drawCovers();
        byId('cover-toggle-' + color).focus({ preventScroll: true });
      });
      check.id = 'cover-toggle-' + color;
      label.append(check, document.createTextNode(name));
      chips.append(label);
      if (!check.checked) continue;
      const row = node('div', undefined, 'cover');
      const heading = node('p', name, 'color-name');
      const swatch = node('span', undefined, 'color-swatch');
      swatch.style.backgroundColor = hex;
      heading.prepend(swatch);
      const wrapper = node('div', undefined, 'cover-main');
      const img = picture(covers[color], 'Обложка · ' + name);
      img.hidden = !covers[color];
      const pick = node('label', undefined, 'file-button');
      const caption = node('span', covers[color] ? 'Заменить фото' : 'Выбрать фото');
      const input = node('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      input.setAttribute('aria-label', 'Обложка · ' + name);
      input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        try {
          validFile(file);
          covers[color] = file;
          img.src = source(file);
          img.hidden = false;
          caption.textContent = 'Заменить фото';
          dirty = true;
          byId('form-error').textContent = '';
        } catch (error) {
          report(error, byId('form-error'));
        }
        input.value = '';
      });
      pick.append(caption, input);
      wrapper.append(img, pick);
      row.append(heading, wrapper);
      root.append(row);
    }
  }

  function drawGallery() {
    const root = byId('gallery');
    root.replaceChildren();
    gallery.forEach((value, index) => {
      const card = node('div', undefined, 'gallery-item');
      const alt = 'Ракурс ' + (index + 1);
      const remove = button('Убрать', () => {
        gallery.splice(index, 1);
        dirty = true;
        drawGallery();
      }, 'text-button');
      remove.setAttribute('aria-label', 'Убрать фото · ' + alt);
      card.append(picture(value, alt), remove);
      root.append(card);
    });
  }

  byId('gallery-files').addEventListener('change', event => {
    const input = event.currentTarget;
    const files = Array.from(input.files);
    try {
      files.forEach(validFile);
      gallery.push(...files);
      dirty = true;
      drawGallery();
      byId('form-error').textContent = '';
    } catch (error) {
      report(error, byId('form-error'));
    }
    input.value = '';
  });

  function syncPrice() {
    const ask = byId('on-request').checked;
    byId('price').disabled = ask;
    byId('price').required = !ask;
  }
  byId('on-request').addEventListener('change', syncPrice);
  byId('product-form').addEventListener('input', () => { dirty = true; });
  byId('product-form').addEventListener('change', () => { dirty = true; });
  window.addEventListener('beforeunload', event => {
    if (dirty || busy) {
      event.preventDefault();
      event.returnValue = '';
    }
  });

  function openEditor(product) {
    clearDraft();
    byId('product-form').reset();
    newItem = !product;
    current = product || {
      id: 'piece-' + crypto.randomUUID(), short: '', category: 'tees', concept: false,
      price: null, variants: {}, photos: [], sizes: [...sizes], description: {}
    };
    byId('editor-title').textContent = newItem ? 'Новая вещь' : 'Карточка товара';
    byId('name').value = current.short || current.name || '';
    byId('category').value = current.category;
    byId('ru').value = current.description?.ru || '';
    byId('en').value = current.description?.en || '';
    byId('line').value = current.line || '';
    byId('edition').value = current.edition || '';
    byId('price').value = current.price ?? '';
    byId('on-request').checked = !newItem && current.price == null;
    byId('concept').checked = Boolean(current.concept);
    syncPrice();
    covers = { ...current.variants };
    selectedColors = new Set(newItem ? ['black'] : Object.keys(covers));
    gallery = [...(current.photos || [])];
    drawSizes(current.sizes || sizes);
    drawCovers();
    drawGallery();
    byId('delete').hidden = newItem;
    byId('form-error').textContent = '';
    notice('');
    showScreen('editor');
    byId('editor-title').focus({ preventScroll: true });
  }

  byId('new').addEventListener('click', () => openEditor(null));
  byId('back').addEventListener('click', () => {
    if (busy || !canLeave()) return;
    clearDraft();
    loadCollection();
  });

  async function resolvePhoto(value) {
    if (typeof value === 'string') return value;
    if (!uploaded.has(value)) uploaded.set(value, await service.upload(value));
    return uploaded.get(value);
  }

  function returnForLogin(error) {
    if (service.isOwner() && error.status !== 401) return false;
    returnToDraft = true;
    showScreen('auth');
    notice('Сессия завершилась. Войдите снова, чтобы продолжить редактирование.');
    return true;
  }

  byId('product-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !current) return;
    const selectedSizes = Array.from(byId('sizes').querySelectorAll('input:checked'), el => el.value);
    const title = byId('name').value.trim();
    byId('form-error').textContent = '';
    const selected = Array.from(selectedColors);
    try {
      if (!title) throw new Error('Введите название модели.');
      if (!selectedSizes.length) throw new Error('Выберите хотя бы один размер.');
      if (!selected.length) throw new Error('Выберите хотя бы один цвет.');
      for (const color of selected) {
        if (!covers[color]) throw new Error('Добавьте обложку для цвета «' + palette[color].ru + '».');
      }
      const price = byId('on-request').checked ? null : byId('price').valueAsNumber;
      const value = {
        ...current, name: current.name && title === current.short ? current.name : title, short: title,
        category: byId('category').value, price, concept: byId('concept').checked, sizes: selectedSizes,
        description: { ru: byId('ru').value.trim(), en: byId('en').value.trim() },
        line: byId('line').value.trim(), edition: byId('edition').value.trim()
      };
      lockEditor(true);
      byId('save').textContent = 'Сохраняем…';
      value.variants = {};
      for (const color of selected) value.variants[color] = await resolvePhoto(covers[color]);
      value.photos = [];
      for (const photo of gallery) value.photos.push(await resolvePhoto(photo));
      await service.save(value, { revision: current._revision ?? null });
      clearDraft();
      await loadCollection('Товар сохранён.');
    } catch (error) {
      if (!returnForLogin(error)) report(error, byId('form-error'));
    } finally {
      lockEditor(false);
      byId('save').textContent = 'Сохранить товар →';
      syncPrice();
    }
  });

  byId('delete').addEventListener('click', async () => {
    if (busy || newItem || !current) return;
    if (!window.confirm('Удалить «' + (current.short || current.name) + '» из коллекции? Покупатели перестанут видеть эту вещь.')) return;
    lockEditor(true);
    try {
      await service.remove(current.id, current._revision);
      clearDraft();
      await loadCollection('Товар удалён.');
    } catch (error) {
      if (!returnForLogin(error)) report(error, byId('form-error'));
    } finally {
      lockEditor(false);
    }
  });

  start();
})();
