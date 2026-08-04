# Carnet d'entrainement

Carnet de suivi d'entraînement — aviron, vélo, course à pied, musculation.
Application web statique en un seul fichier, pensée pour être ajoutée à l'écran d'accueil du téléphone.

## L'application

Cinq onglets, dans une barre fixe en bas de l'écran, accessibles au pouce. On passe de l'un à l'autre
par un balayage gauche / droite, ou en touchant l'onglet.

- **Aujourd'hui** — volume et nombre de séances de la semaine, barres jour par jour (plein = réalisé,
  contour = prévu), la ou les séances du jour avec le bouton « Marquer réalisée », puis les séances à venir.
- **Calendrier** — mois complet, pastilles de couleur par sport, détail du jour sélectionné et ajout direct.
- **Programme** — le programme importé ou saisi, groupé par semaine, filtré (cette semaine / à venir / passé / tout),
  avec le pourcentage de réalisation global et par séance.
- **Récap** — bascule semaine / mois / année : durée, nombre de séances et kilomètres, courbe de progression
  (heures par jour, par semaine ou par mois), tableau de répartition par sport avec la part en pourcentage,
  et la liste des activités réalisées, filtrable par sport.
- **Réglages** — objectifs hebdomadaires, import de programme, connexions Strava et Garmin, sauvegarde et
  restauration des données, export CSV, mot de passe et rappels.

### Saisie d'une séance

Le bouton **+** ouvre une feuille de saisie : sport, date, durée (raccourcis 30 / 45 / 1 h / 1 h 30 / +15, ou saisie libre),
distance. Un bloc **Détails**, replié par défaut, ajoute des champs **facultatifs** : ressenti (dur / ok / bien),
intensité RPE de 1 à 10, fractionné, et l'association à une séance planifiée. Ces champs ne sont enregistrés que
s'ils sont renseignés — les séances déjà enregistrées restent lisibles telles quelles, aucune migration n'est nécessaire.

## Déployer sur GitHub Pages

1. Crée un nouveau dépôt GitHub (public, ou privé sur un compte Pro/Team).
2. Ajoute les fichiers de ce dossier (`index.html`, `README.md`, `LICENSE`, `.gitignore`, et le dossier `worker/`
   si tu configures Strava) et pousse sur la branche `main`.
3. Dans le dépôt : **Settings → Pages**.
4. Sous **Build and deployment**, choisis **Deploy from a branch**, sélectionne `main` et `/ (root)`.
5. Enregistre. L'URL est fournie par GitHub après quelques minutes (`https://TON-COMPTE.github.io/NOM-DU-DEPOT/`).

Aucune étape de build n'est nécessaire pour l'appli elle-même : c'est un fichier HTML autonome.
Le relais Strava (dossier `worker/`), lui, se déploie séparément sur Cloudflare — voir plus bas.

## Ajouter à l'écran d'accueil du téléphone

- **iOS (Safari)** : ouvrir l'URL → icône de partage → « Sur l'écran d'accueil ».
- **Android (Chrome)** : ouvrir l'URL → menu (⋮) → « Ajouter à l'écran d'accueil ».

## Connexion Strava — relais Cloudflare Workers (recommandé)

La connexion directe à Strava depuis un navigateur échoue à l'étape d'échange de jeton : Strava n'active pas
les en-têtes CORS nécessaires sur son point `/oauth/token`, quel que soit le compte ou l'implémentation.
La solution fiable est un petit relais côté serveur qui garde le Client Secret en sécurité et fait cet appel
à la place du navigateur.

Un relais prêt à l'emploi est fourni dans **[`worker/`](./worker)** — gratuit, ~15 minutes de mise en place,
instructions détaillées dans **[`worker/README.md`](./worker/README.md)**. Une fois déployé, colle son URL dans
l'appli : **Réglages → Strava → URL du relais**.

Sans relais configuré, l'appli propose un repli par jeton manuel (`strava.com/settings/api`), moins pratique au
quotidien (jeton valable 6 h, à renouveler à la main).

## Connexion Garmin — pourquoi ce n'est pas une connexion directe

Garmin ne propose aucune API personnelle en libre-service : leur programme développeur exige une entité légale
et rejette les demandes à usage individuel. Les bibliothèques non officielles qui contournaient cette limite
(notamment `garth`, sur laquelle reposait la plupart des projets comme `python-garminconnect`) ont été cassées
par un changement du flux d'authentification de Garmin en mars 2026 ; le mainteneur de `garth` l'a lui-même
déclarée abandonnée. Ce carnet ne tente donc pas de connexion directe à Garmin.

Deux solutions qui fonctionnent bien en pratique :
- **Synchronisation Garmin → Strava** : à activer dans les réglages de ton compte Garmin Connect. Ensuite, une
  seule connexion (Strava, via le relais ci-dessus) suffit pour les deux.
- **Export CSV** : Garmin Connect → Activités → icône export → CSV, puis import dans **Réglages → Garmin**.

## Important à savoir avant utilisation

- **Stockage local uniquement.** Les données sont stockées dans le stockage local du navigateur (`localStorage`),
  propre à cet appareil et à ce navigateur. Pas de synchronisation automatique entre plusieurs appareils.
  Utilise l'export / import JSON (Réglages → Données) pour sauvegarder ou transférer tes données.
- **Rappels limités à l'appli ouverte.** Les notifications de rappel ne fonctionnent que pendant que l'appli est
  affichée à l'écran — un vrai rappel en arrière-plan demanderait un serveur de notification push, non inclus ici.
- **Récupération de mot de passe.** Fonctionne uniquement si une question secrète a été définie (à la création du
  compte, ou plus tard dans Réglages → Compte). Sans elle, en cas d'oubli, il faut effacer le stockage local du
  site — ce qui efface aussi les données.
- **Import PDF du programme.** Moins fiable qu'un import Excel (dépend de la mise en page du document source) —
  une étape de vérification manuelle est intégrée avant validation.

## Bibliothèques utilisées (chargées depuis un CDN, aucune installation requise)

- [SheetJS (xlsx)](https://sheetjs.com/) — lecture des fichiers Excel
- [PDF.js](https://mozilla.github.io/pdf.js/) — extraction de texte PDF

Les graphiques sont dessinés en SVG par l'application elle-même : aucune bibliothèque de graphiques n'est chargée.
Le relais Strava (`worker/`) utilise [Cloudflare Workers](https://workers.cloudflare.com/) — gratuit sur son plan de base.

## Structure du dépôt

```
.
├── index.html         # l'application (fichier unique)
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
