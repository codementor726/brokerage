import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { S3Storage } from 'src/utils/utils.s3';
import { pagination } from 'src/utils/utils.types';
import { IService } from './interfaces/services.interface';

@Injectable()
export class ServicesService {
  constructor(
    @InjectModel('Service')
    private readonly Service: Model<IService>,
    private readonly s3Storage: S3Storage,
  ) {}

  async getServices(
    query: pagination,
    type: string,
  ): Promise<{ totalCount: number; results: number; data: IService[] }> {
    let q: any = {};
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    if ([undefined, null, 'undefined', 'null'].includes(type)) type = 'all';

    if (type == 'all') {
      q = {
        status: { $in: ['home', 'services'] },
      };
    } else {
      q = { type };
    }

    const data = await this.Service.find(q)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    const count = await this.Service.countDocuments(q);

    return {
      totalCount: count as number,
      results: data.length as number,
      data: data as IService[],
    };
  }

  async createService(
    title: string,
    type: string,
    files: any,
  ): Promise<IService> {
    if (!files?.image) throw new BadRequestException('Image not found.');

    let image = files?.image[0].key;

    const service = await this.Service.create({
      title,
      type,
      image,
    });

    return service as IService;
  }

  async updateService(
    serviceId: string,
    title: string,
    type: string,
    order: string,
    files: any,
  ): Promise<IService> {
    let image = undefined;

    const data = await this.Service.findById(serviceId).lean();

    if (!data) throw new NotFoundException('Service not found.');

    if (files?.image) {
      image = files?.image[0].key;

      if (data?.image) await this.s3Storage.deleteImage(data?.image);
    }

    const service = await this.Service.findByIdAndUpdate(
      serviceId,
      {
        title,
        image,
        type,
        order: Number(order),
      },
      { new: true },
    );

    return service as IService;
  }

  async deleteService(serviceId: string): Promise<IService> {
    const data = await this.Service.findById(serviceId).lean();

    if (!data) throw new NotFoundException('Service not found.');

    const service = await this.Service.findByIdAndDelete(serviceId).lean();

    if (service?.image) await this.s3Storage.deleteImage(service?.image);

    return service as IService;
  }
}
