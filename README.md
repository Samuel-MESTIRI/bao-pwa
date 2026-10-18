# BAO — recettes de cuisine (PWA)

Carnet de recettes multi-compte, pensé pour l'iPhone (installé via Safari → « Sur l'écran d'accueil ») et pour la cuisine : gros boutons, texte lisible, mode pas à pas avec l'écran maintenu allumé.

**Stack** : Nuxt 4 (front + API Nitro) · PostgreSQL · Drizzle ORM · Zod · nuxt-auth-utils · Tailwind CSS 4 · @vite-pwa/nuxt · sharp

## Fonctionnalités

- **Comptes** : inscription libre, connexion (session par cookie chiffré, 90 jours).
- **Recettes** : liste, recherche, filtre par catégorie, fiche avec ajustement des quantités au nombre de personnes, création / modification / suppression, photo.
- **Catégories** propres à chaque utilisateur (5 créées par défaut, modifiables).
- **Mode cuisine** : une étape par écran, texte agrandissable, balayage gauche/droite, ingrédients accessibles, écran maintenu allumé (Wake Lock).
- **Sélection** de recettes avec nombre de parts, puis **liste de courses** générée : ingrédients identiques fusionnés, quantités additionnées (g + kg, ml + L). Les articles ajoutés à la main sont conservés lors d'une nouvelle génération.
- **Thème** Système / Clair / Sombre.

## Développement

Prérequis : Node 22+.

```bash
npm install
cp .env.example .env   # puis renseigner NUXT_SESSION_PASSWORD
npm run dev
```

Sans `DATABASE_URL`, une base **PGlite** (vrai PostgreSQL embarqué, sans installation) est créée dans `.data/pglite`. Les photos vont dans `.data/uploads`. Pour repartir de zéro : supprimer `.data/`.

Compte de test utilisé en local (base PGlite locale uniquement) : `demo@bao.test` / `demo-bao-2026`.

### Base de données

- Schéma : [server/db/schema.ts](server/db/schema.ts)
- Après une modification du schéma : `npm run db:generate` crée une migration SQL dans `server/db/migrations/`.
- Les migrations sont appliquées automatiquement au démarrage du serveur.

### Icônes et écrans de démarrage

Générés à partir de `assets-src/` (logo BAO et panda de l'app d'origine) : `npm run icons`. Le résultat est versionné dans `public/`.

## Déploiement (Coolify)

L'image Docker est construite à partir du [Dockerfile](Dockerfile) (multi-stage, Node 22 Alpine). Le build est limité à 1,5 Go de mémoire (~1 min) ; l'image finale ne contient que `.output/` (~27 Mo d'app).

Variables d'environnement :

| Variable | Valeur |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL fournie par Coolify |
| `NUXT_SESSION_PASSWORD` | 32 caractères aléatoires minimum (`openssl rand -hex 32`) |

Volume persistant : monter un volume sur **`/data/uploads`** (photos). À inclure dans les sauvegardes, avec la base.

Sonde de santé : `GET /api/health` (vérifie aussi la connexion à la base).

### Photos

Réduites à 1600 px dans le navigateur avant l'envoi, puis recompressées en WebP par le serveur : ~80–120 Ko pour la fiche (1200 px), ~15–25 Ko pour la miniature. L'original et les métadonnées (GPS compris) ne sont pas conservés. Les photos envoyées mais jamais rattachées à une recette sont supprimées après 24 h.
