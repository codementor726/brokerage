import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/users/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { S3Storage } from 'src/utils/utils.s3';
import { EmailService } from 'src/utils/utils.email.service';
import { AppConfigsModule } from 'src/app-configs/app-configs.module';

@Module({
  imports: [
    forwardRef(() => AppConfigsModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // UsersModule,
    /*   JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get('JWT_SECRET');
        const expiresIn = configService.get('JWT_EXPIRES_IN');

        return {
          secret,
          signOptions: { expiresIn },
        };
      },
      inject: [ConfigService],
    }), */
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    // UtilsModule,
  ],
  providers: [AuthService, JwtStrategy, S3Storage, EmailService],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule, AuthService],
})
export class AuthModule {}
