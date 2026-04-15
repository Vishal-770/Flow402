import { Controller, All, Param, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { GatewayService } from './gateway.service';

@Controller('gw')
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @All([':gatewayPath', ':gatewayPath/*path'])
  async handleGateway(
    @Param('gatewayPath') gatewayPath: string,
    @Param('path') remainingPath: string | string[] | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Safely reconstruct the remaining path from string or array
    let path = '';
    if (typeof remainingPath === 'string') {
      path = remainingPath.startsWith('/')
        ? remainingPath
        : `/${remainingPath}`;
    } else if (Array.isArray(remainingPath)) {
      path = '/' + remainingPath.join('/');
    }

    return await this.gatewayService.handleProxy(gatewayPath, path, req, res);
  }
}
