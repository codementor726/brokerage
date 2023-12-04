import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GetUser, Roles } from 'src/auth/decorators/user.decorator';
import { RolesGuard } from 'src/roles-guard.guard';
import { IUser } from 'src/users/interfaces/user.interface';
import { ErrorHanldingFn } from 'src/utils/utils.helper';
import { pagination } from 'src/utils/utils.types';
import { TestimonialsService } from './testimonials.service';

@Controller({ path: '/api/v1/testimonials' })
export class TestimonialsController {
  constructor(private readonly testimonialService: TestimonialsService) {}

  @Get('/')
  async getAllActiveTestimonials(@Query() query: pagination) {
    try {
      const data = await this.testimonialService.getAllActiveTestimonials(
        query,
      );
      return { results: data.length, data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Post('/')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('seller')
  async createTestimonial(
    @GetUser() user: IUser,
    @Body('description') description: string,
    @Body('rating') rating: number,
  ) {
    try {
      const data = await this.testimonialService.createTestimonial(
        user,
        description,
        rating,
      );
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  //   =================== ADMIN ONLY ======================

  // Update category by admin
  @Patch('/admin/:id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async adminDeactivateTestimonial(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    try {
      const data = await this.testimonialService.adminDeactivateTestimonial(
        id,
        isActive,
      );
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Delete('/admin/:id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async deleteTestimonial(@Param('id') id: string) {
    try {
      const data = await this.testimonialService.deleteTestimonial(id);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/admin/all')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async getAllTestimonial(@Query() query: pagination) {
    try {
      const data = await this.testimonialService.getAllTestimonial(query);
      return { results: data.length, data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
