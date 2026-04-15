import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from './database/database.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './drizzle/schema';
import { count } from 'drizzle-orm';

@Injectable()
export class AppService {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getStatus() {
    try {
      const result = await this.db.select({ count: count() }).from(schema.user);
      return {
        status: 'online',
        database: 'connected',
        users_count: result[0].count,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Database connection failed', error);
      return {
        status: 'online',
        database: 'disconnected',
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
