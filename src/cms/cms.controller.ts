import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/decorators/user.decorator';
import { RolesGuard } from 'src/roles-guard.guard';
import { ErrorHanldingFn, imageFileFilter } from 'src/utils/utils.helper';
import { S3Storage } from 'src/utils/utils.s3';
import { CmsService } from './cms.service';

@Controller({ path: '/api/v1/cms' })
export class CmsController {
  constructor(
    private readonly cmsService: CmsService,
    private readonly s3Storage: S3Storage,
  ) {}

  @Patch('/page/update')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'section2_icon1', maxCount: 1 },
        { name: 'section2_icon2', maxCount: 1 },
        { name: 'section3_image', maxCount: 1 },
        { name: 'section1_image', maxCount: 1 },
        { name: 'section2_image', maxCount: 1 },
        { name: 'section3_image', maxCount: 1 },
        { name: 'section4_image', maxCount: 1 },
        { name: 'section5_image', maxCount: 1 },
        { name: 'section6_image', maxCount: 1 },
        { name: 'footer_image', maxCount: 1 },
        { name: 'getInTouchImage', maxCount: 1 },
        { name: 'image', maxCount: 1 },
      ],
      {
        fileFilter: imageFileFilter,
        limits: { fileSize: 5_000_000 },
      },
    ),
  )
  async updatePage(
    @Body('pageName') pageName: string,
    @Body('_id') _id: string,
    @UploadedFiles() files: any,
    @Body() body: any,
  ) {
    try {
      const images = await this.s3Storage.uploadFiles(files);

      const doc = await this.cmsService.updatePage(pageName, images, _id, body);

      return { doc };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/page/all/new')
  async getDynamicPage(
    @Query('pages') pages: string,
    @Query('all') all: string,
  ) {
    try {
      const data = await this.cmsService.getDynamicPage(pages, all);
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  // get page of cms
  @Get('/page/:page')
  async getPage(
    @Param('page') page: string,
    @Query('testimonial') testimonial: string,
    @Query('faqs') faqs: string,
  ) {
    try {
      const cmsData = await this.cmsService.getPage(page, testimonial, faqs);
      return cmsData;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
