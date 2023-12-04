import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { pagination } from 'src/utils/utils.types';
import { IReview } from './interfaces/review.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel('Review')
    private readonly Reviews: Model<IReview>,
  ) {}
  async create(createReviewDto: CreateReviewDto): Promise<IReview> {
    const data = await this.Reviews.create(createReviewDto);
    return data as IReview;
  }

  async findAll(
    query: pagination,
  ): Promise<{ data: IReview[]; totalCount: number; results: number }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const data = await this.Reviews.find()
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    const countDocuments = await this.Reviews.countDocuments();

    return {
      data: data as IReview[],
      totalCount: countDocuments,
      results: data.length,
    };
  }

  async update(id: string, updateReviewDto: UpdateReviewDto): Promise<IReview> {
    const _data = await this.Reviews.findById(id);
    if (!_data) throw new BadRequestException('Review not found');

    const data = await this.Reviews.findByIdAndUpdate(id, updateReviewDto, {
      new: true,
    }).lean();

    return data as IReview;
  }

  async delete(id: string): Promise<IReview> {
    const _data = await this.Reviews.findById(id).lean();
    if (!_data) throw new BadRequestException('Review not found');

    const data = await this.Reviews.findByIdAndRemove(id).lean();

    return data as IReview;
  }
}
