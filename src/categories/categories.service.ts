import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IBusiness } from 'src/business/interfaces/business.interface';
import { pagination } from 'src/utils/utils.types';
import { ICategory } from './interfaces/category.interface';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel('Category')
    private readonly Category: Model<ICategory>,
    @InjectModel('Business')
    private readonly Business: Model<IBusiness>,
  ) {}

  async getCategories(query: pagination): Promise<ICategory[]> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const data = await this.Category.find({ isActive: true })
      .skip(skip)
      .limit(limit)
      .lean();

    return data as ICategory[];
  }

  async getSingleCategory(categoryId: string): Promise<ICategory> {
    const data = await this.Category.findOne({
      _id: categoryId,
      isActive: true,
    }).lean();
    if (!data) [new BadRequestException('Category not found.'), null];

    return data as ICategory;
  }

  //   //   =================== ADMIN ONLY ======================

  async createCategory(name: string): Promise<ICategory> {
    if (!name)
      throw new BadRequestException('Please provide name of the category.');

    const isExist = await this.Category.findOne({
      name: name,
    }).lean();

    if (isExist) throw new BadRequestException('Category already exist');
    const data = await this.Category.create({ name });
    return data as ICategory;
  }

  async updateCatgeory(
    id: string,
    name: string,
    isActive: boolean,
  ): Promise<ICategory> {
    const _data = await this.Category.findById(id).lean();
    if (!_data) throw new BadRequestException('Category not found');

    const data = await this.Category.findByIdAndUpdate(
      id,
      {
        name,
        isActive,
      },
      { new: true },
    ).lean();

    return data as ICategory;
  }

  async deleteCategory(id: string): Promise<ICategory> {
    const _data = await this.Category.findById(id).lean();
    if (!_data) throw new BadRequestException('Category not found');

    const business = await this.Business.findOne({ category: id });
    if (!!business)
      throw new BadRequestException(
        'You can not delete this category as it exists in a business.',
      );
    const data = await this.Category.findByIdAndDelete(id).lean();

    return data as ICategory;
  }

  async getCategoryAdmin(
    query: pagination,
  ): Promise<{ results: number; totalCount: number; data: ICategory[] }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    let data = [];

    if (query.page == undefined && query.limit == undefined) {
      data = await this.Category.find().lean();
    } else {
      data = await this.Category.find()
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .lean();
    }

    const count = await this.Category.countDocuments();

    return {
      results: data.length as number,
      totalCount: count as number,
      data: data as ICategory[],
    };
  }
}
