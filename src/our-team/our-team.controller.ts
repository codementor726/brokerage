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
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Roles } from 'src/auth/decorators/user.decorator';
import { RolesGuard } from 'src/roles-guard.guard';
import { ErrorHanldingFn, imageFileFilter } from 'src/utils/utils.helper';
import { pagination } from 'src/utils/utils.types';
import { OurTeamService } from './our-team.service';

@Controller({ path: '/api/v1/our-team' })
export class OurTeamController {
  constructor(private readonly ourTeamService: OurTeamService) {}

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'photo', maxCount: 1 }], {
      fileFilter: imageFileFilter,
      limits: { fileSize: 2_000_000 },
    }),
  )
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  create(
    @Body('firstName') firstName: string,
    @Body('lastName') lastName: string,
    @Body('designation') designation: string,
    @Body('email') email: string,
    @Body('officeContact') officeContact: string,
    @Body('deskContact') deskContact: string,
    // @Body('cellContact') cellContact: string,
    @Body('contact') contact: string,
    @Body('description') description: string,
    @Body('order') order: string,
    @UploadedFiles() files: any,
  ) {
    const payload = {
      firstName,
      lastName,
      designation,
      email,
      officeContact,
      deskContact,
      contact,
      description,
      order,
    };

    return this.ourTeamService.create(payload, files);
  }

  @Patch('/:id')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'photo', maxCount: 1 }], {
      fileFilter: imageFileFilter,
      limits: { fileSize: 2_000_000 },
    }),
  )
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  update(
    @Param('id') id: string,
    @Body('firstName') firstName: string,
    @Body('lastName') lastName: string,
    @Body('designation') designation: string,
    @Body('email') email: string,
    @Body('officeContact') officeContact: string,
    @Body('deskContact') deskContact: string,
    // @Body('cellContact') cellContact: string,
    @Body('contact') contact: string,
    @Body('description') description: string,
    @Body('order') order: string,
    @UploadedFiles() files: any,
  ) {
    const payload = {
      firstName,
      lastName,
      designation,
      email,
      officeContact,
      deskContact,
      // cellContact,
      contact,
      description,
      order,
    };
    return this.ourTeamService.update(id, payload, files);
  }

  @Get('/')
  async findAll(@Query() query: pagination) {
    try {
      const data = await this.ourTeamService.findAll(query);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/admin/all')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async findAllForAdmin(
    @Query() query: pagination,
    @Query('status') status: string,
  ) {
    try {
      const data = await this.ourTeamService.findAllForAdmin(query, status);
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Delete('/:id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async remove(@Param('id') id: string) {
    try {
      return await this.ourTeamService.delete(id);
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
