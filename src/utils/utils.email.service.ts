import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { renderFile } from 'ejs';
import { htmlToText } from 'html-to-text';
import { join } from 'path';
import { IUser } from 'src/users/interfaces/user.interface';

interface EmailUser {
  email: string;
  firstName?: string;
  name?: string;
  userName?: string;
}

@Injectable()
export class EmailService {
  private from: string;
  private baseUrl: string;
  private webUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.from = `Business Brokerage Services <${this.configService.get(
      'EMAIL_FROM',
    )}>`;
    this.baseUrl = this.configService.get('API_HOSTED_URL');
    this.webUrl = this.configService.get('WEB_HOSTED_URL');
  }

  newTransport() {
    // Sendgrid
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: this.configService.get('SENDGRID_USERNAME'),
        pass: this.configService.get('SENDGRID_PASSWORD'),
      },
    });
  }

  outlookTransport(sender: IUser) {
    // Outlook
    return nodemailer.createTransport({
      // service: 'bluehost',
      name: 'mail.buybiznow.net',
      host: 'mail.buybiznow.net',
      port: 465,
      secure: true,
      auth: {
        user: sender?.imap?.user,
        pass: sender?.imap?.password,
      },
    });
  }

  // Send the actual email
  async send(
    user: EmailUser,
    template: string,
    subject?: string,
    url?: string,
    payload?,
  ) {
    let attachments = [];
    const { email, name, firstName } = user;
    // this.firstName = user.name.split(' ')[0];

    // 1) Render HTML based on a pug template
    const _path: string = join(
      __dirname,
      '..',
      '..',
      'views',
      'email',
      `${template}.ejs`,
    );

    const html = await renderFile(_path, {
      firstName: name || firstName,
      url: url,
      to: email,
      subject,
      payload,
      baseUrl: this.baseUrl,
      webUrl: this.webUrl,
    });

    if (!!payload?.attachments) {
      attachments = payload.attachments.map((file) => {
        return { path: file.url };
      });
    }

    console.log('payload?.attachments', attachments);

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      cc: payload?.cc,
      to: email,
      subject,
      html: html,
      text: htmlToText(html),
      attachments: attachments,
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
    console.log('in1');
  }

  // Send the outlook mail
  async outlookSend(
    sender: IUser,
    email: string,
    template: string,
    subject?: string,
    url?: string,
    payload?,
  ) {
    let attachments = [];

    // 1) Render HTML based on a pug template
    const _path: string = join(
      __dirname,
      '..',
      '..',
      'views',
      'email',
      `${template}.ejs`,
    );

    const html = await renderFile(_path, {
      // firstName: firstName,
      url: url,
      to: email,
      subject,
      payload,
      baseUrl: this.baseUrl,
      webUrl: this.webUrl,
    });

    if (!!payload?.attachments) {
      attachments = payload.attachments.map((file) => {
        return { path: file.url };
      });
    }

    // 2) Define email options
    const mailOptions = {
      from: sender.imap.user,
      cc: payload?.cc,
      to: email,
      subject,
      html: html,
      text: htmlToText(html),
      attachments: attachments,
    };

    // 3) Create a transport and send email
    await this.outlookTransport(sender).sendMail(mailOptions);
    console.log('outlook send!');
  }

  async sendOutlookMail(sender: IUser, email, payload) {
    await this.outlookSend(
      sender,
      email,
      'outlookTemplate',
      payload.subject,
      '',
      payload,
    );
  }

  async sendUserPassword(user: EmailUser, payload) {
    await this.send(
      user,
      'sendUserCredentials',
      'You have been signed up',
      '',
      payload,
    );
  }

  async sendNdaConfirmation(user: EmailUser, payload) {
    await this.send(user, 'sendNdaConfirmation', payload.subject, '', payload);
  }

  async sendPasswordReset(user: EmailUser, payload) {
    await this.send(
      user,
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)',
      '',
      payload,
    );
  }

  // async pdfMail(user: EmailUser, payload) {
  //   await this.send(user, 'pdfTemplate', payload.subject, '', payload);
  // }

  async businessUpdateStatus(user: EmailUser, payload) {
    await this.send(
      user,
      'businessUpdate',
      'Your listing status has been updated',
      '',
      payload,
    );
  }

  // async outsideLeads(user: EmailUser, payload) {
  //   await this.send(
  //     user,
  //     'outsideLeadsTemplate',
  //     'You have a new lead from outside',
  //     '',
  //     payload,
  //   );
  // }

  async ndaSignMail(user: EmailUser, payload) {
    await this.send(user, 'ndaSign', payload.subject, '', payload);
  }

  promotionMail(user: EmailUser, payload) {
    return this.send(user, 'promotionTemplate', payload.subject, '', payload);
  }
}
