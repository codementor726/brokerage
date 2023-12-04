import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { CmsSchema } from './cms.entity';
import { AuthModule } from 'src/auth/auth.module';
import { TestimonialsModule } from 'src/testimonials/testimonials.module';
import { UtilsModule } from 'src/utils/utils.module';
import { MongooseModule } from '@nestjs/mongoose';
import { S3Storage } from 'src/utils/utils.s3';
import { TestimonialSchema } from 'src/testimonials/testimonial.entity';
import { faqsSchema } from 'src/faqs/faq.entity';
import { AppConfigSchema } from 'src/app-configs/app-config.entity';
import { ServiceSchema } from 'src/services/services.entity';
import { ReviewSchema } from 'src/reviews/review.entity';
import { CoreValuesSchema } from 'src/core-values/core-values.entity';
import { OurTeamSchema } from 'src/our-team/our-team.entity';

@Module({
  imports: [
    AuthModule,
    UtilsModule,
    TestimonialsModule,
    MongooseModule.forFeature([
      { name: 'Cms', schema: CmsSchema },
      { name: 'Testimonial', schema: TestimonialSchema },
      { name: 'Faq', schema: faqsSchema },
      { name: 'AppConfigs', schema: AppConfigSchema },
      { name: 'Service', schema: ServiceSchema },
      { name: 'Review', schema: ReviewSchema },
      { name: 'CoreValue', schema: CoreValuesSchema },
      { name: 'OurTeam', schema: OurTeamSchema },
    ]),
  ],
  controllers: [CmsController],
  providers: [CmsService, S3Storage],
  exports: [CmsService],
})
export class CmsModule {}
