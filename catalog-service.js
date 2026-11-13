(() => {
  'use strict';

  const bucketPath = '/storage/v1/object/public/product-photos/';
  const extensions = new Map([['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp']]);
  const maxPhotoBytes = 8 * 1024 * 1024;
  const columns = 'id,data,revision';
  let settings;
  let initialization;
  let session;
  let refreshTask;

  function fail(message, status) {
    return Object.assign(new Error(message), { status });
  }

  async function readConfiguration() {
    if (location.protocol === 'file:') return false;
    const response = await fetch('/api/config', { cache: 'no-store', headers: { Accept: 'application/json' } });
    if (response.status === 404) return false;
    if (!response.ok) throw fail('Не удалось получить настройки каталога. Проверьте переменные проекта в Vercel.', response.status);
    const data = await response.json();
    if (data.configured === false) return false;
    const url = new URL(data.url);
    if (url.protocol !== 'https:' || url.origin !== data.url || typeof data.key !== 'string' || !data.key) {
      throw fail('Некорректные настройки подключения каталога.', 503);
    }
    settings = { url: url.origin, key: data.key };
    return true;
  }

  function init() {
    initialization ??= readConfiguration().catch(error => {
      initialization = undefined;
      throw error;
    });
    return initialization;
  }

  function photoBase() {
    return settings ? settings.url + bucketPath : '';
  }

  function photoUrl(path) {
    if (typeof path !== 'string') return '';
    const filePattern = /^[a-z\d][\w.-]*\.(?:jpe?g|png|webp|avif)$/i;
    const localFile = path.startsWith('assets/') ? path.slice(7) : path;
    if (filePattern.test(localFile)) return 'assets/' + localFile;
    const base = photoBase();
    if (base && path.startsWith(base) && filePattern.test(path.slice(base.length))) return path;
    return '';
  }

  async function request(path, { token, method = 'GET', body, headers = {} } = {}) {
    if (!await init()) throw fail('Подключите Supabase в настройках проекта Vercel.', 503);
    const fields = { apikey: settings.key, ...headers };
    if (token) fields.Authorization = 'Bearer ' + token;
    if (body !== undefined && !(body instanceof Blob)) {
      fields['Content-Type'] = 'application/json';
      body = JSON.stringify(body);
    }
    let response;
    try {
      response = await fetch(settings.url + path, { method, headers: fields, body, cache: 'no-store', redirect: 'error' });
    } catch {
      throw fail('Не удалось соединиться с сервером. Проверьте сеть и повторите действие.', 0);
    }
    if (!response.ok) {
      const errors = {
        400: 'Сервер не принял данные. Проверьте заполненные поля.',
        401: 'Сессия завершилась. Войдите снова.',
        403: 'Для этого действия нужен доступ владельца.',
        404: 'Каталог не настроен. Проверьте, что setup.sql выполнен в Supabase.',
        409: 'Такая запись уже существует. Обновите список товаров.',
        413: 'Слишком большой файл фотографии.',
        429: 'Слишком много запросов. Попробуйте чуть позже.'
      };
      throw fail(errors[response.status] || 'Сервер временно недоступен. Повторите действие.', response.status);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  function authSession(tokens) {
    if (!tokens.access_token || !tokens.refresh_token) throw fail('Не удалось открыть сессию владельца.', 401);
    return { token: tokens.access_token, refresh: tokens.refresh_token,
      expires: Date.now() + Number(tokens.expires_in || 3600) * 1000 };
  }

  async function login(email, password) {
    let tokens;
    try {
      tokens = await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } });
    } catch (error) {
      if (error.status === 400 || error.status === 401) throw fail('Проверьте адрес почты и пароль.', 401);
      throw error;
    }
    const candidate = authSession(tokens);
    const owner = await request('/rest/v1/rpc/ascent_is_owner', { method: 'POST', token: candidate.token, body: {} });
    if (owner !== true) throw fail('У этой учётной записи нет доступа владельца.', 403);
    session = candidate;
    return true;
  }

  async function ownerToken() {
    if (!session) throw fail('Войдите в панель владельца.', 401);
    if (session.expires > Date.now() + 30000) return session.token;
    if (!refreshTask) {
      const previous = session;
      refreshTask = request('/auth/v1/token?grant_type=refresh_token', {
        method: 'POST', body: { refresh_token: previous.refresh }
      }).then(tokens => {
        if (session !== previous) throw fail('Сессия изменилась. Войдите снова.', 401);
        session = authSession(tokens);
        return session.token;
      }).catch(error => {
        if ((error.status === 400 || error.status === 401) && session === previous) session = undefined;
        throw error;
      }).finally(() => { refreshTask = undefined; });
    }
    return refreshTask;
  }

  async function logout() {
    const previous = session;
    session = undefined;
    if (previous) await request('/auth/v1/logout?scope=local', { method: 'POST', token: previous.token });
  }

  function flatten(row) {
    return { ...row.data, id: row.id, _revision: row.revision };
  }

  async function list() {
    const records = [];
    const pageSize = 100;
    while (true) {
      const page = await request('/rest/v1/ascent_products?select=' + columns +
        '&order=position.asc,id.asc&limit=' + pageSize + '&offset=' + records.length);
      records.push(...page.map(flatten));
      if (page.length < pageSize) return records;
    }
  }

  function validId(id) {
    if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,95}$/.test(id)) {
      throw fail('Некорректный идентификатор товара.', 400);
    }
    return id;
  }

  function editUrl(id, revision) {
    if (!Number.isSafeInteger(revision) || revision < 1) throw fail('Обновите список, чтобы получить текущую версию товара.', 409);
    return '/rest/v1/ascent_products?select=' + columns + '&id=eq.' + validId(id) + '&revision=eq.' + revision;
  }

  function changedRow(rows) {
    if (rows?.length !== 1) throw fail('Товар изменился или был удалён. Обновите список перед новой правкой.', 409);
    return flatten(rows[0]);
  }

  async function save(product, { revision = product._revision ?? null } = {}) {
    const id = validId(product.id);
    const data = { ...product };
    delete data._revision;
    const create = revision === null;
    const rows = await request(create ? '/rest/v1/ascent_products?select=' + columns : editUrl(id, revision), {
      method: create ? 'POST' : 'PATCH', token: await ownerToken(), body: create ? { id, data } : { data },
      headers: { Prefer: 'return=representation' }
    });
    return changedRow(rows);
  }

  async function remove(id, revision) {
    const rows = await request(editUrl(id, revision), { method: 'DELETE', token: await ownerToken(), headers: { Prefer: 'return=representation' } });
    changedRow(rows);
  }

  async function upload(file) {
    const ext = extensions.get(file?.type);
    if (!ext || !(file instanceof Blob) || !file.size || file.size > maxPhotoBytes) {
      throw fail('Выберите фотографию JPG, PNG или WebP размером до 8 МБ.', 400);
    }
    const name = crypto.randomUUID() + '.' + ext;
    await request('/storage/v1/object/product-photos/' + name, { method: 'POST', token: await ownerToken(),
      headers: { 'Content-Type': file.type }, body: file });
    return photoBase() + name;
  }

  window.AscentCatalogService = Object.freeze({
    init, list, login, logout, isOwner: () => Boolean(session), save, remove, upload, photoBase, photoUrl
  });
})();
