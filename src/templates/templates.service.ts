import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppConfigsService } from 'src/app-configs/app-configs.service';
import { IBusiness } from 'src/business/interfaces/business.interface';
import { IGroup } from 'src/groups/interfaces/group.interface';
import { ILead } from 'src/leads/interfaces/lead.interface';
import { IUser } from 'src/users/interfaces/user.interface';
import { EmailService } from 'src/utils/utils.email.service';
import { S3Storage } from 'src/utils/utils.s3';
import { pagination } from 'src/utils/utils.types';
import { ITemplate } from './interfaces/template.interface';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel('Template')
    private readonly Template: Model<ITemplate>,
    @InjectModel('User')
    private readonly User: Model<IUser>,
    @InjectModel('Business')
    private readonly Business: Model<IBusiness>,
    @InjectModel('Lead')
    private readonly Lead: Model<ILead>,
    @InjectModel('Group')
    private readonly Group: Model<IGroup>,
    private readonly s3Storage: S3Storage,
    private readonly emailService: EmailService,
    private readonly appConfigsService: AppConfigsService,
    private readonly configService: ConfigService,
  ) {}

  async sendMailToAllFilteredUsers(parmas: {
    user: IUser;
    templateId: string;
    userIds: string[];
    cc: string[];
  }): Promise<{ message: string }> {
    let { templateId, user, userIds } = parmas;

    const template = await this.Template.findById(templateId).lean();

    if (!template) throw new BadRequestException('Template not found');

    const attachments = template.attachment.map((ele) => ({
      url: `${this.configService.get('API_HOSTED_URL')}api/v1/media/${ele}`,
    }));

    const users = await this.User.find({ _id: { $in: userIds } })
      .select('email firstName lastName')
      .lean();

    const appConfig = await this.appConfigsService.appConfigDetails(
      'ContactInfo',
    );

    const promises = users?.map((ele) => {
      return this.emailService.promotionMail(
        { email: ele.email, firstName: ele.firstName },
        {
          cc: parmas?.cc,
          attachments,
          subject: template.subject,
          message: template.message,
          name:
            user?.firstName + ' ' + user?.lastName + ' | ' + user?.designation,
          userContact: user?.contact,
          deskContact: user?.deskContact,
          officeContact: user?.officeContact,
          cell: user?.cell,
          userEmail: user?.email,
          email: appConfig?.ContactInfo?.email,
          address: appConfig?.ContactInfo?.address,
          contact: appConfig?.ContactInfo?.contact,
          url: this.configService.get('WEB_HOSTED_URL'),
        },
      );
    });

    await Promise.all(promises).catch((err) => console.log(err));

    return { message: 'Email has been sent to all the selected Users' };
  }

  async sendTemplateMails(
    templateId: string,
    users: IUser[],
    user: IUser,
    cc: string[],
  ): Promise<void> {
    const template = await this.Template.findById(templateId).lean();

    const attachments = template.attachment.map((ele) => ({
      url: `${this.configService.get('API_HOSTED_URL')}api/v1/media/${ele}`,
      // url: `https://f50b-119-155-153-170.in.ngrok.io/api/v1/media/${ele}`,
    }));

    const appConfig = await this.appConfigsService.appConfigDetails(
      'ContactInfo',
    );

    const promises = users?.map((ele) => {
      return this.emailService.promotionMail(
        { email: ele.email, firstName: ele.firstName },
        {
          cc,
          attachments,
          subject: template.subject,
          message: template.message,
          name:
            user?.firstName + ' ' + user?.lastName + ' | ' + user?.designation,
          userContact: user?.contact,
          deskContact: user?.deskContact,
          officeContact: user?.officeContact,
          cell: user?.cell,
          userEmail: user?.email,
          address: appConfig?.ContactInfo?.address,
          url: this.configService.get('WEB_HOSTED_URL'),
          email: appConfig?.ContactInfo?.email,
          contact: appConfig?.ContactInfo?.contact,
        },
      );
    });

    await Promise.all(promises).catch((err) => console.log(err));
  }

  async getBusinessIds(params: {
    cities?: string[];
    categories?: string[];
  }): Promise<string[]> {
    const { cities, categories } = params;

    const query = !!cities
      ? { city: { $in: cities } }
      : { category: { $in: categories } };

    const businessIds = await this.Business.find(query).distinct('_id').lean();

    return businessIds as unknown as string[];
  }

  async getleadUsers(
    businessIds: string[],
    status?: string[],
  ): Promise<IUser[]> {
    const userIds = await this.Lead.find({
      listingID: { $in: businessIds },
      ...(!!status && { status: { $in: status } }),
    })
      .distinct('buyer')
      .lean();

    const users = await this.User.find({
      _id: { $in: userIds },
      isCampaignAllowed: true,
    })
      .select('firstName email')
      .lean();

    return users as IUser[];
  }

  async getAllActiveTemplates(query: pagination): Promise<ITemplate[]> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const data = await this.Template.find({ isActive: true })
      .skip(skip)
      .limit(limit)
      .lean();

    return data as ITemplate[];
  }

  async getSingleTemplate(templateId: string): Promise<ITemplate> {
    const data = await this.Template.findById(templateId).lean();

    return data as ITemplate;
  }

  //   =================== ADMIN ONLY ======================

  async createTemplate(
    subject: string,
    message: string,
    files: any,
  ): Promise<ITemplate> {
    let attachment = [];
    if (!subject || !message)
      throw new BadRequestException('Please provide all the required fields.');

    // if (!files?.attachment)
    //   throw new BadRequestException('Email Attachments are missing.');

    if (files?.attachment) {
      attachment = files?.attachment?.map((img) => img.key);
    }

    const data = await this.Template.create({ subject, message, attachment });
    return data as ITemplate;
  }

  async updateTemplate(
    id: string,
    subject: string,
    message: string,
    deletedAttachments: string[],
    isActive: boolean,
    files: any,
  ): Promise<ITemplate> {
    let attachment = [];
    const _data = await this.Template.findById(id).lean();
    if (!_data) throw new BadRequestException('Template not found');

    if (files?.attachment) {
      attachment = files?.attachment?.map((img) => img.key);
    }

    attachment = [...(!!attachment ? attachment : []), ..._data?.attachment];

    if (deletedAttachments?.length > 0) {
      const __imgs = attachment?.filter(
        (el) => !deletedAttachments.includes(String(el)),
      );

      attachment = __imgs;
      deletedAttachments.forEach((img) => {
        this.s3Storage.deleteImage(img);
      });
    }

    const data = await this.Template.findByIdAndUpdate(
      id,
      {
        subject,
        message,
        attachment,
        isActive,
      },
      { new: true },
    ).lean();

    return data as ITemplate;
  }

  async deleteTemplate(id: string): Promise<ITemplate> {
    const _data = await this.Template.findById(id).lean();
    if (!_data) throw new BadRequestException('Template not found');

    const data = await this.Template.findByIdAndDelete(id).lean();

    data?.attachment.forEach((ele) => {
      this.s3Storage.deleteImage(ele);
    });

    return data as ITemplate;
  }

  async getTemplateAdmin(query: pagination): Promise<ITemplate[]> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const data = await this.Template.find().skip(skip).limit(limit).lean();
    return data as ITemplate[];
  }

  async groupSendTemplateMailsToUser(params: {
    user: IUser;
    templateId: string;
    groupId: string;
    listingIds: string[];
    interestStatus: string[];
    categoryIds: string[];
    cities: string[];
    cc: string[];
  }): Promise<string> {
    const {
      categoryIds,
      cities,
      interestStatus,
      templateId,
      listingIds,
      user,
      groupId,
    } = params;

    let businessIds: any[] = [];

    const brokerQuery = user.role.includes('broker')
      ? { broker: user._id }
      : {};

    if (!!cities || !!categoryIds) {
      businessIds = await this.getBusinessIds({
        cities,
        categories: categoryIds,
        ...brokerQuery,
      });
    } else if (groupId) {
      const data = await this.Group.findById(groupId).populate('users').lean();
      if (!data) throw new NotFoundException('Group not found');
      await this.sendTemplateMails(
        templateId,
        data.users as IUser[],
        user,
        params?.cc,
      );
    } else {
      if (!listingIds)
        throw new BadRequestException(
          'Either listing, cities or categories and required',
        );

      const filteredListingIds = await this.Business.find({
        _id: { $in: listingIds },
        ...brokerQuery,
      })
        .distinct('_id')
        .lean();

      businessIds = filteredListingIds as unknown as string[];
    }

    const users = await this.getleadUsers(businessIds, interestStatus);

    await this.sendTemplateMails(templateId, users, user, params?.cc);

    return 'Emails sent!';
  }

  async sendTemplateMailsToUser(
    templateId: string,
    userIds: string[],
    cc: string[],
    user: IUser,
  ): Promise<any> {
    const template = await this.Template.findById(templateId).lean();

    const users = await this.User.find({
      _id: { $in: userIds },
      isCampaignAllowed: true,
    })
      .select('email firstName')
      .lean();

    const attachments = template.attachment.map((ele) => ({
      url: `${this.configService.get('API_HOSTED_URL')}api/v1/media/${ele}`,
    }));

    const appConfig = await this.appConfigsService.appConfigDetails(
      'ContactInfo',
    );

    const promises = users?.map((ele) => {
      return this.emailService.promotionMail(
        { email: ele.email, firstName: ele.firstName },
        {
          cc,
          attachments,
          subject: template.subject,
          message: template.message,
          name:
            user?.firstName + ' ' + user?.lastName + ' | ' + user?.designation,
          userContact: user?.contact,
          deskContact: user?.deskContact,
          officeContact: user?.officeContact,
          cell: user?.cell,
          userEmail: user?.email,
          address: appConfig?.ContactInfo?.address,
          url: this.configService.get('WEB_HOSTED_URL'),
          email: appConfig?.ContactInfo?.email,
          contact: appConfig?.ContactInfo?.contact,
        },
      );
    });

    await Promise.all(promises).catch((err) => {
      throw err;
    });
  }
}
