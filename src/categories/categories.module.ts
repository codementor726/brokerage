import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { BusinessSchema } from 'src/business/business.entity';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { categorySchema } from './category.entity';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'Category', schema: categorySchema },
      { name: 'Business', schema: BusinessSchema },
    ]),
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
