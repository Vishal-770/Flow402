import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createThirdwebClient, ThirdwebClient } from 'thirdweb';
import { facilitator } from 'thirdweb/x402';

@Injectable()
export class ThirdwebService {
  public client: ThirdwebClient;
  public thirdwebFacilitator: ReturnType<typeof facilitator>;

  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('THIRDWEB_SECRET_KEY');
    const serverWalletAddress = this.configService.get<string>(
      'SERVER_WALLET_ADDRESS',
    );

    if (!secretKey || !serverWalletAddress) {
      console.warn(
        'Thirdweb environment variables missing. Ensure THIRDWEB_SECRET_KEY and SERVER_WALLET_ADDRESS are set.',
      );
    }

    this.client = createThirdwebClient({
      secretKey: secretKey || '',
    });

    this.thirdwebFacilitator = facilitator({
      client: this.client,
      serverWalletAddress:
        serverWalletAddress || '0x0000000000000000000000000000000000000000',
      waitUntil: 'simulated',
    });

    if (serverWalletAddress) {
      console.log(
        `[ThirdwebService] Initialized with facilitator wallet: ${serverWalletAddress.substring(0, 6)}...`,
      );
    } else {
      console.error(
        '[ThirdwebService] FATAL: SERVER_WALLET_ADDRESS is missing!',
      );
    }
  }
}
