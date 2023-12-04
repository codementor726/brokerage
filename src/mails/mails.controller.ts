import {
  Controller,
  Get,
  UseGuards,
  Post,
  Body,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { MailsService } from './mails.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/roles-guard.guard';
import { GetUser, Roles } from 'src/auth/decorators/user.decorator';
import { IUser } from 'src/users/interfaces/user.interface';
import { ErrorHanldingFn, imageFileFilter } from 'src/utils/utils.helper';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { S3Storage } from 'src/utils/utils.s3';

@Controller('/api/v1/mails')
export class MailsController {
  constructor(
    private readonly mailsService: MailsService,
    private readonly s3Storage: S3Storage,
  ) {}

  @Get('/')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'buyer',
    'admin',
    'broker',
    'seller',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
    // 'banker',
    // 'attorney',
    // 'accountant',
  )
  async fetchMails(
    @Query('search') search: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('mood') mood: string,
    @GetUser() user: IUser,
    // @Query('userId') userId: string,
  ) {
    try {
      if (!user.imap.user || !user.imap.password)
        throw new BadRequestException(
          'Please configure Email credentials first',
        );

      console.log('user.imap', user.imap);

      const data = await this.mailsService.readInboxMail(
        user.imap,
        from,
        to,
        search,
        mood,
      );

      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  // @Post('/test-credentials')
  // async testCredentials(@Body() body: any) {
  //   try {
  //     const [err, data] = await this.mailsService.testCredentials({
  //       user: body.user,
  //       password: body.password,
  //     });
  //     if (err) throw err;
  //     return { data };
  //   } catch (error) {
  //     return ErrorHanldingFn(error);
  //   }
  // }

  // @Get('/test')
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles(
  //   'buyer',
  //   'admin',
  //   'broker',
  //   'seller',
  //   'financial-analyst',
  //   'buyer-concierge',
  //   'seller-concierge',
  //   'executive',
  //   // 'banker',
  //   // 'attorney',
  //   // 'accountant',
  // )
  // async test(
  //   @Query('search') search: string,
  //   @Query('from') from: string,
  //   @Query('to') to: string,
  //   @Query('mood') mood: string,
  //   @GetUser() user: IUser,
  //   // @Query('userId') userId: string,
  // ) {
  //   try {
  //     if (!user.imap.user || !user.imap.password)
  //       throw new BadRequestException(
  //         'Please configure Email credentials first',
  //       );

  //     const data = await this.mailsService.test(user.imap);

  //     return { data };
  //   } catch (error) {
  //     return ErrorHanldingFn(error);
  //   }
  // }

  /* 
  For the Reports Section, we need this:

  Report of all contacts with filters of:
  listings of interest
  City
  Contact type
  Unsubscribed

  Once report is generated, we need a button to send a bulk email to filtered results
  */
  // @Post('/report-filter')
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles(
  //   'admin',
  //   'broker',
  //   'financial-analyst',
  //   'buyer-concierge',
  //   'seller-concierge',
  //   'executive',
  // )
  // async reportFilter(@GetUser() user: IUser, @Body() user: reportFilterDto) {
  //   try {
  //     if (!user.imap.user || !user.imap.password)
  //       throw new BadRequestException(
  //         'Please configure Email credentials first',
  //       );

  //     const images = await this.s3Storage.uploadFiles(files);

  //     const rs = await this.mailsService.sendMail(
  //       user,
  //       email,
  //       subject,
  //       message,
  //       images,
  //     );
  //     return rs;
  //   } catch (error) {
  //     throw ErrorHanldingFn(error);
  //   }
  // }

  // @Post('/')
  // @UseInterceptors(
  //   FileFieldsInterceptor([{ name: 'attachment', maxCount: 10 }], {
  //     fileFilter: imageFileFilter,
  //     limits: { fileSize: 5_000_000 },
  //   }),
  // )
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles(
  //   'admin',
  //   'broker',
  //   'financial-analyst',
  //   'buyer-concierge',
  //   'seller-concierge',
  //   'executive',
  // )
  // async sendMail(
  //   @GetUser() user: IUser,
  //   @Body('email') email: string,
  //   @Body('subject') subject: string,
  //   @Body('message') message: string,
  //   @UploadedFiles() files: any,
  // ) {
  //   try {
  //     if (!user.imap.user || !user.imap.password)
  //       throw new BadRequestException(
  //         'Please configure Email credentials first',
  //       );

  //     const images = await this.s3Storage.uploadFiles(files);

  //     const rs = await this.mailsService.sendMail(
  //       user,
  //       email,
  //       subject,
  //       message,
  //       images,
  //     );
  //     return rs;
  //   } catch (error) {
  //     throw ErrorHanldingFn(error);
  //   }
  // }

  @Post('/send-email')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'attachment', maxCount: 10 }], {
      fileFilter: imageFileFilter,
      limits: { fileSize: 6_000_000 },
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
  async sendMail(
    @GetUser() user: IUser,
    @Body('email') email: string,
    @Body('subject') subject: string,
    @Body('message') message: string,
    @Body('cc') cc: string[],
    @UploadedFiles() files: any,
  ) {
    try {
      if (!user.imap.user || !user.imap.password)
        throw new BadRequestException(
          'Please configure Email credentials first',
        );

      const images = await this.s3Storage.uploadFiles(files);

      const rs = await this.mailsService.sendMail(
        user,
        email,
        subject,
        message,
        cc,
        images,
      );
      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/delete')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    // 'buyer',
    'admin',
    'broker',
    // 'seller',
    // 'banker',
    // 'attorney',
    // 'accountant',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async deleteMail(
    @Body('uids') uids: number[] | number,
    @GetUser() user: IUser,
    // @Query('userId') userId: string,
  ) {
    try {
      if (!user.imap.user || !user.imap.password)
        throw new BadRequestException(
          'Please configure Email credentials first',
        );

      return await this.mailsService.deleteMail(user.imap, uids);
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Post('/add/box')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async addToMailBox(
    @Body('uids') uids: number[],
    @Body('box') box: string,
    @GetUser() user: IUser,
  ) {
    try {
      if (!box || !(uids?.length >= 0))
        throw new BadRequestException('payload is missing');

      if (!user.imap.user || !user.imap.password)
        throw new BadRequestException(
          'Please configure Email credentials first',
        );

      return await this.mailsService.addToMailBox(user.imap, uids, box);
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
