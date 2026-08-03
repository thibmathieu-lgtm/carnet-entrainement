# Relais Strava (Cloudflare Workers)

Ce petit relais résout le seul vrai blocage technique de la connexion Strava depuis
une page web statique : Strava n'autorise pas les appels cross-origin sur son
point d'échange de jeton (`/oauth/token`), donc un navigateur seul ne peut pas
terminer la connexion OAuth. Le relais fait cet appel à ta place, côté serveur,
où cette limite ne s'applique pas.

Gratuit sur le plan gratuit de Cloudflare Workers (100 000 requêtes/jour).

## Mise en place (une seule fois, ~15 minutes)

1. **Créer l'application Strava** (si pas déjà fait) : [strava.com/settings/api](https://www.strava.com/settings/api).
   Note le **Client ID** et le **Client Secret**. Dans "Authorization Callback Domain",
   mets le domaine de ton site GitHub Pages (ex: `ton-compte.github.io`).

2. **Installer Wrangler** (l'outil en ligne de commande de Cloudflare) :
   ```bash
   npm install -g wrangler
   wrangler login
   ```

3. **Déployer le relais** depuis ce dossier (`worker/`) :
   ```bash
   cd worker
   wrangler deploy
   ```
   Wrangler affiche une URL du type `https://carnet-strava-proxy.TON-COMPTE.workers.dev`.
   Garde-la.

4. **Ajouter le Client Secret en secret chiffré** (jamais dans un fichier commité) :
   ```bash
   wrangler secret put STRAVA_CLIENT_SECRET
   ```
   Colle le Client Secret Strava quand c'est demandé.

5. **(Recommandé) Restreindre l'origine autorisée** : édite `ALLOWED_ORIGIN` dans
   `wrangler.toml` avec l'URL exacte de ton site (ex: `https://ton-compte.github.io`),
   puis redéploie avec `wrangler deploy`.

6. **Configurer l'appli** : dans le carnet, onglet **Paramètres → Connexions**,
   colle l'URL du relais dans "URL du relais" et le Client ID Strava, puis
   "Se connecter à Strava".

## Ce que fait (et ne fait pas) le relais

- Fait : échange de jeton, rafraîchissement de jeton, proxy des appels à
  `GET /activities` — les trois opérations que Strava bloque en cross-origin.
- Ne fait pas : il ne stocke rien. Chaque requête est transmise à Strava puis
  la réponse est renvoyée telle quelle ; les jetons restent uniquement dans le
  navigateur (stockage local de l'appli).
- Le Client Secret ne quitte jamais Cloudflare — il n'est jamais envoyé au
  navigateur ni visible dans le code de l'appli.

## Coût et maintenance

Le plan gratuit de Cloudflare Workers couvre largement un usage personnel
(100 000 requêtes/jour). Rien à surveiller au-delà de la limite habituelle de
renouvellement de jeton Strava (l'appli gère l'expiration automatiquement une
fois le relais configuré).
