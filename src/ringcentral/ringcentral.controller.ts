// import {
//   Body,
//   Controller,
//   Delete,
//   Get,
//   Param,
//   Patch,
//   Post,
//   Query,
//   UseGuards,
// } from '@nestjs/common';
// import { UploadedFiles, UseInterceptors } from '@nestjs/common/decorators';
// import { AuthGuard } from '@nestjs/passport';
// import { FileFieldsInterceptor } from '@nestjs/platform-express';
// import { GetUser } from 'src/auth/decorators/user.decorator';
// import { RolesGuard } from 'src/roles-guard.guard';
// import { IUser } from 'src/users/interfaces/user.interface';
// import { ErrorHanldingFn, imageFileFilter } from 'src/utils/utils.helper';
// import { pagination } from 'src/utils/utils.types';
// import { BlockNumberDto } from './dtos/block-number.dto';
// import {
//   CreateCallHandling,
//   CreateExternalContactDto,
//   RingCentralMessageDto,
//   UpdateCallHandling,
//   UpdateExternalContactDto,
// } from './dtos/ring-central.dto';
// import { UpdateBusinessHoursDto } from './dtos/update-business-hours.dto';
// import { RingcentralService } from './ringcentral.service';

// @Controller({ path: '/api/v1/ring-central' })
// export class RingcentralController {
//   constructor(private readonly ringcentralService: RingcentralService) {}

//   // @Get('/')
//   // @UseGuards(AuthGuard(), RolesGuard)
//   // async getAllMessages(
//   //   @Query() query: pagination,
//   //   @Query('status') status: string,
//   //   @GetUser() user: IUser,
//   // ) {
//   //   try {
//   //     const rs = await this.ringcentralService.getAllMessages(
//   //       query,
//   //       status,
//   //       user,
//   //     );
//   //     return { ...rs };
//   //   } catch (error) {
//   //     throw ErrorHanldingFn(error);
//   //   }
//   // }

//   @Get('/')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async getAllRingCentralMessages(
//     @GetUser() user: IUser,
//     @Query('phoneNumber') phoneNumber: string,
//   ) {
//     try {
//       const data = await this.ringcentralService.getAllRingCentralMessages(
//         user,
//         phoneNumber,
//       );

//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Get('/call-logs')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async getCallLogs(
//     @GetUser() user: IUser,
//     @Query() query: pagination,
//     @Query('dateFrom') dateFrom: string,
//     @Query('phoneNumber') phoneNumber: string,
//   ) {
//     try {
//       const data = await this.ringcentralService.getCallLogs(
//         user,
//         query,
//         dateFrom,
//         phoneNumber,
//       );

//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Get('/chats')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async getChatsOfUser(@GetUser() user: IUser, @Query() query: pagination) {
//     try {
//       const data = await this.ringcentralService.getChatsOfUser(user, query);

//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Get('/conversations')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async getConversationsOfUser(
//     @GetUser() user: IUser,
//     @Query() query: pagination,
//   ) {
//     try {
//       const data = await this.ringcentralService.getConversationsOfUser(
//         user,
//         query,
//       );

//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Get('/call-handling-rules')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async userGetCallHandlingRules(
//     @GetUser() user: IUser,
//     @Query() query: pagination,
//   ) {
//     try {
//       const data = await this.ringcentralService.userGetCallHandlingRules(
//         user,
//         query,
//       );

//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Get('/recording/:recordingId')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async userGetCallRecording(
//     @GetUser() user: IUser,
//     @Param('recordingId') recordingId: string,
//   ) {
//     try {
//       const data = await this.ringcentralService.userGetCallRecording(
//         user,
//         recordingId,
//       );

//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Get('/recording-content/:recordingId')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async userGetCallRecordingContent(
//     @GetUser() user: IUser,
//     @Param('recordingId') recordingId: string,
//   ) {
//     try {
//       const data = await this.ringcentralService.userGetCallRecordingContent(
//         user,
//         recordingId,
//       );

//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Get('/business-hours')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async userGetBusinesshours(@GetUser() user: IUser) {
//     try {
//       const data = await this.ringcentralService.userGetBusinesshours(user);

//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Get('/blocked-list')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async userGetBlockList(
//     @GetUser() user: IUser,
//     @Query() query: pagination,
//     @Query('status') status: string,
//   ) {
//     try {
//       const data = await this.ringcentralService.userGetBlockList(
//         user,
//         query,
//         status,
//       );

//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Get('/contacts')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async getAllRingcentralContacts(
//     @GetUser() user: IUser,
//     @Query('type') type: string,
//   ) {
//     try {
//       const data = await this.ringcentralService.getAllRingcentralContacts(
//         type,
//         user,
//       );

//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Get('/internal-contacts')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async getRingCentralInternalContacts(
//     @GetUser() user: IUser,
//     @Query() query: pagination,
//   ) {
//     try {
//       const data = await this.ringcentralService.getRingCentralInternalContacts(
//         user,
//         query,
//       );

//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Get('/external-contacts')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async getRingCentralExternalContacts(
//     @GetUser() user: IUser,
//     @Query() query: pagination,
//   ) {
//     try {
//       const data = await this.ringcentralService.getRingCentralExternalContacts(
//         user,
//         query,
//       );

//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Post('/create-external-contacts')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async createRingCentralExternalContact(
//     @GetUser() user: IUser,
//     @Body() createContactDto: CreateExternalContactDto,
//   ) {
//     try {
//       const data =
//         await this.ringcentralService.createRingCentralExternalContact(
//           user,
//           createContactDto,
//         );

//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Post('/webhook')
//   async webhook(@Body() body: any) {
//     try {
//       return { body };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Post('/message')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async createMessage(
//     @GetUser() user: IUser,
//     @Body() messageDto: RingCentralMessageDto,
//   ) {
//     try {
//       const data = await this.ringcentralService.createMessage(
//         user,
//         messageDto,
//       );
//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Post('/favourite-chat/:chatId')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async userAddChatToFavourite(
//     @GetUser() user: IUser,
//     @Param('chatId') chatId: string,
//   ) {
//     try {
//       const data = await this.ringcentralService.userAddChatToFavourite(
//         user,
//         chatId,
//       );
//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Post('/unfavourite-chat/:chatId')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async userRemoveChatToFavourite(
//     @GetUser() user: IUser,
//     @Param('chatId') chatId: string,
//   ) {
//     try {
//       const data = await this.ringcentralService.userRemoveChatToFavourite(
//         user,
//         chatId,
//       );
//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Post('/update-blocklist')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async userUpdateBlockList(
//     @GetUser() user: IUser,
//     @Body() blockNumberDto: BlockNumberDto,
//   ) {
//     try {
//       const data = await this.ringcentralService.userUpdateBlockList(
//         user,
//         blockNumberDto,
//       );
//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Post('/create-call-handling-rule')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async userCreateCallHandlingRule(
//     @GetUser() user: IUser,
//     @Body() createCallHandling: CreateCallHandling,
//   ) {
//     try {
//       const data = await this.ringcentralService.userCreateCallHandlingRule(
//         user,
//         createCallHandling,
//       );
//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Delete('/call/:ringId')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async cancelCall(@GetUser() user: IUser, @Param('ringId') ringId: string) {
//     try {
//       const rs = await this.ringcentralService.cancelCall_ringout({
//         user,
//         ringId,
//       });
//       return rs;
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Post('/mms')
//   @UseInterceptors(
//     FileFieldsInterceptor([{ name: 'attachments', maxCount: 10 }], {
//       fileFilter: imageFileFilter,
//       limits: { fileSize: 2_000_000 },
//     }),
//   )
//   @UseGuards(AuthGuard(), RolesGuard)
//   async createMMS(
//     @GetUser() user: IUser,
//     @Body() messageDto: RingCentralMessageDto,
//     @UploadedFiles() files: any,
//   ) {
//     try {
//       const data = await this.ringcentralService.createMMS(
//         user,
//         messageDto,
//         files,
//       );
//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Post('/call')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async makeCall(@GetUser() user: IUser, @Body('recipient') recipient: string) {
//     try {
//       const rs = await this.ringcentralService.call_ringout({
//         user,
//         recipient,
//       });
//       return rs;
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Patch('/update-call-handling-rule/:ruleId')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async userUpdateCallHandlingRule(
//     @GetUser() user: IUser,
//     @Param() ruleId: string,
//     @Body() updateCallHandling: UpdateCallHandling,
//   ) {
//     try {
//       const data = await this.ringcentralService.userUpdateCallHandlingRule(
//         user,
//         ruleId,
//         updateCallHandling,
//       );
//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Patch('/update-business-hours')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async userUpdateBusinesshours(
//     @GetUser() user: IUser,
//     @Body() updateBusinessHoursDto: UpdateBusinessHoursDto,
//   ) {
//     try {
//       const data = await this.ringcentralService.userUpdateBusinesshours(
//         user,
//         updateBusinessHoursDto,
//       );
//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Patch('/update-message/:messageId')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async updateMessageList(
//     @GetUser() user: IUser,
//     @Param('messageId') messageId: number[],
//   ) {
//     try {
//       const data = await this.ringcentralService.updateMessageList(
//         user,
//         messageId,
//       );
//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Patch('/update-external-contacts/:contactId')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async updateRingCentralExternalContact(
//     @GetUser() user: IUser,
//     @Param('contactId') contactId: number,
//     @Body() updateContactDto: UpdateExternalContactDto,
//   ) {
//     try {
//       const data =
//         await this.ringcentralService.updateRingCentralExternalContact(
//           user,
//           contactId,
//           updateContactDto,
//         );
//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Delete('/delete-message/:messageId')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async deleteRingcentralMessage(
//     @GetUser() user: IUser,
//     @Param('messageId') messageId: number[],
//     @Query('conversationId')
//     conversationId: number,
//   ) {
//     try {
//       const data = await this.ringcentralService.deleteRingcentralMessage(
//         user,
//         messageId,
//         conversationId,
//       );
//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Delete('/delete-external-contacts/:contactId')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async deleteRingCentralExternalContact(
//     @GetUser() user: IUser,
//     @Param('contactId') contactId: number,
//   ) {
//     try {
//       const data =
//         await this.ringcentralService.deleteRingCentralExternalContact(
//           user,
//           contactId,
//         );
//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Delete('/delete-conversation')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async deleteConversation(
//     @GetUser() user: IUser,
//     @Query('conversationId') conversationId: number[],
//   ) {
//     try {
//       const data = await this.ringcentralService.deleteConversation(
//         user,
//         conversationId,
//       );
//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }

//   @Delete('/delete-call-rule/:ruleId')
//   @UseGuards(AuthGuard(), RolesGuard)
//   async userDeleteCallHandlingRule(
//     @GetUser() user: IUser,
//     @Param('ruleId') ruleId: string,
//   ) {
//     try {
//       const data = await this.ringcentralService.userDeleteCallHandlingRule(
//         user,
//         ruleId,
//       );
//       return { data };
//     } catch (error) {
//       throw ErrorHanldingFn(error);
//     }
//   }
// }
