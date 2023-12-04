import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { TestimonialSchema } from './testimonial.entity';
import { TestimonialsController } from './testimonials.controller';
import { TestimonialsService } from './testimonials.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: 'Testimonial', schema: TestimonialSchema },
    ]),
  ],
  controllers: [TestimonialsController],
  providers: [TestimonialsService],
})
export class TestimonialsModule {}
