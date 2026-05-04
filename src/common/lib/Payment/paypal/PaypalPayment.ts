import appConfig from '../../../../config/app.config';
import { Fetch } from '../../Fetch';

const clientId = appConfig().payment.paypal.client_id;
const secret = appConfig().payment.paypal.secret;
const api = appConfig().payment.paypal.api;

export class PaypalPayment {
  private async getAccessToken(): Promise<string> {
    const token = Buffer.from(`${clientId}:${secret}`).toString('base64');

    const response = await Fetch.post(
      `${api}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    return response.data.access_token;
  }

  async sendPayout(
    recipientEmail: string,
    amount: string,
    currency: string = 'USD',
  ) {
    const accessToken = await this.getAccessToken();

    const body = {
      sender_batch_header: {
        sender_batch_id: `batch-${Date.now()}`,
        email_subject: 'You have a payment',
        email_message: 'You have received a payment',
      },
      items: [
        {
          recipient_type: 'EMAIL',
          amount: {
            value: amount,
            currency,
          },
          receiver: recipientEmail,
          note: 'Thanks for your great service!',
          sender_item_id: `item-${Date.now()}`,
        },
      ],
    };

    const response = await Fetch.post(`${api}/v1/payments/payouts`, body, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  async getPayoutStatus(batchId: string) {
    const accessToken = await this.getAccessToken();

    const response = await Fetch.get(`${api}/v1/payments/payouts/${batchId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }
}
