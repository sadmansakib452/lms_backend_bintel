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
    purpose?: 'verification' | 'password_reset' | 'email_change';
  }) {
    try {
      const from = `${process.env.APP_NAME} <${appConfig().mail.from}>`;
      const subjectByPurpose = {
        verification: 'Verify Your Email - EduFlow Pro',
        password_reset: 'Reset Your Password - EduFlow Pro',
        email_change: 'Confirm Your New Email - EduFlow Pro',
      } as const;
      const templateByPurpose = {
        verification: 'otp-email-verification',
        password_reset: 'otp-password-reset',
        email_change: 'otp-email-change',
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
}
