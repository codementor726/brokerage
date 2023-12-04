import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
  Req,
  Param,
  Post,
  Body,
  Ip,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/roles-guard.guard';
import { IUser } from 'src/users/interfaces/user.interface';
import { ErrorHanldingFn } from 'src/utils/utils.helper';
import { pagination } from 'src/utils/utils.types';
import { GetUser, Roles } from '../auth/decorators/user.decorator';
import { NotesDto } from './dto/create-lead.dto';
import { SendTemplateDto } from './dto/send-template.dto';
import { SignNdaDto } from './dto/sign-nda.dto';
import { LeadsService } from './leads.service';

@Controller({ path: '/api/v1/leads' })
export class LeadsController {
  constructor(private readonly leadsServices: LeadsService) {}

  @Get('/')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('buyer', 'broker')
  async getLeads(
    @Query() query: pagination,
    @Query('status') status: string,
    @Query('search') search: string,
    @GetUser() user: IUser,
  ) {
    try {
      const rs = await this.leadsServices.getLeads(query, status, search, user);
      return { ...rs };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/owned')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('seller')
  async getLeadsOnOwnedBusiness(
    @Query() query: pagination,
    @GetUser() user: IUser,
  ) {
    try {
      const rs = await this.leadsServices.getLeadsOnOwnedBusiness(query, user);
      return { ...rs };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/')
  @UseGuards(AuthGuard(), RolesGuard)
  async createLead(
    @Body('businessId') businessId: string,
    @GetUser() user: IUser,
  ) {
    try {
      const rs = await this.leadsServices.createLead(businessId, user);
      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/send-mail')
  @UseGuards(AuthGuard(), RolesGuard)
  async sendTemplatePdfToBuyer(@Body() sendTemplateDto: SendTemplateDto) {
    try {
      const data = await this.leadsServices.sendTemplatePdfToBuyer(
        sendTemplateDto,
      );
      return { data };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Post('/sign-nda')
  @UseGuards(AuthGuard(), RolesGuard)
  async signNda(@Body() signNdaDto: SignNdaDto, @GetUser() user: IUser) {
    try {
      const rs = await this.leadsServices.signNda(user, signNdaDto);
      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/update-nda-status')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateNdaContract(
    @Body('leadId') leadId: string,
    @Body('status') status: string,
    @GetUser() user: IUser,
  ) {
    try {
      const rs = await this.leadsServices.updateNdaContract(
        leadId,
        status,
        user,
      );
      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/update-lead-status')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateLeadStatus(
    @GetUser() user: IUser,
    @Body('leadId') leadId: string,
    @Body('status') status: string,
    @Body('leadProgress') leadProgress: string,
    @Body('memorandum') memorandum: string,
  ) {
    try {
      const rs = await this.leadsServices.updateLeadStatus(
        user,
        leadId,
        status,
        leadProgress,
        memorandum,
      );
      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Patch('/notes')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async updateNotes(@Body() notesDto: NotesDto) {
    try {
      const rs = await this.leadsServices.updateNotes(notesDto);
      return rs;
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  // ------------> ADMIN CONTROLLERS <------------

  @Get('/admin')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async adminGetAllLeads(
    @Query() query: pagination,
    @Query('status') status: string,
    @Query('search') search: string,
    @Query('outsideLead') outsideLead: string,
  ) {
    try {
      const rs = await this.leadsServices.adminGetAllLeads(
        query,
        status,
        search,
        outsideLead,
      );
      return { ...rs };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }

  @Get('/admin/details/:id')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'broker',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async adminGetleadDetails(@Param('id') id: string) {
    try {
      const rs = await this.leadsServices.adminGetleadDetails(id);
      return { ...rs };
    } catch (error) {
      throw ErrorHanldingFn(error);
    }
  }
}
