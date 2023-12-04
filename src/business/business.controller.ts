import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { LeadsService } from 'src/leads/leads.service';
import { RolesGuard } from 'src/roles-guard.guard';
import { IUser } from 'src/users/interfaces/user.interface';
import { ErrorHanldingFn, imageFileFilter } from 'src/utils/utils.helper';
import { S3Storage } from 'src/utils/utils.s3';
import { pagination } from 'src/utils/utils.types';
import { GetUser, Roles } from '../auth/decorators/user.decorator';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { CreateDraftBusinessDto } from './dto/create-draft.dto';
import { OwnerTemplateDto } from './dto/owner-template.dto';
import { NotesDto, UpdateBusinessDto } from './dto/update-business.dto';
import { UpdateDraftBusinessDto } from './dto/update-draft.dto';

@Controller({ path: '/api/v1/business' })
export class BusinessController {
  constructor(
    private readonly businessService: BusinessService,
    private readonly leadService: LeadsService,
    private readonly s3Storage: S3Storage,
  ) {}

  @Get('/')
  @UseGuards(AuthGuard(), RolesGuard)
  async getAllBusinessWithFilteration(
    @Query() query: pagination,
    @GetUser() user: IUser,
    @Query('city') city?: string,
    @Query('price') price?: number,
    @Query('category') category?: string,
    @Query('brokerId') brokerId?: string,
  ) {
    try {
      const rs = await this.businessService.getAllBusinessWithFilteration(
        query,
        user,
        city,
        price,
        category,
        brokerId,
      );
      return { ...rs };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/public')
  async getAllBusinessForPublic(
    @Query() query: pagination,
    @Query('city') city?: string,
    @Query('price') price?: number,
    @Query('category') category?: string,
    @Query('brokerId') brokerId?: string,
  ) {
    try {
      const rs = await this.businessService.getAllBusinessForPublic(
        query,
        city,
        price,
        category,
        brokerId,
      );
      return { ...rs };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/broker')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('broker')
  async getAllAssignedBusinessForBroker(
    @Query() query: pagination,
    @Query('search') search: string,
    @GetUser() user: IUser,
  ) {
    try {
      const rs = await this.businessService.getAllAssignedBusinessForBroker(
        query,
        user,
        search,
      );
      return { ...rs };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/cities')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async businessCities() {
    try {
      const cities = await this.businessService.businessCities();

      return { data: { cities } };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/categories')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async businessCategories() {
    try {
      const categories = await this.businessService.businessCategories();

      return { data: { categories } };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/search-for-mails')
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles('admin', 'buyer')
  async searchBusinessForMails(@Query('search') search: string) {
    try {
      const data = await this.businessService.searchBusinessForMails(search);

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/:businessId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('buyer')
  async getSingleBusiness(
    @Param('businessId') businessId: string,
    @GetUser() user: IUser,
  ) {
    try {
      const rs = await this.businessService.getSingleBusiness(businessId, user);
      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  // --------------> ADMIN & BROKER CONTROLLERS <--------------

  @Get('/admin/all')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getAllBusinessForAdmin(
    @Query() query: pagination,
    @Query('status') status: string,
    @Query('search') search: string,
  ) {
    try {
      const rs = await this.businessService.getAllBusinessForAdmin(
        query,
        status,
        search,
      );
      return { ...rs };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/admin/drafts')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getAllBusinessDraftsForAdmin(
    @Query() query: pagination,
    @Query('status') status: string,
    @Query('search') search: string,
  ) {
    try {
      const rs = await this.businessService.getAllBusinessDraftsForAdmin(
        query,
        status,
        search,
      );
      return { ...rs };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  // --------------> ADMIN CONTROLLERS <--------------

  @Post('/create')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async createBusiness(
    @GetUser() user: IUser,
    @Body() createBusinessDto: CreateBusinessDto,
  ) {
    try {
      const rs = await this.businessService.createBusiness(
        user,
        createBusinessDto,
      );

      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/create-draft')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async createDraft(@Body() createDraftBusinessDto: CreateDraftBusinessDto) {
    try {
      const data = await this.businessService.createDraft(
        createDraftBusinessDto,
      );

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/update-draft-to-business')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateDraftToBusiness(
    @GetUser() user: IUser,
    @Body('draftId') draftId: string,
  ) {
    try {
      const data = await this.businessService.updateDraftToBusiness(
        user,
        draftId,
      );

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/draft/:draftId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async getSingleDraft(@Param('draftId') draftId: string) {
    try {
      const data = await this.businessService.getSingleDraft(draftId);
      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/assign-buyer-to-dataroom')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async assignedBuyerToDataRoom(
    @Body('businessId') businessId: string,
    @Body('userIds') userIds: string[],
    @GetUser() user: IUser,
  ) {
    try {
      const rs = await this.businessService.assignBuyersToDataRoom(
        businessId,
        userIds,
        user,
      );
      return { data: rs };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/unassign-buyer-from-dataroom')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async unAssignBuyersToDataRoom(
    @Body('businessId') businessId: string,
    @Body('userId') userId: string,
    @GetUser() user: IUser,
  ) {
    try {
      const rs = await this.businessService.unAssignBuyersToDataRoom(
        businessId,
        userId,
        user,
      );
      return { data: rs };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/notes')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateNotes(@Body() notesDto: NotesDto) {
    try {
      const rs = await this.businessService.updateNotes(notesDto);
      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/update')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateBusiness(
    @Body() updateBusinessDto: UpdateBusinessDto,
    @GetUser() user: IUser,
  ) {
    try {
      const rs = await this.businessService.updateBusiness(
        updateBusinessDto,
        user,
      );
      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/update-draft')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async updateDraft(
    @Body('draftId') draftId: string,
    @Body() updateDraftBusinessDto: UpdateDraftBusinessDto,
  ) {
    try {
      const data = await this.businessService.updateDraft(
        draftId,
        updateDraftBusinessDto,
      );
      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/update-owner-template')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async sendOwnerTemplate(@Body() ownerTemplate: OwnerTemplateDto) {
    try {
      const data = await this.businessService.sendOwnerTemplate(ownerTemplate);
      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/update-images')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 10 },
        { name: 'demographics', maxCount: 10 },
        { name: 'financialsAnalysis', maxCount: 10 },
        { name: 'financialsCSVImages', maxCount: 10 },
        { name: 'dummyImage', maxCount: 1 },
      ],
      {
        fileFilter: imageFileFilter,
        limits: { fileSize: 2_000_000 },
      },
    ),
  )
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateImagesAndCsv(
    @Body('slug') slug: string,
    @Body() updateBusinessDto: UpdateBusinessDto,
    @UploadedFiles() files: any,
  ) {
    try {
      const images = await this.s3Storage.uploadFiles(files);

      const rs = await this.businessService.updateImagesAndCsv(
        slug,
        updateBusinessDto,
        images,
      );
      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/update-draft-images')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'images', maxCount: 10 },
        { name: 'demographics', maxCount: 10 },
        { name: 'financialsAnalysis', maxCount: 10 },
        { name: 'financialsCSVImages', maxCount: 10 },
        { name: 'dummyImage', maxCount: 1 },
      ],
      {
        fileFilter: imageFileFilter,
        limits: { fileSize: 2_000_000 },
      },
    ),
  )
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async updateDraftImagesAndCsv(
    @Body('draftId') draftId: string,
    @Body() updateDraftBusinessDto: UpdateDraftBusinessDto,
    @UploadedFiles() files: any,
  ) {
    try {
      const images = await this.s3Storage.uploadFiles(files);

      const data = await this.businessService.updateDraftImagesAndCsv(
        draftId,
        updateDraftBusinessDto,
        images,
      );
      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  // @Patch('/update-status')
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles(
  //   'admin',
  //   'financial-analyst',
  //   'buyer-concierge',
  //   'seller-concierge',
  //   'executive',
  // )
  // async updateBusinessStatus(
  //   @Body('slug') slug: string,
  //   @Body('status') status: string,
  // ) {
  //   try {
  //     const rs = await this.businessService.updateBusinessStatus(slug, status);
  //     return rs;
  //   } catch (error) {
  //     throw ErrorHanldingFn(error);
  //   }
  // }

  @Get('/general/:slug')
  @UseGuards(AuthGuard(), RolesGuard)
  async getSingleBusinessWithSlug(
    @Param('slug') slug: string,
    @GetUser() user: IUser,
  ) {
    try {
      const data = await this.businessService.getSingleBusinessWithSlug(
        slug,
        user,
      );

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/with-slug/:slug')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getSingleBusinessWithSlugForAdmin(@Param('slug') slug: string) {
    try {
      const [business, leads, vipUsers] = await Promise.all([
        this.businessService.getSingleBusinessWithSlugForAdmin(slug),
        this.leadService.adminGetLeadsBySlug(slug),
        this.businessService.adminGetVipUsersOfBusiness(slug),
      ]);

      return { data: { business, leads, vipUsers } };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/interested-listings/:slug')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getInterestedListingsOfBusinessWithSlugForAdmin(
    @Param('slug') slug: string,
    @Query() query: pagination,
    @Query('status') status: string,
    @Query('search') search: string,
  ) {
    try {
      const { leads, totalCount } =
        await this.businessService.getInterestedListingsOfBusinessWithSlugForAdmin(
          slug,
          query,
          status,
          search,
        );

      return { data: leads, results: leads.length, totalCount };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Delete('/delete-draft/:draftId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async deleteDraft(@Param('draftId') draftId: string) {
    try {
      const data = await this.businessService.deleteDraft(draftId);

      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }
}
