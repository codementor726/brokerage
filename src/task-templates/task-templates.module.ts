import { Module } from '@nestjs/common';
import { TaskTemplatesService } from './task-templates.service';
import { TaskTemplatesController } from './task-templates.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskTemplateSchema } from './task-template.entity';
import { TaskSchema } from 'src/tasks/task.entity';
import { TasksModule } from 'src/tasks/tasks.module';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'TaskTemplate', schema: TaskTemplateSchema },
      { name: 'Task', schema: TaskSchema },
    ]),
  ],
  controllers: [TaskTemplatesController],
  providers: [TaskTemplatesService],
  exports: [TaskTemplatesService],
})
export class TaskTemplatesModule {}
