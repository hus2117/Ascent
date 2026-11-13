(() => {
  'use strict';

  const storageKey = 'ascent-cart';
  const maxQuantity = 99;
  const copy = {
    ru: {
      greeting: 'Здравствуйте! Меня интересуют эти вещи ASCENT:',
      types: { tees: 'Футболка', hoodies: 'Худи', longsleeves: 'Лонгслив' },
      quantity: qty => `${qty} шт.`, size: 'размер', request: 'подскажите цену и наличие',
      total: 'Итого', subtotal: 'Сумма позиций с указанной ценой'
    },
    en: {
      greeting: 'Hello! I’m interested in these ASCENT pieces:',
      types: { tees: 'T-shirt', hoodies: 'Hoodie', longsleeves: 'Long sleeve' },
      quantity: qty => `qty ${qty}`, size: 'size', request: 'please confirm price and availability',
      total: 'Total', subtotal: 'Subtotal for priced items'
    }
  };

  function create(products) {
    let byId = new Map(products.map(product => [product.id, product]));
    let memory = [];
    let storageAvailable = true;

    function valid(id, color, size) {
      const product = byId.get(id);
      return product && typeof color === 'string' && Object.hasOwn(product.variants, color) && product.sizes.includes(size);
    }

    function match(rows, id, color, size) {
      return rows.find(row => row.id === id && row.color === color && row.size === size);
    }

    function normalize(saved) {
      const rows = [];
      if (!Array.isArray(saved)) return rows;
      for (const entry of saved) {
        if (!entry) continue;
        const { id, size } = entry;
        // In the original bag each of these shirts had one fixed colour.
        const legacyColor = id === 'mountain-dept' ? 'black' : id === 'highland-origins' ? 'cream' : undefined;
        const color = entry.color ?? (entry.key === id + '-' + size ? legacyColor : undefined);
        if (!valid(id, color, size)) continue;
        const qty = Number(entry.qty ?? entry.quantity ?? 1);
        if (!Number.isSafeInteger(qty) || qty < 1) continue;
        const existing = match(rows, id, color, size);
        if (existing) existing.qty = Math.min(maxQuantity, existing.qty + qty);
        else rows.push({ id, color, size, qty: Math.min(maxQuantity, qty) });
      }
      return rows;
    }

    function read() {
      let raw;
      if (storageAvailable) {
        try { raw = window.localStorage.getItem(storageKey); }
        catch { storageAvailable = false; }
      }
      if (storageAvailable) {
        try { memory = normalize(JSON.parse(raw)); }
        catch { memory = []; }
      }
      if (!storageAvailable) memory = normalize(memory);
      return memory.map(row => ({ ...row }));
    }

    function save(rows) {
      memory = rows;
      if (storageAvailable) {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(rows));
        } catch {
          storageAvailable = false;
        }
      }
    }

    function add(id, color, size) {
      if (!valid(id, color, size)) return false;
      const rows = read();
      const row = match(rows, id, color, size);
      if (row?.qty === maxQuantity) return false;
      if (row) row.qty += 1;
      else rows.push({ id, color, size, qty: 1 });
      save(rows);
      return true;
    }

    function changeQuantity(id, color, size, delta) {
      if (!Number.isSafeInteger(delta) || delta === 0) return false;
      const rows = read();
      const row = match(rows, id, color, size);
      if (!row) return false;
      const qty = Math.min(maxQuantity, row.qty + delta);
      if (qty === row.qty) return false;
      row.qty = qty;
      save(rows.filter(row => row.qty > 0));
      return true;
    }

    function remove(id, color, size) {
      const rows = read();
      const row = match(rows, id, color, size);
      if (!row) return false;
      save(rows.filter(entry => entry !== row));
      return true;
    }

    function summarize(rows) {
      const result = { count: 0, amount: 0, hasUnpriced: false };
      for (const row of rows) {
        const price = byId.get(row.id).price;
        result.count += row.qty;
        if (Number.isFinite(price)) result.amount += row.qty * price;
        else result.hasUnpriced = true;
      }
      return result;
    }

    function draft(language = 'ru') {
      const rows = read();
      if (!rows.length) return '';
      const lang = language === 'en' ? 'en' : 'ru';
      const labels = copy[lang];
      const format = new Intl.NumberFormat(lang === 'ru' ? 'ru-RU' : 'en-GB');
      const lines = [labels.greeting, ''];
      for (const [index, row] of rows.entries()) {
        const product = byId.get(row.id);
        const name = `${labels.types[product.category]} ${product.short}`;
        const color = window.ASCENT_COLORS[row.color][lang].toLocaleLowerCase();
        const detail = `${color}, ${labels.size} ${row.size}, ${labels.quantity(row.qty)}`;
        const amount = Number.isFinite(product.price) ? `${format.format(product.price * row.qty)} ₽` : labels.request;
        lines.push(`${index + 1}. ${name} — ${detail} — ${amount}`);
      }
      const { amount, hasUnpriced } = summarize(rows);
      if (!hasUnpriced || rows.some(row => Number.isFinite(byId.get(row.id).price))) {
        const label = hasUnpriced ? labels.subtotal : labels.total;
        lines.push('', `${label}: ${format.format(amount)} ₽`);
      }
      return lines.join('\n');
    }

    function url(language) {
      const message = draft(language);
      return message ? `https://t.me/mmaaaga?text=${encodeURIComponent(message)}` : '';
    }

    function setProducts(next) {
      byId = new Map(next.map(product => [product.id, product]));
    }
    return { read, add, changeQuantity, remove, setProducts, total: () => summarize(read()), draft, url, storageKey, maxQuantity };
  }

  window.AscentBasket = { create };
})();
