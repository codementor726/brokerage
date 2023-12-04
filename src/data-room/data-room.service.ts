import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUser } from 'src/users/interfaces/user.interface';
import { everyFn, includes, matchRoles } from 'src/utils/utils.helper';
import { S3Storage } from 'src/utils/utils.s3';
import { pagination } from 'src/utils/utils.types';
import { AssignFolderPermissionDto } from './dto/assign-folder-permission.dto';
import { CreateFolderDto } from './dto/create-folder.dto';
import { RevokeDataRoomPermissionDto } from './dto/revoke-data-room-permission.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { IFolder } from './interfaces/folder.interface';

@Injectable()
export class DataRoomService {
  constructor(
    @InjectModel('Folder')
    private readonly Folder: Model<IFolder>,
    @InjectModel('User')
    private readonly User: Model<IUser>,
    private readonly s3Storage: S3Storage,
  ) {}

  async getDataRoom(
    user: IUser,
    child: string,
    currentFolderName: string,
    parent: string,
  ): Promise<{
    brokerFolders: IFolder[];
    companyFolders: IFolder[];
    listingFolders: IFolder[];
  }> {
    const query = !!child ? { _id: child } : { parent: { $exists: null } };

    const isUser = user.role.some((_role) =>
      ['buyer', 'seller'].includes(_role),
    );
    // two different queries for 1) buyer/seller and 2) for ant other roles
    let roleQuery: any = {
      roles: { $in: user.role },
      type: { $ne: 'broker' },
    };

    if (isUser) {
      // if current req. is from user.

      roleQuery = {
        $or: [{ allowedBuyers: user._id }, { allowedSellers: user._id }],
      };
    } else if (user.role.includes('broker')) {
      // if current req. is from broker.

      if (currentFolderName == 'broker')
        roleQuery = {
          roles: { $in: user.role },
          type: 'broker',
          owner: user._id,
        };
      else roleQuery = { roles: { $in: user.role } };

      if (parent == 'true') {
        delete roleQuery.owner;
      }
    }

    // if folder has sub folder then pagination is wasted so i guess its useless to put the pagination
    const folders = await this.Folder.find({ ...roleQuery, ...query })
      .populate('parent', '-children')
      .populate('business', 'broker')
      .populate({ path: 'children', match: roleQuery })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    let brokerFolders = folders.filter(
      (el) => el.type == 'broker',
    ) as IFolder[];
    let companyFolders = folders.filter(
      (el) => el.type == 'company',
    ) as IFolder[];
    let listingFolders = folders.filter(
      (el) => el.type == 'data-room',
    ) as IFolder[];

    const childrenArray = !!child
      ? brokerFolders.length > 0
        ? brokerFolders
        : companyFolders.length > 0
        ? companyFolders
        : listingFolders
      : [];

    return {
      ...(!child && {
        brokerFolders,
        companyFolders,
        listingFolders,
      }),
      ...(!!child && {
        folders: childrenArray,
      }),
    };
  }

  async createProject(
    user: IUser,
    project: {
      roles: string[];
      parent?: string;
      business: string;
      owner?: string;
      name: string;
      isFile: boolean;
      isDeletable: boolean;
      isActive: boolean;
      fileName?: string;
      children?: string[];
      folders: { name: string; isDeletable: boolean; roles: string[] }[];
    },
  ): Promise<IFolder> {
    project.owner = user._id;
    const businessFolder = await this.Folder.create(project);

    const subFolders = project.folders.map((folder) => {
      folder.roles.push('admin');
      return {
        roles: folder.roles,
        owner: user._id,
        isDeletable: folder.isDeletable,
        business: businessFolder.business,
        parent: businessFolder._id,
        name: folder.name,
        isFile: false,
        isActive: true,
        fileName: undefined,
        children: [],
      };
    });

    const subFolderIds = await this.Folder.insertMany(subFolders);

    const data = await this.Folder.findByIdAndUpdate(
      businessFolder._id,
      {
        children: subFolderIds.map((el) => el._id),
      },
      { new: true },
    );

    return data as IFolder;
  }

  async createFolder(
    user: IUser,
    createFolderDto: CreateFolderDto,
    files: any,
  ): Promise<any> {
    const admins = [
      'admin',
      'financial-analyst',
      'buyer-concierge',
      'seller-concierge',
      'executive',
    ];

    const brokers = ['broker', 'third-party-broker'];
    /* 
      console.log(files?.file[0], '<--------------');

      {
        key: '89cfcef4-2448-4d72-ba33-d738d914bd88.jpg',
        Bucket: 'brokerage-bucket-dev',
        originalname: 'testimage.jpg',
        size: 49056,
        mimetype: 'image/jpeg',
        encoding: '7bit'
      } 
    */

    // REQUIRED CODE HERE
    const parentFolder = await this.Folder.findById(createFolderDto?.parent)
      .select('+isDeletable')
      .populate('business', 'broker _id')
      .lean();

    if (!parentFolder)
      throw new BadRequestException('Parent folder doest not exists');

    if (!!parentFolder?.isFile)
      throw new BadRequestException('Sorry file cannot have sub directories');

    // checking if the req. is from user
    const isUser = user.role.some((_role) =>
      ['buyer', 'seller'].includes(_role),
    );

    createFolderDto.owner = user._id;
    createFolderDto.type = parentFolder.type;
    if (parentFolder.type == 'data-room')
      createFolderDto.business = (parentFolder.business as any)._id;

    if (files?.file) {
      createFolderDto.name = files?.file[0].key;
      createFolderDto.fileName = files?.file[0].originalname;
      createFolderDto.isFile = true;
      createFolderDto.name = files?.file[0].key;
    } else {
      if (!createFolderDto?.name)
        throw new BadRequestException('Folder Name is required');
    }

    // ==============
    // LOGICs HERE //
    // ==============
    if (isUser) {
      /*    

      // OLD CODE

        if (isUser) {
          if (includes(user._id, parentFolder.allowedBuyers))
            createFolderDto.allowedBuyers = [user._id];
          else createFolderDto.allowedSellers = [user._id];

          // if user theres no need to save roles
          createFolderDto.roles = createFolderDto.roles.filter(
            (el) => !['buyer', 'seller'].includes(el),
          );
        } else {
          createFolderDto.allowedBuyers = undefined;
          createFolderDto.allowedSellers = undefined;
        }
      */

      // checking if the user is buyer or seller.
      const allowedBuyers = includes(user._id, parentFolder.allowedBuyers);
      const allowedSellers = includes(user._id, parentFolder.allowedSellers);

      // if user is not allowed to access the parent folder and create the sub folder/files
      if (!allowedBuyers && !allowedSellers)
        throw new BadRequestException('Sorry, cannot perform operations');

      if (allowedBuyers) {
        // if he is allowed as 'allowedBuyers'
        createFolderDto.allowedBuyers = [user._id];
      } else {
        // if he is allowed as 'allowedSellers'
        createFolderDto.allowedSellers = [user._id];
      }

      // setting role for user (buyer/seller) creates the folder/files.
      createFolderDto.roles = [...admins, ...brokers];
    } else if (
      matchRoles(brokers, user.role) &&
      parentFolder.type == 'broker'
    ) {
      /* PARENT DATA_ROOM OF BROKER CASE */

      // if broker is not allowed to access the parent folder and want to create the sub folder/files
      // then  throw error

      if (parentFolder.isDeletable)
        if (String(parentFolder.owner) !== String(user._id))
          throw new UnauthorizedException('Sorry, cannot perform operations');

      createFolderDto.roles = parentFolder.roles;
    } else if (
      (matchRoles(admins, user.role) || matchRoles(brokers, user.role)) &&
      parentFolder.type == 'company'
    ) {
      if (
        String(parentFolder.owner) !== String(user._id) &&
        parentFolder.isDeletable
      )
        throw new BadRequestException(
          `Cannot create/upload file in other role's folder`,
        );

      createFolderDto.roles = [...admins, ...brokers];
      // createFolderDto.roles = parentFolder.roles;
      createFolderDto.owner = user._id;
    } else if (matchRoles(brokers, user.role)) {
      // if broker is not allowed to access the parent folder and want to create the sub folder/files
      // then  throw error
      if (!matchRoles(brokers, parentFolder.roles))
        throw new BadRequestException('Sorry, cannot perform operations');

      // only business assigned brokers can participate on the folders
      if (!includes(user._id, parentFolder?.business?.broker))
        throw new BadRequestException(
          'Sorry, You are not allowed to perform action as you are not assigned to this business.',
        );

      createFolderDto.roles = parentFolder.roles;

      createFolderDto.allowedBuyers = parentFolder.allowedBuyers;
    } else if (matchRoles(admins, user.role)) {
      /* 
        
      {
        "data": {
        "name": "ed1f0307-205b-45d3-8d7f-0c681f4ece88.jpg",
        "fileName": "c0f4d042-8963-477c-8173-48ba38bb6537.jpg",
        "isFile": true,
        "owner": "636521f96bc3cb3a30166d9e",
        "business": "636d413f78acab38bafc1caa",
        "parent": "636d413f78acab38bafc1cb8",
        "allowedBuyers": [],
        "allowedSellers": [
            "636521f96bc3cb3a30166d9e"
        ],
        "children": [],
        "roles": [
            "admin"
        ],
        "isActive": true,
        "_id": "636d47ba78acab38bafc1d47",
        "createdAt": "2022-11-10T18:49:30.260Z",
        "updatedAt": "2022-11-10T18:49:30.260Z",
        "__v": 0
      }
    }
      
      */

      // setting inherited properties from the parent folder in case if admin creates folder/file of other roles
      // if admin allows the roles
      // if (createFolderDto.roles.length > 0) {
      //   // if admin define role does not exists in parent role
      //   const isNotEvery = !everyFn(parentFolder.roles, createFolderDto.roles);

      //   if (isNotEvery)
      //     throw new BadRequestException(
      //       'Assigned roles may not exists in parent folder',
      //     );

      //   // else just assign the roles
      //   // createFolderDto.roles = ['admin', ...createFolderDto.roles];
      // } else {
      //   createFolderDto.roles = ['admin', ...parentFolder.roles];
      // }
      createFolderDto.roles = [...admins, ...parentFolder.roles];

      createFolderDto.allowedSellers = parentFolder.allowedSellers;
      createFolderDto.allowedBuyers = parentFolder.allowedBuyers;
    } else {
      throw new BadRequestException('Invalid operation');
    }

    createFolderDto.roles = [...new Set(createFolderDto.roles)];
    const data = await this.Folder.create(createFolderDto);

    await this.Folder.findByIdAndUpdate(createFolderDto?.parent, {
      $push: { children: data._id },
    });

    return data as IFolder;
  }

  async updateFolder(
    user: IUser,
    folderId: string,
    updateFolderDto: UpdateFolderDto,
  ): Promise<IFolder> {
    // checking if the req. is from user
    const isUser = user.role.some((_role) =>
      ['buyer', 'seller'].includes(_role),
    );

    const _data = await this.Folder.findById(folderId)
      .populate('business', 'broker')
      .select('+isDeletable')
      .lean();

    if (!_data) throw new BadRequestException('Folder not found');

    if (!_data?.isDeletable)
      throw new BadRequestException('Parent folder cannot be modified');

    // ================================================================================
    // ================================================================================
    if (isUser) {
      // checking if the user is buyer or seller.
      const allowedBuyers = includes(user._id, _data.allowedBuyers);
      const allowedSellers = includes(user._id, _data.allowedSellers);

      // if user is not allowed to access the parent folder and update the sub folder
      if (!allowedBuyers && !allowedSellers)
        throw new BadRequestException('Sorry, cannot perform operations');
    } else if (user.role.includes('broker') && _data.type == 'broker') {
      /* PARENT DATA_ROOM OF BROKER CASE */

      // if broker is not allowed to access the parent folder and want to update the sub folder only
      // then  throw error
      if (_data.isDeletable)
        if (String(_data.owner) !== String(user._id))
          throw new UnauthorizedException('Sorry, cannot perform operations');
      delete updateFolderDto?.roles;
    }
    // ========================
    else if (user.role.includes('broker') && _data.type == 'company') {
      // only Company assigned brokers can participate on the folders
      if (String(user._id) != String(_data.owner))
        throw new BadRequestException(
          'Sorry, You are not allowed to perform action as you are not assigned to this business.',
        );

      delete updateFolderDto?.roles;
    }
    // ========================
    else if (user.role.includes('broker')) {
      // if broker is not allowed to access the parent folder and want to create the sub folder/files
      // then  throw error

      // only business assigned brokers can participate on the folders
      if (!includes(user._id, _data?.business?.broker))
        throw new BadRequestException(
          'Sorry, You are not allowed to perform action as you are not assigned to this business.',
        );

      delete updateFolderDto?.roles;
    } else if (user.role.includes('admin')) {
      if (updateFolderDto?.roles?.length > 0) {
        // if admin define role does not exists in parent role
        const isNotEvery = !everyFn(_data.roles, updateFolderDto.roles);

        if (isNotEvery)
          throw new BadRequestException(
            'Assigned roles may not exists in parent folder',
          );

        // else just assign the roles
        updateFolderDto.roles = ['admin', ...updateFolderDto.roles];
      }
    } else {
      throw new BadRequestException('Invalid operation');
    }

    const data = await this.Folder.findByIdAndUpdate(
      folderId,
      updateFolderDto,
      { new: true },
    )
      .populate('parent', '-children')
      .populate('business', 'broker')
      .populate({ path: 'children' })
      .lean();

    return data as IFolder;
  }

  async deleteFolder(user: IUser, folderId: string): Promise<IFolder> {
    const deletingFolder = await await this.Folder.findById(folderId)
      .select('+isDeletable')
      .populate('business', 'broker')
      .lean();

    if (!deletingFolder.isDeletable)
      throw new BadRequestException('Sorry Cannot delete the main folders');

    if (!deletingFolder) throw new BadRequestException('Folder not found');

    // checking if the req. is from user
    const isUser = user.role.some((_role) =>
      ['buyer', 'seller'].includes(_role),
    );

    // Preventing unauthorized deleteing folder example: buyer del. the seller folder
    if (isUser) {
      // checking if the user is buyer or seller.
      const allowedBuyers = includes(user._id, deletingFolder.allowedBuyers);
      const allowedSellers = includes(user._id, deletingFolder.allowedSellers);

      // if user is not allowed to access the parent folder and create the sub folder/files
      if (!allowedBuyers && !allowedSellers)
        throw new UnauthorizedException('Sorry, cannot perform this operation');
    } else if (
      user.role.includes('broker') &&
      deletingFolder.type == 'broker'
    ) {
      /* PARENT DATA_ROOM OF BROKER CASE */

      // if broker is not allowed to access the parent folder and want to create the sub folder/files
      // then  throw error
      if (String(deletingFolder.owner) !== String(user._id))
        throw new UnauthorizedException('Sorry, cannot perform operations');
    }
    // ==================================
    else if (user.role.includes('broker') && deletingFolder.type == 'company') {
      // only business assigned brokers can participate on the folders
      if (String(user._id) != String(deletingFolder?.owner))
        throw new BadRequestException(
          'Sorry, You are not allowed to perform action.',
        );
    }
    // ==================================
    else if (user.role.includes('broker')) {
      // if broker is not allowed to access the parent folder and want to delete the sub folder/files
      // then throw error
      if (!deletingFolder.roles.includes('broker'))
        throw new BadRequestException('Sorry, cannot perform operations');

      // only business assigned brokers can participate on the folders
      if (!includes(user._id, deletingFolder?.business?.broker))
        throw new BadRequestException(
          'Sorry, You are not allowed to perform action.',
        );
    }

    if (deletingFolder?.children?.length > 0)
      throw new BadRequestException('Sorry, the folder contains files in it');

    const deletedFolder = await this.Folder.findByIdAndDelete(folderId).lean();

    // if it's a file deleting fom the s3 bucket
    if (deletedFolder.isFile)
      await this.s3Storage.deleteImage(deletedFolder.name);

    await this.Folder.findByIdAndUpdate(deletedFolder.parent, {
      $pull: { children: deletedFolder._id },
    });

    return deletedFolder as IFolder;
  }

  async getChildFolder(payload: {
    parentFolderId: string;
    folderName: string;
  }): Promise<[Error, IFolder]> {
    const childFolder = await this.Folder.findOne({
      parent: payload.parentFolderId,
      name: payload.folderName,
    }).lean();

    if (!childFolder) return [new BadRequestException('not found'), null];
    return [null, childFolder as IFolder];
  }

  async createFoldersWithBuyerNames(params: {
    businessId: string;
    userIds: string[];
    role: string;
    parent: string;
  }): Promise<void> {
    // const { businessId, newBrokers, excludedBrokers } = params;
    const users = await this.User.find({ _id: { $in: params.userIds } })
      .select('firstName lastName')
      .lean();

    const folders = users.map((el) => {
      const allowedBuyers = [],
        allowedSellers = [];

      params.role == 'buyer'
        ? allowedBuyers.push(el._id)
        : allowedSellers.push(el._id);

      return {
        name: `${el.firstName} ${el.lastName}`,
        isFile: false,
        type: 'data-room',
        owner: el._id,
        leavedUsers: [],
        business: params.businessId,
        parent: params.parent,
        allowedBuyers,
        allowedSellers,
        children: [],
        roles: ['admin', 'broker'],
        isActive: true,
        isDeletable: true,
        order: 2,
      };
    });

    const newFolders = await this.Folder.insertMany(folders);
    const ids = newFolders.map((el) => el._id);

    await this.Folder.findByIdAndUpdate(params.parent, {
      $push: { children: { $each: ids } },
    });
  }

  /* 
    - get all the parents.
    - and assign the buyer and seller permissions.
    - revoke data-room permimssion of user but from the last child thast why will not be used this feature
  */
  async assignFolderPermimssion(
    assignFolderPermission: AssignFolderPermissionDto,
  ): Promise<string[]> {
    const parents: string[] = [];
    let folder: IFolder = null;

    const queryKeyWord = assignFolderPermission.isAllowing
      ? '$addToSet'
      : '$pullAll';

    const updatedQuery =
      assignFolderPermission.role == 'buyer'
        ? {
            [queryKeyWord]: {
              allowedBuyers: { $each: assignFolderPermission.userIds },
            },
          }
        : {
            [queryKeyWord]: { allowedSellers: assignFolderPermission.userIds },
          };

    let child = assignFolderPermission.child;
    do {
      folder = await this.Folder.findById(child).select('parent').lean();

      if (folder?.parent) parents.unshift(folder.parent);
      else break;

      child = folder.parent;
    } while (!!child);

    if (parents.length > 0) {
      parents.push(assignFolderPermission.child);

      await this.Folder.updateMany(
        { _id: { $in: parents } },
        updatedQuery,
      ).lean();
    }

    return parents;
  }

  /* 
    - Remove buyer and seller to the specific listings.
  */
  async revokeDataRoomPermimssion(
    revokeDataRoomPermissionDto: RevokeDataRoomPermissionDto,
  ): Promise<[Error, void]> {
    const folder = await this.Folder.findById(
      revokeDataRoomPermissionDto.projectId,
    ).select('allowedBuyers allowedSellers');

    if (!folder) return [new BadRequestException('No data-room  found'), null];

    // checking if the user is buyer or seller.
    const allowedBuyers = includes(
      revokeDataRoomPermissionDto.userId,
      folder.allowedBuyers,
    );

    const allowedSellers = includes(
      revokeDataRoomPermissionDto.userId,
      folder.allowedSellers,
    );

    const role = allowedBuyers ? 'buyer' : 'seller';
    console.log({ allowedBuyers, allowedSellers });

    // if user is not allowed to access the parent folder and create the sub folder/files
    if (!allowedBuyers && !allowedSellers)
      throw new BadRequestException('Sorry, cannot perform operations');

    if (!folder) return [new BadRequestException('No data-room  found'), null];

    const updatedQuery: object =
      role == 'buyer'
        ? {
            $pull: {
              allowedBuyers: (revokeDataRoomPermissionDto.userId as any)._id,
            },
          }
        : {
            $pull: {
              allowedSellers: (revokeDataRoomPermissionDto.userId as any)._id,
            },
          };

    await this.Folder.updateMany(
      { _id: revokeDataRoomPermissionDto.projectId },
      updatedQuery,
    ).lean();

    return [null, null];
  }

  async getFolders(query: pagination): Promise<IFolder[]> {
    // for pagination
    const page = query.page * 1 || 1;
    const limit = query.limit * 1 || 40;
    const skip = (page - 1) * limit;

    const data = await this.Folder.find()
      .sort('order')
      .skip(skip)
      .limit(limit)
      .lean();
    return data as IFolder[];
  }

  async updateFolderBrokers(params: {
    businessId: string;
    excludedBrokers: string[];
    newBrokers: string[];
  }): Promise<void> {
    const { businessId, newBrokers, excludedBrokers } = params;

    await this.Folder.updateMany(
      { business: businessId, owner: { $in: excludedBrokers } },
      {
        owner: newBrokers[0],
        $addToSet: { leavedUsers: { $each: excludedBrokers as any[] } },
      },
    );
  }

  async updateFolderOwners(params: {
    businessId: string;
    prevOwner: string;
    newOwner: string;
  }): Promise<void> {
    const { businessId, prevOwner, newOwner } = params;

    const criteriaFolderIds = await this.Folder.find({
      business: businessId,
      allowedSellers: prevOwner,
    }).distinct('_id');

    await Promise.all([
      // 1. ALL PARENT ASSIGNED OWNER FOLDERS WILL BE ADDED BY THE NEW ONE (no old owner is replaced here)
      this.Folder.updateMany(
        { _id: { $in: criteriaFolderIds } },
        {
          $addToSet: {
            allowedSellers: newOwner as any,
            leavedUsers: prevOwner as any,
          },
        },
      ),

      // PULLING OLD OWNER FROM THE FOLDERS
      this.Folder.updateMany(
        { _id: { $in: criteriaFolderIds } },
        // { business: businessId, allowedSellers: prevOwner },
        { $pull: { allowedSellers: prevOwner as any } },
      ),

      this.Folder.updateMany(
        { business: businessId, owner: prevOwner },
        { owner: newOwner, $addToSet: { leavedUsers: prevOwner as any } },
      ),
    ]);
  }

  // addBuyers to leaved Users
  async addBuyersToLeavedUsers(payload: {
    businessId: string;
    allowedBuyers: string[];
  }): Promise<void> {
    const { businessId, allowedBuyers } = payload;

    const folderIds = await this.Folder.find({
      business: businessId,
      allowedBuyers: { $in: allowedBuyers },
    })
      .distinct('_id')
      .lean();

    console.log({ folderIds });

    await this.Folder.updateMany(
      { _id: { $in: folderIds } },
      { $addToSet: { leavedUsers: { $each: allowedBuyers as any } } },
    );
  }

  // async moveFile(sourceFolder: string, destFolder: string): Promise<any> {
  //   const params = {
  //     Bucket: 'brokerage-bucket',
  //     sourceFolder,
  //     destFolder,
  //   };

  //   return await this.s3Storage.moveFile(params);
  // }

  // async getFoldersList(folderName: string): Promise<any> {
  //   const params = {
  //     Bucket: 'brokerage-bucket',
  //     folderName,
  //   };

  //   return await this.s3Storage.getFoldersList(params);
  // }

  // async deleteDirectory(directory: string): Promise<any> {
  //   const payload = {
  //     bucket: 'brokerage-bucket',
  //     directory,
  //   };

  //   const isFile = !!payload.directory.split('.')[1];

  //   if (isFile) return await this.s3Storage.deleteFile(payload);
  //   else return await this.s3Storage.deleteDirectory(payload);
  // }

  // async createProjectFolder(
  //   createDirectoryDto: CreateDirectoryDto,
  // ): Promise<any> {
  //   const payload = {
  //     Bucket: 'brokerage-bucket',
  //     ...createDirectoryDto,
  //   };

  //   return await this.s3Storage.createProjectFolder(payload);
  // }
}
