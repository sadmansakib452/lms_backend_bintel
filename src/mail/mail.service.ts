import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import appConfig from '../config/app.config';

@Injectable()
export class MailService {
  constructor(
    @InjectQueue('mail-queue') private queue: Queue,
    private mailerService: MailerService,
  ) {}

  async sendMemberInvitation({ user, member, url }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;
      const subject = `${user.fname} is inviting you to ${appConfig().app.name}`;

      // add to queue
      await this.queue.add('sendMemberInvitation', {
        to: member.email,
        from: from,
        subject: subject,
        template: 'member-invitation',
        context: {
          user: user,
          member: member,
          url: url,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  // send otp code for email verification
  async sendOtpCodeToEmail({
    name,
    email,
    otp,
    purpose = 'verification',
  }: {
    name: string;
    email: string;
    otp: string;
    purpose?: 'verification' | 'password_reset' | 'email_change' | '2fa';
  }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;
      const subjectByPurpose = {
        verification: 'Verify Your Email - EduFlow Pro',
        password_reset: 'Reset Your Password - EduFlow Pro',
        email_change: 'Confirm Your New Email - EduFlow Pro',
        '2fa': 'Your 2FA Code - EduFlow Pro',
      } as const;
      const templateByPurpose = {
        verification: 'otp-email-verification',
        password_reset: 'otp-password-reset',
        email_change: 'otp-email-change',
        '2fa': 'otp-2fa',
      } as const;
      const selectedPurpose =
        purpose in subjectByPurpose ? purpose : 'verification';
      const subject = subjectByPurpose[selectedPurpose];
      const template = templateByPurpose[selectedPurpose];

      // add to queue
      await this.queue.add('sendOtpCodeToEmail', {
        to: email,
        from: from,
        subject: subject,
        template: template,
        context: {
          name: name,
          otp: otp,
          appName: process.env.APP_NAME || 'EduFlow Pro',
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async sendVerificationLink(params: {
    email: string;
    name: string;
    token: string;
    type: string;
  }) {
    try {
      const verificationLink = `${appConfig().app.client_app_url}/verify-email?token=${params.token}&email=${params.email}&type=${params.type}`;

      // add to queue
      await this.queue.add('sendVerificationLink', {
        to: params.email,
        subject: 'Verify Your Email - EduFlow Pro',
        template: 'verification-link',
        context: {
          name: params.name,
          verificationLink,
          appName: process.env.APP_NAME || 'EduFlow Pro',
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async sendBanNotification(params: { email: string; name: string; reason: string }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;
      await this.queue.add('sendBanNotification', {
        to: params.email,
        from: from,
        subject: 'Your Account Has Been Suspended - EduFlow Pro',
        template: 'account-suspended',
        context: {
          name: params.name,
          reason: params.reason,
          appName: process.env.APP_NAME || 'EduFlow Pro',
          supportEmail: appConfig().mail.from,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async sendUnbanNotification(params: { email: string; name: string; reason?: string }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;
      await this.queue.add('sendUnbanNotification', {
        to: params.email,
        from: from,
        subject: 'Your Account Has Been Restored - EduFlow Pro',
        template: 'account-restored',
        context: {
          name: params.name,
          reason: params.reason || 'Your account has been reinstated',
          appName: process.env.APP_NAME || 'EduFlow Pro',
          loginUrl: appConfig().app.client_app_url,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
}
