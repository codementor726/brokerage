import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import { createReadStream } from 'fs';
import * as sharp from 'sharp';
import { v4 } from 'uuid';
import { getBase64Images, getImageType, makeRoleObject } from './utils.helper';

type files = {
  key: string;
  Bucket: string;
  originalname: string;
  size: string;
  mimetype: string;
  encoding: string;
};
@Injectable()
export class S3Storage {
  constructor(private readonly configService: ConfigService) {}

  private imageBucket = this.configService.get('AWS_IMAGE_BUCKET_NAME');
  private pdfBucket = this.configService.get('AWS_IMAGE_BUCKET_NAME');
  private videoBucket = this.configService.get('AWS_IMAGE_BUCKET_NAME');
  private region = this.configService.get('AWS_BUCKET_REGION');
  private accessKeyId = this.configService.get('AWS_ACCESS_KEY');
  private secretAccessKey = this.configService.get('AWS_SECRET_KEY');

  private s3 = new S3({
    region: this.region,
    accessKeyId: this.accessKeyId,
    secretAccessKey: this.secretAccessKey,
  });

  private objectOfUploadedFiles(finalObjectInfo, resolvedPromise): object {
    const obj = {};
    let counter = 0;

    for (let i = 0; i < finalObjectInfo.length; i++) {
      for (let j = 0; j < finalObjectInfo[i]['length']; j++) {
        !!obj[finalObjectInfo[i]['name']]
          ? obj[finalObjectInfo[i]['name']].push(resolvedPromise[counter])
          : (obj[finalObjectInfo[i]['name']] = [resolvedPromise[counter]]);

        counter++;
      }
    }
    return obj;
  }

  getFileStream(params: { Bucket: string; Key: string }) {
    return this.s3.getObject(params).createReadStream();
  }

  copyFile(params: {
    Bucket: string;
    sourceFolder: string;
    fileName: string;
    destFolder: string;
  }) {
    return this.s3
      .copyObject({
        Bucket: params.Bucket,
        CopySource: `${params.Bucket}/${params.sourceFolder}`,
        Key: `${params.destFolder}/${params.fileName}`,
      })
      .promise();
  }

  async moveFile(params: {
    Bucket: string;
    sourceFolder: string;
    destFolder: string;
  }): Promise<{ files: S3.ObjectList; folders: string[] }> {
    const fileName = params.sourceFolder.split('/').at(-1);

    await this.copyFile({
      Bucket: params.Bucket,
      sourceFolder: params.sourceFolder,
      fileName,
      destFolder: params.destFolder,
    });

    await this.s3
      .deleteObject({
        Bucket: params.Bucket,
        Key: params.sourceFolder,
      })
      .promise();

    // "data-room/imgs/dp.jpg".split('/').slice(0, -1).join('/'),

    const dataRoom = await this.getFoldersList({
      Bucket: params.Bucket,
      folderName: params.destFolder + '/',
    });

    return dataRoom;
  }

  async getFoldersList(params: {
    Bucket: string;
    folderName: string;
  }): Promise<{ files: S3.ObjectList; folders: string[] }> {
    const rs = await this.s3
      .listObjectsV2({
        Bucket: params.Bucket,
        MaxKeys: 10000,
        Prefix: params.folderName.replace(/\/?$/, '/'),
        Delimiter: '/',
      })
      .promise();

    /* 
        {
    "IsTruncated": false,
    "Contents": [
        {
            "Key": "data-room/",
            "LastModified": "2022-10-20T19:47:19.000Z",
            "ETag": "\"d41d8cd98f00b204e9800998ecf8427e\"",
            "ChecksumAlgorithm": [],
            "Size": 0,
            "StorageClass": "STANDARD"
        }
    ],
    "Name": "brokerage-bucket",
    "Prefix": "data-room/",
    "Delimiter": "/",
    "MaxKeys": 20,
    "CommonPrefixes": [
        {
            "Prefix": "data-room/ABC-company/"
        },
        {
            "Prefix": "data-room/imgs/"
        }
    ],
    "KeyCount": 3
}
    */
    const dataRoom = {
      IsTruncated: rs.IsTruncated,
      files: rs?.Contents || [],
      folders: rs?.CommonPrefixes?.map(({ Prefix }) => Prefix) || [],
    };

    return dataRoom;
  }

  async createProjectFolder(params: {
    Bucket: string;
    folderName: string;
    roles?: string[];
  }) {
    const folderName = params.folderName
      .replace(/ /g, '_')
      .replace(/\/?$/, '/');

    /* 
        Metadata: {
          'my-key': 'some-value',
        }
    */

    const roles = makeRoleObject(params.roles);

    const rrrs = await this.s3
      .putObject({
        Bucket: params.Bucket,
        Key: folderName,
        Metadata: {
          ...roles,
        },
      })
      .promise();

    const dataRoom = await this.getFoldersList({
      Bucket: params.Bucket,
      folderName: folderName.split('/').at(-3),
    });

    return dataRoom;
  }

  async getUploadingSignedURL(Key, Expires = 15004): Promise<string> {
    // try {
    const url = await this.s3.getSignedUrlPromise('putObject', {
      Bucket: this.videoBucket,
      Key: Key,
      // Expires: 60 * 2, // in seconds
      Expires, // in seconds {25 mints}
      ContentType: 'video/mp4',
    });

    return url as string;
    // } catch (error) {
    //   return error;
    // }
  }

  async deleteImage(fileKey): Promise<any> {
    if (['default.png', 'default-cover.png', null, undefined].includes(fileKey))
      return;

    const deleteParams = {
      Key: fileKey,
      Bucket: this.imageBucket,
    };

    if (['default.png'].includes(fileKey)) return;
    return this.s3.deleteObject(deleteParams).promise();
  }

  deleteFile(payload: { directory: string; bucket: string }): Promise<any> {
    if (
      ['default.png', 'default-cover.png', null, undefined].includes(
        payload.directory,
      )
    )
      return;

    const deleteParams = {
      Key: payload.directory,
      Bucket: payload.bucket,
    };

    console.log(deleteParams);

    return this.s3.deleteObject(deleteParams).promise();
  }

  async deleteDirectory(payload: {
    directory: string;
    bucket: string;
  }): Promise<{
    files: S3.ObjectList;
    folders: string[];
  }> {
    const folderName = payload.directory
      .replace(/ /g, '_')
      .replace(/\/?$/, '/');

    const rs = await this.s3
      .deleteObject({
        Key: folderName,
        Bucket: payload.bucket,
      })
      .promise();

    const dataRoom = await this.getFoldersList({
      Bucket: payload.bucket,
      folderName: folderName
        .split('/')
        .slice(0, -2)
        .join('/')
        .replace(/\/?$/, '/'),
    });

    return dataRoom;
  }

  async getPDFFileStream(fileKey): Promise<any> {
    const downloadParams = {
      Key: fileKey,
      Bucket: this.pdfBucket,
    };

    return this.s3.getObject(downloadParams).createReadStream();
  }

  async uploadFiles(files: Array<Express.Multer.File>): Promise<any> {
    if (!files || files.length === 0) return;
    /*
        [
          { name: 'avatar', length: 2 },
          { name: 'basit', length: 5 },
        ];
    */
    const finalObjectInfo: Array<{ name: string; length: number }> =
      Object.entries(files).map((val) => ({
        name: val[0],
        length: val[1]['length'],
      }));

    const unresolvedPromiseOfSharp = Object.values(files)
      .flat()
      .map(async (file: Express.Multer.File) => {
        const fileType = file.mimetype?.split('/')[1];
        let _sharp;
        if (file.mimetype.startsWith('image')) {
          if (fileType == 'jpeg' || fileType == 'jpg')
            _sharp = await sharp(file?.buffer)
              .resize()
              .toFormat('jpeg')
              .jpeg({ quality: 40 })
              .toBuffer();
          else if (fileType == 'gif')
            _sharp = await sharp(file?.buffer)
              .resize()
              .toFormat('gif')
              .gif()
              .toBuffer();
          else if (fileType == 'webp')
            _sharp = await sharp(file?.buffer)
              .resize()
              .toFormat('webp')
              .webp()
              .toBuffer();
          else
            _sharp = await sharp(file?.buffer)
              .resize()
              .toFormat('png')
              .png()
              .toBuffer();
        } else {
          _sharp = file?.buffer;
        }
        return _sharp;
      });
    const sharpImages = await Promise.all(unresolvedPromiseOfSharp);

    const resolvedfiles = [];

    const unresolvedPromise = Object.values(files)
      .flat()
      .map(async (file: Express.Multer.File, i) => {
        const ext = file?.originalname.split('.').at(-1);
        let params: any = {
          Body: sharpImages[i],
          Bucket: this.imageBucket,
          Key: `${v4()}.${ext || 'jpeg'}`,
        };

        resolvedfiles.push({
          key: params.Key,
          Bucket: this.imageBucket,
          originalname: file?.originalname,
          size: file?.size,
          mimetype: file?.mimetype,
          encoding: file?.encoding,
        });
        return this.s3.putObject(params).promise();
      });

    // const resolvedPromise =
    await Promise.all(unresolvedPromise);

    const result = this.objectOfUploadedFiles(finalObjectInfo, resolvedfiles);

    return result;
  }

  async uploadPdf(body: Buffer): Promise<string> {
    const Key = `${v4()}.pdf`;

    await this.s3
      .putObject({
        Body: body,
        ContentType: 'application/pdf',
        Bucket: this.imageBucket,
        Key,
      })
      .promise();

    return Key;
  }

  async uploadWord(body: Buffer): Promise<string> {
    const Key = `${v4()}.docx`;

    await this.s3
      .putObject({
        Body: body,
        ContentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        Bucket: this.imageBucket,
        Key,
      })
      .promise();

    return Key;
  }

  async uploadBase64Files(fileKey): Promise<string[]> {
    const keys = [];
    const proms = getBase64Images(fileKey).map((image) => {
      let imgType = getImageType(image);
      let base64data = Buffer.from(
        image.replace(/^data:image\/\w+;base64,/, ''),
        'base64',
      );

      let _key = `${v4()}.${imgType}`;
      keys.push(_key);

      return this.s3
        .putObject({
          Key: _key,
          Body: base64data,
          ContentEncoding: 'base64',
          ContentType: `image/${imgType}`,
          Bucket: this.imageBucket,
        })
        .promise();
    });

    await Promise.all(proms);
    return keys;
  }
}
