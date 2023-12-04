/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Model } from 'mongoose';
import { IUser } from 'src/users/interfaces/user.interface';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from 'jsonwebtoken';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel('User')
    private readonly User: Model<IUser>,
    private readonly configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      //   secretOrkey:
      //     'my-urJAAES6NlAXnmLCg-pmunasbaterlon*-g-se-ocg&@4SbwrJAAES6NlAXnmLCgF-cret-har$-2@-sasja',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<IUser> {
    const { id, iat } = payload;

    // fetching the user info.
    const user: IUser = await this.User.findById(id).select(
      '+active',
      // '+active +ringCentral',
    );

    // 1) Check if user still exists
    if (!user)
      throw new UnauthorizedException({
        message: 'The user belonging to this token does no longer exist.',
      });

    // 2) Check if user changed password after the token was issued
    if (user.changedPasswordAfter(iat))
      throw new UnauthorizedException({
        message: 'User recently changed password! Please log in again.',
      });

    // checking if the account is deactivated by admin
    if (['user-deactivated', 'system-deactivated'].includes(user.active))
      throw new UnauthorizedException({
        message: 'Your Account has been deactivated.',
      });
    else if (['unverified'].includes(user.active))
      throw new UnauthorizedException({
        message: 'Please wait until your Account is Verified.',
      });

    // excluding fields
    user.active = undefined;

    return user;
  }
}
