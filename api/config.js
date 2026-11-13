'use strict';

// Only a publishable key or a legacy anon key may be sent to the browser.
function isPublicKey(key) {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  try {
    const parts = key.split('.');
    return parts.length === 3 && JSON.parse(Buffer.from(parts[1], 'base64url')).role === 'anon';
  } catch {
    return false;
  }
}

module.exports = function config(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  if (!url && !key) return res.status(200).json({ configured: false });
  try {
    const project = new URL(url);
    if (project.protocol !== 'https:' || project.username || project.password ||
        project.pathname !== '/' || project.search || project.hash || !isPublicKey(key)) {
      throw new Error();
    }
    return res.status(200).json({ configured: true, url: project.origin, key });
  } catch {
    return res.status(503).json({ error: 'Проверьте SUPABASE_URL и публичный ключ проекта в Vercel.' });
  }
};
