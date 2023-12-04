import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { pagination } from 'src/utils/utils.types';
import { CreateValuationDto } from './dto/create-valuation.dto';
import { IValuation } from './interfaces/valuation.interface';

@Injectable()
export class ValuationService {
  constructor(
    @InjectModel('Valuation')
    private readonly Valuation: Model<IValuation>,
  ) { }

  async createValuation(
    createValuationDto: CreateValuationDto,
  ): Promise<IValuation> {
    const data = await this.Valuation.create(createValuationDto);

    return data as IValuation;
  }

  // ---------------> ADMIN SERIVCES <---------------

  async getAllValuations(
    query: pagination,
    status: string,
    search: string,
  ): Promise<{ data: IValuation[]; totalCount: number }> {
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
        status: { $in: ['pending', 'evaluated', 'rejected'] },
      };
    } else {
      q = {
        ...q,
        status,
      };
    }

    const valuations = await this.Valuation.find(q)
      .sort('-createdAt -updatedAt')
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await this.Valuation.countDocuments();

    return { data: valuations as IValuation[], totalCount };
  }

  async getSpecificValuation(
    id: string
  ): Promise<{ data: IValuation }> {
    const valuation = await this.Valuation.findById(id)

    return { data: valuation };
  }

  async updateValuation(
    valuationId: string,
    status: string,
  ): Promise<IValuation> {
    const data = await this.Valuation.findByIdAndUpdate(
      valuationId,
      { status },
      { new: true },
    ).lean();

    return data as IValuation;
  }

  async deleteValuation(valuationId: string): Promise<IValuation> {
    const data = await this.Valuation.findByIdAndDelete(valuationId).lean();

    return data as IValuation;
  }
}
