import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/lib/env';
import * as schema from './schema';

export const pg = postgres(env.DATABASE_URL);

export const db = drizzle(pg, { schema });
