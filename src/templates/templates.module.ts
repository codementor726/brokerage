import { Module } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TemplateSchema } from './template.entity';
import { S3Storage } from 'src/utils/utils.s3';
import { EmailService } from 'src/utils/utils.email.service';
import { UserSchema } from 'src/users/user.entity';
import { BusinessSchema } from 'src/business/business.entity';
import { LeadSchema } from 'src/leads/lead.entity';
import { GroupSchema } from 'src/groups/group.entity';
import { AppConfigsModule } from 'src/app-configs/app-configs.module';

@Module({
  imports: [
    AuthModule,
    AppConfigsModule,
    MongooseModule.forFeature([
      { name: 'Template', schema: TemplateSchema },
      { name: 'Lead', schema: LeadSchema },
      { name: 'Business', schema: BusinessSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Group', schema: GroupSchema },
    ]),
  ],
  controllers: [TemplatesController],
  providers: [TemplatesService, S3Storage, EmailService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
