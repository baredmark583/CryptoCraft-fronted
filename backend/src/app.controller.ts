import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('tonconnect-manifest.json')
  getTonConnectManifest() {
    return {
      url: 'https://cryptocraft-frontend.onrender.com', // Your frontend URL
      name: 'CryptoCraft Marketplace',
      iconUrl: 'https://www.scnsoft.com/ecommerce/cryptocurrency-ecommerce/cryptocurrency-ecommerce_cover.svg',
    };
  }
}