import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUser } from 'src/users/interfaces/user.interface';
import { pagination } from 'src/utils/utils.types';
import { ITestimonial } from './interfaces/testimonial.interface';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectModel('Testimonial')
    private readonly Testimonial: Model<ITestimonial>,
  ) {}

  async createTestimonial(
    user: IUser,
    description: string,
    rating: number,
  ): Promise<ITestimonial> {
    const data = await this.Testimonial.create({
      user: user._id,
      description,
      rating,
    });

    return data as ITestimonial;
  }

  async getAllActiveTestimonials(query: pagination): Promise<ITestimonial[]> {
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const data = await this.Testimonial.find({ isActive: true })
      .populate('user', 'userName photo')
      .skip(skip)
      .limit(limit)
      .lean();
    return data as ITestimonial[];
  }

  //   admin Services starting here
  async adminDeactivateTestimonial(
    id: string,
    isActive: boolean,
  ): Promise<ITestimonial> {
    const data = await this.Testimonial.findByIdAndUpdate(
      id,
      { isActive },
      { new: true },
    ).lean();
    return data as ITestimonial;
  }

  async deleteTestimonial(id: string): Promise<ITestimonial> {
    const _data = await this.Testimonial.findById(id).lean();
    if (!_data) throw new BadRequestException('Testimonial not found');

    const data = await this.Testimonial.findByIdAndDelete(id).lean();

    return data as ITestimonial;
  }

  async getAllTestimonial(query: pagination): Promise<ITestimonial[]> {
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const data = await this.Testimonial.find()
      .populate('user', 'userName photo')
      .skip(skip)
      .limit(limit)
      .lean();
    return data as ITestimonial[];
  }
}
