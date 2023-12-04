import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { pagination } from 'src/utils/utils.types';
import { CreateNewsLetterDto } from './dto/create-newsletter.dto';
import { INewsLetter } from './interfaces/newsletter.interface';

@Injectable()
export class NewslettersService {
  constructor(
    @InjectModel('NewsLetter')
    private readonly NewsLetter: Model<INewsLetter>,
  ) { }

  async createNewsLetterQuery(
    createNewsLetterDto: CreateNewsLetterDto,
  ): Promise<INewsLetter> {
    const data = await this.NewsLetter.create(createNewsLetterDto);

    return data as INewsLetter;
  }

  //   //   =================== ADMIN ONLY ======================

  async updateNewsLetterQueryStatus(
    id: string,
    status: string,
  ): Promise<INewsLetter> {
    const _data = await this.NewsLetter.findById(id).lean();
    if (!_data) throw new BadRequestException('NewsLetter not found');

    const data = await this.NewsLetter.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    ).lean();

    return data as INewsLetter;
  }

  async deleteNewsLetterQuery(id: string): Promise<INewsLetter> {
    const _data = await this.NewsLetter.findById(id).lean();
    if (!_data) throw new BadRequestException('NewsLetter not found');

    const data = await this.NewsLetter.findByIdAndDelete(id).lean();

    return data as INewsLetter;
  }

  async getNewsLetterQuery(
    query: pagination,
    status: string,
    type: string,
    search: string,
  ): Promise<{ data: INewsLetter[]; totalCount: number }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;
    let q: any = {
      ...(search && {
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }),
    };
    if (['undefined', 'null', null, undefined].includes(status)) status = 'all';

    if (status == 'all') {
      q = {
        ...q,
        status: { $in: ['pending', 'seen', 'rejected'] },
      };
    } else {
      q = {
        ...q,
        status,
      };
    }

    const newsLetter = await this.NewsLetter.find({ ...q, type })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await this.NewsLetter.countDocuments();

    return { data: newsLetter as INewsLetter[], totalCount };
  }
}
