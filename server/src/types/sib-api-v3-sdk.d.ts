/**
 * Type definitions for sib-api-v3-sdk
 * Brevo (formerly Sendinblue) API v3 SDK
 */

declare module 'sib-api-v3-sdk' {
  export class ApiClient {
    static instance: ApiClient;
    authentications: {
      'api-key': {
        apiKey: string;
      };
    };
  }

  export class SendSmtpEmail {
    sender?: { name: string; email: string };
    to?: Array<{ email: string; name?: string }>;
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    cc?: Array<{ email: string; name?: string }>;
    bcc?: Array<{ email: string; name?: string }>;
    replyTo?: { email: string; name?: string };
    attachment?: Array<{ content: string; name: string }>;
    headers?: Record<string, string>;
    templateId?: number;
    params?: Record<string, any>;
    tags?: string[];
  }

  export class TransactionalEmailsApi {
    sendTransacEmail(sendSmtpEmail: SendSmtpEmail): Promise<any>;
  }

  export class CreateEmailCampaign {
    name?: string;
    subject?: string;
    sender?: { name: string; email: string };
    type?: 'classic' | 'trigger';
    htmlContent?: string;
    recipients?: { listIds?: number[] };
    scheduledAt?: string;
    abTesting?: boolean;
    subjectA?: string;
    subjectB?: string;
    splitRule?: number;
    winnerCriteria?: string;
    winnerDelay?: number;
    ipWarmupEnable?: boolean;
    initialQuota?: number;
    increaseRate?: number;
    unsubscriptionPageId?: string;
    updateFormId?: string;
    previewText?: string;
    footer?: string;
    header?: string;
    utmCampaign?: string;
    params?: Record<string, any>;
    sendAtBestTime?: boolean;
    mirrorActive?: boolean;
    recurring?: boolean;
    toField?: string;
  }

  export class EmailCampaignsApi {
    createEmailCampaign(emailCampaigns: CreateEmailCampaign): Promise<any>;
    deleteEmailCampaign(campaignId: number): Promise<any>;
    getEmailCampaign(campaignId: number): Promise<any>;
    getEmailCampaigns(
      type?: string,
      status?: string,
      startDate?: string,
      endDate?: string,
      limit?: number,
      offset?: number,
      sort?: string
    ): Promise<any>;
    sendEmailCampaignNow(campaignId: number): Promise<any>;
    updateEmailCampaign(campaignId: number, emailCampaign: any): Promise<any>;
  }

  export class ContactsApi {
    createContact(createContact: any): Promise<any>;
    deleteContact(identifier: string): Promise<any>;
    getContactInfo(identifier: string): Promise<any>;
    getContacts(
      limit?: number,
      offset?: number,
      modifiedSince?: string,
      sort?: string
    ): Promise<any>;
    updateContact(identifier: string, updateContact: any): Promise<any>;
  }

  export class SMTPApi {
    getSmtpTemplate(templateId: number): Promise<any>;
    getSmtpTemplates(
      templateStatus?: boolean,
      limit?: number,
      offset?: number,
      sort?: string
    ): Promise<any>;
    sendTransacEmail(sendSmtpEmail: SendSmtpEmail): Promise<any>;
  }
}
