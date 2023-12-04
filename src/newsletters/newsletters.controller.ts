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
import { CreateNewsLetterDto } from './dto/create-newsletter.dto';
import { NewslettersService } from './newsletters.service';

@Controller({ path: '/api/v1/newsletters' })
export class NewslettersController {
  constructor(private readonly newsLetterService: NewslettersService) {}

  @Post('/')
  async createNewsLetterQuery(
    @Body() createNewsLetterDto: CreateNewsLetterDto,
  ) {
    try {
      const data = await this.newsLetterService.createNewsLetterQuery(
        createNewsLetterDto,
      );
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  //   =================== ADMIN ONLY ======================

  // Update category by admin
  @Patch('/update')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateNewsLetterQueryStatus(
    @Body('id') id: string,
    @Body('status') status: string,
  ) {
    try {
      const data = await this.newsLetterService.updateNewsLetterQueryStatus(
        id,
        status,
      );
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Delete('/delete/:id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async deleteNewsLetterQuery(@Param('id') id: string) {
    try {
      const data = await this.newsLetterService.deleteNewsLetterQuery(id);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/admin/all')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getNewsLetterQuery(
    @Query() query: pagination,
    @Query('status') status: string,
    @Query('type') type: string,
    @Query('search') search: string,
  ) {
    try {
      const { data, totalCount } =
        await this.newsLetterService.getNewsLetterQuery(
          query,
          status,
          type,
          search,
        );
      return { results: data.length, data, totalCount };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
