import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskSchema } from './task.entity';
import { CalendarService } from 'src/calendars/calendar.service';
import { CalendarModule } from 'src/calendars/calendar.module';
import { CalendarSchema } from 'src/calendars/calendar.entity';
import { TemplateTasksController } from './templateTask.controller';
import { TaskTemplateSchema } from 'src/task-templates/task-template.entity';

@Module({
  imports: [
    AuthModule,
    CalendarModule,
    MongooseModule.forFeature([
      { name: 'Task', schema: TaskSchema },
      { name: 'Calendar', schema: CalendarSchema },
      { name: 'TaskTemplate', schema: TaskTemplateSchema },
    ]),
  ],
  controllers: [TasksController, TemplateTasksController],
  providers: [TasksService, CalendarService],
  exports: [TasksService],
})
export class TasksModule {}
