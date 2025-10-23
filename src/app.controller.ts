import { Controller, Get, Query } from '@nestjs/common';
import { SoapService } from './soap/soap.service';

@Controller('api')
export class SoapController {
  constructor(private readonly soapService: SoapService) {}

  @Get('card-list')
  async getCardList(@Query('cpr') cpr: string) {
    return this.soapService.getCardList(cpr);
  }

  @Get('statement-transactions')
  async getStatementTransactions(
    @Query('cpr') cpr: string,
    @Query('cardNumber') cardNumber: string,
    @Query('statementFlag') statementFlag?: string,
  ) {
    return this.soapService.getStatementTransactions(
      cpr,
      cardNumber,
      statementFlag,
    );
  }
}
