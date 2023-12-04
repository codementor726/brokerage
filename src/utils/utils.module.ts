import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from 'src/users/user.entity';
import { EmailService } from './utils.email.service';
import { UtilsStripeService } from './utils.stripe';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])],
  providers: [EmailService, UtilsStripeService],
  exports: [EmailService, UtilsStripeService],
})
export class UtilsModule {}
