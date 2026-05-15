// api/instagram-token-check.js — Vercel cron (weekly Sunday 08:00 UTC)
// Checks Meta Graph API token expiry and logs a warning if <14 days remain
// Alerts via console.error so Vercel logs surface it

module.exports = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    return res.status(200).json({ ok: false, warning: 'INSTAGRAM_ACCESS_TOKEN not set' });
  }

  try {
    // Meta debug_token endpoint to check expiry
    const appId = process.env.INSTAGRAM_APP_ID;
    const appSecret = process.env.INSTAGRAM_APP_SECRET;

    if (!appId || !appSecret) {
      // Can't verify without app credentials — just ping the API to see if token works
      const pingCtrl = new AbortController();
      const pingTimeout = setTimeout(() => pingCtrl.abort(), 8000);
      let pingRes;
      try {
        pingRes = await fetch(
          `https://graph.instagram.com/me?fields=id,username&access_token=${token}`,
          { signal: pingCtrl.signal }
        );
      } finally {
        clearTimeout(pingTimeout);
      }
      const pingData = await pingRes.json();

      if (pingData.error) {
        console.error('[instagram-token-check] TOKEN INVALID:', pingData.error.message);
        return res.status(200).json({ ok: false, error: pingData.error.message, action: 'Renovar token en Meta Developer Console' });
      }

      return res.status(200).json({ ok: true, username: pingData.username, note: 'Token válido (sin verificación de expiración — configura INSTAGRAM_APP_ID/SECRET para chequeo completo)' });
    }

    // Full debug check with app credentials
    const debugCtrl = new AbortController();
    const debugTimeout = setTimeout(() => debugCtrl.abort(), 8000);
    let debugRes;
    try {
      debugRes = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${appId}|${appSecret}`,
        { signal: debugCtrl.signal }
      );
    } finally {
      clearTimeout(debugTimeout);
    }
    const debug = await debugRes.json();
    const info = debug.data;

    if (!info || !info.is_valid) {
      console.error('[instagram-token-check] TOKEN INVÁLIDO:', info?.error?.message);
      return res.status(200).json({ ok: false, invalid: true, action: 'Renovar token inmediatamente en Meta Developer Console' });
    }

    const expiresAt = info.expires_at ? new Date(info.expires_at * 1000) : null;
    const now = new Date();
    const daysLeft = expiresAt ? Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24)) : null;

    if (daysLeft !== null && daysLeft < 14) {
      console.error(`[instagram-token-check] TOKEN EXPIRA EN ${daysLeft} DÍAS (${expiresAt.toISOString()}). Renovar en Meta Developer Console.`);
    } else {
      console.log(`[instagram-token-check] Token válido. Expira: ${expiresAt ? expiresAt.toISOString() : 'never'} (${daysLeft ?? '∞'} días)`);
    }

    return res.status(200).json({
      ok: true,
      valid: info.is_valid,
      expiresAt: expiresAt?.toISOString() ?? null,
      daysLeft,
      warning: daysLeft !== null && daysLeft < 14 ? `Token expira en ${daysLeft} días — renovar YA` : null,
    });
  } catch (err) {
    console.error('[instagram-token-check] error:', err);
    return res.status(500).json({ error: err.message });
  }
};
