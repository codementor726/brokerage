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
import { Model } from 'mongoose';
import { join } from 'path';
import slugify from 'slugify';
import { AppConfigsService } from 'src/app-configs/app-configs.service';
import { ChatsService } from 'src/chats/chats.service';
import { DataRoomService } from 'src/data-room/data-room.service';
import { ILead } from 'src/leads/interfaces/lead.interface';
import { LeadsService } from 'src/leads/leads.service';
import { IUser } from 'src/users/interfaces/user.interface';
import { EmailService } from 'src/utils/utils.email.service';
import { categorizeByrole, includes, saveFile } from 'src/utils/utils.helper';
import { S3Storage } from 'src/utils/utils.s3';
import { pagination } from 'src/utils/utils.types';
import { v4 } from 'uuid';
import { CreateBusinessDto } from './dto/create-business.dto';
import { CreateDraftBusinessDto } from './dto/create-draft.dto';
import { OwnerTemplateDto } from './dto/owner-template.dto';
import { NotesDto, UpdateBusinessDto } from './dto/update-business.dto';
import { UpdateDraftBusinessDto } from './dto/update-draft.dto';
import { IBusiness } from './interfaces/business.interface';
import { IDraftBusiness } from './interfaces/draftbusiness.interface';

@Injectable()
export class BusinessService {
  constructor(
    @InjectModel('Business')
    private readonly Business: Model<IBusiness>,
    @InjectModel('DraftBusiness')
    private readonly DraftBusiness: Model<IDraftBusiness>,
    @InjectModel('User')
    private readonly User: Model<IUser>,
    @InjectModel('Lead')
    private readonly Lead: Model<ILead>,
    @Inject(forwardRef(() => LeadsService))
    private readonly leadsServices: LeadsService,
    private readonly chatsService: ChatsService,
    private readonly s3Storage: S3Storage,
    private readonly dataRoomService: DataRoomService,
    private readonly emailService: EmailService,
    private readonly appConfigService: AppConfigsService,
    private readonly configService: ConfigService,
  ) {}

  deleteImgs(draft: IDraftBusiness): void {
    if (draft?.images.length > 0)
      draft?.images?.forEach((ele) => this.s3Storage.deleteImage(ele));

    if (draft?.demographics.length > 0)
      draft?.demographics?.forEach((ele) => this.s3Storage.deleteImage(ele));

    if (draft?.financialsAnalysis.length > 0)
      draft?.financialsAnalysis?.forEach((ele) =>
        this.s3Storage.deleteImage(ele),
      );

    if (draft?.financialsCSVImages.length > 0)
      draft?.financialsCSVImages?.forEach((ele) =>
        this.s3Storage.deleteImage(ele),
      );

    if (!!draft?.dummyImage) this.s3Storage.deleteImage(draft?.dummyImage);

    return;
  }

  deleteImagesFn(
    updateBusinessDto: UpdateBusinessDto,
    deletedImagesProp: string,
    imageProp: string,
  ): UpdateBusinessDto {
    /* 
     if (updateBusinessDto?.deletedImages?.length > 0) {
        updateBusinessDto.images = updateBusinessDto.images.filter(
          (el) => !updateBusinessDto.deletedImages.includes(String(el)),
        );

        updateBusinessDto.deletedImages.forEach((img) => {
          this.s3Storage.deleteImage(img);
        });
      }
    }
*/

    if (updateBusinessDto[deletedImagesProp]?.length > 0) {
      const __imgs = updateBusinessDto[imageProp]?.filter(
        (el) => !updateBusinessDto[deletedImagesProp].includes(String(el)),
      );

      updateBusinessDto[imageProp] = __imgs;
      updateBusinessDto[deletedImagesProp].forEach((img) => {
        this.s3Storage.deleteImage(img);
      });
    }

    return updateBusinessDto;
  }

  async generateOwnerPdf(ownerTemplate: OwnerTemplateDto): Promise<Buffer> {
    // 1) Render HTML based on a pug template

    const _path: string = join(
      __dirname,
      '..',
      '..',
      'views',
      `ownerListingContract.ejs`,
    );

    const _pathImg = `${this.configService.get(
      'API_HOSTED_URL',
    )}imgs/Signature-pic.png`;

    const html = await renderFile(_path, {
      logo_img: _pathImg,
      ...ownerTemplate,
    });

    const buf = await saveFile(html);

    return buf;
  }

  async updateBusinessNdaSigned(payload: {
    businessId: string;
    buyerId?: string;
    user: IUser;
  }): Promise<void> {
    const { businessId, buyerId } = payload;
    let query: any = { status: 'under-contract' };

    if (!!buyerId)
      query = { ...query, ndaSigned: buyerId, futureOwner: buyerId };
    else query = { ...query, ndaSigned: [] };

    const buyerAssignedToDataRoomIds = (
      await this.Business.findById(businessId)
        .distinct('buyerAssignedToDataRoom')
        .lean()
    ).map((id) => String(id));

    const leadBuyerIds = await this.Lead.find({
      buyer: { $ne: buyerId },
      listingID: businessId,
    })
      .distinct('buyer')
      .lean();

    const filteredIds = leadBuyerIds.filter((el) =>
      buyerAssignedToDataRoomIds.includes(String(el)),
    );

    if (filteredIds.length > 0) {
      const promises = leadBuyerIds?.map((ele) => {
        return this.unAssignBuyersToDataRoom(
          businessId,
          ele as unknown as string,
          payload.user,
        );
      });

      await Promise.all(promises);
    }

    await this.Business.findByIdAndUpdate(businessId, query, {
      new: true,
    }).lean();

    await this.User.updateMany(
      { _id: { $ne: buyerId }, ndaSigned: businessId },
      { $pull: { ndaSigned: businessId } },
    );

    await this.Lead.updateMany(
      { buyer: { $ne: buyerId }, listingID: businessId },
      { status: 'closed' },
    );
  }

  async getAllBusinessForPublic(
    query: pagination,
    city?: string,
    price?: number,
    category?: string,
    brokerId?: string,
  ): Promise<{ results: number; business: IBusiness[] }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    let q = {};

    // QUERIES STARTS
    if (city) q = { ...q, city };

    if (price) q = { ...q, businessOpportunity: { $lte: price } };

    if (category) q = { ...q, category };

    if (brokerId) q = { broker: brokerId };

    const [totalDoc, business] = await Promise.all([
      this.Business.countDocuments(),
      this.Business.find({
        status: { $nin: ['pre-listing', 'off-market'] },
        ...q,
      })
        .select(
          'title isFeatured order businessOpportunity status slug dummyImage inventory country cashFlow grossSales category industry city state dummyDescription buildingSF forSale realEstate monthlyRent employees ownerInvolvment reason businessHighlights hoursOfOperation recentImprovements',
        )
        .populate(
          'broker',
          'firstName lastName photo email officeContact deskContact cell designation description meetingLink contact',
        )
        .populate('category', 'name')
        .sort('-isFeatured order -createdAt -updatedAt')
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return { results: totalDoc, business: business as IBusiness[] };
  }

  async getAllAssignedBusinessForBroker(
    query: pagination,
    user: IUser,
    search: string,
  ): Promise<{ results: number; totalCount: number; business: IBusiness[] }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;
    const dbQuery: any = {
      broker: { $in: [user._id] },
      ...(search && {
        title: { $regex: search, $options: 'i' },
      }),
    };

    const [business, count] = await Promise.all([
      this.Business.find(dbQuery)
        .select('+owner +companyName')
        .populate(
          'broker',
          'firstName lastName photo email contact officeContact deskContact cell designation description',
        )
        .populate({
          path: 'room',
          populate: {
            path: 'users.userId',
            select: 'firstName lastName photo email',
          },
        })
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      this.Business.countDocuments(dbQuery),
    ]);

    return {
      results: business.length as number,
      totalCount: count as number,
      business: business as IBusiness[],
    };
  }

  async getAllBusinessWithFilteration(
    query: pagination,
    user: IUser,
    city?: string,
    price?: number,
    category?: string,
    brokerId?: string,
  ): Promise<{ results: number; business: IBusiness[] }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const dummyBusinessPropIds = [];
    const actualBusinessPropIds = [];

    let q = {};

    // QUERIES STARTS
    if (city) {
      q = { ...q, city };
    }

    if (price) {
      q = {
        ...q,
        businessOpportunity: { $lte: price },
      };
    }

    if (category) {
      q = { ...q, category };
    }

    if (brokerId) {
      q = {
        broker: brokerId,
      };
    }
    // QUERIES ENDS

    const businessIds = (
      await this.Business.find({
        status: { $nin: ['pre-listing', 'off-market'] },
        ...q,
      })
        .sort('-createdAt -updatedAt')
        .select('_id')
        .skip(skip)
        .limit(limit)
        .lean()
    ).map((el) => el._id);

    businessIds.forEach((id) => {
      if (includes(id, user?.vipList) || includes(id, user?.ndaSigned)) {
        actualBusinessPropIds.push(id);
      } else {
        dummyBusinessPropIds.push(id);
      }
    });

    const [allFieldsBusiness, dummyFieldsBusiness] = await Promise.all([
      this.Business.find({
        _id: { $in: actualBusinessPropIds },
      })
        .populate(
          'broker',
          'firstName lastName photo email officeContact deskContact cell designation description',
        )
        .populate('category', 'name')
        .sort('-createdAt -updatedAt')
        .lean(),

      this.Business.find({
        _id: { $in: dummyBusinessPropIds },
      })
        .select(
          'title status businessOpportunity industry cashFlow inventory grossSales fullTimeEmployees partTimeEmployees ownerInvolvment reason dummyDescription businessHighlights hoursOfOperation hoursOfOperationOpportunity recentImprovements monthlyRent buildingSf category dummyImage',
        )
        .populate(
          'broker',
          'firstName lastName  photo email officeContact deskContact cell designation description',
        )
        .populate('category', 'name')
        .lean(),
    ]);

    const totalDoc = await this.Business.countDocuments();

    const business = [...dummyFieldsBusiness, ...allFieldsBusiness];

    return { results: totalDoc, business: business as IBusiness[] };
  }

  async getSingleBusiness(businessId: string, user: IUser): Promise<IBusiness> {
    let business = {};

    if (
      includes(businessId, user?.vipList) ||
      includes(businessId, user?.ndaSigned)
    ) {
      business = await this.Business.findById(businessId)
        .populate('category', 'name')
        .populate(
          'broker',
          'firstName lastName  photo email officeContact deskContact cell designation description leadInterested ndaSubmitted ndaSigned',
        )
        .lean();
    } else {
      business = await this.Business.findById(businessId)
        .select(
          'title status businessOpportunity industry cashFlow inventory grossSales fullTimeEmployees partTimeEmployees ownerInvolvment reason dummyDescription businessHighlights hoursOfOperation hoursOfOperationOpportunity recentImprovements monthlyRent buildingSf category dummyImage leadInterested ndaSubmitted ndaSigned financialsCSVImages',
        )
        .populate('category', 'name')
        .populate('broker')
        .lean();
    }
    return business as IBusiness;
  }

  async getSingleBusinessWithSlug(
    slug: string,
    user: IUser,
  ): Promise<IBusiness> {
    let newObj = {};
    const _business = await this.Business.findOne({ slug })
      .select('+owner +futureOwner +amountType +companyName')
      .populate('category', 'name')
      .populate('broker')
      .populate({
        path: 'room',
        populate: {
          path: 'users.userId',
          select: 'firstName lastName photo email',
        },
      })
      .lean();

    const isVip = includes(_business._id, user?.vipList);
    const isNda = includes(_business._id, user?.ndaSigned);
    const isOwner = String(_business.owner) == String(user._id);
    const futureOwner = String(_business.futureOwner) == String(user._id);

    console.log(!isVip && !isNda);
    console.log(
      ['under-contract', 'sold'].includes(_business.status) &&
        String(_business.futureOwner) != String(user._id),
    );

    // console.log(
    //   (!isVip && !isNda) ||
    //     String(_business.owner) != String(user._id) ||
    //     (['under-contract', 'sold'].includes(_business.status) &&
    //       String(_business.futureOwner) != String(user._id)),
    // );
    newObj = {
      _id: _business._id,
      title: _business.title,
      status: _business.status,
      broker: _business.broker,
      businessOpportunity: _business.businessOpportunity,
      industry: _business.industry,
      cashFlow: _business.cashFlow,
      inventory: _business.inventory,
      grossSales: _business.grossSales,
      fullTimeEmployees: _business.fullTimeEmployees,
      partTimeEmployees: _business.partTimeEmployees,
      ownerInvolvment: _business.ownerInvolvment,
      reason: _business.reason,
      dummyDescription: _business.dummyDescription,
      businessHighlights: _business.businessHighlights,
      hoursOfOperation: _business.hoursOfOperation,
      hoursOfOperationOpportunity: _business.hoursOfOperationOpportunity,
      recentImprovements: _business.recentImprovements,
      monthlyRent: _business.monthlyRent,
      buildingSF: _business.buildingSF,
      category: _business.category,
      dummyImage: _business.dummyImage,
      slug: _business.slug,
      leadInterested: _business.leadInterested,
      ndaSubmitted: _business.ndaSubmitted,
      ndaSigned: _business.ndaSigned,
      realEstate: _business.realEstate,
      amountType: _business.amountType,
    };

    if (isVip || isNda || isOwner || futureOwner) {
      newObj = _business;
    }

    return newObj as IBusiness;
  }

  // ----------> ADMIN SERVICES <----------

  async sendOwnerTemplate(
    ownerTemplate: OwnerTemplateDto,
  ): Promise<{ ownerTemplate: string }> {
    const business = await this.Business.findById(
      ownerTemplate.businessId,
    ).lean();

    if (!business) throw new NotFoundException('Business not found!');

    // pdf creation here
    const pdfBuffer = await this.generateOwnerPdf(ownerTemplate);

    // pdf saving here
    const pdfkey = await this.s3Storage.uploadWord(pdfBuffer);

    const updateBusiness = await this.Business.findByIdAndUpdate(
      ownerTemplate.businessId,
      { ownerTemplate: pdfkey },
      { new: true },
    ).lean();

    // pdf attachment link
    // const attachments = [
    //   {
    //     url: `${this.configService.get('API_HOSTED_URL')}api/v1/media/${
    //       updateBusiness.ownerTemplate
    //     }`,
    //   },
    // ];

    // const appConfig = await this.appConfigService.appConfigDetails(
    //   'ContactInfo',
    // );

    // pdf sending here
    // await this.emailService
    //   .pdfMail(
    //     { email: business.owner.email, firstName: business.owner.firstName },
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

    return { ownerTemplate: pdfkey };
  }

  async createDraft(
    createDraftBusinessDto: CreateDraftBusinessDto,
  ): Promise<IDraftBusiness> {
    let location = undefined;
    if (!!createDraftBusinessDto.longitude && !!createDraftBusinessDto.latitude)
      location = {
        type: 'Point',
        coordinates: [
          Number(createDraftBusinessDto.longitude),
          Number(createDraftBusinessDto.latitude),
        ],
      };

    const draft = await this.DraftBusiness.create({
      ...createDraftBusinessDto,
      location,
    });

    return draft as IDraftBusiness;
  }

  async updateDraft(
    draftId: string,
    updateDraftBusinessDto: UpdateDraftBusinessDto,
  ): Promise<IDraftBusiness> {
    let location = undefined;
    if (!!updateDraftBusinessDto.longitude && !!updateDraftBusinessDto.latitude)
      location = {
        type: 'Point',
        coordinates: [
          Number(updateDraftBusinessDto.longitude),
          Number(updateDraftBusinessDto.latitude),
        ],
      };

    const draft = await this.DraftBusiness.findByIdAndUpdate(
      draftId,
      { ...updateDraftBusinessDto, location },
      { new: true },
    ).lean();

    return draft as IDraftBusiness;
  }

  async updateDraftImagesAndCsv(
    draftId: string,
    updateDraftBusinessDto: UpdateDraftBusinessDto,
    files: any,
  ): Promise<IDraftBusiness> {
    let {
      images,
      demographics,
      financialsAnalysis,
      financialsCSVImages,
      financialsCSV1,
      financialsCSV2,
    } = updateDraftBusinessDto;

    const _business = await this.DraftBusiness.findById(draftId).lean();

    if (!_business) throw new BadRequestException('Draft not found');

    const imgs = files?.images?.map((img) => img.key);
    // adding new image keys into prev. ones
    images = [...(!!imgs ? imgs : []), ..._business?.images];

    updateDraftBusinessDto['images'] = images;

    // If there's any deleting key ids, then remove it from udpatedImage keys
    updateDraftBusinessDto = this.deleteImagesFn(
      updateDraftBusinessDto as unknown as UpdateBusinessDto,
      'deletedImages',
      'images',
    );

    const demoImgs = files?.demographics?.map((img) => img.key);
    demographics = [
      ...(!!demoImgs ? demoImgs : []),
      ..._business?.demographics,
    ];

    updateDraftBusinessDto['demographics'] = demographics;

    updateDraftBusinessDto = this.deleteImagesFn(
      updateDraftBusinessDto as unknown as UpdateBusinessDto,
      'deletedDemographics',
      'demographics',
    );

    const financialImgs = files?.financialsAnalysis?.map((img) => img.key);
    financialsAnalysis = [
      ...(!!financialImgs ? financialImgs : []),
      ..._business?.financialsAnalysis,
    ];

    updateDraftBusinessDto['financialsAnalysis'] = financialsAnalysis;

    updateDraftBusinessDto = this.deleteImagesFn(
      updateDraftBusinessDto as unknown as UpdateBusinessDto,
      'deletedFinancialsAnalysis',
      'financialsAnalysis',
    );

    const financialsCSVImgs = files?.financialsCSVImages?.map((img) => img.key);
    financialsCSVImages = [
      ...(!!financialsCSVImgs ? financialsCSVImgs : []),
      ...(_business?.financialsCSVImages || []),
    ];

    updateDraftBusinessDto['financialsCSVImages'] = financialsCSVImages;

    updateDraftBusinessDto = this.deleteImagesFn(
      updateDraftBusinessDto as unknown as UpdateBusinessDto,
      'deletedFinancialsCSVImages',
      'financialsCSVImages',
    );

    if (files?.dummyImage) {
      updateDraftBusinessDto.dummyImage = files?.dummyImage[0].key;

      if (_business?.dummyImage)
        await this.s3Storage.deleteImage(_business?.dummyImage);
    }

    const business = await this.DraftBusiness.findByIdAndUpdate(
      draftId,
      {
        ...updateDraftBusinessDto,
        financialsCSV1,
        financialsCSV2,
      },
      { new: true },
    ).lean();

    return business as IDraftBusiness;
  }

  async getSingleDraft(draftId: string): Promise<IDraftBusiness> {
    const draft = await this.DraftBusiness.findById(draftId)
      .populate([
        { path: 'category', select: 'name' },
        { path: 'broker', select: 'firstName lastName' },
        { path: 'owner', select: 'firstName lastName _id' },
      ])
      .lean();
    if (!draft) throw new NotFoundException('Draft not found!');
    return draft as IDraftBusiness;
  }

  async updateDraftToBusiness(
    user: IUser,
    draftId: string,
  ): Promise<IBusiness> {
    const draft = await this.DraftBusiness.findById(draftId).lean();

    if (!draft) throw new NotFoundException('Draft not found!');

    const [business] = await Promise.all([
      this.createBusiness(user, draft as unknown as CreateBusinessDto),
    ]);

    if (business) {
      await this.DraftBusiness.findByIdAndDelete(draftId).lean();
    }

    return business as IBusiness;
  }

  async deleteDraft(draftId: string): Promise<IDraftBusiness> {
    const __draft = await this.DraftBusiness.findById(draftId).lean();

    if (!__draft) throw new NotFoundException('Draft not found!');

    const draft = await this.DraftBusiness.findByIdAndDelete(draftId).lean();

    this.deleteImgs(draft as IDraftBusiness);

    return draft as IDraftBusiness;
  }

  async assignBuyersToDataRoom(
    businessId: string,
    userIds: string[],
    user: IUser,
  ): Promise<string[]> {
    const business = await this.Business.findById(businessId).lean();

    if (!business) throw new NotFoundException('Business not found.');

    if (
      user.role.includes('broker') &&
      !user.involvedBusiness.includes(business._id)
    )
      throw new BadRequestException(
        'You can not assign buyer to this data room!',
      );

    // getting the address of of the buyer folder of particular listing
    const [childFolderError, childFolder] =
      await this.dataRoomService.getChildFolder({
        folderName: 'buyer',
        parentFolderId: business.projectFolder as any,
      });

    if (childFolderError)
      throw new BadRequestException(
        'Can not assign data room because the folder does not exist',
      );

    await this.dataRoomService.assignFolderPermimssion({
      userIds: userIds,
      role: 'buyer',
      isAllowing: true,
      child: childFolder._id,
    });

    await this.dataRoomService.createFoldersWithBuyerNames({
      userIds: userIds,
      role: 'buyer',
      businessId,
      parent: childFolder._id,
    });

    await this.Business.findByIdAndUpdate(
      businessId,
      { $addToSet: { buyerAssignedToDataRoom: { $each: userIds } } },
      { new: true },
    );

    return userIds;
  }

  async searchBusinessForMails(search?: string): Promise<{
    business: IBusiness[];
  }> {
    const business = await this.Business.find({
      title: new RegExp(search, 'i'),
    })
      .select('title')
      .lean();

    return { business: business as IBusiness[] };
  }

  async unAssignBuyersToDataRoom(
    businessId: string,
    userId: string,
    user: IUser,
  ): Promise<string> {
    const business = await this.Business.findById(businessId).lean();

    if (!business) throw new NotFoundException('Business not found.');

    console.log(business.projectFolder, userId, '<------------------');
    if (
      user.role.includes('broker') &&
      !user.involvedBusiness.includes(business._id)
    )
      throw new BadRequestException(
        'You can not assign buyer to this data room!',
      );
    const [err] = await this.dataRoomService.revokeDataRoomPermimssion({
      projectId: business.projectFolder as unknown as string,
      userId: userId,
    });

    if (err) throw err;

    await this.Business.findByIdAndUpdate(
      businessId,
      { $pull: { buyerAssignedToDataRoom: userId } },
      { new: true },
    );

    return userId;
  }

  async getSingleBusinessWithSlugForAdmin(slug: string): Promise<IBusiness> {
    const _business = await this.Business.findOne({ slug })
      .select(
        'title slug order isFeatured owner status dummyImage amountType realEstate country images vipUsers inventory cashFlow grossSales category industry city state dummyDescription description buildingSF forSale monthlyRent employees ownerInvolvment reason businessAddress location financials businessHighlights thirdPartyPresence pros cons demographics hoursOfOperation recentImprovements financingOptions companyName fullTimeEmployees partTimeEmployees propertyInformation businessOpportunity financialsAnalysis refId hoursOfOperationOpportunity financialsDescription financialsCSV1 financialsCSV2 financialsCSVImages googleMapAddress autoNdaApprove',
      )
      .populate([
        { path: 'category', select: 'name' },
        { path: 'broker', select: 'firstName lastName' },
        { path: 'owner', select: 'firstName lastName _id' },
      ])
      .populate({
        path: 'room',
        populate: [
          {
            path: 'users.userId',
            select: 'firstName lastName photo email',
          },
          {
            path: 'business',
            select: 'images title',
          },
        ],
      })
      .lean();

    return _business as IBusiness;
  }

  async adminGetVipUsersOfBusiness(slug: string): Promise<IUser[]> {
    const _business = await this.Business.findOne({ slug });

    const _users = await this.User.find({
      vipList: { $in: [_business?._id] },
    }).select('_id firstName lastName role');

    const users = categorizeByrole(_users);

    return users as IUser[];
  }

  async getInterestedListingsOfBusinessWithSlugForAdmin(
    slug: string,
    query: pagination,
    status: string,
    search: string,
  ): Promise<{ leads: ILead[]; totalCount: number }> {
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const _business = await this.Business.findOne({ slug })
      .select('_id')
      .lean();

    let q: any = { listingID: _business?._id };

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
      q = {
        ...q,
        status,
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
          pipeline: [
            { $project: { firstName: 1, lastName: 1, photo: 1, email: 1 } },
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

    const [leads, totalCount] = await Promise.all([
      this.Lead.aggregate(aggregateQuery),
      this.Lead.aggregate(countDocQuery),
    ]);
    return { leads: leads as ILead[], totalCount: totalCount.length as number };
  }

  async createBusiness(
    user: IUser,
    createBusinessDto: CreateBusinessDto,
  ): Promise<IBusiness> {
    const { broker, title, refId } = createBusinessDto;
    let { order } = createBusinessDto;
    let location = undefined;

    const totalEmployees =
      Number(createBusinessDto.partTimeEmployees) +
      Number(createBusinessDto.fullTimeEmployees);

    const slug = slugify(title, { lower: true, strict: false });

    if (!!createBusinessDto.longitude && !!createBusinessDto.latitude)
      location = {
        type: 'Point',
        coordinates: [
          Number(createBusinessDto.longitude),
          Number(createBusinessDto.latitude),
        ],
      };

    // get total number of  business
    if (!(Number(order) || order < 0))
      order = (await this.Business.countDocuments()) + 1;

    const business = await this.Business.create({
      ...createBusinessDto,
      slug,
      totalEmployees,
      location,
      order,
      refId: !!refId ? refId : v4(),
    });

    const adminRoles = await this.User.find({
      role: {
        $in: [
          'admin',
          'financial-analyst',
          'buyer-concierge',
          'seller-concierge',
          'executive',
        ],
      },
    })
      .select('_id')
      .lean();

    const adminIds = adminRoles.map((el) => el._id);

    const userIds = [...business?.broker, ...adminIds];

    const room = await this.chatsService.createRoom({
      reference: 'business-group',
      business: business._id,
      title: business.title,
      userIds,
    });

    const projectObj = {
      roles: [
        'broker',
        'buyer',
        'seller',
        'admin',
        'financial-analyst',
        'buyer-concierge',
        'seller-concierge',
        'executive',
      ],
      name: business.title,
      business: business._id,
      isFile: false,
      isActive: true,
      isDeletable: false,
      // children: [],
      folders: [
        {
          isDeletable: false,
          name: 'admin',
          roles: [
            'admin',
            'financial-analyst',
            'buyer-concierge',
            'seller-concierge',
            'executive',
          ],
        },
        {
          isDeletable: false,
          name: 'broker',
          roles: [
            'broker',
            'admin',
            'financial-analyst',
            'buyer-concierge',
            'seller-concierge',
            'executive',
          ],
        },
        {
          isDeletable: false,
          name: 'seller',
          roles: [
            'seller',
            'broker',
            'admin',
            'financial-analyst',
            'buyer-concierge',
            'seller-concierge',
            'executive',
          ],
        },
        {
          isDeletable: false,
          name: 'buyer',
          roles: [
            'buyer',
            'broker',
            'admin',
            'financial-analyst',
            'buyer-concierge',
            'seller-concierge',
            'executive',
          ],
        },
      ],
    };

    const dataRoom = await this.dataRoomService.createProject(user, projectObj);

    const [updatedBusiness] = await Promise.all([
      this.Business.findByIdAndUpdate(
        business._id,
        { projectFolder: dataRoom._id as any, room: room._id },
        { new: true },
      ),

      this.User.updateMany(
        { _id: { $in: broker } },
        { $push: { involvedBusiness: business._id } },
      ),
    ]);

    if (!!createBusinessDto?.owner) {
      // user update here
      const owner = await this.User.findByIdAndUpdate(
        createBusinessDto.owner,
        { $push: { ownedBusiness: business._id } },
        { new: true },
      ).lean();
      // owner joining room here
      await this.chatsService.joinRoom(owner as IUser, String(room._id));
      // assign folder permission to owner here
      const [childFolderError, childFolder] =
        await this.dataRoomService.getChildFolder({
          folderName: 'seller',
          parentFolderId: updatedBusiness.projectFolder as any,
        });
      if (childFolderError)
        throw new BadRequestException(
          'Can not assign data room because the folder does not exist',
        );
      await this.dataRoomService.assignFolderPermimssion({
        userIds: [createBusinessDto?.owner],
        role: 'seller',
        isAllowing: true,
        child: childFolder._id,
      });
    }

    return business as IBusiness;
  }

  async businessCategories(): Promise<any[]> {
    const categories = await this.Business.aggregate([
      { $match: { category: { $ne: null } } },
      { $group: { _id: 'category', categories: { $addToSet: '$category' } } },
      {
        $lookup: {
          from: 'categories',
          localField: 'categories',
          foreignField: '_id',
          as: 'categories',
        },
      },
    ]);

    return categories[0]?.categories || [];
  }

  async businessCities(): Promise<any[]> {
    const cities = await this.Business.aggregate([
      { $match: { city: { $ne: null } } },
      { $group: { _id: '$city', cities: { $addToSet: '$city' } } },
    ]);

    return cities[0]?.cities || [];
  }

  async updateNotes(notesDto: NotesDto): Promise<IBusiness> {
    // 1. leave broker from the business
    const business = await this.Business.findOneAndUpdate(
      { slug: notesDto.slug },
      { notes: notesDto.notes },
      { new: true },
    )
      .select('+owner')
      .populate('owner')
      .populate({
        path: 'room',
        populate: {
          path: 'users.userId',
          select: 'firstName lastName photo email',
        },
      })
      .lean();

    return business as IBusiness;
  }

  async updateBusiness(
    updateBusinessDto: UpdateBusinessDto,
    user: IUser,
  ): Promise<IBusiness> {
    let _slug = undefined;
    let q = {};

    const { slug } = updateBusinessDto;

    let excludedBrokers: string[] = [];

    const _business = await this.Business.findOne({ slug })
      .select('+owner')
      .populate('owner')
      .lean();

    if (!_business) throw new BadRequestException('Business not found');

    if (updateBusinessDto.title) {
      _slug = slugify(updateBusinessDto.title, {
        lower: true,
        strict: false,
      });
      q = { slug: _slug };
    }

    if (
      updateBusinessDto.partTimeEmployees ||
      updateBusinessDto.fullTimeEmployees
    ) {
      updateBusinessDto.totalEmployees =
        Number(updateBusinessDto.partTimeEmployees) +
        Number(updateBusinessDto.fullTimeEmployees);
    }

    if (updateBusinessDto?.longitude && updateBusinessDto?.latitude) {
      q = {
        ...q,
        location: {
          type: 'Point',
          coordinates: [
            Number(updateBusinessDto.longitude),
            Number(updateBusinessDto.latitude),
          ],
        },
      };
    }

    if (updateBusinessDto?.owner) {
      const updateOwner = await this.User.findById(updateBusinessDto.owner)
        // .select('firstName lastName')
        .lean();

      if (!updateOwner)
        throw new BadRequestException(
          'The owner you have entered does not existss',
        );

      if (_business?.owner) {
        const [error] = await this.chatsService.leaveRoom(
          _business?.owner as IUser,
          String(_business?.room),
        );

        if (error) throw error;

        await this.User.findByIdAndUpdate(
          _business.owner,
          { $pull: { ownedBusiness: _business._id } },
          { new: true },
        ).lean();
      }

      // FOR NEW OWNER HERE
      const [_owner] = await Promise.all([
        this.User.findByIdAndUpdate(
          updateBusinessDto.owner,
          { $push: { ownedBusiness: _business._id } },
          { new: true },
        ).lean(),

        this.chatsService.joinRoom(
          updateOwner as IUser,
          String(_business.room),
        ),
      ]);
    }

    if (!!_business?.owner && !!updateBusinessDto?.owner) {
      // 4. Assigning new owner
      await this.dataRoomService.updateFolderOwners({
        businessId: _business._id,
        prevOwner: _business?.owner._id,
        newOwner: updateBusinessDto?.owner,
      });
    } else if (!_business?.owner && !!updateBusinessDto?.owner) {
      const [childFolderError, childFolder] =
        await this.dataRoomService.getChildFolder({
          folderName: 'seller',
          parentFolderId: _business.projectFolder as any,
        });

      if (childFolderError)
        throw new BadRequestException(
          'Can not assign data room because the folder does not exist',
        );

      await this.dataRoomService.assignFolderPermimssion({
        userIds: [updateBusinessDto?.owner],
        role: 'seller',
        isAllowing: true,
        child: childFolder._id,
      });
    }
    // const [err] = await this.dataRoomService.revokeDataRoomPermimssion({
    //   projectId: _business.projectFolder as unknown as string,
    //   userId: _business?.owner?._id as any,
    // });

    // if (err) throw err;

    if (updateBusinessDto?.broker?.length > 0) {
      // broker will replace previous broker in all the listing and leads(interest) and the room(chats) and data-room and its folders and
      const oldBrokers = _business.broker.map((el) => String(el));
      const newBrokersArr = updateBusinessDto.broker;

      excludedBrokers = oldBrokers.filter(
        (broker) => !newBrokersArr.includes(String(broker)),
      );

      const newBrokers = newBrokersArr.filter(
        (broker) => !oldBrokers.includes(broker),
      );

      await Promise.all([
        // 2. leave broker from the business assigned leads (interest)
        this.leadsServices.updateLeadBrokers({
          businessId: _business._id,
          oldBrokers,
          excludedBrokers,
          newBrokers,
        }),

        // 3. leave broker from the business assigned chats
        this.chatsService.updateUsers({
          oldBrokers,
          excludedBrokers,
          businessId: _business._id,
          newBrokers,
        }),

        // 4. Assigning new owner
        this.dataRoomService.updateFolderBrokers({
          businessId: _business._id,
          excludedBrokers,
          newBrokers,
        }),

        this.User.updateMany(
          { _id: { $in: newBrokers } },
          { $addToSet: { involvedBusiness: _business._id } },
        ),

        this.User.updateMany(
          { _id: { $in: excludedBrokers } },
          { $pull: { involvedBusiness: _business._id } },
        ),
      ]);
    }

    if (updateBusinessDto.status == 'under-contract')
      await this.updateBusinessNdaSigned({
        businessId: _business._id,
        buyerId: null,
        user,
      });

    // 1. leave broker from the business
    const business = await this.Business.findOneAndUpdate(
      { slug },
      {
        ...updateBusinessDto,
        ...q,
        // slug: _slug,
        // location,
        $addToSet: { leavedUsers: { $each: excludedBrokers } },
      },
      { new: true },
    )
      .select('+owner')
      .populate('owner')
      .populate({
        path: 'room',
        populate: {
          path: 'users.userId',
          select: 'firstName lastName photo email',
        },
      })
      .lean();

    // email to owner on business status change
    if (_business.status !== updateBusinessDto.status) {
      const appConfig = await this.appConfigService.appConfigDetails(
        'ContactInfo',
      );

      await this.emailService
        .businessUpdateStatus(
          {
            email: business.owner.email,
            firstName: business.owner.firstName,
          },
          {
            listingName: business.title,
            status: business.status,
            email: appConfig?.ContactInfo?.email,
            contact: appConfig?.ContactInfo?.contact,
            address: appConfig?.ContactInfo?.address,
            url: appConfig?.ContactInfo?.url,
            name: appConfig?.ContactInfo?.name,
            designation: appConfig?.ContactInfo?.designation,
          },
        )
        .catch((e) => console.log(e));
    }

    return business as IBusiness;
  }

  // async uploadImagesAndCsv(
  //   businessId: string,
  //   financialsCSV1: object[],
  //   financialsCSV2: object[],
  //   //  files: any
  // ): Promise<IBusiness> {
  //   // if (!files?.images)
  //   //   throw new BadRequestException('Property Images are missing.');

  //   // if (!files?.demographics)
  //   //   throw new BadRequestException('Property Demographic images are missing.');

  //   // if (!files?.dummyImage)
  //   //   throw new BadRequestException('Property Dummy image is missing.');

  //   // if (!files?.financialsAnalysis)
  //   //   throw new BadRequestException(
  //   //     'Property financial analysis images are missing.',
  //   //   );

  //   // CSV WORK REMAINING

  //   // const images = files?.images?.map((img) => img.key);
  //   // const demographics = files?.demographics.map((img) => img.key);
  //   // const financialsAnalysis = files?.financialsAnalysis.map((img) => img.key);
  //   // const dummyImage = files?.dummyImage[0].key;

  //   const business = await this.Business.findByIdAndUpdate(
  //     businessId,
  //     {
  //       // images, demographics, financialsAnalysis, dummyImage,

  //       financialsCSV1: financialsCSV1,
  //       financialsCSV2: financialsCSV2,
  //     },
  //     { new: true },
  //   ).lean();

  //   return business as IBusiness;
  // }

  async updateImagesAndCsv(
    slug: string,
    updateBusinessDto: UpdateBusinessDto,
    files: any,
  ): Promise<IBusiness> {
    let {
      images,
      demographics,
      financialsAnalysis,
      financialsCSVImages,
      financialsCSV1,
      financialsCSV2,
    } = updateBusinessDto;

    const _business = await this.Business.findOne({ slug }).lean();

    if (!_business) throw new BadRequestException('Business not found');

    const imgs = files?.images?.map((img) => img.key);
    // adding new image keys into prev. ones
    images = [...(!!imgs ? imgs : []), ..._business?.images];

    updateBusinessDto['images'] = images;

    // If there's any deleting key ids, then remove it from udpatedImage keys
    updateBusinessDto = this.deleteImagesFn(
      updateBusinessDto,
      'deletedImages',
      'images',
    );

    const demoImgs = files?.demographics?.map((img) => img.key);
    demographics = [
      ...(!!demoImgs ? demoImgs : []),
      ..._business?.demographics,
    ];

    updateBusinessDto['demographics'] = demographics;

    updateBusinessDto = this.deleteImagesFn(
      updateBusinessDto,
      'deletedDemographics',
      'demographics',
    );

    const financialImgs = files?.financialsAnalysis?.map((img) => img.key);
    financialsAnalysis = [
      ...(!!financialImgs ? financialImgs : []),
      ..._business?.financialsAnalysis,
    ];

    updateBusinessDto['financialsAnalysis'] = financialsAnalysis;

    updateBusinessDto = this.deleteImagesFn(
      updateBusinessDto,
      'deletedFinancialsAnalysis',
      'financialsAnalysis',
    );

    const financialsCSVImgs = files?.financialsCSVImages?.map((img) => img.key);
    financialsCSVImages = [
      ...(!!financialsCSVImgs ? financialsCSVImgs : []),
      ...(_business?.financialsCSVImages || []),
    ];

    updateBusinessDto['financialsCSVImages'] = financialsCSVImages;

    updateBusinessDto = this.deleteImagesFn(
      updateBusinessDto,
      'deletedFinancialsCSVImages',
      'financialsCSVImages',
    );

    if (files?.dummyImage) {
      updateBusinessDto.dummyImage = files?.dummyImage[0].key;

      if (_business?.dummyImage)
        await this.s3Storage.deleteImage(_business?.dummyImage);
    }

    const business = await this.Business.findOneAndUpdate(
      { slug },
      {
        ...updateBusinessDto,
        financialsCSV1,
        financialsCSV2,
      },
      { new: true },
    )
      .populate({
        path: 'room',
        populate: {
          path: 'users.userId',
          select: 'firstName lastName photo email',
        },
      })
      .lean();

    return business as IBusiness;
  }

  // async updateBusinessStatus(slug: string, status: string): Promise<IBusiness> {
  //   let q = {};
  //   const _business = await this.Business.findOne({ slug }).lean();

  //   if (!_business) throw new BadRequestException('Business Not Found!');

  //   if (_business?.status == 'active' && status == 'off-market') {
  //     q = { status };
  //   } else if (status == 'pre-listing') {
  //     q = { status };
  //   } else {
  //     throw new BadRequestException(`Invalid status: ${status}`);
  //   }

  //   const business = await this.Business.findOneAndUpdate({ slug }, q, {
  //     new: true,
  //   }).populate({
  //     path: 'room',
  //     populate: {
  //       path: 'users.userId',
  //       select: 'firstName lastName photo email',
  //     },
  //   });

  //   return business as IBusiness;
  // }

  async getAllBusinessForAdmin(
    query: pagination,
    status: string,
    search: string,
  ): Promise<{ results: number; countDoc: number; business: IBusiness[] }> {
    let q: any = {
      ...(search && {
        title: { $regex: search, $options: 'i' },
      }),
    };
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;
    let business = [];

    if (['undefined', 'null', undefined, null].includes(status)) status = 'all';

    if (status == 'all') {
      q = {
        ...q,
        status: {
          $in: [
            'active',
            'pre-listing',
            'under-contract',
            'sold',
            'off-market',
          ],
        },
      };
    } else {
      q = {
        ...q,
        status: status,
      };
    }

    if (query.page == undefined && query.limit == undefined) {
      business = await this.Business.find()
        .populate({
          path: 'room',
          populate: {
            path: 'users.userId',
            select: 'firstName lastName photo email',
          },
        })
        .sort({ createdAt: -1 })
        .lean();
    } else {
      business = await this.Business.find(q)
        .select('+owner +companyName')
        .populate('broker')
        .populate({
          path: 'room',
          populate: {
            path: 'users.userId',
            select: 'firstName lastName photo email',
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }
    const countDoc = await this.Business.countDocuments(q);

    return {
      results: business.length as number,
      countDoc: countDoc || 0,
      business: business as IBusiness[],
    };
  }

  async getAllBusinessDraftsForAdmin(
    query: pagination,
    status: string,
    search: string,
  ): Promise<{
    results: number;
    countDoc: number;
    businessDrafts: IDraftBusiness[];
  }> {
    let q: any = {
      ...(search && {
        title: { $regex: search, $options: 'i' },
      }),
    };
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;
    let businessDrafts = [];

    if (['undefined', 'null', undefined, null].includes(status)) status = 'all';

    if (status == 'all') {
      q = {
        ...q,
        status: {
          $in: [
            'active',
            'pre-listing',
            'under-contract',
            'sold',
            'off-market',
          ],
        },
      };
    } else {
      q = {
        ...q,
        status: status,
      };
    }

    if (query.page == undefined && query.limit == undefined) {
      businessDrafts = await this.DraftBusiness.find()
        .sort({ createdAt: -1 })
        .lean();
    } else {
      businessDrafts = await this.DraftBusiness.find(q)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }
    const countDoc = await this.DraftBusiness.countDocuments(q);

    return {
      results: businessDrafts.length as number,
      countDoc: countDoc || 0,
      businessDrafts: businessDrafts as IDraftBusiness[],
    };
  }
}
