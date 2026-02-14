import { Module, Global } from '@nestjs/common';
import { db } from '../drizzle/db';

@Global()
@Module({
  providers: [
    {
      provide: 'DRIZZLE',
      useValue: db,
    },
  ],
  exports: ['DRIZZLE'],
})
export class DatabaseModule {}
