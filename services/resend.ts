
import { RESEND_API_KEY, SEND_FROM_EMAIL, SEND_FROM_NAME } from '../config';

const BASE_URL = 'https://api.resend.com';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

interface BatchEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const ResendClient = {
  async sendEmail(params: SendEmailParams) {
    try {
      const response = await fetch(`${BASE_URL}/emails`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: params.from || `${SEND_FROM_NAME} <${SEND_FROM_EMAIL}>`,
          to: params.to,
          subject: params.subject,
          html: params.html,
        }),
      });

      if (!response.ok) {
        throw new Error(`Resend API Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },

  async sendBatch(emails: BatchEmailParams[]) {
    try {
      const payload = emails.map(e => ({
        from: e.from || `${SEND_FROM_NAME} <${SEND_FROM_EMAIL}>`,
        to: e.to,
        subject: e.subject,
        html: e.html
      }));

      const response = await fetch(`${BASE_URL}/emails/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Resend Batch Error: ${errText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending batch emails:', error);
      throw error;
    }
  },

  async getEmailStatus(emailId: string) {
    try {
      const response = await fetch(`${BASE_URL}/emails/${emailId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Resend Status Error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting email status:', error);
      return null;
    }
  }
};
