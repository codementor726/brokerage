import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import {
  Body,
  Delete,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common/decorators';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Roles } from './auth/decorators/user.decorator';
import { RolesGuard } from './roles-guard.guard';
import { imageFileFilter } from './utils/utils.helper';
import { S3Storage } from './utils/utils.s3';
@Controller()
export class AppController {
  constructor(
    private readonly s3Storage: S3Storage,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  greetings(): { message: string } {
    return { message: 'Welcome to the Brokerage APIs' };
  }

  @Post('/api/v1/upload/image')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'photo', maxCount: 3 }], {
      fileFilter: imageFileFilter,
      limits: { fileSize: 3_000_000 },
    }),
  )
  async Images(@UploadedFiles() files: any): Promise<any> {
    const images = await this.s3Storage.uploadFiles(files);

    const keys = images?.photo?.map((image) => image?.key) || [];

    return { data: { keys } };
  }

  @Delete('/api/v1/delete/image')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    'broker',
  )
  async deleteImages(@Body('images') images: string[]): Promise<any> {
    const promises = images.map((image) => this.s3Storage.deleteImage(image));
    await Promise.all(promises);

    return;
  }

  @Get('/api/v1/images/:key')
  async serveImages(
    @Param('key') key: string,
    @Res() res: Response,
  ): Promise<any> {
    if (['undefined', undefined, null, 'null'].includes(key))
      return res.status(HttpStatus.BAD_REQUEST).json({
        status: 'fail',
        message: { error: ['media not found'] },
      });

    const params = {
      Bucket: this.configService.get('AWS_IMAGE_BUCKET_NAME'),
      Key: key,
    };

    res.set('Content-type', 'image/gif');

    return await this.s3Storage
      .getFileStream(params)
      .on('error', (err) => {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: { error: ['media not found'] },
        });
      })
      .pipe(res);
  }

  @Get('/api/v1/media/:key')
  async serveMedia(
    @Param('key') key: string,
    @Res() res: Response,
  ): Promise<any> {
    if (['undefined', undefined, null, 'null'].includes(key))
      return res.status(HttpStatus.BAD_REQUEST).json({
        status: 'fail',
        message: { error: ['media not found'] },
      });

    const params = {
      Bucket: this.configService.get('AWS_IMAGE_BUCKET_NAME'),
      Key: key,
    };

    return await this.s3Storage
      .getFileStream(params)
      .on('error', (err) => {
        return res.status(HttpStatus.BAD_REQUEST).json({
          message: { error: ['media not found'] },
        });
      })
      .pipe(res);
  }
}
