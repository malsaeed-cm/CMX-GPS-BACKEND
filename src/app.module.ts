import { Module } from '@nestjs/common';
import { SoapController } from './app.controller';
import { SoapService } from './soap/soap.service';

@Module({
  controllers: [SoapController],
  providers: [SoapService],
})
export class AppModule {}
