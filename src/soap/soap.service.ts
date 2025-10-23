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

export interface Statement {
  CREDIT_LIMIT: string;
  CURRENT_BALANCE: string;
  CardNumber: string;
  MCC_Code: string;
  MCC_Name: string;
  TOTAL_FEES: string;
  TOTAL_PAYMENTS_CREDIT: string;
  TOTAL_PURCHASE_CASH_ADVANCE: string;
  TOTAL_VAT_AMOUNT_4: string;
  VAT_AMOUNT_4: string;
  VAT_AMOUNT_4_TYPE: string;
  VAT_MARKUP_AMOUNT: string;
  billing_amount: string;
  closing_balance: string;
  date_create: string;
  description: string;
  due_date: string;
  microfilm_ref_number: string;
  microfilm_ref_seq: string;
  minimum_due: string;
  posting_date: string;
  shadow_account_nbr: string;
  transaction_amount: string;
  transaction_code: string;
  transaction_currency: string;
  transaction_date: string;
  transaction_wording: string;
  user_create: string;
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

  async getStatementTransactions(
    cpr: string,
    cardNumber: string,
    statementFlag: string = 'c',
  ): Promise<Statement[]> {
    if (!cpr || !cardNumber) {
      throw new BadRequestException('CPR and cardNumber parameters are required');
    }

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header/>
  <soap:Body>
    <F8_GetCurrentStatementTransaction xmlns="http://tempuri.org/">
      <pCpr>${cpr}</pCpr>
      <pCardNumber>${cardNumber}</pCardNumber>
      <StatmentFlag>${statementFlag}</StatmentFlag>
    </F8_GetCurrentStatementTransaction>
  </soap:Body>
</soap:Envelope>`;

    try {
      this.logger.log(
        `Fetching statement transactions for CPR: ${cpr}, Card: ${cardNumber}`,
      );

      const response = await axios.post(this.endpoint, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction':
            '"http://tempuri.org/IServicesGps/F8_GetCurrentStatementTransaction"',
        },
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
        timeout: 10000,
      });

      // Parse XML to JSON
      const parsedResponse = await parseStringPromise(response.data, {
        explicitArray: false,
        ignoreAttrs: true,
        tagNameProcessors: [(name) => name.replace(/^[a-z]:/, '')],
      });

      // Extract statements from the parsed response
      const statements = this.extractStatements(parsedResponse);

      this.logger.log(
        `Successfully fetched ${statements.length} statement transactions`,
      );

      return statements;
    } catch (error) {
      this.logger.error(
        `Error fetching statement transactions for CPR ${cpr}:`,
        error,
      );

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

  private extractStatements(parsedResponse: any): Statement[] {
    try {
      const body = parsedResponse?.Envelope?.Body;
      const statementResult =
        body?.F8_GetCurrentStatementTransactionResponse
          ?.F8_GetCurrentStatementTransactionResult;

      if (!statementResult || !statementResult.Statement) {
        return [];
      }

      // Handle both single statement and multiple statements
      const statementsData = Array.isArray(statementResult.Statement)
        ? statementResult.Statement
        : [statementResult.Statement];

      return statementsData.map((statement: any) => ({
        // CREDIT_LIMIT: statement.CREDIT_LIMIT || '',
        CURRENT_BALANCE: statement.CURRENT_BALANCE || '',
        CardNumber: statement.CardNumber || '',
        // MCC_Code: statement.MCC_Code || '',
        // MCC_Name: statement.MCC_Name || '',
        // TOTAL_FEES: statement.TOTAL_FEES || '',
        // TOTAL_PAYMENTS_CREDIT: statement.TOTAL_PAYMENTS_CREDIT || '',
        // TOTAL_PURCHASE_CASH_ADVANCE: statement.TOTAL_PURCHASE_CASH_ADVANCE || '',
        // TOTAL_VAT_AMOUNT_4: statement.TOTAL_VAT_AMOUNT_4 || '',
        // VAT_AMOUNT_4: statement.VAT_AMOUNT_4 || '',
        // VAT_AMOUNT_4_TYPE: statement.VAT_AMOUNT_4_TYPE || '',
        // VAT_MARKUP_AMOUNT: statement.VAT_MARKUP_AMOUNT || '',
        billing_amount: statement.billing_amount || '',
        // closing_balance: statement.closing_balance || '',
        date_create: statement.date_create || '',
        description: statement.description || '',
        // due_date: statement.due_date || '',
        // microfilm_ref_number: statement.microfilm_ref_number || '',
        // microfilm_ref_seq: statement.microfilm_ref_seq || '',
        // minimum_due: statement.minimum_due || '',
        posting_date: statement.posting_date || '',
        // shadow_account_nbr: statement.shadow_account_nbr || '',
        transaction_amount: statement.transaction_amount || '',
        transaction_code: statement.transaction_code || '',
        transaction_currency: statement.transaction_currency || '',
        transaction_date: statement.transaction_date || '',
        transaction_wording: statement.transaction_wording || '',
        // user_create: statement.user_create || '',
      }));
    } catch (error) {
      this.logger.error('Error extracting statements from response:', error);
      return [];
    }
  }
}
