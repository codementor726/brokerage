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
import { GetUser, Roles } from 'src/auth/decorators/user.decorator';
import { RolesGuard } from 'src/roles-guard.guard';
import { IUser } from 'src/users/interfaces/user.interface';
import { ErrorHanldingFn, imageFileFilter } from 'src/utils/utils.helper';
import { S3Storage } from 'src/utils/utils.s3';
import { pagination } from 'src/utils/utils.types';
import { TemplatesService } from './templates.service';

@Controller({ path: '/api/v1/templates' })
export class TemplatesController {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly s3Storage: S3Storage,
  ) {}

  @Get('/')
  async getAllActiveTemplates(@Query() query: pagination) {
    try {
      const data = await this.templatesService.getAllActiveTemplates(query);
      return { results: data.length, data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/single/:templateId')
  @UseGuards(AuthGuard(), RolesGuard)
  async getSingleTemplate(@Param('templateId') templateId: string) {
    try {
      const data = await this.templatesService.getSingleTemplate(templateId);
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Post('/send-promotion-mails')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async sendTemplateMailsToUser(
    @Body('templateId') templateId: string,
    @Body('userIds') userIds: string[],
    @Body('cc') cc: string[],
    @GetUser() user: IUser,
  ) {
    try {
      const data = await this.templatesService.sendTemplateMailsToUser(
        templateId,
        userIds,
        cc,
        user,
      );
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Post('/send-mails-to-filtered-users')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async sendMailToAllFilteredUsers(
    @GetUser() user: IUser,
    @Body('userIds') userIds: string[],
    @Body('templateId') templateId: string,
    @Body('cc') cc: string[],
  ) {
    try {
      const data = await this.templatesService.sendMailToAllFilteredUsers({
        user,
        templateId,
        userIds,
        cc,
      });
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Post('/group-send-promotion-mails')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async groupSendTemplateMailsToUser(
    @GetUser() user: IUser,
    @Body('templateId') templateId: string,
    @Body('groupId') groupId: string,
    @Body('interestStatus') interestStatus: string[],
    @Body('listingIds') listingIds: string[],
    @Body('categoryIds') categoryIds: string[],
    @Body('cities') cities: string[],
    @Body('cc') cc: string[],
  ) {
    try {
      const data = await this.templatesService.groupSendTemplateMailsToUser({
        user,
        templateId,
        groupId,
        listingIds,
        interestStatus,
        categoryIds,
        cities,
        cc,
      });

      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  //   =================== ADMIN ONLY ======================

  @Post('/create')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'attachment', maxCount: 10 }], {
      fileFilter: imageFileFilter,
      limits: { fileSize: 2_000_000 },
    }),
  )
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async createTemplate(
    @Body('subject') subject: string,
    @Body('message') message: string,
    @UploadedFiles() files: any,
  ) {
    try {
      const images = await this.s3Storage.uploadFiles(files);

      const data = await this.templatesService.createTemplate(
        subject,
        message,
        images,
      );
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  // Update category by admin
  @Patch('/update')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'attachment', maxCount: 10 }], {
      fileFilter: imageFileFilter,
      limits: { fileSize: 2_000_000 },
    }),
  )
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateTemplate(
    @Body('id') id: string,
    @Body('subject') subject: string,
    @Body('message') message: string,
    @Body('deletedAttachments') deletedAttachments: string[],
    @Body('isActive') isActive: boolean,
    @UploadedFiles() files: any,
  ) {
    try {
      const images = await this.s3Storage.uploadFiles(files);

      const data = await this.templatesService.updateTemplate(
        id,
        subject,
        message,
        deletedAttachments,
        isActive,
        images,
      );
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Delete('/delete/:id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async deleteTemplate(@Param('id') id: string) {
    try {
      const data = await this.templatesService.deleteTemplate(id);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
  // get all address for admin
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
  async getTemplateAdmin(@Query() query: pagination) {
    try {
      const data = await this.templatesService.getTemplateAdmin(query);
      return { results: data.length, data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
