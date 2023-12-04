import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { hash } from 'bcryptjs';
import { generate } from 'generate-password-ts';
import { Model } from 'mongoose';
import { AppConfigsService } from 'src/app-configs/app-configs.service';
import { BusinessService } from 'src/business/business.service';
import { IBusiness } from 'src/business/interfaces/business.interface';
import { ChatsService } from 'src/chats/chats.service';
import { ILead } from 'src/leads/interfaces/lead.interface';
import { MailsService } from 'src/mails/mails.service';
import { EmailService } from 'src/utils/utils.email.service';
import {
  isBoolean,
  matchRoles,
  categorizeByrole,
} from 'src/utils/utils.helper';
import { pagination } from 'src/utils/utils.types';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import {
  CreateBulkUserDTO,
  CreateSpecialUser,
} from './dto/create-specialUser.dto';
import { UpdateImapDto } from './dto/update-imap.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './interfaces/user.interface';
import { S3Storage } from 'src/utils/utils.s3';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly User: Model<IUser>,
    @InjectModel('Business') private readonly Business: Model<IBusiness>,
    @InjectModel('Lead') private readonly Lead: Model<ILead>,
    private readonly businessService: BusinessService,
    private readonly mailsService: MailsService,
    private readonly chatsService: ChatsService,
    private readonly emailService: EmailService,
    private readonly appConfigService: AppConfigsService,
    private readonly s3Storage: S3Storage,
  ) {}

  async myProfile(user: IUser): Promise<IUser> {
    const _user = await this.User.findById(user._id).select('+active').lean();

    if (['system-deactivated'].includes(_user.active))
      throw new BadRequestException({ message: 'Your account is deactivated' });

    return _user as IUser;
  }

  async getUserCities(): Promise<any> {
    const user = await this.User.find().select('city').distinct('city').lean();
    return user;
  }

  async getAllUsersForRoom(
    user: IUser,
    role: string,
    searchName: string,
  ): Promise<IUser[]> {
    let q: any = {
      _id: { $nin: user._id },
    };

    if (!!searchName) {
      q = {
        ...q,
        $or: [
          { firstName: new RegExp(searchName, 'i') },
          { lastName: new RegExp(searchName, 'i') },
        ],
      };
    }

    if (!!role) {
      q = {
        ...q,
        role,
      };
    }

    const users = await this.User.find(q).sort('-createdAt').lean();

    return users as IUser[];
  }

  async addNotes(
    user: IUser,
    userId: string,
    updateUserDto: UpdateUserDto,
  ): Promise<IUser> {
    const __user = await this.User.findById(userId).lean();

    if (!__user) throw new NotFoundException('User not found!');

    const updatedUser = await this.User.findByIdAndUpdate(
      userId,
      { notes: updateUserDto.notes },
      { new: true },
    ).lean();

    return updatedUser as IUser;
  }

  async updateMe(
    updateUserDto: UpdateUserDto,
    _user: IUser,
  ): Promise<{ user: IUser }> {
    // 1) Get user from collection

    const user = await this.User.findOneAndUpdate(
      { _id: _user._id },
      updateUserDto,
      { new: true, runValidators: true },
    ).lean();

    return { user: user as IUser };
  }

  // user will sign nda after that an email will be sent to user with the link of business
  // then user can see all the details of business on web.
  // admin and broker can both add user to nda list
  // this is the final step api
  // async addUserToNDAList(userId: string, businessId: string): Promise<IUser> {
  //   const _user = await this.User.findById(userId).lean();

  //   if (!_user) throw new NotFoundException('User not found');

  //   const business = await this.Business.findById(businessId).lean();

  //   if (!business) throw new NotFoundException('Business not found');

  //   const user = await this.User.findByIdAndUpdate(
  //     userId,
  //     { $push: { ndaSigned: businessId } },
  //     { new: true },
  //   ).lean();

  //   const updateBusinessUser = await this.Business.findByIdAndUpdate(
  //     businessId,
  //     { $push: { ndaSigned: userId } },
  //     { new: true },
  //   ).lean();

  //   return user as IUser;
  // }

  async updateMailFields(
    updateImapDto: UpdateImapDto,
    user: IUser,
  ): Promise<IUser> {
    const [err, _] = await this.mailsService.testCredentials({
      user: updateImapDto.user,
      password: updateImapDto.password,
    });

    if (err) throw err;

    const data = await this.User.findByIdAndUpdate(
      { _id: user._id },
      { imap: updateImapDto },
      {
        new: true,
        runValidators: true,
      },
    ).lean();

    return data as IUser;
  }

  /////////////////////////////////////////////////////////
  //    =================  ADMIN   ===================
  /////////////////////////////////////////////////////////

  async getAllAdmins(): Promise<IUser[]> {
    const users = await this.User.find({
      role: {
        $in: [
          'admin',
          'financial-analyst',
          'buyer-concierge',
          'seller-concierge',
          'executive',
        ],
      },
    }).lean();

    return users as IUser[];
  }

  async adminUpdateUser(
    userId: string,
    updateUserDto: AdminUpdateUserDto,
    files: any,
  ): Promise<IUser> {
    if (files?.photo) updateUserDto.photo = files?.photo[0].key;

    const user = await this.User.findByIdAndUpdate(userId, updateUserDto, {
      new: true,
    })
      .select('+active')
      .lean();

    return user as IUser;
  }

  async adminGetOwnerAndBrokers(userType: string): Promise<any> {
    let data = {};

    const userPromise = [];
    if ([undefined, null, 'undefined', 'null'].includes(userType))
      userType = 'all';

    if (
      ![
        'broker',
        'seller',
        'third-party-broker',
        'banker',
        'attorney',
        'accountant',
        'job-seeker',
        'co-broker',
        'all',
      ].includes(userType)
    )
      throw new BadRequestException(
        'Please provide valid user role. Valid user roles are  broker, seller, third-party-broker, banker, attorney, accountant, job-seeker and co-broker',
      );

    if (userType == 'all') {
      const [
        owners,
        brokers,
        thirdPartyBrokers,
        bankers,
        attornies,
        accountants,
        jobSeeker,
        coBroker,
      ] = await Promise.all([
        // owners
        this.User.find({ role: 'seller' })
          .select('firstName lastName photo email')
          .lean(),
        // brokers
        this.User.find({ role: 'broker' })
          .select('firstName lastName photo email')
          .lean(),
        // third-party-broker
        this.User.find({ role: 'third-party-broker' })
          .select('firstName lastName photo email')
          .lean(),
        // banker
        this.User.find({ role: 'banker' })
          .select('firstName lastName photo email')
          .lean(),
        // attorney
        this.User.find({ role: 'attorney' })
          .select('firstName lastName photo email')
          .lean(),
        // accountant
        this.User.find({ role: 'accountant' })
          .select('firstName lastName photo email')
          .lean(),
        // job-seeker
        this.User.find({ role: 'job-seeker' })
          .select('firstName lastName photo email')
          .lean(),
        // co-broker
        this.User.find({ role: 'co-broker' })
          .select('firstName lastName photo email')
          .lean(),
      ]);
      data = {
        sellers: owners,
        brokers: brokers,
        thirdPartyBrokers,
        bankers,
        attornies,
        accountants,
        jobSeeker,
        coBroker,
      };
    } else {
      const user = await this.User.find({ role: { $in: [userType] } })
        .select('firstName lastName photo email')
        .lean();

      data = { [`${userType}s`]: user };
    }
    return data;
  }

  async adminCreateSpecialUser(
    createSpecialUser: CreateSpecialUser,
  ): Promise<IUser> {
    const { role, email } = createSpecialUser;

    if (
      ![
        'broker',
        'banker',
        'attorney',
        'accountant',
        'financial-analyst',
        'buyer-concierge',
        'seller-concierge',
        'executive',
        'third-party-broker',
        'co-broker',
        'job-seeker',
        'landlord',
        'property-manager',
        'job-applicant',
        'title-company',
        '3rd-party-contacts',
        'insurance-agent',
        'service-provider',
        // ===
        // -third-party-broker
        // -Banker
        // -Attorney
        // -Accountant
      ].includes(role)
    )
      throw new BadRequestException(`Role: ${role || 'role'} is invalid`);

    const userExists = await this.User.findOne({ email });
    if (userExists) throw new NotFoundException('User already exists.');

    const password = generate({ length: 10, numbers: true });

    let [user, appConfig] = await Promise.all([
      this.User.create({
        ...createSpecialUser,
        password: password,
        passwordConfirm: password,
      }),
      this.appConfigService.appConfigDetails('ContactInfo'),
    ]);

    if (
      [
        'third-party-broker',
        'banker',
        'attorney',
        'accountant',
        'job-seeker',
        'co-broker',
        'landlord',
        'property-manager',
        'job-applicant',
        'title-company',
        '3rd-party-contacts',
        'insurance-agent',
        'service-provider',
      ].includes(role)
    ) {
      user = await this.User.findByIdAndUpdate(
        user._id,
        { $push: { role: { $each: ['buyer', 'seller'] } } },
        { new: true },
      );
    }

    if (
      [
        'financial-analyst',
        'buyer-concierge',
        'seller-concierge',
        'executive',
      ].includes(role)
    ) {
      await this.chatsService.addUserToGroups(user);
    }

    await this.emailService
      .sendUserPassword(
        { email: user.email, firstName: user.firstName },
        {
          password: password,
          email: appConfig?.ContactInfo?.email,
          contact: appConfig?.ContactInfo?.contact,
          address: appConfig?.ContactInfo?.address,
          url: appConfig?.ContactInfo?.url,
          name: appConfig?.ContactInfo?.name,
          designation: appConfig?.ContactInfo?.designation,
        },
      )
      .catch((e) => console.log(e));

    return user as IUser;
  }

  async adminCreateBulkSpecialUser(
    user: IUser,
    createBulkUsers: CreateBulkUserDTO,
  ): Promise<IUser[]> {
    const { users } = createBulkUsers;
    let { role } = createBulkUsers;
    const emails = [];

    createBulkUsers.password = generate({ length: 10, numbers: true });

    const hashedPassword = await hash(createBulkUsers.password, 12);

    const appConfig = await this.appConfigService.appConfigDetails(
      'ContactInfo',
    );

    // because role broker only allowed to create buyer and seller
    if (user.role.includes('broker')) {
      // code to exclude roles except this array ['buyer', 'seller', 'banker', 'attorney', 'accountant', 'job-seeker']
      role = [
        'buyer',
        'seller',
        'banker',
        'attorney',
        'accountant',
        'job-seeker',
        'landlord',
        'property-manager',
        'job-applicant',
        'title-company',
        '3rd-party-contacts',
        'insurance-agent',
        'service-provider',
      ].filter((r) => role.includes(r));
    }

    const operations = users.map((user) => {
      user.role = role;
      user.password = hashedPassword;
      user.passwordConfirm = hashedPassword;
      user.photo = 'default.png';
      user.active = 'active';

      // el.ringCentral = {
      //   clientId: this.configService.get('RC_CLIENT_ID'),
      //   clientSecret: this.configService.get('RC_CLIENT_SECRET'),
      // } as any;
      emails.push(
        this.emailService
          .sendUserPassword(
            { email: user.email, firstName: user.firstName },
            {
              password: createBulkUsers.password,
              email: appConfig?.ContactInfo?.email,
              contact: appConfig?.ContactInfo?.contact,
              address: appConfig?.ContactInfo?.address,
              url: appConfig?.ContactInfo?.url,
              name: appConfig?.ContactInfo?.name,
              designation: appConfig?.ContactInfo?.designation,
            },
          )
          .catch((e) => console.log(e)),
      );
      return {
        updateOne: {
          filter: { email: user.email }, // filter by email
          update: { $set: user }, // update the entire user object
          upsert: true, // insert if not found
        },
      };
    });

    const rs = await Promise.all([
      this.User.bulkWrite(operations as any),
    ]).catch((err) => {
      throw new BadRequestException(err.message);
      console.log(err);
    });

    console.log(JSON.stringify(rs, null, 2));

    await Promise.all(emails);

    return users as unknown as IUser[];
  }

  async adminAddUserToVipList(
    users: string[],
    removeUser: string,
    businessId: string,
    user: IUser,
  ): Promise<IUser[]> {
    const business = await this.Business.findById(businessId).lean();

    if (!business) throw new NotFoundException('Business not found');

    const exceptionalUsers = [
      ...business.buyerAssignedToDataRoom,
      ...business.vipUsers,
    ];

    if (users?.length > 0) {
      const _user = await this.User.find({
        _id: { $in: users, $nin: exceptionalUsers },
      })
        .distinct('_id')
        .lean();

      if (!_user) throw new NotFoundException('Users not found');

      await Promise.all([
        this.User.updateMany(
          { _id: { $in: _user } },
          { $addToSet: { vipList: businessId } },
        ),
        // { $addToSet: { _users: new ObjectId(user._id) }}
        this.Business.findByIdAndUpdate(
          businessId,
          { $addToSet: { vipUsers: _user as unknown } },
          { new: true },
        ),
        this.businessService.assignBuyersToDataRoom(
          businessId,
          _user as unknown as string[],
          user,
        ),
      ]);
    }

    if (!!removeUser) {
      await Promise.all([
        this.User.findByIdAndUpdate(removeUser, {
          $pull: { vipList: businessId },
        }),
        // { $addToSet: { _users: new ObjectId(user._id) }}
        this.Business.findByIdAndUpdate(
          businessId,
          { $pull: { vipUsers: removeUser } },
          { new: true },
        ),
        this.businessService.unAssignBuyersToDataRoom(
          businessId,
          removeUser,
          user,
        ),
      ]);
    }

    // const dynamicUser = users?.length > 0 ? users : [removeUser];
    // const data = await this.User.find({ _id: { $in: dynamicUser } }).lean();

    const _users = await this.User.find({
      vipList: { $in: [businessId] },
    }).select('_id firstName lastName role');

    const data = categorizeByrole(_users);

    return data as IUser[];
  }

  async deactivateUser(active: boolean, userId: string): Promise<IUser> {
    let q = {};
    if (active) {
      q = { active: 'active' };
    } else if (!active) {
      q = { active: 'system-deactivated' };
    } else {
      throw new BadRequestException(`Status: ${active} is invalid.`);
    }

    const data = await this.User.findByIdAndUpdate(userId, q, {
      new: true,
    })
      .select('+active')
      .lean();

    return data as IUser;
  }

  async getBuyersSellersUsers(
    query: pagination,
    status: string,
    search: string,
    designation?: string,
  ): Promise<{ totalCount: number; results: number; data: IUser[] }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;
    let q: any = {
      role: { $in: ['buyer', 'seller'] },
      ...(!!designation && { designation }),
      ...(search && {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }),
    };

    if (['undefined', 'null', null, undefined].includes(status)) status = 'all';
    if (
      !['active', 'system-deactivated', 'all', 'user-deactivated'].includes(
        status,
      )
    )
      throw new BadRequestException(
        'Please enter a valid status. Valid Statuses are active, system-deactivated, user-deactivated and all',
      );

    if (status == 'all') {
      q = {
        ...q,
        active: { $in: ['active', 'system-deactivated', 'user-deactivated'] },
      };
    } else {
      q = { ...q, active: status };
    }

    const [data, totalCount] = await Promise.all([
      this.User.find(q)
        .select('+active')
        .skip(skip)
        .limit(limit)
        .sort('-updatedAt')
        .lean(),
      this.User.countDocuments(q),
    ]);

    return {
      totalCount,
      results: data?.length,
      data: data as IUser[],
    };
  }

  async getBrokers(
    query: pagination,
    search: string,
  ): Promise<{ totalCount: number; results: number; data: IUser[] }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;
    let data = [];
    let countDoc = 0;
    const dbQuery = {
      role: 'broker',
      ...(search && {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }),
    };
    // const withPagination = query.page * 1 !== undefined

    if (query.page == undefined && query.limit == undefined) {
      data = await this.User.find(dbQuery).sort({ createdAt: -1 }).lean();
    } else {
      [data, countDoc] = await Promise.all([
        this.User.find(dbQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.User.countDocuments({
          role: 'broker',
        })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);
    }

    return {
      totalCount: countDoc || 0,
      results: data?.length || 0,
      data: data as IUser[],
    };
  }

  async getDetailsOfABroker(
    brokerId: string,
  ): Promise<{ user: IUser; listings: IBusiness[] }> {
    const [user, listings] = await Promise.all([
      this.User.findById(brokerId).select('+active').lean(),
      this.Business.find({ broker: { $in: [brokerId] } }).lean(),
    ]);

    return { user: user as IUser, listings: listings as IBusiness[] };
  }

  async getDetailsOfAUser(userId: string): Promise<IUser> {
    const [user, ownedBusiness, interestedListing] = await Promise.all([
      this.User.findById(userId).select('+active').lean(),
      this.Business.find({
        owner: userId,
      })
        .populate('owner')
        .populate('category')
        .sort('-createdAt -updatedAt')
        .lean(),

      this.Lead.find({
        buyer: userId,
      })
        .populate('broker', 'firstName lastName photo')
        .populate('buyer', 'firstName lastName photo')
        .populate('listingID')
        .sort('-createdAt -updatedAt')
        .lean(),
    ]);

    user.ownedBusiness = ownedBusiness;
    user.interestedListing = interestedListing;

    return user as IUser;
  }

  async getListingsOfAUser(
    userId: string,
    query: pagination,
    user: IUser,
  ): Promise<{ totalCount: number; ownedBusiness: IBusiness[] }> {
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const roles = [
      'buyer',
      'seller',
      'third-party-broker',
      'co-broker',
      'banker',
      'attorney',
      'accountant',
      'job-seeker',
    ];
    let q: any = { owner: userId };

    if (matchRoles(roles, user.role)) {
      q = {
        ...q,
        status: { $nin: ['pre-listing', 'off-market'] },
      };
    }

    const [business, count] = await Promise.all([
      this.Business.find(q)
        .select('+companyName')
        .populate('owner')
        .populate('broker')
        .populate('category')
        .sort('-createdAt -updatedAt')
        .skip(skip)
        .limit(limit)
        .lean(),

      this.Business.countDocuments(q),
    ]);

    return {
      totalCount: count,
      ownedBusiness: business as IBusiness[],
    };
  }

  async getInterestedLeadsOfAUser(
    userId: string,
    query: pagination,
  ): Promise<{ totalCount: number; leads: ILead[] }> {
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    let _leads = [];
    let count = 1;

    if (query.page == undefined) {
      [_leads, count] = await Promise.all([
        this.Lead.find({
          buyer: userId,
        })
          .populate('broker', 'firstName lastName photo email contact')
          .populate('buyer', 'firstName lastName photo')
          .populate('listingID', '+companyName')
          .sort('-createdAt -updatedAt')
          .lean(),
        this.Lead.countDocuments({
          buyer: userId,
        }),
      ]);
    } else {
      [_leads, count] = await Promise.all([
        this.Lead.find({
          buyer: userId,
        })
          .skip(skip)
          .limit(limit)
          .populate('broker', 'firstName lastName photo email contact')
          .populate('buyer')
          .populate([
            {
              path: 'listingID',
              select: '+companyName +owner',
              populate: { path: 'category owner' },
            },
          ])
          .sort('-createdAt -updatedAt')
          .lean(),
        this.Lead.countDocuments({
          buyer: userId,
        }),
      ]);
    }

    return {
      totalCount: count,
      leads: _leads as ILead[],
    };
  }

  async getListingsOfABroker(
    userId: string,
    query: pagination,
  ): Promise<{ totalCount: number; ownedBusiness: IBusiness[] }> {
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const [business, count] = await Promise.all([
      this.Business.find({
        broker: { $in: [userId] },
      })
        .populate('owner', 'firstName lastName')
        .populate('broker', 'firstName lastName')
        .populate('category', 'name')
        .select('+companyName')
        .sort('-createdAt -updatedAt')
        .skip(skip)
        .limit(limit)
        .lean(),

      this.Business.countDocuments({
        broker: { $in: [userId] },
      }),
    ]);

    return {
      totalCount: count,
      ownedBusiness: business as IBusiness[],
    };
  }

  async getOutsideUsers(
    query: pagination,
    userType: string,
    search: string,
  ): Promise<{ totalCount: number; results: number; data: IUser[] }> {
    let user = [];
    let q: any = {
      ...(search && {
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
        ],
      }),
    };
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    if ([undefined, null, 'undefined', 'null'].includes(userType))
      userType = 'all';

    if (userType == 'all') {
      q = {
        ...q,
        role: {
          $in: [
            'banker',
            'attorney',
            'accountant',
            'financial-analyst',
            'buyer-concierge',
            'seller-concierge',
            'executive',
          ],
        },
      };
    } else if (userType == 'outside-roles') {
      q = {
        ...q,
        role: {
          $in: ['banker', 'attorney', 'accountant', 'co-broker', 'job-seeker'],
        },
      };
    } else if (userType == 'admin-roles') {
      q = {
        ...q,
        role: {
          $in: [
            'financial-analyst',
            'buyer-concierge',
            'seller-concierge',
            'executive',
          ],
        },
      };
    } else {
      q = { ...q, role: { $in: [userType] } };
    }

    if (query.page == undefined && query.limit == undefined) {
      user = await this.User.find(q)
        .populate('vipList')
        .sort('-createdAt -updatedAt')
        .lean();
    } else {
      user = await this.User.find(q)
        .populate('vipList')
        .sort('-createdAt -updatedAt')
        .skip(skip)
        .limit(limit)
        .lean();
    }

    const count = await this.User.countDocuments(q).lean();

    return {
      totalCount: count as number,
      results: user.length as number,
      data: user as IUser[],
    };
  }

  async getUsersAccToParams(
    params: {
      interest: boolean;
      city: string;
      subscribed: boolean;
      onlyBuyer: boolean;
      zipCode: number;
      search: string;
      statuses: string[];
      businessIds: string[];
      // query: pagination;
    },
    // contactType: need explanation
  ): Promise<{ users: IUser[]; countDoc: number }> {
    let {
      city,
      interest,
      onlyBuyer,
      // query,
      search,
      statuses,
      subscribed,
      zipCode,
      businessIds,
    } = params;
    // for pagination
    // const page = query.page * 1 || 1;
    // const limit = query.limit * 1 || 40;
    // const skip = (page - 1) * limit;

    const interestStatuses = [
      'inquired',
      'nda-submitted',
      'nda-signed',
      'under-negotiation',
      'under-contract',
      'sold',
      'not-interested',
      'not-qualified',
    ];

    let dbQuery = {
      ...(!!city && { city }),
      ...(isBoolean(subscribed) && { isCampaignAllowed: subscribed }),
      ...(!!zipCode && { zipCode }),
      ...(isBoolean(onlyBuyer) && {
        ownedBusiness: { $exists: true, $eq: [] },
      }),
      ...(!!search && {
        $or: [
          { firstName: new RegExp(search, 'i') },
          { lastName: new RegExp(search, 'i') },
        ],
      }),
    };

    if ([true, 'true'].includes(interest) || businessIds?.length > 0) {
      let _q = {};

      if (matchRoles(interestStatuses, statuses?.length > 0 ? statuses : [])) {
        _q = {
          status: { $in: statuses?.length > 0 ? statuses : interestStatuses },
        };
      }

      if (businessIds?.length > 0) {
        _q = { ..._q, listingID: { $in: businessIds } };
      }

      const leads = await this.Lead.find(_q)
        .select('buyer')
        .distinct('buyer')
        .lean();

      dbQuery['_id'] = { $in: leads };
    }

    console.log({ ...dbQuery, role: 'buyer' });
    const users = await this.User.find({ ...dbQuery, role: 'buyer' })
      .select('firstName lastName photo email role city leadInterested contact')
      // .skip(skip)
      // .limit(limit)
      .lean();

    const countDoc = await this.User.countDocuments({
      ...dbQuery,
      role: 'buyer',
    });

    return { users: users as IUser[], countDoc };
  }

  async getBuyersFromBusinessInterests(
    businessIds: string[],
  ): Promise<{ users: IUser[]; countDoc: number }> {
    console.log(businessIds);

    const leads = await this.Lead.find({ listingID: { $in: businessIds } })
      .distinct('buyer')
      .lean();

    console.log({ leads });

    const users = await this.User.find({ _id: { $in: leads } })
      .select('firstName lastName photo email role city leadInterested contact')
      .lean();

    const countDoc = await this.User.countDocuments({
      _id: { $in: leads },
    });

    return { users: users as IUser[], countDoc };
  }

  async deleteUser(userId: string): Promise<IUser> {
    const user = await this.User.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    if (!user.role.includes('seller') && !user.role.includes('buyer'))
      throw new BadRequestException('You can not delete this type of user');

    if (
      user.ownedBusiness.length > 0 ||
      user.leadInterested.length > 0 ||
      user.ndaSubmitted.length > 0 ||
      user.ndaSigned.length > 0
    )
      throw new BadRequestException('You can not delete this user');

    await Promise.all([
      this.User.findByIdAndDelete(userId),
      this.s3Storage.deleteImage(user.photo),
    ]);

    return user as IUser;
  }
}
