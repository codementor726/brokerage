import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { renderFile } from 'ejs';
import { generatePdf } from 'html-pdf-node-ts';
import { Model } from 'mongoose';
import { join } from 'path';
import { AppConfigsService } from 'src/app-configs/app-configs.service';
import { BusinessService } from 'src/business/business.service';
import { IBusiness } from 'src/business/interfaces/business.interface';
import { ChatsService } from 'src/chats/chats.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { IUser } from 'src/users/interfaces/user.interface';
import { EmailService } from 'src/utils/utils.email.service';
import { includes, saveFile } from 'src/utils/utils.helper';
import { S3Storage } from 'src/utils/utils.s3';
import { pagination } from 'src/utils/utils.types';
import { NotesDto } from './dto/create-lead.dto';
import { SendTemplateDto } from './dto/send-template.dto';
import { SignNdaDto } from './dto/sign-nda.dto';
import { ILead } from './interfaces/lead.interface';
@Injectable()
export class LeadsService {
  constructor(
    @InjectModel('Lead')
    private readonly Lead: Model<ILead>,
    @InjectModel('User')
    private readonly User: Model<IUser>,
    @InjectModel('Business')
    private readonly Business: Model<IBusiness>,
    @Inject(forwardRef(() => BusinessService))
    private readonly businessService: BusinessService,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationsService,
    private readonly chatsService: ChatsService,
    private readonly configService: ConfigService,
    private readonly s3Storage: S3Storage,
    private readonly appConfigService: AppConfigsService,
  ) {}

  // ---- Pdf generation ----
  async generateNdaPdf(sendTemplateDto: SendTemplateDto): Promise<Buffer> {
    // 1) Render HTML based on a pug template
    const { templateType } = sendTemplateDto;

    const type = templateType == 'liquor' ? 'nda.ejs' : 'standardNda.ejs';

    const _path: string = join(__dirname, '..', '..', 'views', `${type}`);

    const _pathImg = `${this.configService.get(
      'API_HOSTED_URL',
    )}imgs/Signature-pic.png`;

    const html = await renderFile(_path, {
      logo_img: _pathImg,
      ...sendTemplateDto,
    });

    const buf = await saveFile(html);

    return buf;
  }

  async generateSignNdaPdf(userSignNda: object): Promise<Buffer> {
    // 1) Render HTML based on a pug template
    const _path: string = join(
      __dirname,
      '..',
      '..',
      'views',
      `userSignNda.ejs`,
    );

    const _pathImg = `${this.configService.get(
      'API_HOSTED_URL',
    )}imgs/Signature-pic.png`;

    const html = await renderFile(_path, {
      logo_img: _pathImg,
      ...userSignNda,
    });

    const buf = await generatePdf(
      { content: html },
      {
        format: 'Legal',
        margin: { top: 20, bottom: 20, left: 15, right: 15 },
        displayHeaderFooter: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    );

    return buf;
  }
  // ---- Pdf generation ----

  async updateLeadBrokers(params: {
    businessId: string;
    oldBrokers: string[];
    excludedBrokers: string[];
    newBrokers: string[];
  }): Promise<void> {
    const { businessId, newBrokers, oldBrokers, excludedBrokers } = params;

    const filteredUsers = oldBrokers.filter(
      (el) => !excludedBrokers.includes(el),
    );

    const calculatedUsers = [...filteredUsers, ...newBrokers];

    await this.Lead.updateMany(
      { listingID: businessId },
      {
        broker: calculatedUsers,
        $addToSet: { leavedUsers: { $each: excludedBrokers as any[] } },
      },
    );
  }

  async sendTemplatePdfToBuyer(
    sendTemplateDto: SendTemplateDto,
  ): Promise<{ template: string }> {
    const lead = await this.Lead.findById(sendTemplateDto.leadId)
      .populate({
        path: 'listingID',
        select: 'title +companyName businessAddress +owner',
        populate: {
          path: 'owner',
          select: 'firstName lastName contact email designation',
        },
      })
      .populate('buyer', 'firstName lastName contact email')
      .lean();

    sendTemplateDto.listingTitle = lead.listingID.title;
    sendTemplateDto.seller_name =
      lead.buyer.firstName + ' ' + lead.buyer.lastName;

    if (!!lead.template) {
      await this.s3Storage.deleteImage(lead.template);
    }

    // pdf creation here
    const pdfBuffer = await this.generateNdaPdf(sendTemplateDto);

    // pdf saving here
    const pdfkey = await this.s3Storage.uploadWord(pdfBuffer);

    const updateLead = await this.Lead.findByIdAndUpdate(
      sendTemplateDto.leadId,
      { template: pdfkey },
      { new: true },
    );

    // pdf attachment link
    // const attachments = [
    //   {
    //     url: `${this.configService.get('API_HOSTED_URL')}api/v1/media/${
    //       updateLead.template
    //     }`,
    //   },
    // ];

    // const appConfig = await this.appConfigService.appConfigDetails(
    //   'ContactInfo',
    // );

    // pdf sending here
    // await this.emailService
    //   .pdfMail(
    //     {
    //       email: lead.buyer.email,
    //       firstName: lead.buyer.firstName,
    //     },
    //     {
    //       attachments,
    //       email: appConfig?.ContactInfo?.email,
    //       contact: appConfig?.ContactInfo?.contact,
    //       address: appConfig?.ContactInfo?.address,
    // url: appConfig?.ContactInfo?.url,
    //         name: appConfig?.ContactInfo?.name,
    //         designation: appConfig?.ContactInfo?.designation,
    //     },
    //   )
    //   .catch((e) => console.log(e));

    return { template: pdfkey };
  }

  async getLeads(
    query: pagination,
    status: string,
    search: string,
    user: IUser,
  ): Promise<{ lead: ILead[]; countDoc: number; results: number }> {
    let q: any = {};
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const userType = user.role.includes('broker') ? 'broker' : 'buyer';

    if (['undefined', 'null', null, undefined].includes(status)) status = 'all';

    if (status == 'all') {
      q = {
        ...q,
        status: {
          $in: [
            'inquired',
            'nda-submitted',
            'nda-signed',
            'nda-approved',
            'under-negotiation',
            'under-contract',
            'sold',
            'not-interested',
            'not-qualified',
            'closed',
          ],
        },
      };
    } else {
      q = { status: status };
    }

    if (userType == 'broker') q = { ...q, broker: user._id };
    else q = { ...q, buyer: user._id };

    // const data = await this.Lead.find(q)
    //   .populate('listingID', 'title askingPrice status')
    //   .populate('buyer', 'firstName lastName photo email')
    //   .populate('broker', 'firstName lastName photo email')
    //   .populate({
    //     path: 'room',
    //     populate: [
    //       {
    //         path: 'users.userId',
    //         select: 'firstName lastName photo email',
    //       },
    //       {
    //         path: 'lead',
    //         select: 'listingID buyer',
    //         populate: [
    //           {
    //             path: 'listingID',
    //             select: 'title',
    //           },
    //           {
    //             path: 'buyer',
    //             select: 'firstName lastName photo',
    //           },
    //         ],
    //       },
    //     ],
    //   })
    //   .sort('-createdAt -updatedAt')
    //   .skip(skip)
    //   .limit(limit)
    //   .lean();

    const aggregateQuery: any = [
      {
        $match: {
          ...q,
        },
      },
      {
        $lookup: {
          from: 'businesses',
          localField: 'listingID',
          foreignField: '_id',
          as: 'listingID',
          pipeline: [
            {
              $project: {
                title: 1,
                // askingPrice: 1,
                status: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$listingID',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'buyer',
          foreignField: '_id',
          as: 'buyer',
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
                photo: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$buyer',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'broker',
          foreignField: '_id',
          as: 'broker',
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
                photo: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'room',
          foreignField: '_id',
          as: 'room',
        },
      },
      {
        $unwind: {
          path: '$room',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'room.users.userId',
          foreignField: '_id',
          as: 'room.users',
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
                photo: 1,
                email: 1,
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'leads',
          localField: 'room.lead',
          foreignField: '_id',
          as: 'room.lead',
          pipeline: [
            {
              $project: {
                listingID: 1,
                buyer: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$room.lead',
        },
      },
      {
        $lookup: {
          from: 'businesses',
          localField: 'room.lead.listingID',
          foreignField: '_id',
          as: 'room.lead.listingID',
          pipeline: [
            {
              $project: {
                title: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$room.lead.listingID',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'room.lead.buyer',
          foreignField: '_id',
          as: 'room.lead.buyer',
          pipeline: [
            {
              $project: {
                firstName: 1,
                lastName: 1,
                photo: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$room.lead.buyer',
        },
      },
      {
        $match: {
          $or: [
            {
              'listingID.title': {
                $regex: search,
                $options: 'i',
              },
            },
            {
              'buyer.firstName': {
                $regex: search,
                $options: 'i',
              },
            },
            {
              'buyer.lastName': {
                $regex: search,
                $options: 'i',
              },
            },
          ],
        },
      },
      {
        $sort: { createdAt: -1, updatedAt: -1 },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ];

    const countDocQuery = [...aggregateQuery];

    countDocQuery.splice(countDocQuery.length - 2, 2);

    const [data, countDoc] = await Promise.all([
      this.Lead.aggregate(aggregateQuery),
      this.Lead.aggregate(countDocQuery),
    ]);

    return {
      lead: data as ILead[],
      countDoc: countDoc.length as number,
      results: data.length as number,
    };
  }

  // adding notes to lead
  async updateNotes(notesDto: NotesDto): Promise<ILead> {
    // 1. leave broker from the business
    const lead = await this.Lead.findByIdAndUpdate(
      notesDto.leadId,
      { notes: notesDto.notes },
      { new: true },
    )
      .populate('broker', 'firstName lastName photo')
      .populate('listingID', '+companyName')
      .populate('buyer', 'firstName lastName photo')
      .populate({
        path: 'room',
        populate: {
          path: 'users.userId',
          select: 'firstName lastName photo email',
        },
      })
      .lean();

    return lead as ILead;
  }

  // owner get its leads on the business he/she owned
  async getLeadsOnOwnedBusiness(
    query: pagination,
    user: IUser,
  ): Promise<{ lead: ILead[]; results: number }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const lead = await this.Lead.find({
      listingID: { $in: user.ownedBusiness },
    })
      .populate('broker', 'firstName lastName photo')
      .populate('buyer', 'firstName lastName photo')
      .populate('listingID', 'title')
      .sort('-createdAt -updatedAt')
      .skip(skip)
      .limit(limit)
      .lean();

    return { lead: lead as ILead[], results: lead.length as number };
  }

  // Lead is created after hitting sign nda button with status 'inquired'.
  async createLead(businessId: string, user: IUser): Promise<ILead> {
    const business = await this.Business.findById(businessId)
      .populate(
        'broker',
        'fcmToken socketIds pushNotifications inAppNotifications',
      )
      .select('+owner +title')
      .lean();

    if (!business) throw new NotFoundException('Business not found');

    if (String(business?.owner) == String(user._id))
      throw new BadRequestException(
        'This user is already the owner of the business and hence can not create lead on this business',
      );

    const leadExists = await this.Lead.findOne({
      buyer: user._id,
      listingID: businessId,
    }).lean();

    if (leadExists)
      throw new BadRequestException(
        'You have already generated a lead for this listing and so cannot generate any more.',
      );

    const brokerIds = business.broker.map((el) => el._id);

    const otherUsers = await this.User.find({
      role: {
        $in: [
          'financial-analyst',
          'buyer-concierge',
          'seller-concierge',
          'executive',
          'admin',
        ],
      },
    })
      .distinct('_id')
      .lean();

    const userIds = [...brokerIds, ...otherUsers, user._id];

    let [lead] = await Promise.all([
      this.Lead.create({
        broker: business.broker,
        buyer: user._id,
        listingID: businessId,
        contactName: user.firstName + ' ' + user.lastName,
        contactPhone: user.contact,
      }),
      this.User.findByIdAndUpdate(user._id, {
        $push: { leadInterested: business._id },
      }),
      this.Business.findByIdAndUpdate(business._id, {
        $push: { leadInterested: user._id },
      }),
    ]);

    const room = await this.chatsService.createRoom({
      leadId: lead._id,
      userIds,
      business: business._id,
      title: business.title as any,
      reference: 'lead-group',
    });

    lead = await this.Lead.findByIdAndUpdate(
      lead._id,
      { room: room._id },
      { new: true },
    )
      .populate('broker', 'firstName lastName photo')
      .populate('listingID', 'title')
      .populate('buyer', 'firstName lastName photo')
      .populate({
        path: 'room',
        populate: {
          path: 'users.userId',
          select: 'firstName lastName photo email',
        },
      })
      .lean();

    // nofitification here to all brokers of the business
    const _notification = business?.broker.map((ele) => {
      return this.notificationService.createNotification({
        senderMode: 'buyer',
        sender: user._id,
        receiver: ele?._id,
        title: `Business Brokerage Services`,
        message: `${user.firstName} has created a lead on business: ${business.title}.`,
        fcmToken: ele?.fcmToken,
        socket: ele?.socketIds,
        flag: 'lead',
        receiverUser: {
          pushNotifications: ele?.pushNotifications,
          inAppNotifications: ele?.inAppNotifications,
        },
      });
    });

    await Promise.all(_notification);

    return lead as ILead;
  }

  // Sign NDA api
  async signNda(user: IUser, signNdaDto: SignNdaDto): Promise<ILead> {
    const { refferedBusiness } = signNdaDto;

    // getting the current lead
    const _lead = await this.Lead.findOne({
      buyer: user._id,
      listingID: refferedBusiness,
    })
      .populate(
        'broker',
        'firstName email fcmToken socketIds pushNotifications inAppNotifications',
      )
      .populate('listingID', 'title autoNdaApprove slug refId')
      .lean();

    // throwing error if not found
    if (!_lead) throw new NotFoundException('Lead not found.');

    const URL = this.configService.get('API_HOSTED_URL');

    const nda = {
      firstName: signNdaDto?.firstName,
      lastName: signNdaDto?.lastName,
      contact: signNdaDto?.contact,
      email: signNdaDto?.email,
      streetAddress: signNdaDto?.streetAddress,
      city: signNdaDto?.city,
      state: signNdaDto?.state,
      zipCode: signNdaDto?.zipCode,
      licensedBroker: signNdaDto?.licensedBroker,
      brokerName: signNdaDto?.brokerName,
      brokerCompanyName: signNdaDto?.brokerCompanyName,
      preferredLocation: signNdaDto?.preferredLocation,
      capitalAvailable: signNdaDto?.capitalAvailable,
      currentOccupation: signNdaDto?.currentOccupation,
      businessInterested: signNdaDto?.businessInterested,
      timeAllocatedForBusiness: signNdaDto?.timeAllocatedForBusiness,
      minAnnualIncomeNeeds: signNdaDto?.minAnnualIncomeNeeds,
      URL,
    };

    const userSignNda = {
      user_name: user?.firstName + ' ' + user?.lastName,
      user_contact: user?.contact,
      user_email: user?.email,
      store_name: _lead?.listingID?.title,
      broker_contract: signNdaDto?.licensedBroker,
      broker_name: signNdaDto?.brokerName,
      brokers_company_name: signNdaDto?.brokerCompanyName,
      street_address: signNdaDto?.streetAddress,
      state: signNdaDto?.state,
      location_preference: signNdaDto?.preferredLocation,
      current_occupation: signNdaDto?.currentOccupation,
      allocation_time_towards_business: signNdaDto?.timeAllocatedForBusiness,
      city: signNdaDto?.city,
      zipcode: signNdaDto?.zipCode,
      capital_available_purchase: signNdaDto?.capitalAvailable,
      type_of_business: signNdaDto?.businessInterested,
      minimum_annual_income_needs: signNdaDto?.minAnnualIncomeNeeds,
      acknowleged_check: signNdaDto?.areYouAcknowledged,
      terms_condition_check: signNdaDto?.areYouSure,
      signing_date: signNdaDto.signing_date,
      ip: signNdaDto.ip,
      URL,
    };

    const pdfBuffer = await this.generateSignNdaPdf(userSignNda);
    // pdf saving here
    const pdfkey = await this.s3Storage.uploadPdf(pdfBuffer);

    if (!!userSignNda?.broker_contract) {
      const lead = await this.Lead.findByIdAndUpdate(
        _lead._id,
        { nda: signNdaDto, status: 'inquired', ndaTemplate: pdfkey },
        { new: true },
      )
        .populate('broker', 'firstName lastName photo')
        .populate('listingID', 'title')
        .populate('buyer', 'firstName lastName photo')
        .populate({
          path: 'room',
          populate: {
            path: 'users.userId',
            select: 'firstName lastName photo email',
          },
        });

      return lead as ILead;
    }

    if (!_lead.listingID.autoNdaApprove) {
      const [lead] = await Promise.all([
        this.Lead.findByIdAndUpdate(
          _lead._id,
          { nda: signNdaDto, status: 'nda-submitted', ndaTemplate: pdfkey },
          { new: true },
        )
          .populate('broker', 'firstName lastName photo')
          .populate('listingID', 'title')
          .populate('buyer', 'firstName lastName photo')
          .populate({
            path: 'room',
            populate: {
              path: 'users.userId',
              select: 'firstName lastName photo email',
            },
          }),

        this.User.findByIdAndUpdate(user._id, {
          nda,
          $push: { ndaSubmitted: _lead.listingID._id },
        }),

        this.Business.findByIdAndUpdate(_lead.listingID._id, {
          nda,
          $push: { ndaSubmitted: user._id },
        }),
      ]);

      // sending notification and email to respective brokers
      let _notification = [];
      let _email = [];

      const appConfig = await this.appConfigService.appConfigDetails(
        'ContactInfo',
      );

      _lead?.broker.forEach((ele) => {
        _notification.push(
          this.notificationService.createNotification({
            senderMode: 'buyer',
            sender: user._id,
            receiver: ele?._id,
            title: `Business Brokerage Services`,
            message: `${user.firstName} has signed NDA on business: ${_lead.listingID.title}.`,
            fcmToken: ele?.fcmToken,
            socket: ele?.socketIds,
            flag: 'lead',
            receiverUser: {
              pushNotifications: ele?.pushNotifications,
              inAppNotifications: ele?.inAppNotifications,
            },
          }),
        );
        _email.push(
          this.emailService.ndaSignMail(
            { email: ele?.email, name: ele?.firstName },
            {
              subject: `${user.firstName} signed NDA for ${_lead.listingID.title}`,
              username: user.firstName + ' ' + user.lastName,
              title: _lead?.listingID?.title,
              refId: _lead?.listingID?.refId,
              email: appConfig?.ContactInfo?.email,
              contact: appConfig?.ContactInfo?.contact,
              address: appConfig?.ContactInfo?.address,
              url: appConfig?.ContactInfo?.url,
              name: appConfig?.ContactInfo?.name,
              designation: appConfig?.ContactInfo?.designation,
            },
          ),
        );
      });

      await Promise.all([_notification, _email].flat());

      return lead as ILead;
    } else {
      const [appConfig] = await Promise.all([
        this.appConfigService.appConfigDetails('ContactInfo'),
        // pushing buyer id ndaSigned & pulling from ndaSubmitted
        this.User.findByIdAndUpdate(
          user._id,
          {
            nda,
            $push: { ndaSigned: String(_lead.listingID._id) },
            $pull: { ndaSubmitted: String(_lead.listingID._id) },
          },
          { new: true },
        ),
        // updating business ndaSigned array with new buyer
        this.Business.findByIdAndUpdate(
          _lead.listingID._id,
          {
            $push: { ndaSigned: String(user._id) },
            // $pull: { ndaSubmitted: String(_lead.buyer._id) },
          },
          { new: true },
        ),
      ]);

      const userType = 'broker';
      const _status = 'approved';

      // mail
      await this.emailService
        .sendNdaConfirmation(
          {
            email: user.email,
            firstName: user.firstName,
          },
          {
            subject: `Your NDA request against ${_lead?.listingID?.title} is approved!`,
            firstName: user.firstName,
            listingName: _lead.listingID.title,
            webUrl: `${this.configService.get(
              'WEB_HOSTED_URL',
            )}buy-a-business/${_lead.listingID._id}`,
            email: appConfig?.ContactInfo?.email,
            contact: appConfig?.ContactInfo?.contact,
            address: appConfig?.ContactInfo?.address,
            url: appConfig?.ContactInfo?.url,
            name: appConfig?.ContactInfo?.name,
            designation: appConfig?.ContactInfo?.designation,
          },
        )
        .catch((e) => console.log(e));

      const lead = await this.Lead.findByIdAndUpdate(
        _lead._id,
        { status: 'nda-signed', ndaTemplate: pdfkey, nda: signNdaDto },
        { new: true },
      )
        .populate('broker', 'firstName lastName photo')
        .populate('listingID', 'title')
        .populate('buyer', 'firstName lastName photo')
        .populate({
          path: 'room',
          populate: {
            path: 'users.userId',
            select: 'firstName lastName photo email',
          },
        });

      // notification here
      if (!!lead?.broker[0])
        await this.notificationService.createNotification({
          senderMode: userType,
          sender: user._id,
          receiver: lead?.broker[0]._id,
          title: `Business Brokerage Services`,
          message: `${userType} has ${_status} your NDA request on business: ${_lead.listingID.title}.`,
          fcmToken: user.fcmToken,
          socket: user.socketIds,
          flag: 'lead',
          receiverUser: {
            pushNotifications: user.pushNotifications,
            inAppNotifications: user.inAppNotifications,
          },
        });

      return lead as ILead;
    }
  }

  // admin/broker accept reject nda request
  // if the nda request is accepted then a mail will be sent to buyer with the link of business
  // user id will be pushed in signedNda[]
  async updateNdaContract(
    leadId: string,
    status: string,
    user: IUser,
  ): Promise<ILead> {
    // const url = `${this.configService.get('WEB_HOSTED_URL')}/nda/`;
    const userType = user.role.includes('broker') ? 'broker' : 'admin';
    const _status = status == 'nda-signed' ? 'approved' : 'rejected';

    const _lead = await this.Lead.findById(leadId)
      .populate(
        'buyer',
        'firstName email fcmToken socketIds pushNotifications inAppNotifications',
      )
      .populate('listingID', 'title slug projectFolder')
      .lean();

    if (!_lead) throw new NotFoundException('Requested Lead not found');

    if (
      user?.role?.includes('broker') &&
      !includes(_lead?.listingID._id, user?.involvedBusiness)
    )
      throw new BadRequestException(
        'This lead was not generated on your assigned business',
      );

    if (!['nda-signed', 'not-qualified'].includes(status))
      throw new BadRequestException(`Invalid Status: ${status}`);

    if (status == 'nda-signed') {
      const [appConfig] = await Promise.all([
        this.appConfigService.appConfigDetails('ContactInfo'),
        // pushing buyer id ndaSigned & pulling from ndaSubmitted
        this.User.findByIdAndUpdate(
          _lead.buyer._id,
          {
            $push: { ndaSigned: String(_lead.listingID._id) },
            $pull: { ndaSubmitted: String(_lead.listingID._id) },
          },
          { new: true },
        ),
        // updating business ndaSigned array with new buyer
        this.Business.findByIdAndUpdate(
          _lead.listingID._id,
          {
            $push: { ndaSigned: String(_lead.buyer._id) },
            // $pull: { ndaSubmitted: String(_lead.buyer._id) },
          },
          { new: true },
        ),
      ]);

      // mail
      await this.emailService
        .sendNdaConfirmation(
          {
            email: _lead.buyer.email,
            firstName: _lead.buyer.firstName,
          },
          {
            subject: `Your NDA request against ${_lead?.listingID?.title} is approved!`,
            firstName: _lead.buyer.firstName,
            listingName: _lead.listingID.title,
            webUrl: `${this.configService.get(
              'WEB_HOSTED_URL',
            )}buy-a-business/${_lead.listingID._id}`,
            email: appConfig?.ContactInfo?.email,
            contact: appConfig?.ContactInfo?.contact,
            address: appConfig?.ContactInfo?.address,
            url: appConfig?.ContactInfo?.url,
            name: appConfig?.ContactInfo?.name,
            designation: appConfig?.ContactInfo?.designation,
          },
        )
        .catch((e) => console.log(e));
    } else if (status == 'not-qualified') {
      await Promise.all([
        this.User.findByIdAndUpdate(
          _lead.buyer._id,
          { $pull: { ndaSubmitted: String(_lead.listingID._id) } },
          { new: true },
        ),
        this.Business.findByIdAndUpdate(
          _lead.listingID._id,
          { $pull: { ndaSubmitted: String(_lead.buyer._id) } },
          { new: true },
        ),
      ]);
    }

    const lead = await this.Lead.findByIdAndUpdate(
      leadId,
      { status },
      { new: true },
    )
      .populate('broker', 'firstName lastName photo')
      .populate('listingID', 'title')
      .populate('buyer', 'firstName lastName photo')
      .populate({
        path: 'room',
        populate: {
          path: 'users.userId',
          select: 'firstName lastName photo email',
        },
      });

    // notification here
    await this.notificationService.createNotification({
      senderMode: userType,
      sender: user._id,
      receiver: _lead?.buyer?._id,
      title: `Business Brokerage Services`,
      message: `${userType} has ${_status} your NDA request on business: ${_lead.listingID.title}.`,
      fcmToken: _lead?.buyer?.fcmToken,
      socket: _lead?.buyer?.socketIds,
      flag: 'lead',
      receiverUser: {
        pushNotifications: _lead?.buyer?.pushNotifications,
        inAppNotifications: _lead?.buyer?.inAppNotifications,
      },
    });

    return lead as ILead;
  }

  async updateLeadStatus(
    user: IUser,
    leadId: string,
    status?: string,
    leadProgress?: string,
    memorandum?: string,
  ): Promise<ILead> {
    let q = {};
    const userType = user.role.includes('broker') ? 'broker' : 'admin';

    const _lead = await this.Lead.findById(leadId)
      .populate(
        'buyer',
        'fcmToken socketIds pushNotifications inAppNotifications',
      )
      // .populate('listingID', 'title')
      .populate({
        path: 'listingID',
        select: 'title broker +owner',
        populate: {
          path: 'owner',
          select: 'firstName email',
        },
      })
      .lean();

    console.log(user._id);
    console.log(_lead.listingID._id);

    if (!_lead) throw new NotFoundException('Requested lead not found.');

    if (
      user?.role?.includes('broker') &&
      !includes(_lead?.listingID._id, user?.involvedBusiness)
    )
      throw new BadRequestException(
        'This lead was not generated on your assigned business',
      );

    if (
      ['nda-signed', 'nda-approved'].includes(_lead.status) &&
      status == 'under-negotiation'
    ) {
      q = { status };
    } else if (
      _lead.status == 'under-negotiation' &&
      status == 'under-contract'
    ) {
      q = { status };
      await this.businessService.updateBusinessNdaSigned({
        businessId: _lead.listingID._id as unknown as string,
        buyerId: _lead.buyer._id as unknown as string,
        user,
      });
      const appConfig = await this.appConfigService.appConfigDetails(
        'ContactInfo',
      );
      await this.emailService
        .businessUpdateStatus(
          {
            email: _lead?.listingID?.owner.email,
            firstName: _lead?.listingID?.owner.firstName,
          },
          {
            listingName: _lead?.listingID?.title,
            status: 'under-contract',
            email: appConfig?.ContactInfo?.email,
            contact: appConfig?.ContactInfo?.contact,
            address: appConfig?.ContactInfo?.address,
            url: appConfig?.ContactInfo?.url,
            name: appConfig?.ContactInfo?.name,
            designation: appConfig?.ContactInfo?.designation,
          },
        )
        .catch((e) => console.log(e));
    } else if (_lead.status == 'under-contract' && status == 'sold') {
      q = { status };
      // pull out business ids from all the users where the nda is signed
      const appConfig = await this.appConfigService.appConfigDetails(
        'ContactInfo',
      );

      await Promise.all([
        this.Business.findByIdAndUpdate(_lead.listingID._id, {
          status: 'sold',
        }),
        this.emailService.businessUpdateStatus(
          {
            email: _lead?.listingID?.owner.email,
            firstName: _lead?.listingID?.owner.firstName,
          },
          {
            listingName: _lead?.listingID?.title,
            status: 'sold',
            email: appConfig?.ContactInfo?.email,
            contact: appConfig?.ContactInfo?.contact,
            address: appConfig?.ContactInfo?.address,
            url: appConfig?.ContactInfo?.url,
            name: appConfig?.ContactInfo?.name,
            designation: appConfig?.ContactInfo?.designation,
          },
        ),
      ]);
    } else if (status == 'not-interested') {
      q = { status };
    }
    //  else {
    //   throw new BadRequestException(`Invalid status: ${status}`);
    // }
    const lead = await this.Lead.findByIdAndUpdate(
      leadId,
      { ...q, leadProgress, memorandum },
      { new: true },
    )
      .populate('broker', 'firstName lastName photo email')
      .populate('listingID', 'title')
      .populate('buyer', 'firstName lastName photo email')
      .populate({
        path: 'room',
        populate: {
          path: 'users.userId',
          select: 'firstName lastName photo email',
        },
      });

    await this.notificationService.createNotification({
      senderMode: userType,
      sender: user._id,
      receiver: _lead?.buyer?._id,
      title: `Business Brokerage Services`,
      message: `${userType} has changed the status to ${status} on business: ${_lead.listingID.title}.`,
      fcmToken: _lead?.buyer?.fcmToken,
      socket: _lead?.buyer?.socketIds,
      flag: 'lead',
      receiverUser: {
        pushNotifications: _lead?.buyer?.pushNotifications,
        inAppNotifications: _lead?.buyer?.inAppNotifications,
      },
    });

    return lead as ILead;
  }

  async adminGetLeadsBySlug(slug: string): Promise<ILead[]> {
    const lead = await this.Lead.find({ slug })
      .populate({
        path: 'listingID',
        select: 'title status companyName grossSales cashFlow city',
        populate: {
          path: 'owner',
          select: 'firstName lastName photo email',
        },
      })
      .populate('buyer', 'firstName lastName photo email contact')
      .populate('broker', 'firstName lastName photo email ')
      .populate({
        path: 'room',
        populate: {
          path: 'users.userId',
          select: 'firstName lastName photo email',
        },
      })
      .lean();

    return lead as ILead[];
  }

  async adminGetAllLeads(
    query: pagination,
    status: string,
    search: string,
    outsideLead: string,
  ): Promise<{ lead: ILead[]; results: number; countDoc: number }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    let q = {};

    if (outsideLead == 'true') q = { outsideLead: true };
    else if (outsideLead == 'false') q = { outsideLead: false };

    if (['undefined', 'null', null, undefined].includes(status)) status = 'all';

    if (status == 'all') {
      q = {
        ...q,
        status: {
          $in: [
            'inquired',
            'nda-submitted',
            'nda-signed',
            'nda-approved',
            'under-negotiation',
            'under-contract',
            'sold',
            'not-interested',
            'not-qualified',
            'closed',
          ],
        },
      };
    } else {
      q = { status };
    }

    if (outsideLead == 'true') {
      const [data, countDoc] = await Promise.all([
        this.Lead.find(q)
          .populate({
            path: 'listingID',
            populate: {
              path: 'broker',
              select: 'firstName lastName photo email',
            },
          })
          .lean(),
        this.Lead.countDocuments(q),
      ]);
      return {
        lead: data as ILead[],
        results: data.length as number,
        countDoc: countDoc as number,
      };
    }
    const aggregateQuery: any = [
      { $match: { ...q } },
      {
        $lookup: {
          from: 'businesses',
          localField: 'listingID',
          foreignField: '_id',
          as: 'listingID',
        },
      },
      { $unwind: { path: '$listingID' } },
      {
        $lookup: {
          from: 'users',
          localField: 'listingID.owner',
          foreignField: '_id',
          as: 'listingID.owner',
        },
      },
      { $unwind: { path: '$listingID.owner' } },
      {
        $lookup: {
          from: 'users',
          localField: 'buyer',
          foreignField: '_id',
          as: 'buyer',
        },
      },
      { $unwind: { path: '$buyer' } },
      {
        $lookup: {
          from: 'users',
          localField: 'broker',
          foreignField: '_id',
          as: 'broker',
        },
      },
      {
        $lookup: {
          from: 'rooms',
          localField: 'room',
          foreignField: '_id',
          as: 'room',
        },
      },
      { $unwind: { path: '$room' } },
      {
        $lookup: {
          from: 'users',
          localField: 'room.users.userId',
          foreignField: '_id',
          as: 'room.users',
          pipeline: [
            { $project: { firstName: 1, lastName: 1, photo: 1, email: 1 } },
          ],
        },
      },
      {
        $match: {
          $or: [
            {
              'listingID.title': {
                $regex: search,
                $options: 'i',
              },
            },
            {
              'buyer.firstName': {
                $regex: search,
                $options: 'i',
              },
            },
            {
              'buyer.lastName': {
                $regex: search,
                $options: 'i',
              },
            },
          ],
        },
      },
      { $sort: { createdAt: -1, updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ];

    const countDocQuery = [...aggregateQuery];

    countDocQuery.splice(countDocQuery.length - 2, 2);

    const [data, countDoc] = await Promise.all([
      this.Lead.aggregate(aggregateQuery),
      this.Lead.aggregate(countDocQuery),
    ]);

    return {
      lead: data as ILead[],
      results: data.length as number,
      countDoc: countDoc.length as number,
    };
  }

  async adminGetleadDetails(id: string): Promise<any> {
    const data = await this.Lead.findById(id)
      .populate('listingID')
      .populate('buyer', '+nda')
      .populate('broker')
      .populate({
        path: 'room',
        populate: {
          path: 'users.userId',
          select: 'firstName lastName photo email',
        },
      })
      .sort('-createdAt -updatedAt')
      .lean();

    const [ownedBusiness, interestedListing] = await Promise.all([
      this.Business.find({
        owner: data.buyer._id,
      })
        .populate('owner')
        .populate('category')
        .sort('-createdAt -updatedAt')
        .lean(),

      this.Lead.find({
        buyer: data.buyer._id,
        _id: { $nin: [id] },
      })
        .populate('broker', 'firstName lastName photo')
        .populate('buyer', 'firstName lastName photo')
        .populate('listingID')
        .sort('-createdAt -updatedAt')
        .lean(),
    ]);

    return {
      lead: data as ILead,
      ownedBusiness,
      interestedListing,
    };
  }

  async endLeads(payload: {
    business: string;
    buyerIds: string[];
  }): Promise<void> {
    const { business, buyerIds } = payload;

    const leadIds = await this.Lead.find({
      listingID: business,
      buyer: { $in: buyerIds },
    })
      .distinct('_id')
      .lean();

    if (!leadIds) throw new BadRequestException('Interests not found!');

    await this.Lead.updateMany({ _id: { $in: leadIds } }, { status: 'closed' });
  }
}
