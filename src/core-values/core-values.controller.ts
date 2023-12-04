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
import { CoreValuesService } from './core-values.service';

@Controller({
  path: '/api/v1/core-values',
})
export class CoreValuesController {
  constructor(private readonly coreValuesService: CoreValuesService) {}

  @Get('/')
  async getAllCoreValues(@Query() query: pagination) {
    try {
      const data = await this.coreValuesService.getAllCoreValues(query);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  //   =================== ADMIN ONLY ======================

  @Post('/create')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async createCoreValues(
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('order') order: number,
  ) {
    try {
      const data = await this.coreValuesService.createCoreValues(
        title,
        description,
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
  async updateCoreValues(
    @Body('title') title: string,
    @Body('description') description: string,
    @Body('order') order: number,
    @Body('id') id: string,
  ) {
    try {
      const data = await this.coreValuesService.updateCoreValues(
        id,
        title,
        description,
        order,
      );
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Delete('/delete/:id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async deleteCoreValues(@Param('id') id: string) {
    try {
      const data = await this.coreValuesService.deleteCoreValues(id);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
  // get all address for admin
  @Get('/admin/all')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async getCoreValuesForAdmin(@Query() query: pagination) {
    try {
      const data = await this.coreValuesService.getCoreValuesForAdmin(query);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
