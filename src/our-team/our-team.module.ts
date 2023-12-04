import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OurTeamSchema } from './our-team.entity';
import { AuthModule } from 'src/auth/auth.module';
import { OurTeamService } from './our-team.service';
import { OurTeamController } from './our-team.controller';
import { S3Storage } from 'src/utils/utils.s3';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: 'OurTeam', schema: OurTeamSchema }]),
  ],
  controllers: [OurTeamController],
  providers: [OurTeamService, S3Storage],
})
export class OurTeamModule {}
