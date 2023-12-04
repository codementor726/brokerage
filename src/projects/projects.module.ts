import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { BusinessController } from '../business/business.controller';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ProjectSchema } from './entities/project.entity';
import { BusinessSchema } from '../business/business.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksModule } from 'src/tasks/tasks.module';
import { BusinessModule } from '../business/business.module';
import { TaskTemplatesModule } from 'src/task-templates/task-templates.module';

@Module({
  imports: [
    AuthModule,
    TasksModule,
    NotificationsModule,
    TaskTemplatesModule,
    BusinessModule,
    MongooseModule.forFeature([
      { name: 'Project', schema: ProjectSchema },
      { name: 'Business', schema: BusinessSchema },
      // { name: 'User', schema: UserSchema },
      // { name: 'Business', schema: BusinessSchema },
    ]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
})
export class ProjectsModule {}
