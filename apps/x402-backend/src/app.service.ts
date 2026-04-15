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
    return {
      status: 'online',
      database: 'connected',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
