/**
 * Relais Strava pour "Carnet // Entraînement".
 *
 * Rôle : garder le Client Secret Strava côté serveur et faire, à la place du
 * navigateur, les appels que Strava bloque en cross-origin (échange de jeton,
 * rafraîchissement, et proxy des appels à l'API activités).
 *
 * Déploiement (Cloudflare Workers, gratuit) :
 *   1. npm install -g wrangler
 *   2. wrangler login
 *   3. Dans ce dossier : wrangler deploy
 *   4. wrangler secret put STRAVA_CLIENT_SECRET   (colle ton Client Secret Strava)
 *   5. Récupère l'URL affichée (https://xxxx.workers.dev) et colle-la dans
 *      l'appli, onglet Paramètres > Connexions > "URL du relais".
 *
 * Voir wrangler.toml pour la configuration (nom, variable ALLOWED_ORIGIN).
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // POST /token  { client_id, code }  -> échange le code contre un access_token
      if (url.pathname === '/token' && request.method === 'POST') {
        const { client_id, code } = await request.json();
        if (!client_id || !code) {
          return jsonResponse({ error: 'client_id et code requis' }, 400, corsHeaders);
        }
        const resp = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id,
            client_secret: env.STRAVA_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
          }),
        });
        const data = await resp.json();
        return jsonResponse(data, resp.status, corsHeaders);
      }

      // POST /refresh  { client_id, refresh_token }  -> renouvelle l'access_token
      if (url.pathname === '/refresh' && request.method === 'POST') {
        const { client_id, refresh_token } = await request.json();
        if (!client_id || !refresh_token) {
          return jsonResponse({ error: 'client_id et refresh_token requis' }, 400, corsHeaders);
        }
        const resp = await fetch('https://www.strava.com/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id,
            client_secret: env.STRAVA_CLIENT_SECRET,
            refresh_token,
            grant_type: 'refresh_token',
          }),
        });
        const data = await resp.json();
        return jsonResponse(data, resp.status, corsHeaders);
      }

      // GET /activities?per_page=30  (Authorization: Bearer <access_token>)
      //   -> proxy vers l'API Strava, ajoute les en-têtes CORS sur la réponse
      if (url.pathname === '/activities' && request.method === 'GET') {
        const auth = request.headers.get('Authorization');
        if (!auth) {
          return jsonResponse({ error: 'en-tête Authorization requis' }, 401, corsHeaders);
        }
        const perPage = url.searchParams.get('per_page') || '30';
        const page = url.searchParams.get('page') || '1';
        const resp = await fetch(
          `https://www.strava.com/api/v3/athlete/activities?per_page=${encodeURIComponent(perPage)}&page=${encodeURIComponent(page)}`,
          { headers: { Authorization: auth } }
        );
        const data = await resp.text();
        return new Response(data, {
          status: resp.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return jsonResponse({ error: 'route inconnue', path: url.pathname }, 404, corsHeaders);
    } catch (err) {
      return jsonResponse({ error: 'erreur interne du relais', detail: String(err) }, 500, corsHeaders);
    }
  },
};

function jsonResponse(obj, status, corsHeaders) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
