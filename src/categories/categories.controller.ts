import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/user.decorator';
import { RolesGuard } from 'src/roles-guard.guard';
import { ErrorHanldingFn } from 'src/utils/utils.helper';
import { pagination } from 'src/utils/utils.types';
import { CategoriesService } from './categories.service';

@Controller({
  path: '/api/v1/categories',
})
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  @Get('/')
  async getCategories(@Query() query: pagination) {
    try {
      const data = await this.categoryService.getCategories(query);
      return { results: data.length, data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/:categoryId')
  async getSingleCategory(@Param('categoryId') categoryId: string) {
    try {
      const data = await this.categoryService.getSingleCategory(categoryId);
      return { results: data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  //   =================== ADMIN ONLY ======================
  // create address by admin
  @Post('/admin')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async createCategory(@Body('name') name: string) {
    try {
      const data = await this.categoryService.createCategory(name);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  // Update category by admin
  @Patch('/admin/:id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateCatgeory(
    @Body('name') name: string,
    @Body('isActive') isActive: boolean,
    @Param('id') id: string,
  ) {
    try {
      const data = await this.categoryService.updateCatgeory(
        id,
        name,
        isActive,
      );
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Delete('/admin/:id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async deleteCategory(@Param('id') id: string) {
    try {
      const data = await this.categoryService.deleteCategory(id);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  // get all address for admin
  @Get('/admin/all')
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles('admin')
  async getCategoryAdmin(@Query() query: pagination) {
    try {
      const data = await this.categoryService.getCategoryAdmin(query);
      return { ...data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
