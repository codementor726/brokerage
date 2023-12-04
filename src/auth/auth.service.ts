import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { createHash } from 'crypto';
import { sign } from 'jsonwebtoken';
import { Model } from 'mongoose';
import { LoginUserDto } from 'src/users/dto/login-user.dto';
import { ResetPasswordUserDto } from 'src/users/dto/resetPassword-user.dto';
import { UpdateUserPasswordDto } from 'src/users/dto/updatePassword-user.dto';
import { IUser } from 'src/users/interfaces/user.interface';
import { EmailService } from 'src/utils/utils.email.service';
import { matchRoles } from 'src/utils/utils.helper';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import ShortUniqueId from 'short-unique-id';
import { AppConfigsService } from 'src/app-configs/app-configs.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User')
    private readonly User: Model<IUser>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly appConfigService: AppConfigsService,
  ) {}

  addFCMToken = (token) => {
    let obj = {};

    if (!!token)
      obj = {
        $addToSet: {
          fcmToken: token,
        },
      };

    return obj;
  };

  removeFCMToken = (token) => {
    let obj = {};

    if (!!token) obj = { $pull: { fcmToken: token } };

    return obj;
  };

  addPushNotificationIds_onLogin = async (userName, token) => {
    if (token && userName)
      await this.User.findOneAndUpdate(
        { userName },
        { $addToSet: { fcmToken: token } },
      );
  };

  signToken(id: string) {
    return sign({ id }, this.configService.get('JWT_SECRET'), {
      expiresIn: this.configService.get('JWT_EXPIRES_IN'),
    });
  }

  createSendToken(user: IUser) {
    const token = this.signToken(user._id);

    // Remove password from output
    user.password = undefined;

    return { token, user };
  }

  async createDummyUser(payload: {
    firstName: string;
  }): Promise<{ user: IUser; token: string }> {
    const uid = new ShortUniqueId({ length: 10 });
    uid.setDictionary('alphanum_lower');
    let userName: string = uid();

    const user = await this.User.create({
      firstName: payload.firstName || userName,
      lastName: userName,
      email: `${userName}@domain.com`,
      role: 'guest-user',
      password: userName,
      passwordConfirm: userName,
      active: 'active',
    });

    const token = this.signToken(user._id);

    return { token, user };
  }

  async signup(
    createUserDto: CreateUserDto,
  ): Promise<{ user: IUser; token: string }> {
    const { email, fcmToken } = createUserDto;

    const userExists = await this.User.findOne({ email });

    if (userExists)
      throw new ConflictException({ message: 'User already Exist.' });

    // const cus = await new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
    //   apiVersion: '2020-08-27',
    // }).customers.create({ email });

    const newUser = await this.User.create({
      ...createUserDto,
      // cus: cus.id,
      ...this.addFCMToken(fcmToken),
    });

    // const url = `${req.protocol}://${req.get('host')}/api/v1/users/verify-me/${
    //   newUser._id
    // }`;

    const data = await this.createSendToken(newUser);

    return data;
  }

  async login(
    loginUserDto: LoginUserDto,
  ): Promise<{ user: IUser; token: string }> {
    const { email, password, fcmToken } = loginUserDto;

    // check if account dosent exist
    const user = await this.User.findOne({ email }).select('+password +active');

    if (!user || !(await user.correctPassword(password, user.password)))
      throw new UnauthorizedException({
        message: 'Incorrect email or password.',
      });

    // 2) Check if user exists && password is correct

    if (
      matchRoles(
        [
          'admin',
          'financial-analyst',
          'buyer-concierge',
          'seller-concierge',
          'executive',
          'broker',
        ],
        user.role,
      )
    )
      throw new BadRequestException({
        message: 'Not a admin route.',
      });

    if (['unverified'].includes(user.active))
      throw new BadRequestException({
        message: 'Please Verify your email first.',
      });

    if (['system-deactivated'].includes(user.active))
      throw new BadRequestException({
        message: 'Since your account has been deactivated, you cannot log in.',
      });

    // 3) If everything ok, send token to client
    if (fcmToken) await this.addPushNotificationIds_onLogin(email, fcmToken);

    const token = this.signToken(user._id);

    // Remove password from output
    user.password = undefined;

    return { token, user };
  }

  async adminLogin(
    loginUserDto: LoginUserDto,
  ): Promise<{ user: IUser; token: string }> {
    const { email, password, fcmToken } = loginUserDto;

    // check if account dosent exist
    const user = await this.User.findOne({ email }).select('+password +active');

    if (!user || !(await user.correctPassword(password, user.password)))
      throw new UnauthorizedException({
        message: 'Incorrect email or password.',
      });

    // 2) Check if user exists && password is correct

    if (
      matchRoles(
        [
          'buyer',
          'seller',
          'third-party-broker',
          'banker',
          'attorney',
          'accountant',
          'landlord',
          'property-manager',
          'job-applicant',
          'title-company',
          '3rd-party-contacts',
          'insurance-agent',
          'service-provider',
        ],
        user.role,
      )
    )
      throw new BadRequestException({
        message: 'Not a user login route.',
      });

    if (
      matchRoles(
        [
          'financial-analyst',
          'buyer-concierge',
          'seller-concierge',
          'executive',
        ],
        user.role,
      ) &&
      ['system-deactivated'].includes(user.active)
    )
      throw new BadRequestException({
        message: 'Since your account has been deactivated, you cannot log in.',
      });

    // 3) If everything ok, send token to client
    if (fcmToken) await this.addPushNotificationIds_onLogin(email, fcmToken);

    const token = this.signToken(user._id);

    // Remove password from output
    user.password = undefined;

    return { token, user };
  }

  async logout(fcmToken: string, id: string): Promise<any> {
    await this.User.findByIdAndUpdate(id, {
      lastLogin: Date.now(),
      ...this.removeFCMToken(fcmToken),
    });

    return;
  }

  async forgotPassword(
    email: string,
    protocol: string,
    host: string,
  ): Promise<any> {
    if (!email) {
      throw new NotFoundException({
        message: 'Email address is invalid.',
      });
    }

    // 1) Get user based on POSTed email
    const user = await this.User.findOne({ email });

    if (!user) {
      throw new NotFoundException({
        message: 'There is no user with email address.',
      });
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    try {
      const appConfig = await this.appConfigService.appConfigDetails(
        'ContactInfo',
      );
      const resetURL = `${protocol}://${host}/api/v1/auth/resetPassword/${resetToken}`;

      this.emailService
        .sendPasswordReset(
          {
            email: user.email,
            firstName: user.firstName,
            name: user.firstName,
          },
          {
            url: resetURL,
            email: appConfig?.ContactInfo?.email,
            contact: appConfig?.ContactInfo?.contact,
            address: appConfig?.ContactInfo?.address,
          },
        )
        .catch((e) => console.log(e));

      return {
        status: 'success',
        message: 'Token sent to email!',
      };
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      throw new InternalServerErrorException({
        message: 'There was an error sending the email. Try again later!',
      });
    }

    return;
  }

  async resetPassword(
    resetPasswordUserDto: ResetPasswordUserDto,
  ): /* Promise<{ user: IUser; token: string }> */ Promise<boolean> {
    const { password, passwordConfirm, token } = resetPasswordUserDto;
    // 1) Get user based on the token

    const hashedToken = createHash('sha256').update(token).digest('hex');

    const user = await this.User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      throw new NotFoundException({
        message: 'Token is invalid or has expired',
      });
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return true;

    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    // return this.createSendToken(user);
  }

  async updatePassword(
    updateUserPasswordDto: UpdateUserPasswordDto,
    _user: IUser,
  ): Promise<{ user: IUser; token: string }> {
    const { password, passwordConfirm, passwordCurrent } =
      updateUserPasswordDto;
    // 1) Get user from collection
    const user = await this.User.findById(_user._id).select('+password');
    // 2) Check if POSTed current password is correct
    if (!(await user.correctPassword(passwordCurrent, user.password))) {
      throw new UnauthorizedException({
        message: 'Your current password is wrong.',
      });
    }

    // 3) If so, update password
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended!

    // 4) Log user in, send JWT
    return this.createSendToken(user);
  }
}
