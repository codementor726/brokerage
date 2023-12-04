import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import { IBusiness } from 'src/business/interfaces/business.interface';
import { ILead } from 'src/leads/interfaces/lead.interface';
import { MailsService } from 'src/mails/mails.service';
import { extractLeadDetails, groupLeads } from 'src/utils/utils.helper';

@Injectable()
export class CronService {
  constructor(
    @InjectModel('Business')
    private readonly Business: Model<IBusiness>,
    @InjectModel('Lead')
    private readonly Lead: Model<ILead>,
    private readonly mailsService: MailsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runEveryMidnight() {
    // 1) Reading all the current day emails.
    const data = (await this.mailsService.readInboxMailForCron({
      user: 'developer@buybiznow.net',
      password: 'Node_developer_54321',
      host: 'mail.buybiznow.net',
      port: 993,
      authTimeout: 10000,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    })) as { text: string; uid: number; from: string; subject: string }[];

    // 2) Extract the leads.
    const extractedLeads = data?.map((el) => {
      return extractLeadDetails(el?.text);
    });

    // 3) combining the leads together.
    const combinedLeads = groupLeads(extractedLeads, 'refID');

    // console.log(combinedLeads[0][1], '<======lead=====>');
    let isError = false;

    // 4) make DB call and push the leads [] to the leads DB Collection against the refID.
    combinedLeads.forEach(async (lead) => {
      const _business = await this.Business.findOne({ refId: lead[0] })
        .select('broker')
        .lean();

      const customArr = [];

      (lead[1] as any[]).forEach((el) => {
        el.broker = _business?.broker;
        el.listingID = _business?._id;
        el.outsideLead = true;

        if (!!el?.broker && !!el?._id) customArr.push(el);
      });

      // await this.Lead.insertMany(customArr);
    });

    // console.log('<====================ENDED=======================>');
  }
}
