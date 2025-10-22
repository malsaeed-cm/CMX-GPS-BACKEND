import { Controller, Get, Query } from '@nestjs/common';
import { SoapService } from './soap/soap.service';

@Controller('api')
export class SoapController {
  constructor(private readonly soapService: SoapService) {}

  @Get('list-cards')
  async getCardList(@Query('cpr') cpr: string) {
    return this.soapService.getCardList(cpr);
  }
}
