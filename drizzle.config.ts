import { defineConfig } from 'drizzle-kit'

// Sert uniquement à générer les migrations SQL (`npm run db:generate`).
// Elles sont appliquées au démarrage du serveur (server/utils/db.ts).
export default defineConfig({
  dialect: 'postgresql',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
})
