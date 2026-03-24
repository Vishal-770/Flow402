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

  async getHello(): Promise<string> {
    try {
      const result = await this.db.select({ count: count() }).from(schema.user);
      return `Hello World! Database connected. Total users: ${result[0].count}`;
    } catch (error) {
      console.error('Database connection failed', error);
      return 'Hello World! Database connection failed.';
    }
  }
}
