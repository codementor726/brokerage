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
import { Roles } from 'src/auth/decorators/user.decorator';
import { RolesGuard } from 'src/roles-guard.guard';
import { ErrorHanldingFn } from 'src/utils/utils.helper';
import { pagination } from 'src/utils/utils.types';
import { FaqsService } from './faqs.service';

@Controller({
  path: '/api/v1/faqs',
})
export class FaqsController {
  constructor(private readonly faqService: FaqsService) {}

  @Get('/')
  async getFaqs(@Query() query: pagination) {
    try {
      const data = await this.faqService.getAllActiveFaqs(query);
      return { results: data.length, data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  //   =================== ADMIN ONLY ======================

  @Post('/create')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async createFaqs(
    @Body('question') question: string,
    @Body('answer') answer: string,
    @Body('type') type: string,
    @Body('order') order: number,
  ) {
    try {
      const data = await this.faqService.createFaq(
        question,
        answer,
        type,
        order,
      );
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  // Update category by admin
  @Patch('/update')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async updateFaq(
    @Body('question') question: string,
    @Body('answer') answer: string,
    @Body('type') type: string,
    @Body('order') order: number,
    @Body('isActive') isActive: boolean,
    @Body('id') id: string,
  ) {
    try {
      const data = await this.faqService.updateFaq(
        id,
        question,
        answer,
        type,
        order,
        isActive,
      );
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Delete('/delete/:id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async deleteFaq(@Param('id') id: string) {
    try {
      const data = await this.faqService.deleteFaq(id);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
  // get all address for admin
  @Get('/admin/all')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async getFaqsAdmin(@Query() query: pagination) {
    try {
      const data = await this.faqService.getFaqsAdmin(query);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
