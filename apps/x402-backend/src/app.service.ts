import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    // console.log('AppService.getHello called', process.env.PORT);
    return 'Hello World!';
  }
}
