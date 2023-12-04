import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { UserSchema } from 'src/users/user.entity';
import { S3Storage } from 'src/utils/utils.s3';
import { DataRoomController } from './data-room.controller';
import { DataRoomService } from './data-room.service';
import { FolderSchema } from './folder.entity';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Folder', schema: FolderSchema },
    ]),
  ],
  controllers: [DataRoomController],
  providers: [DataRoomService, S3Storage],
  exports: [DataRoomService],
})
export class DataRoomModule {}
