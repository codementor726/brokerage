import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as IImap from 'imap';
import * as imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { AppConfigsService } from 'src/app-configs/app-configs.service';
import { Imap, IUser } from 'src/users/interfaces/user.interface';
import { EmailService } from 'src/utils/utils.email.service';
import { addBoxFlags } from 'src/utils/utils.helper';

@Injectable()
export class MailsService {
  constructor(
    @InjectModel('User') private readonly User: Model<IUser>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly appConfigsService: AppConfigsService,
  ) {}

  async testCredentials(param: {
    user: string;
    password: string;
  }): Promise<[Error, any]> {
    try {
      const data = await this.readInboxMailForCron({
        ...param,
        host: 'mail.buybiznow.net',
        port: 993,
        authTimeout: 10000,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      });
      return [null, data];
    } catch (err) {
      return [new BadRequestException(err.response.message), false];
    }
  }

  async getImapConfig(payload: {
    userId?: string;
    user?: IUser;
  }): Promise<Imap> {
    try {
      const { user, userId } = payload;

      if (!user && !userId)
        throw new BadRequestException('Credentials not found.');

      if (!!user)
        return {
          user: user?.imap?.user,
          password: user?.imap?.password,
          host: user?.imap?.host,
          port: user?.imap?.port,
          authTimeout: user?.imap?.authTimeout,
          tls: user?.imap?.tls,
          tlsOptions: user?.imap?.tlsOptions,
        };

      const { imap } = await this.User.findById(userId).select('imap');
      return {
        user: imap?.user,
        password: imap.password,
        host: imap.host,
        port: imap.port,
        authTimeout: imap.authTimeout,
        tls: imap.tls,
        tlsOptions: imap.tlsOptions,
      };
    } catch (error) {
      throw error;
    }
  }
  /*
      'ALL' - All messages.
      'ANSWERED' - Messages with the Answered flag set.
      'DELETED' - Messages with the Deleted flag set.
      'DRAFT' - Messages with the Draft flag set.
      'FLAGGED' - Messages with the Flagged flag set.
      'NEW' - Messages that have the Recent flag set but not the Seen flag.
      'SEEN' - Messages that have the Seen flag set.
      'RECENT' - Messages that have the Recent flag set.
      'OLD' - Messages that do not have the Recent flag set. This is functionally equivalent to "!RECENT" (as opposed to "!NEW").
      'UNANSWERED' - Messages that do not have the Answered flag set.
      'UNDELETED' - Messages that do not have the Deleted flag set.
      'UNDRAFT' - Messages that do not have the Draft flag set.
      'UNFLAGGED' - Messages that do not have the Flagged flag set.
      'UNSEEN' - Messages that do not have the Seen flag set.
    */

  async getAllMails(
    imapConfig,
    from: string,
    to: string,
    search = 'ALL',
    mood = 'INBOX',
    options = undefined,
  ) {
    try {
      const imap = new IImap(imapConfig);
      let criteria: any = [search];
      const _from = moment(from);
      const _to = moment(to);
      const uids = [];

      if (!!from && !!to && _from > _to) {
        criteria.push(['SINCE', _from.format('MMM DD, YYYY')]);
        // criteria.push(['BEFORE', _to.format('MMM DD, YYYY')]);
      } else if (!!from && !!to && _from < _to) {
        criteria.push(['SINCE', _from.format('MMM DD, YYYY')]);
        criteria.push(['BEFORE', _to.format('MMM DD, YYYY')]);
      } else {
        criteria.push(['SINCE', _from.format('MMM DD, YYYY')]);
      }

      if (!!options) {
        criteria = [search];

        criteria.push(['SINCE', _from.format('MMM DD, YYYY')]);
      }

      console.log(criteria);

      await new Promise((resolve, reject) => {
        imap.once('ready', resolve);
        imap.once('error', reject);
        imap.connect();
      }).catch((err) => {
        throw err;
      });

      const mails = await new Promise((resolve, reject) => {
        imap.openBox(mood, true, (err, box) => {
          imap.search(criteria, (err, results) => {
            if (results.length <= 0) return resolve([]);

            if (err) {
              reject(err);
            }
            const mails: any = [];

            const f = imap.fetch(results, { bodies: '' });

            f.on('message', (msg, seqno) => {
              const mail: any = {};
              msg.on('body', (stream, info) => {
                simpleParser(stream, (err, parsed) => {
                  if (err) reject(err);
                  mail.textAsHtml = parsed.textAsHtml;
                  mail.subject = parsed.subject;
                  mail.cc = (parsed?.cc as any)?.value;
                  mail.bcc = (parsed?.bcc as any)?.value;
                  mail.text = parsed.text;
                  mail.html = parsed.html;
                  mail.from = parsed.from.text;
                  mail.date = parsed.date;

                  mails.push(mail);
                });
              });

              msg.once('attributes', (attrs) => {
                const { uid, flags } = attrs;
                uids.push({ uid, flags });
              });
            });

            f.once('error', (err) => {
              reject(err);
            });

            f.once('end', () => {
              mails.forEach((el, i) => {
                el.uid = uids[i]['uid'];
                el.flags = uids[i]['flags'];
              });

              resolve(mails);
            });
          });
        });
      }).catch((err) => {
        throw err;
      });
      imap.end();

      // write a functon to delay for 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 4.5 * 1000));

      return mails;
    } catch (err) {
      console.error(err);
    }
  }

  async readInboxMail(
    READ_MAIL_CONFIG: any,
    from: string,
    to: string,
    search = 'ALL',
    mood = 'INBOX',
  ) {
    if (
      ![
        'INBOX',
        'INBOX.Drafts',
        'INBOX.Trash',
        'INBOX.Sent',
        'INBOX.spam',
        'INBOX.Archive',
      ].includes(mood)
    )
      throw new Error('Invalid mode option');

    try {
      const mails = (await this.getAllMails(
        READ_MAIL_CONFIG,
        from,
        to,
        search,
        mood,
      )) as any[];

      const data = mails || [];

      return data;
    } catch (error) {
      return [];
    }
  }

  async addToMailBox(READ_MAIL_CONFIG: any, uids: number[], box: string) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!['broker', 'admin', 'lisitng'].includes(box))
          throw new Error('Invalid box option!');

        const imap = new IImap(READ_MAIL_CONFIG);
        const rs = [];
        const _uids = [];

        imap.once('ready', execute);

        function execute() {
          imap.openBox('INBOX', false, () => {
            imap.search(['ALL'], (err, results) => {
              if (err) {
                console.error(err);
                return;
              }

              if (results.length <= 0) return resolve([]);

              const f = imap.fetch(results, { bodies: '' });
              f.on('message', processMessage);

              f.once('error', (ex) => {
                return Promise.reject(ex);
              });

              f.once('end', () => {
                imap.end();
              });
            });
          });
        }

        function processMessage(msg) {
          msg.on('body', (stream) => {
            simpleParser(stream, async (err, parsed) => {
              // // const { from, subject, textAsHtml, text, attachments } = parsed;
              rs.push({
                // attachments: parsed.attachments,
                textAsHtml: parsed.textAsHtml,
                text: parsed.text,
                html: parsed.html,
                from: parsed?.from?.text,
                date: parsed.date,
                cc: (parsed?.cc as any)?.value,
                bcc: (parsed?.bcc as any)?.value,
                subject: parsed.subject,
              });
              /*
              Make API call to save the data
              Save the retrieved data into a database.
              E.t.c
            */
            });
          });
          msg.once('attributes', (attrs) => {
            const { uid, flags } = attrs;

            _uids.push({ uid, flags });
            {
              if (uids.includes(uid)) {
                imap.delFlags(
                  uid,
                  ['\\Answered', '\\Flagged', '\\Deleted', '\\Seen', '\\Draft'],
                  () => {
                    // Mark the email as read after reading it
                  },
                );
                imap.addFlags(uid, addBoxFlags(box), () => {
                  // Mark the email as read after reading it
                });
              }
            }
          });
          msg.once('end', function () {});
        }

        imap.once('error', (err) => {
          console.log(err);
        });

        imap.once('end', () => {
          rs.forEach((el, i) => {
            el.uid = _uids[i]['uid'];
            el.flags = _uids[i]['flags'];
          });

          resolve(rs);
        });

        imap.connect();
      } catch (error) {
        reject(error);
      }
    });
  }

  async readInboxMailForCron(READ_MAIL_CONFIG: any) {
    const search = 'ALL';
    const mood = 'INBOX';

    const date = moment().subtract(1, 'day').format();

    return await this.getAllMails(
      READ_MAIL_CONFIG,
      date,
      date,
      search,
      mood,
      'yes',
    );
  }

  async sendMail(
    user: IUser,
    email: string,
    subject: string,
    message: string,
    cc: string[],
    files: any,
  ): Promise<any> {
    let attachment = [];
    let attachments = [];

    if (!user?.imap?.user && !user?.imap?.password)
      throw new BadRequestException(
        'User has not configured the email and password',
      );

    if (files?.attachment) {
      attachment = files?.attachment?.map((img) => img.key);

      attachments = attachment?.map((ele) => ({
        url: `${this.configService.get('API_HOSTED_URL')}api/v1/media/${ele}`,
        // url: `https://085d-119-155-153-170.eu.ngrok.io/api/v1/media/${ele}`,
      }));
    }

    const appConfig = await this.appConfigsService.appConfigDetails(
      'ContactInfo',
    );

    await this.emailService.sendOutlookMail(user, email, {
      cc,
      attachments,
      subject: subject,
      message: message,
      name: user?.firstName + ' ' + user?.lastName + ' | ' + user?.designation,
      contact: user?.contact,
      deskContact: user?.deskContact,
      officeContact: user?.officeContact,
      cell: user?.cell,
      email: user?.email,
      address: appConfig?.ContactInfo?.address,
      url: this.configService.get('WEB_HOSTED_URL'),
    });
  }

  async deleteMail(READ_MAIL_CONFIG: any, uids: number[] | number) {
    try {
      /*
      const a = {
        imap: {
          user: 'development.aftab@outlook.com',
          password: 'Aftab_321',
          host: 'imap.outlook.com',
          port: 993,
          tls: true,
          authTimeout: 3000,
        },
      };
*/
      const connection = await imaps.connect({ imap: READ_MAIL_CONFIG });
      const box = await connection.openBox('JUNK');
      await connection.deleteMessage(uids);
      connection.end();

      const connection1 = await imaps.connect({ imap: READ_MAIL_CONFIG });
      const box1 = await connection1.openBox('INBOX');
      await connection1.deleteMessage(uids);
      connection1.end();
    } catch (error) {}
  }
}
