import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { UserSchema } from 'src/users/user.entity';
import { AppConfigSchema } from './app-config.entity';
import { AppConfigsController } from './app-configs.controller';
import { AppConfigsService } from './app-configs.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      // { name: 'Transaction', schema: transactionSchema },
      { name: 'AppConfigs', schema: AppConfigSchema },
    ]),
  ],

  controllers: [AppConfigsController],
  providers: [AppConfigsService],
  exports: [AppConfigsService],
})
export class AppConfigsModule {}
