import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { LeadSchema } from 'src/leads/lead.entity';
import { TemplateSchema } from 'src/templates/template.entity';
import { TemplatesModule } from 'src/templates/templates.module';
import { UserSchema } from 'src/users/user.entity';
import { EmailService } from 'src/utils/utils.email.service';
import { S3Storage } from 'src/utils/utils.s3';
import { GroupSchema } from './group.entity';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [
    AuthModule,
    TemplatesModule,
    MongooseModule.forFeature([
      { name: 'Group', schema: GroupSchema },
      { name: 'Template', schema: TemplateSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Lead', schema: LeadSchema },
    ]),
  ],
  controllers: [GroupsController],
  providers: [GroupsService, S3Storage, EmailService],
})
export class GroupsModule {}
