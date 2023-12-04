import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
  Param,
  Post,
  Body,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from 'src/roles-guard.guard';
import { ErrorHanldingFn, imageFileFilter } from 'src/utils/utils.helper';
import { S3Storage } from 'src/utils/utils.s3';
import { pagination } from 'src/utils/utils.types';
import { Roles } from '../auth/decorators/user.decorator';
import { ServicesService } from './services.service';

@Controller({ path: '/api/v1/services' })
export class ServicesController {
  constructor(
    private readonly serviceServices: ServicesService,
    private readonly s3Storage: S3Storage,
  ) {}

  @Get('/')
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles('admin','buyer', 'broker')
  async getServices(@Query() query: pagination, @Query('type') type: string) {
    try {
      const rs = await this.serviceServices.getServices(query, type);
      return { data: { ...rs } };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'image', maxCount: 1 }], {
      fileFilter: imageFileFilter,
      limits: { fileSize: 2_000_000 },
    }),
  )
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async createService(
    @Body('title') title: string,
    @Body('type') type: string,
    @UploadedFiles() files: any,
  ) {
    try {
      const image = await this.s3Storage.uploadFiles(files);

      const rs = await this.serviceServices.createService(title, type, image);
      return { data: rs };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/update')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'image', maxCount: 1 }], {
      fileFilter: imageFileFilter,
      limits: { fileSize: 2_000_000 },
    }),
  )
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async updateService(
    @Body('serviceId') serviceId: string,
    @Body('title') title: string,
    @Body('type') type: string,
    @Body('order') order: string,
    @UploadedFiles() files: any,
  ) {
    try {
      const image = await this.s3Storage.uploadFiles(files);

      const data = await this.serviceServices.updateService(
        serviceId,
        title,
        type,
        order,
        image,
      );
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Delete('/delete/:serviceId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async deleteService(@Param('serviceId') serviceId: string) {
    try {
      const data = await this.serviceServices.deleteService(serviceId);
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
