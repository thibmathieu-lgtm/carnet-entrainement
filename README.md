# Carnet // Entraînement

Carnet de suivi d'entraînement simplifié — aviron, vélo, course à pied, musculation.
Application web statique en un seul fichier, pensée pour être ajoutée à l'écran d'accueil du téléphone.

## Fonctionnalités

- **Accueil** : bilan hebdomadaire (lundi → dimanche), totaux par catégorie de sport, objectifs de la semaine, graphique de répartition, courbe de progression sur 8 semaines, séances à venir.
- **Calendrier mensuel** : vue jour par jour, détail des séances réalisées et planifiées.
- **Planning** : import d'un programme (Excel ou PDF) qui s'intègre au planning ; association manuelle ou automatique avec les séances réalisées ; calcul du % de réalisation ; bouton "Marquer réalisée" sur chaque séance planifiée.
- **Séances** : saisie manuelle rapide, ou récupération depuis Strava (relais fiable inclus) / Garmin (CSV).
- **Objectifs** : cible hebdomadaire de nombre de séances par sport, avec barre de progression.
- **Rappels** : notification quand une séance du jour n'est pas encore marquée réalisée (tant que l'appli est ouverte).
- **Sauvegarde/restauration** : export et import des données au format JSON.
- **Accès protégé** : email + mot de passe (haché, jamais stocké en clair), avec récupération par question secrète.

## Déployer sur GitHub Pages

1. Crée un nouveau dépôt GitHub (public, ou privé sur un compte Pro/Team).
2. Ajoute les fichiers de ce dossier (`index.html`, `README.md`, `LICENSE`, `.gitignore`, et le dossier `worker/` si tu configures Strava) et pousse sur la branche `main`.
3. Dans le dépôt : **Settings → Pages**.
4. Sous **Build and deployment**, choisis **Deploy from a branch**, sélectionne `main` et `/ (root)`.
5. Enregistre. L'URL est fournie par GitHub après quelques minutes (`https://TON-COMPTE.github.io/NOM-DU-DEPOT/`).

Aucune étape de build n'est nécessaire pour l'appli elle-même : c'est un fichier HTML autonome.
Le relais Strava (dossier `worker/`), lui, se déploie séparément sur Cloudflare — voir plus bas.

## Ajouter à l'écran d'accueil du téléphone

- **iOS (Safari)** : ouvrir l'URL → icône de partage → « Sur l'écran d'accueil ».
- **Android (Chrome)** : ouvrir l'URL → menu (⋮) → « Ajouter à l'écran d'accueil ».

## Connexion Strava — relais Cloudflare Workers (recommandé)

La connexion directe à Strava depuis un navigateur échoue à l'étape d'échange de
jeton : Strava n'active pas les en-têtes CORS nécessaires sur son point
`/oauth/token`, quel que soit le compte ou l'implémentation — c'est documenté et
confirmé par Strava eux-mêmes. La solution fiable est un petit relais côté
serveur qui garde le Client Secret en sécurité et fait cet appel à la place du
navigateur.

Un relais prêt à l'emploi est fourni dans **[`worker/`](./worker)** — gratuit,
~15 minutes de mise en place, instructions détaillées dans
**[`worker/README.md`](./worker/README.md)**. Une fois déployé, colle son URL
dans l'appli : **Paramètres → Connexions → URL du relais**.

Sans relais configuré, l'appli propose un repli par jeton manuel
(`strava.com/settings/api`), mais moins pratique au quotidien (jeton valable 6h,
à renouveler à la main).

## Connexion Garmin — pourquoi ce n'est pas une connexion directe

Garmin ne propose aucune API personnelle en libre-service : leur programme
développeur exige une entité légale et rejette les demandes à usage individuel.
Les bibliothèques non-officielles qui contournaient cette limite (notamment
`garth`, sur laquelle reposait la plupart des projets comme
`python-garminconnect`) ont été cassées par un changement du flux
d'authentification de Garmin en mars 2026 ; le mainteneur de `garth` l'a
lui-même déclarée abandonnée, sans date de correction. Construire une
connexion directe ici reposerait sur une fondation actuellement rompue, que
Garmin peut recasser sans préavis — ce n'est pas une piste fiable à l'heure
actuelle, et ce carnet ne tente donc pas de connexion directe à Garmin.

Deux solutions qui fonctionnent bien en pratique :
- **Synchronisation Garmin → Strava** : à activer dans les réglages de ton compte Garmin Connect. Ensuite, une seule connexion (Strava, via le relais ci-dessus) suffit pour les deux.
- **Export CSV** : Garmin Connect → Activités → icône export → CSV, puis import dans l'onglet Paramètres → Connexions.

## Important à savoir avant utilisation

- **Stockage local uniquement.** Les données sont stockées dans le stockage local du navigateur (`localStorage`), propre à cet appareil et à ce navigateur. Pas de synchronisation automatique entre plusieurs appareils. Utilise l'export/import JSON (Paramètres → Compte) pour sauvegarder ou transférer tes données.
- **Rappels limités à l'appli ouverte.** Les notifications de rappel ne fonctionnent que pendant que l'appli est affichée à l'écran — un vrai rappel en arrière-plan (appli fermée) demanderait un serveur de notification push, non inclus ici.
- **Récupération de mot de passe.** Fonctionne uniquement si une question secrète a été définie (à la création du compte, ou plus tard dans Paramètres → Compte). Sans elle, en cas d'oubli, il faut effacer le stockage local du site (ce qui efface aussi les données).
- **Import PDF du programme.** Moins fiable qu'un import Excel (dépend de la mise en page du document source) — une étape de vérification manuelle est intégrée avant validation.

## Bibliothèques utilisées (chargées depuis un CDN, aucune installation requise)

- [Chart.js](https://www.chartjs.org/) — graphiques
- [SheetJS (xlsx)](https://sheetjs.com/) — lecture des fichiers Excel
- [PDF.js](https://mozilla.github.io/pdf.js/) — extraction de texte PDF

Le relais Strava (`worker/`) utilise [Cloudflare Workers](https://workers.cloudflare.com/) — gratuit sur son plan de base.

## Structure du dépôt

```
.
├── index.html        # l'application (fichier unique)
├── README.md          # ce fichier
├── LICENSE
├── .gitignore
└── worker/            # relais Strava, à déployer séparément sur Cloudflare
    ├── strava-proxy.js
    ├── wrangler.toml
    └── README.md
```

## Licence

Voir [LICENSE](./LICENSE).
