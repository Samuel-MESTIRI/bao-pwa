import { resolve } from 'node:path'
import { mkdir } from 'node:fs/promises'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from '../db/schema'

export { schema }
export type Db = NodePgDatabase<typeof schema>

const migrationsFolder = resolve(process.env.MIGRATIONS_DIR || 'server/db/migrations')

let dbPromise: Promise<Db> | undefined

async function connect(): Promise<Db> {
  const url = useRuntimeConfig().databaseUrl || process.env.DATABASE_URL

  if (url) {
    // Peu de connexions : le VPS est petit et l'app a peu d'utilisateurs simultanés.
    const pool = new pg.Pool({ connectionString: url, max: 5, idleTimeoutMillis: 30_000 })
    const db = drizzle(pool, { schema })
    await migrate(db, { migrationsFolder })
    return db
  }

  // Sans DATABASE_URL : PostgreSQL embarqué (PGlite), uniquement en développement.
  // `import.meta.dev` vaut false au build, donc PGlite n'est pas embarqué en production.
  if (import.meta.dev) {
    const dataDir = resolve('.data/pglite')
    await mkdir(dataDir, { recursive: true })
    const { PGlite } = await import('@electric-sql/pglite')
    const { drizzle: drizzlePglite } = await import('drizzle-orm/pglite')
    const { migrate: migratePglite } = await import('drizzle-orm/pglite/migrator')
    const db = drizzlePglite(new PGlite(dataDir), { schema })
    await migratePglite(db, { migrationsFolder })
    return db as unknown as Db
  }

  throw new Error('DATABASE_URL manquante')
}

/** Connexion partagée ; les migrations sont appliquées à la première ouverture. */
export function useDb(): Promise<Db> {
  dbPromise ??= connect().catch((error) => {
    dbPromise = undefined
    throw error
  })
  return dbPromise
}
