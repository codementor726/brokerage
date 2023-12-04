import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/user.decorator';
import { RolesGuard } from 'src/roles-guard.guard';
import { ErrorHanldingFn } from 'src/utils/utils.helper';
import { AppConfigsService } from './app-configs.service';
import { UpdateContactInfo } from './dto/contact-info.dto';
import { UpdateAppConfigDto } from './dto/update-appConfig.dto';

@Controller({ path: '/api/v1/config' })
export class AppConfigsController {
  constructor(private readonly appConfigsService: AppConfigsService) {}

  @Get('/appDetails')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async getAppConfigs() {
    try {
      const data = await this.appConfigsService.getAppDetails();
      return { results: data.length, data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/configDetails')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async appConfigDetails(@Query() updateAppConfigDto: UpdateAppConfigDto) {
    const { KeyType } = updateAppConfigDto;
    try {
      const data = await this.appConfigsService.appConfigDetails(KeyType);
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Patch('/contact-info/update')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles('admin', 'executive')
  async updateContactInfo(@Body() updateContactInfo: UpdateContactInfo) {
    try {
      const data = await this.appConfigsService.updateContactInfo(
        updateContactInfo,
      );
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }
}
