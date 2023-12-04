import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { RolesGuard } from 'src/roles-guard.guard';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { ResetPasswordUserDto } from 'src/users/dto/resetPassword-user.dto';
import { UpdateUserPasswordDto } from 'src/users/dto/updatePassword-user.dto';
import { IUser } from 'src/users/interfaces/user.interface';
import { ErrorHanldingFn } from 'src/utils/utils.helper';
import { S3Storage } from 'src/utils/utils.s3';
import { AuthService } from './auth.service';
import { GetUser } from './decorators/user.decorator';

@Controller({
  path: '/api/v1/auth',
})
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly s3Storage: S3Storage,
    private readonly configService: ConfigService,
  ) {}

  // @Post('/upload')
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles('super-admin', 'admin', 'trainee')
  // @UseInterceptors(
  //   FileFieldsInterceptor(
  //     [
  //       { name: 'avatar', maxCount: 1 },
  //       { name: 'background', maxCount: 1 },
  //     ],
  //     {
  //       fileFilter: multerPdfFilter,
  //       limits: { fileSize: 3000000 }, // In bytes: 2000000 bytes = 3 MB
  //       // dest: join(__dirname, '..', '..', '..', 'src', 'upload'),
  //     },
  //   ),
  // )
  // async name(
  //   @GetUser() user: IUser,
  //   @UploadedFiles() files: Array<Express.Multer.File>,
  // ) {
  //   return { message: 'guarded', user: user?.email || 9, files };
  // }

  // @Post('/upload-s3')
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles('super-admin', 'admin', 'trainee')
  // @UseInterceptors(
  //   FileFieldsInterceptor(
  //     [
  //       { name: 'avatar', maxCount: 2 },
  //       { name: 'background', maxCount: 1 },
  //     ],
  //     /*      {
  //       fileFilter: imageFileFilter,
  //       limits: { fileSize: 2000000 },
  //       // dest: join(__dirname, '..', '..', '..', 'src', 'upload'),
  //     }, */
  //   ),
  // )
  // async nameS3(
  //   @GetUser() user: IUser,
  //   @UploadedFiles() files: Array<Express.Multer.File>,
  // ) {
  //   const rs = await this.s3Storage.uploadFiles(files);

  //   return { message: 'guarded', user: user?.email || 9, rs };
  // }

  @Post('/signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    try {
      const data = await this.authService.signup(createUserDto);

      return {
        status: 'success',
        data,
      };
    } catch (error) {
      console.log({ error });
      return ErrorHanldingFn(error);
    }
  }

  @Post('/login')
  async login(@Body() loginUserDto: LoginUserDto) {
    try {
      const data = await this.authService.login(loginUserDto);

      return { status: 'success', data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/admin/login')
  async adminLogin(@Body() loginUserDto: LoginUserDto) {
    try {
      const data = await this.authService.adminLogin(loginUserDto);

      return { status: 'success', data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/logout')
  @UseGuards(AuthGuard(), RolesGuard)
  async logout(
    @Body('fcmToken') fcmToken: string,
    @GetUser() user: IUser,
    @Res(/* { passthrough: true } */) res: Response,
  ) {
    try {
      await this.authService.logout(fcmToken, user._id);

      return res.status(HttpStatus.OK).json({
        status: 'success',
        message: 'logout success',
      });
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/forgotPassword')
  async forgotPassword(@Body('email') email: string, @Req() req: Request) {
    try {
      const rs = await this.authService.forgotPassword(
        email,
        req.protocol,
        req.get('host'),
      );

      return { ...rs };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Patch('/updateMyPassword')
  @UseGuards(AuthGuard(), RolesGuard)
  async updatePassword(
    @Body() updateUserPasswordDto: UpdateUserPasswordDto,
    @GetUser() user: IUser,
  ) {
    try {
      const rs = await this.authService.updatePassword(
        updateUserPasswordDto,
        user,
      );

      return rs;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Post('/resetPassword/:token')
  async resetPassword(
    @Body() resetPasswordUserDto: ResetPasswordUserDto,
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    try {
      resetPasswordUserDto.token = token;
      const rs = await this.authService.resetPassword(resetPasswordUserDto);

      if (rs) {
        res.render('thankyou', {
          token,
          baseUrl: this.configService.get('API_HOSTED_URL'),
        });
      } else {
        throw new BadRequestException({
          message: 'Sorry cannot set password at the moment.',
        });
      }
    } catch (error) {
      res.render('errorPage', {
        message: error.message,
        baseUrl: this.configService.get('API_HOSTED_URL'),
      });
    }
  }

  @Get('/resetPassword/:token')
  async resetPasswordToken(
    @Res() res: Response,
    @Param('token') token: string,
  ) {
    try {
      res.render('password-page', {
        token,
        baseUrl: this.configService.get('API_HOSTED_URL'),
      });
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
