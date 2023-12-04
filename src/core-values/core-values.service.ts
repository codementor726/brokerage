import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { pagination } from 'src/utils/utils.types';
import { ICoreValues } from './interfaces/core-values.interface';

@Injectable()
export class CoreValuesService {
  constructor(
    @InjectModel('CoreValue')
    private readonly CoreValues: Model<ICoreValues>,
  ) {}

  async getAllCoreValues(
    query: pagination,
  ): Promise<{ data: ICoreValues[]; totalCount: number; results: number }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const data = await this.CoreValues.find()
      .sort('createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    const totalRecords = await this.CoreValues.countDocuments();

    return {
      data: data as ICoreValues[],
      results: data.length,
      totalCount: totalRecords,
    };
  }

  //   //   =================== ADMIN ONLY ======================

  async createCoreValues(
    title: string,
    description: string,
    order: number,
  ): Promise<ICoreValues> {
    if (!title || !description)
      throw new BadRequestException('Please provide all the required fields.');

    const data = await this.CoreValues.create({ title, description, order });
    return data as ICoreValues;
  }

  async updateCoreValues(
    id: string,
    title: string,
    description: string,
    order: number,
  ): Promise<ICoreValues> {
    const _data = await this.CoreValues.findById(id).lean();
    if (!_data) throw new BadRequestException('Faq not found');

    const data = await this.CoreValues.findByIdAndUpdate(
      id,
      {
        title,
        description,
        order,
      },
      { new: true },
    ).lean();

    return data as ICoreValues;
  }

  async deleteCoreValues(id: string): Promise<ICoreValues> {
    const _data = await this.CoreValues.findById(id).lean();
    if (!_data) throw new BadRequestException('Core value not found');

    const data = await this.CoreValues.findByIdAndDelete(id).lean();

    return data as ICoreValues;
  }

  async getCoreValuesForAdmin(
    query: pagination,
  ): Promise<{ data: ICoreValues[]; totalCount: number; results: number }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const data = await this.CoreValues.find()
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();
    const totalRecords = await this.CoreValues.countDocuments();
    return {
      data: data as ICoreValues[],
      results: data.length,
      totalCount: totalRecords,
    };
  }
}
