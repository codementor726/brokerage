import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { GetUser, Roles } from 'src/auth/decorators/user.decorator';
import { RolesGuard } from 'src/roles-guard.guard';
import { IUser } from 'src/users/interfaces/user.interface';
import { ErrorHanldingFn, imageFileFilter } from 'src/utils/utils.helper';
import { S3Storage } from 'src/utils/utils.s3';
import { DataRoomService } from './data-room.service';
import { AssignFolderPermissionDto } from './dto/assign-folder-permission.dto';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Controller({ path: '/api/v1/data-room' })
export class DataRoomController {
  constructor(
    private readonly dataRoomService: DataRoomService,
    private readonly s3Storage: S3Storage,
  ) {}

  // @Post('/testing')
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles(
  //   'admin',
  //   'financial-analyst',
  //   'buyer-concierge',
  //   'seller-concierge',
  //   'executive',
  // )
  // async createProject(@GetUser() user: IUser, @Body() project: any) {
  //   try {
  //     /*
  //     const project = {
  //       roles: ['broker', 'buyer', 'seller', 'admin'],
  //       name: 'abc project',
  //       business: '636beaec21173189e186ffc9',
  //       isFile: false,
  //       isActive: true,
  //       children: [],
  //       folders: [
  //         {
  //           name: 'broker',
  //           roles: ['broker', 'admin'],
  //         },
  //         {
  //           name: 'seller',
  //           roles: ['seller', 'admin'],
  //         },
  //         {
  //           name: 'buyer',
  //           roles: ['buyer', 'admin'],
  //         },
  //       ],
  //     };
  //     */
  //     const data = await this.dataRoomService.createProject(user, project);

  //     return { data };
  //   } catch (error) {
  //     return ErrorHanldingFn(error);
  //   }
  // }

  /* 
   - assign folder permission to buyer/seller
  */
  @Post('/assignFolderPermimssion')
  @UseGuards(AuthGuard(), RolesGuard)
  @Roles(
    'admin',
    'financial-analyst',
    'buyer-concierge',
    'seller-concierge',
    'executive',
  )
  async assignFolderPermimssion(
    @GetUser() user: IUser,
    @Body() sssignFolderPermission: AssignFolderPermissionDto,
  ) {
    try {
      const data = await this.dataRoomService.assignFolderPermimssion(
        sssignFolderPermission,
      );

      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Get('/')
  @UseGuards(AuthGuard(), RolesGuard)
  // @Roles('admin')
  async getDataRoom(
    @GetUser() user: IUser,
    @Query('child') child: string,
    @Query('currentFolderName') currentFolderName: string,
    @Query('parent') parent: string,
    // @Query() pagination: pagination,
  ) {
    try {
      const data = await this.dataRoomService.getDataRoom(
        user,
        child,
        currentFolderName,
        parent,
      );

      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  // @Get('/admin/all')
  // @UseGuards(AuthGuard(), RolesGuard)
  // @Roles('admin')
  // async getFolders(@Query() query: pagination) {
  //   try {
  //     const data = await this.dataRoomService.getFolders(query);
  //     return { data: { results: data.length, data } };
  //   } catch (error) {
  //     return ErrorHanldingFn(error);
  //   }
  // }

  @Post('/')
  @UseGuards(AuthGuard(), RolesGuard)
  // @Roles('admin')
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'file', maxCount: 1 }], {
      fileFilter: imageFileFilter,
      limits: { fileSize: 5_000_000 },
    }),
  )
  async createFolder(
    @Body() createFolderDto: CreateFolderDto,
    @GetUser() user: IUser,
    @UploadedFiles() files: any,
  ) {
    try {
      const images = await this.s3Storage.uploadFiles(files);

      const data = await this.dataRoomService.createFolder(
        user,
        createFolderDto,
        images,
      );
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  // Update category by admin
  @Patch('/update')
  @UseGuards(AuthGuard(), RolesGuard)
  // @Roles('admin')
  async updateFolder(
    @GetUser() user: IUser,
    @Body() updateFolderDto: UpdateFolderDto,
    @Body('folderId') folderId: string,
  ) {
    try {
      const data = await this.dataRoomService.updateFolder(
        user,
        folderId,
        updateFolderDto,
      );
      return data;
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  @Delete('/delete/:folderId')
  @UseGuards(AuthGuard(), RolesGuard)
  // @Roles('admin')
  async deleteFolder(
    @GetUser() user: IUser,
    @Param('folderId') folderId: string,
  ) {
    try {
      const data = await this.dataRoomService.deleteFolder(user, folderId);
      return { data };
    } catch (error) {
      return ErrorHanldingFn(error);
    }
  }

  // @Post('/move')
  // async moveFile(
  //   @Body('sourceFolder') sourceFolder: string,
  //   @Body('destFolder') destFolder: string,
  // ): Promise<any> {
  //   const data = await this.dataRoomService.moveFile(sourceFolder, destFolder);
  // }

  // @Post('/listing')
  // async getFoldersList(@Body('folderName') folderName: string): Promise<any> {
  //   const data = await this.dataRoomService.getFoldersList(folderName);

  //   return data;
  // }

  // @Post('/folder')
  // async createProjectFolder(
  //   @Body() createDirectoryDto: CreateDirectoryDto,
  // ): Promise<any> {
  //   const data = await this.dataRoomService.createProjectFolder(
  //     createDirectoryDto,
  //   );

  //   return data;
  // }

  // @Post('/delete/directory')
  // async deleteDirectory(@Body('directory') directory: string): Promise<any> {
  //   const data = await this.dataRoomService.deleteDirectory(directory);

  //   return { data };
  // }
}
