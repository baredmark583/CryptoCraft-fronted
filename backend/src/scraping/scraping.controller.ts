import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ScrapingService } from './scraping.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('scrape')
@UseGuards(JwtAuthGuard)
export class ScrapingController {
  constructor(private readonly scrapingService: ScrapingService) {}

  @Post()
  scrape(@Body('url') url: string) {
    return this.scrapingService.scrapeUrl(url);
  }
}