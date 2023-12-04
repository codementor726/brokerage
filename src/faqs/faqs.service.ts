import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { pagination } from 'src/utils/utils.types';
import { IFaqs } from './interfaces/faq.interface';

@Injectable()
export class FaqsService {
  constructor(
    @InjectModel('Faq')
    private readonly Faq: Model<IFaqs>,
  ) {}

  async getAllActiveFaqs(query: pagination): Promise<IFaqs[]> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const data = await this.Faq.find({ isActive: true })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    return data as IFaqs[];
  }

  //   //   =================== ADMIN ONLY ======================

  async createFaq(
    question: string,
    answer: string,
    type: string,
    order: number,
  ): Promise<IFaqs> {
    if (!question || !answer || !type || !order)
      throw new BadRequestException('Please provide all the required fields.');

    const data = await this.Faq.create({ question, answer, type, order });
    return data as IFaqs;
  }

  async updateFaq(
    id: string,
    question: string,
    answer: string,
    type: string,
    order: number,
    isActive: boolean,
  ): Promise<IFaqs> {
    const _data = await this.Faq.findById(id).lean();
    if (!_data) throw new BadRequestException('Faq not found');

    const data = await this.Faq.findByIdAndUpdate(
      id,
      {
        question,
        answer,
        type,
        order,
        isActive,
      },
      { new: true },
    ).lean();

    return data as IFaqs;
  }

  async deleteFaq(id: string): Promise<IFaqs> {
    const _data = await this.Faq.findById(id).lean();
    if (!_data) throw new BadRequestException('Faq not found');

    const data = await this.Faq.findByIdAndDelete(id).lean();

    return data as IFaqs;
  }

  async getFaqsAdmin(
    query: pagination,
  ): Promise<{ data: IFaqs[]; totalCount: number; results: number }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const data = await this.Faq.find()
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();
    const totalRecords = await this.Faq.countDocuments();
    return {
      data: data as IFaqs[],
      results: data.length,
      totalCount: totalRecords,
    };
  }
}
