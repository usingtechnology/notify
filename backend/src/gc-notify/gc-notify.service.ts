import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateEmailNotificationRequest,
  CreateSmsNotificationRequest,
  NotificationResponse,
  Notification,
  Template,
  Links,
  PostBulkRequest,
  PostBulkResponse,
  PostBulkJobData,
} from './v2/core/schemas';
import {
  Sender,
  CreateSenderRequest,
  UpdateSenderRequest,
  CreateTemplateRequest,
  UpdateTemplateRequest,
} from './v2/contrib/schemas';

interface StoredSender extends Sender {
  id: string;
}

interface StoredTemplate extends Template {
  id: string;
  version: number;
}

@Injectable()
export class GcNotifyService {
  private readonly logger = new Logger(GcNotifyService.name);

  private readonly senders = new Map<string, StoredSender>();
  private readonly templates = new Map<string, StoredTemplate>();

  constructor(private readonly configService: ConfigService) {}

  async getNotifications(query: {
    template_type?: 'sms' | 'email';
    status?: string[];
    reference?: string;
    older_than?: string;
    include_jobs?: boolean;
  }): Promise<{ notifications: Notification[]; links: Links }> {
    this.logger.log('Getting notifications list');
    return {
      notifications: [],
      links: { current: '/gc-notify/v2/notifications' },
    };
  }

  async getNotificationById(notificationId: string): Promise<Notification> {
    this.logger.log(`Getting notification: ${notificationId}`);
    throw new NotFoundException('Notification not found in database');
  }

  async sendEmail(
    body: CreateEmailNotificationRequest,
  ): Promise<NotificationResponse> {
    const notificationId = uuidv4();
    this.logger.log(
      `Creating email notification: ${notificationId} to ${body.email_address}`,
    );

    return {
      id: notificationId,
      reference: body.reference,
      content: {
        from_email: 'noreply@gov.bc.ca',
        body: `Email sent with template ${body.template_id}`,
        subject: 'Notification',
      },
      uri: `/gc-notify/v2/notifications/${notificationId}`,
      template: {
        id: body.template_id,
        version: 1,
        uri: `/gc-notify/v2/templates/${body.template_id}`,
      },
      scheduled_for: body.scheduled_for,
    };
  }

  async sendSms(body: CreateSmsNotificationRequest): Promise<NotificationResponse> {
    const notificationId = uuidv4();
    this.logger.log(
      `Creating SMS notification: ${notificationId} to ${body.phone_number}`,
    );

    return {
      id: notificationId,
      reference: body.reference,
      content: {
        body: `SMS sent with template ${body.template_id}`,
        from_number:
          this.configService.get<string>('twilio.fromNumber') || '+15551234567',
      },
      uri: `/gc-notify/v2/notifications/${notificationId}`,
      template: {
        id: body.template_id,
        version: 1,
        uri: `/gc-notify/v2/templates/${body.template_id}`,
      },
      scheduled_for: body.scheduled_for,
    };
  }

  async sendBulk(body: PostBulkRequest): Promise<PostBulkResponse> {
    if (!body.rows && !body.csv) {
      throw new BadRequestException('You should specify either rows or csv');
    }

    const rowCount = body.rows
      ? body.rows.length - 1
      : (body.csv?.split('\n').length ?? 1) - 1;

    if (rowCount > 50000) {
      throw new BadRequestException(
        'Too many rows. Maximum number of rows allowed is 50000',
      );
    }

    const jobId = uuidv4();
    this.logger.log(`Creating bulk job: ${jobId} with ${rowCount} recipients`);

    const now = new Date().toISOString();
    const data: PostBulkJobData = {
      id: jobId,
      template: body.template_id,
      job_status: 'pending',
      notification_count: rowCount,
      created_at: now,
    };

    return { data };
  }

  async getTemplates(type?: 'sms' | 'email'): Promise<{ templates: Template[] }> {
    this.logger.log('Getting templates list');
    let templates = Array.from(this.templates.values());
    if (type) {
      templates = templates.filter((t) => t.type === type);
    }
    return { templates };
  }

  async getTemplate(templateId: string): Promise<Template> {
    this.logger.log(`Getting template: ${templateId}`);
    const template = this.templates.get(templateId);
    if (!template) {
      throw new NotFoundException('Template not found in database');
    }
    return template;
  }

  // --- Senders CRUD (Extension: Management) ---

  async getSenders(type?: 'email' | 'sms' | 'both'): Promise<{ senders: Sender[] }> {
    this.logger.log('Getting senders list');
    let senders = Array.from(this.senders.values());
    if (type) {
      senders = senders.filter((s) => s.type === type || s.type === 'both');
    }
    return { senders };
  }

  async getSender(senderId: string): Promise<Sender> {
    this.logger.log(`Getting sender: ${senderId}`);
    const sender = this.senders.get(senderId);
    if (!sender) {
      throw new NotFoundException('Sender not found');
    }
    return sender;
  }

  async createSender(body: CreateSenderRequest): Promise<Sender> {
    this.validateSenderFields(body);
    const id = uuidv4();
    const now = new Date().toISOString();
    const sender: StoredSender = {
      id,
      type: body.type,
      email_address: body.email_address,
      sms_sender: body.sms_sender,
      is_default: body.is_default ?? false,
      created_at: now,
      updated_at: now,
    };
    this.senders.set(id, sender);
    this.logger.log(`Created sender: ${id}`);
    return sender;
  }

  async updateSender(senderId: string, body: UpdateSenderRequest): Promise<Sender> {
    const existing = this.senders.get(senderId);
    if (!existing) {
      throw new NotFoundException('Sender not found');
    }
    const merged = { ...existing, ...body };
    this.validateSenderFields(merged as CreateSenderRequest);
    const updated: StoredSender = {
      ...existing,
      ...body,
      updated_at: new Date().toISOString(),
    };
    this.senders.set(senderId, updated);
    this.logger.log(`Updated sender: ${senderId}`);
    return updated;
  }

  async deleteSender(senderId: string): Promise<void> {
    if (!this.senders.has(senderId)) {
      throw new NotFoundException('Sender not found');
    }
    this.senders.delete(senderId);
    this.logger.log(`Deleted sender: ${senderId}`);
  }

  private validateSenderFields(body: CreateSenderRequest): void {
    if (body.type === 'email' || body.type === 'both') {
      if (!body.email_address) {
        throw new BadRequestException('email_address is required when type is email or both');
      }
    }
    if (body.type === 'sms' || body.type === 'both') {
      if (!body.sms_sender) {
        throw new BadRequestException('sms_sender is required when type is sms or both');
      }
    }
  }

  // --- Templates CRUD (Extension: Management) ---

  async createTemplate(body: CreateTemplateRequest): Promise<Template> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const template: StoredTemplate = {
      id,
      name: body.name,
      description: body.description,
      type: body.type,
      subject: body.subject,
      body: body.body,
      personalisation: body.personalisation,
      active: body.active ?? true,
      created_at: now,
      updated_at: now,
      version: 1,
    };
    this.templates.set(id, template);
    this.logger.log(`Created template: ${id}`);
    return template;
  }

  async updateTemplate(templateId: string, body: UpdateTemplateRequest): Promise<Template> {
    const existing = this.templates.get(templateId);
    if (!existing) {
      throw new NotFoundException('Template not found in database');
    }
    const updated: StoredTemplate = {
      ...existing,
      ...body,
      updated_at: new Date().toISOString(),
      version: existing.version + 1,
    };
    this.templates.set(templateId, updated);
    this.logger.log(`Updated template: ${templateId}`);
    return updated;
  }

  async deleteTemplate(templateId: string): Promise<void> {
    if (!this.templates.has(templateId)) {
      throw new NotFoundException('Template not found in database');
    }
    this.templates.delete(templateId);
    this.logger.log(`Deleted template: ${templateId}`);
  }
}
