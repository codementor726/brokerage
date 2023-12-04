import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Model } from 'mongoose';
import { RolesGuard } from 'src/roles-guard.guard';
import { ErrorHanldingFn, imageFileFilter } from 'src/utils/utils.helper';
import { S3Storage } from 'src/utils/utils.s3';
import { UtilsStripeService } from 'src/utils/utils.stripe';
import { pagination } from 'src/utils/utils.types';
import { GetUser, Roles } from '../auth/decorators/user.decorator';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import {
  CreateBulkUserDTO,
  CreateSpecialUser,
} from './dto/create-specialUser.dto';
import { UpdateImapDto } from './dto/update-imap.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUser } from './interfaces/user.interface';
import { UsersService } from './users.service';

@Controller('/api/v1/users')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly StripeService: UtilsStripeService,
    @InjectModel('User') private readonly User: Model<IUser>,

    private readonly s3Storage: S3Storage /*private readonly configService: ConfigService, */,
  ) {}

  @Get('/profile')
  @UseGuards(AuthGuard(), RolesGuard)
  async me(@GetUser() _user: IUser) {
    try {
      const data = await this.userService.myProfile(_user);

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/get-all-users-for-room')
  @UseGuards(AuthGuard(), RolesGuard)
  async getAllUsersForRoom(
    @GetUser() user: IUser,
    @Query('role') role: string,
    @Query('searchName') searchName: string,
  ) {
    try {
      const data = await this.userService.getAllUsersForRoom(
        user,
        role,
        searchName,
      );
      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/cities')
  @UseGuards(AuthGuard(), RolesGuard)
  async getUserCities() {
    try {
      const data = await this.userService.getUserCities();
      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/add-noteS')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async addNotes(
    @GetUser() user: IUser,
    @Body('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      const rs = await this.userService.addNotes(user, userId, updateUserDto);
      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/updateMe')
  @UseGuards(AuthGuard(), RolesGuard)
  async updateMe(@Body() updateUserDto: UpdateUserDto, @GetUser() user: IUser) {
    try {
      const rs = await this.userService.updateMe(updateUserDto, user);
      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/updatePhoto')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'photo', maxCount: 1 }], {
      fileFilter: imageFileFilter,
      limits: { fileSize: 2_000_000 },
    }),
  )
  @UseGuards(AuthGuard(), RolesGuard)
  async updatePhoto(
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFiles() files: any,
    @GetUser() user: IUser,
  ) {
    try {
      const images = await this.s3Storage.uploadFiles(files);

      if (images?.photo) updateUserDto.photo = images?.photo[0].key;

      const rs = await this.userService.updateMe(updateUserDto, user);

      await this.s3Storage.deleteImage(user.photo);

      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/attach-payment-methods')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('company')
  async attachedPaymentMethod(
    @GetUser() user: IUser,
    @Body('pmId') pmId: string,
  ) {
    try {
      if (!pmId) throw new NotFoundException('Payment method id is required');

      const paymentMethods = await this.StripeService.attachedPaymentMethod(
        user,
        pmId,
      );
      return { data: paymentMethods };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/detach-payment-methods')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('company')
  async detachPaymentMethod(
    @GetUser() user: IUser,
    @Body('pmId') pmId: string,
  ) {
    try {
      if (!pmId) throw new NotFoundException('Payment method id is required');

      const paymentMethods = await this.StripeService.detachPaymentMethod(
        user,
        pmId,
      );
      return { data: paymentMethods };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/payment-methods')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('company')
  async getPaymentMethods(@GetUser() user: IUser) {
    try {
      const paymentMethods = await this.StripeService.getPaymentMethods(user);
      return { data: paymentMethods };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  // @Patch('/add-to-nda')
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles(
  //   'admin',
  //   'broker',
  //   // 'financial-analyst',
  //   // 'buyer-concierge',
  //   // 'seller-concierge',
  //   'executive',
  // )
  // async addUserToNDAList(
  //   @Body('userId') userId: string,
  //   @Body('businessId') businessId: string,
  // ) {
  //   try {
  //     const data = await this.userService.addUserToNDAList(userId, businessId);

  //     return { data };
  //   } catch (error) {
  //     throw ErrorHanldingFn(error);
  //   }
  // }

  @Patch('/update-imap')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'buyer',
    'seller',
    'banker',
    'attorney',
    'accountant',
    'job-seeker',
    'co-broker',
  )
  async updateMailFields(
    @Body() updateImapDto: UpdateImapDto,
    @GetUser() user: IUser,
  ) {
    try {
      const rs = await this.userService.updateMailFields(updateImapDto, user);
      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/get-all-admins')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async getAllAdmins() {
    try {
      const data = await this.userService.getAllAdmins();

      return { results: data.length, data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  //////////////////////////////////////////////////
  //  ==================> Admin <===================
  //////////////////////////////////////////////////

  @Get('/admin/outside-users')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async getOutsideUsers(
    @Query() query: pagination,
    @Query('userType') userType: string,
    @Query('search') search: string,
  ) {
    try {
      const data = await this.userService.getOutsideUsers(
        query,
        userType,
        search,
      );

      return { ...data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/admin/get-buyers-from-business')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async getBuyersFromBusinessInterests(
    @Body('businessIds') businessIds: string[],
  ) {
    try {
      const data = await this.userService.getBuyersFromBusinessInterests(
        businessIds,
      );

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/admin/get-users-acc-to-param')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async getUsersAccToParams(
    @Body('interest') interest: boolean,
    @Body('city') city: string,
    @Body('statuses') statuses: string[],
    @Body('zipCode') zipCode: number,
    @Body('subscribed') subscribed: boolean,
    @Body('search') search: string,
    @Body('onlyBuyer') onlyBuyer: boolean,
    @Body('businessIds') businessIds: string[],
  ) {
    try {
      const data = await this.userService.getUsersAccToParams({
        interest,
        city,
        subscribed,
        search,
        onlyBuyer,
        statuses,
        zipCode,
        businessIds,
      });

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/admin/owner-broker')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async adminGetOwnerAndBrokers(@Query('userType') userType: string) {
    try {
      const data = await this.userService.adminGetOwnerAndBrokers(userType);

      return { ...data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/admin/create')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    // 'financial-analyst',
    // 'buyer-concierge',
    // 'seller-concierge',
    'broker',
    'executive',
  )
  async adminCreateSpecialUser(@Body() createSpecialUser: CreateSpecialUser) {
    try {
      const updatedUser = await this.userService.adminCreateSpecialUser(
        createSpecialUser,
      );

      return { data: updatedUser };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/admin/user/bulk')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async adminCreateBulkSpecialUser(
    @GetUser() user: IUser,
    @Body() createBulkUsers: CreateBulkUserDTO,
  ) {
    try {
      const updatedUser = await this.userService.adminCreateBulkSpecialUser(
        user,
        createBulkUsers,
      );

      return { data: updatedUser };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/admin/add-to-vip')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    // 'financial-analyst',
    // 'buyer-concierge',
    // 'seller-concierge',
    'broker',
    'executive',
  )
  async adminAddUserToVipList(
    @Body('users') users: string[],
    @Body('removeUser') removeUser: string,
    @Body('businessId') businessId: string,
    @GetUser() user: IUser,
  ) {
    try {
      const data = await this.userService.adminAddUserToVipList(
        users,
        removeUser,
        businessId,
        user,
      );

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/admin/update-user')
  @UseGuards(AuthGuard(), RolesGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'photo', maxCount: 1 }], {
      fileFilter: imageFileFilter,
      limits: { fileSize: 2_000_000 },
    }),
  )
  async adminUpdateUser(
    @Body('userId') userId: string,
    @Body() updateUserDto: AdminUpdateUserDto,
    @UploadedFiles() files: any,
  ) {
    try {
      const images = await this.s3Storage.uploadFiles(files);

      const data = await this.userService.adminUpdateUser(
        userId,
        updateUserDto,
        images,
      );
      return data;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/active/:userId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async deactivateUser(
    @Body('active') active: boolean,
    @Param('userId') userId: string,
  ) {
    try {
      const updatedUser = await this.userService.deactivateUser(active, userId);

      return { data: updatedUser };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/buyers-sellers/all')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async getBuyersSellersUsers(
    @Query() query: pagination,
    @Query('status') status: string,
    @Query('search') search: string,
    @Query('designation') designation: string,
  ) {
    try {
      const data = await this.userService.getBuyersSellersUsers(
        query,
        status,
        search,
        designation,
      );
      return { ...data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/brokers/all')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getBrokers(
    @Query() query: pagination,
    @Query('search') search: string,
  ) {
    try {
      const data = await this.userService.getBrokers(query, search);
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/broker/details/:brokerId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getDetailsOfABroker(@Param('brokerId') brokerId: string) {
    try {
      const data = await this.userService.getDetailsOfABroker(brokerId);
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/details/:userId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async getDetailsOfAUser(@Param('userId') userId: string) {
    try {
      const data = await this.userService.getDetailsOfAUser(userId);

      return { ...data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/owned-listings/:userId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'buyer',
    'seller',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'third-party-broker',
    'co-broker',
    'banker',
    'attorney',
    'accountant',
    'job-seeker',
  )
  async getListingsOfAUser(
    @Param('userId') userId: string,
    @Query() query: pagination,
    @GetUser() user: IUser,
  ) {
    try {
      const data = await this.userService.getListingsOfAUser(
        userId,
        query,
        user,
      );

      return { ...data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/interested-listings/:userId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'buyer',
    'seller',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getInterestedLeadsOfAUser(
    @Param('userId') userId: string,
    @Query() query: pagination,
  ) {
    try {
      const data = await this.userService.getInterestedLeadsOfAUser(
        userId,
        query,
      );

      return { ...data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/broker-listings/:userId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getListingsOfABroker(
    @Param('userId') userId: string,
    @Query() query: pagination,
  ) {
    try {
      const data = await this.userService.getListingsOfABroker(userId, query);

      return { ...data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Delete('/delete/:userId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async deleteUser(@Param('userId') userId: string) {
    try {
      const data = await this.userService.deleteUser(userId);

      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
