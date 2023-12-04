import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUser } from 'src/users/interfaces/user.interface';
import { UpdateContactInfo } from './dto/contact-info.dto';
import { IAppConfig } from './interfaces/appConfig.interface';

@Injectable()
export class AppConfigsService {
  constructor(
    @InjectModel('AppConfigs')
    private readonly AppConfigs: Model<IAppConfig>,
  ) {}

  // getting all details related to app
  async getAppDetails(): Promise<IAppConfig[]> {
    const data = await this.AppConfigs.find({});
    return data;
  }

  async appConfigDetails(key): Promise<any> {
    const data = await this.AppConfigs.findOne({ KeyType: key });

    return data;
  }

  async updateContactInfo(
    updateContactInfo: UpdateContactInfo,
  ): Promise<IAppConfig> {
    const appConfig = await this.appConfigDetails('ContactInfo');

    const contactInfo = {
      email: updateContactInfo.email || appConfig.ContactInfo.email,
      contact: updateContactInfo.contact || appConfig.ContactInfo.contact,
      address: updateContactInfo.address || appConfig.ContactInfo.address,
      url: updateContactInfo.url || appConfig.ContactInfo.fax,
      name: updateContactInfo.name || appConfig.ContactInfo.name,
      designation:
        updateContactInfo.designation || appConfig.ContactInfo.designation,
    };

    const data = await this.AppConfigs.findOneAndUpdate(
      { KeyType: 'ContactInfo' },
      { ContactInfo: contactInfo },
      { new: true },
    );

    return data;
  }
}
