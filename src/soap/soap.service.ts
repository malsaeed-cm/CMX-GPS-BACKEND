import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import * as https from 'https';
import { parseStringPromise } from 'xml2js';

export interface Card {
  Account_Status: string;
  Activation_flag: string;
  Agreement_date: string;
  BrandName: string;
  CardNumber: string;
  CardType: string;
  Card_status_reason: string;
  ClientCode: string;
  CprId: string;
  CurrentBalance: string;
  Delivery_card_flag: string;
  Direct_debit: string;
  EmbossingName: string;
  ExpiryDate: string;
  Limit_Index: string;
  MainSupp: string;
  Plastic_Code: string;
  ProfileCode: string;
  Shadow_Acoount_NBR: string;
  Shadow_account_reason: string;
  Single_Multi: string;
  Stop_list_ind: string;
  Stop_list_reason: string;
  Total_unpaid_amount: string;
  Unpaid_status: string;
  pBasicCardNumber: string;
  status_code: string;
}

@Injectable()
export class SoapService {
  private readonly logger = new Logger(SoapService.name);
  private readonly endpoint = 'https://10.6.101.233:2001/Manager/ServicesGps.svc';

  async getCardList(cpr: string): Promise<Card[]> {
    if (!cpr) {
      throw new BadRequestException('CPR parameter is required');
    }

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header/>
  <soap:Body>
    <F4_GetCardList xmlns="http://tempuri.org/">
      <pCpr>${cpr}</pCpr>
    </F4_GetCardList>
  </soap:Body>
</soap:Envelope>`;

    try {
      this.logger.log(`Fetching card list for CPR: ${cpr}`);

      const response = await axios.post(this.endpoint, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': '"http://tempuri.org/IServicesGps/F4_GetCardList"',
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false, // For self-signed certificates - change in production
        }),
        timeout: 10000,
      });

      // Parse XML to JSON
      const parsedResponse = await parseStringPromise(response.data, {
        explicitArray: false,
        ignoreAttrs: true,
        tagNameProcessors: [(name) => name.replace(/^[a-z]:/, '')], // Remove namespace prefixes
      });

      // Extract cards from the parsed response
      const cards = this.extractCards(parsedResponse);

      this.logger.log(`Successfully fetched ${cards.length} cards for CPR: ${cpr}`);

      return cards;
    } catch (error) {
      this.logger.error(`Error fetching card list for CPR ${cpr}:`, error);

      if (error instanceof AxiosError) {
        throw new BadRequestException(
          `SOAP API Error: ${error.message}`,
        );
      }

      throw error;
    }
  }

  private extractCards(parsedResponse: any): Card[] {
    try {
      const body = parsedResponse?.Envelope?.Body;
      const cardListResult = body?.F4_GetCardListResponse?.F4_GetCardListResult;

      if (!cardListResult || !cardListResult.Card) {
        return [];
      }

      // Handle both single card and multiple cards
      const cardsData = Array.isArray(cardListResult.Card)
        ? cardListResult.Card
        : [cardListResult.Card];

      return cardsData.map((card: any) => ({
        // Account_Status: card.Account_Status || '',
        // Activation_flag: card.Activation_flag || '',
        // Agreement_date: card.Agreement_date || '',
        BrandName: card.BrandName || '',
        CardNumber: card.CardNumber || '',
        CardType: card.CardType || '',
        // Card_status_reason: card.Card_status_reason || '',
        ClientCode: card.ClientCode || '',
        CprId: card.CprId || '',
        // CurrentBalance: card.CurrentBalance || '',
        // Delivery_card_flag: card.Delivery_card_flag || '',
        // Direct_debit: card.Direct_debit || '',
        EmbossingName: card.EmbossingName || '',
        ExpiryDate: card.ExpiryDate || '',
        // Limit_Index: card.Limit_Index || '',
        MainSupp: card.MainSupp || '',
        // Plastic_Code: card.Plastic_Code || '',
        // ProfileCode: card.ProfileCode || '',
        // Shadow_Acoount_NBR: card.Shadow_Acoount_NBR || '',
        // Shadow_account_reason: card.Shadow_account_reason || '',
        // Single_Multi: card.Single_Multi || '',
        // Stop_list_ind: card.Stop_list_ind || '',
        // Stop_list_reason: card.Stop_list_reason || '',
        // Total_unpaid_amount: card.Total_unpaid_amount || '',
        // Unpaid_status: card.Unpaid_status || '',
        // pBasicCardNumber: card.pBasicCardNumber || '',
        // status_code: card.status_code || '',
      }));
    } catch (error) {
      this.logger.error('Error extracting cards from response:', error);
      return [];
    }
  }
}
