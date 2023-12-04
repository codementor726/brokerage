import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { S3Storage } from 'src/utils/utils.s3';
import { pagination } from 'src/utils/utils.types';
import { IOurTeam } from './interfaces/our-team.interface';

@Injectable()
export class OurTeamService {
  constructor(
    @InjectModel('OurTeam')
    private readonly OurTeam: Model<IOurTeam>,
    private readonly s3Storage: S3Storage,
  ) {}

  async create(payload, files: any): Promise<IOurTeam> {
    const image = await this.s3Storage.uploadFiles(files);

    if (image?.photo) payload.photo = image?.photo[0].key;

    let data = await this.OurTeam.create(payload);
    data = await this.OurTeam.findOne({ _id: data._id }).lean();
    return data as IOurTeam;
  }

  async update(id: string, payload, files: any): Promise<IOurTeam> {
    const image = await this.s3Storage.uploadFiles(files);

    if (image?.photo) {
      payload.photo = image?.photo[0].key;

      const oldPhoto = await this.OurTeam.findById(id).select('photo');

      this.s3Storage.deleteImage(oldPhoto?.photo);
    }

    let data = await this.OurTeam.findByIdAndUpdate(id, payload, { new: true });
    return data as IOurTeam;
  }

  async findAll(
    query: pagination,
  ): Promise<{ data: IOurTeam[]; totalCount: number; results: number }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const data = await this.OurTeam.find({ isActive: true })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean();

    const countDocuments = await this.OurTeam.countDocuments({
      isActive: true,
    });

    return {
      data: data as IOurTeam[],
      totalCount: countDocuments,
      results: data.length,
    };
  }

  async findAllForAdmin(
    query: pagination,
    status: string,
  ): Promise<{ data: IOurTeam[]; totalCount: number; results: number }> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;
    const dbQuery = { ...(status && status != 'all' && { isActive: status }) };

    const data = await this.OurTeam.find(dbQuery)
      .sort('order')
      .skip(skip)
      .limit(limit)
      .lean();

    const countDocuments = await this.OurTeam.countDocuments(dbQuery);

    return {
      data: data as IOurTeam[],
      totalCount: countDocuments,
      results: data.length,
    };
  }

  async delete(id: string): Promise<IOurTeam> {
    const _data = await this.OurTeam.findOne({ user: id }).lean();
    if (!_data) throw new BadRequestException('Team member not found');

    const data = await this.OurTeam.findOneAndDelete({ user: id }).lean();

    await this.s3Storage.deleteImage(_data.photo);

    return data as IOurTeam;
  }
}
