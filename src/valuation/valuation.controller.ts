import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/user.decorator';
import { RolesGuard } from 'src/roles-guard.guard';
import { ErrorHanldingFn } from 'src/utils/utils.helper';
import { pagination } from 'src/utils/utils.types';
import { ValuationService } from './valuation.service';
import { CreateValuationDto } from './dto/create-valuation.dto';

@Controller({ path: '/api/v1/valuation' })
export class ValuationController {
  constructor(private readonly valuationService: ValuationService) { }

  @Get('/')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getAllValuations(
    @Query() query: pagination,
    @Query('status') status: string,
    @Query('search') search: string,
  ) {
    try {
      const { data, totalCount } = await this.valuationService.getAllValuations(
        query,
        status,
        search,
      );
      return { results: data.length, data, totalCount };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/:id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async getSpecificValuation(
    @Param('id') id: string,
  ) {
    try {
      const { data } = await this.valuationService.getSpecificValuation(
        id
      );
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Post('/create')
  async createValuation(@Body() createValuationDto: CreateValuationDto) {
    try {
      const data = await this.valuationService.createValuation(
        createValuationDto,
      );
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Patch('/update')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateValuation(
    @Body('valuationId') valuationId: string,
    @Body('status') status: string,
  ) {
    try {
      const data = await this.valuationService.updateValuation(
        valuationId,
        status,
      );
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Delete('/delete/:valuationId')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async deleteValuation(@Param('valuationId') valuationId: string) {
    try {
      const data = await this.valuationService.deleteValuation(valuationId);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
