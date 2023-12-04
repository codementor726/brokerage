// import { Injectable } from '@nestjs/common';
// import { BadRequestException } from '@nestjs/common/exceptions';
// import { ConfigService } from '@nestjs/config';
// import { InjectModel } from '@nestjs/mongoose';
// import { SDK } from '@ringcentral/sdk';
// import Platform from '@ringcentral/sdk/lib/platform/Platform';
// import * as FormData from 'form-data';
// import * as moment from 'moment';
// import { Model } from 'mongoose';
// import { IUser } from 'src/users/interfaces/user.interface';
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

// @Injectable()
// export class RingcentralService {
//   constructor(
//     @InjectModel('User')
//     private readonly User: Model<IUser>,
//     private readonly configService: ConfigService,
//   ) {}

//   // --------------->  RINGCENTRAL FUNCTIONS START HERE  <---------------

//   // get account info of the user
//   async accountInfo(platform: Platform) {
//     return (
//       await platform.get('/restapi/v1.0/account/~').catch((e) => {
//         throw e;
//       })
//     ).json();
//   }

//   // CREATE EXTERNAL CONTACT
//   async createExternalContact(
//     platform: Platform,
//     createContactDto: CreateExternalContactDto,
//   ) {
//     //   const params = {
//     //     firstName: 'Charlie',
//     //     lastName: 'Williams',
//     //     businessPhone: '+15551234567',
//     //     businessAddress: {
//     //       street: '20 Davis Dr.',
//     //       city: 'Belmont',
//     //       state: 'CA',
//     //       zip: 94002,
//     //     },
//     // };

//     return (
//       await platform
//         .post(
//           `/restapi/v1.0/account/~/extension/~/address-book/contact`,
//           createContactDto,
//         )
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // UPDATE EXTERNAL CONTACT
//   async updateExternalContact(
//     platform: Platform,
//     contactId: number,
//     updateContactDto: UpdateExternalContactDto,
//   ) {
//     return (
//       await platform
//         .put(
//           `/restapi/v1.0/account/~/extension/~/address-book/contact/${contactId}`,
//           updateContactDto,
//         )
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // DELETE EXTERNAL CONTACT
//   async deleteExternalContact(platform: Platform, contactId: number) {
//     return platform.delete(
//       `/restapi/v1.0/account/~/extension/~/address-book/contact/${contactId}`,
//     );
//   }

//   // sending message
//   async sendMessage(
//     platform: Platform,
//     from: string,
//     recipient: string[],
//     message: string,
//   ) {
//     return (
//       await platform
//         .post('/restapi/v1.0/account/~/extension/~/sms', {
//           from: { phoneNumber: from },
//           to: recipient.map((rec) => ({ phoneNumber: rec })),
//           text: message,
//         })
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // sending mms
//   async sendMms(
//     platform: Platform,
//     from: string,
//     recipients: string[],
//     message: string,
//     files: any,
//   ) {
//     let data = {
//       from: { phoneNumber: from },
//       to: recipients.map((rec) => ({ phoneNumber: rec })),
//       text: message,
//       attachments: files.attachments,
//     };

//     let form = new FormData();
//     form.append('from', JSON.stringify(data?.from));
//     for (let key in data?.to) {
//       form.append('to', JSON.stringify(data?.to[key]));
//     }
//     form.append('text', data?.text);
//     for (let key in data?.attachments) {
//       // form.append('attachments[]', data?.attachments[key]);
//       form.append('attachments[]', Buffer.from(data?.attachments[key].buffer));
//     }

//     // console.error('FORM, =>>>>>>>>>>>>>>. 😊😊😊', form);

//     // form.append('from', { phoneNumber: from });
//     // form.append(
//     //   'to',
//     //   recipients.map((rec) => ({ phoneNumber: rec })),
//     // );
//     // form.append('text', message);
//     // files.attachments?.map((item: any) => {
//     //   return form.append('attachments', item);
//     // });

//     // attachments: form.append(
//     //   'attachments',
//     //   recipients.map((rec) => ({ phoneNumber: rec })),
//     // ),

//     return (
//       await platform
//         .post('/restapi/v1.0/account/~/extension/~/mms', form)
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // getting conversation
//   async messageList(platform: Platform, queryParams: object) {
//     return (
//       await platform
//         .get('/restapi/v1.0/account/~/extension/~/message-store', queryParams)
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // updating message read status
//   async updateMessage(
//     platform: Platform,
//     messageId: number[],
//     queryParams: object,
//   ) {
//     return (
//       await platform
//         .put(
//           `/restapi/v1.0/account/~/extension/~/message-store/${messageId}`,
//           queryParams,
//         )
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // deleting whole conversation
//   async deleteMessageList(platform: Platform, queryParams: object) {
//     return (
//       await platform
//         .delete(
//           `/restapi/v1.0/account/~/extension/~/message-store`,
//           queryParams,
//         )
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // deleting a single message
//   async deleteMessage(
//     platform: Platform,
//     messageId: number[],
//     queryParams: object,
//   ) {
//     return (
//       await platform
//         .delete(
//           `/restapi/v1.0/account/~/extension/~/message-store/${messageId}`,
//           queryParams,
//         )
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // getting call logs
//   async getLogs(platform: Platform, queryParams: object) {
//     return (
//       await platform
//         .get(`/restapi/v1.0/account/~/extension/~/call-log`, queryParams)
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // getting internal contacts
//   async getInternalContacts(platform: Platform, queryParams: object) {
//     return (
//       await platform
//         .get(`/restapi/v1.0/account/~/directory/entries`, queryParams)
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // getting user external contacts
//   async getExternalContacts(platform: Platform, queryParams: object) {
//     return (
//       await platform
//         .get(
//           `/restapi/v1.0/account/~/extension/~/address-book/contact`,
//           queryParams,
//         )
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   async call_ringoutFn(platform: Platform, RECIPIENT: string) {
//     try {
//       var resp = await platform.post(
//         '/restapi/v1.0/account/~/extension/~/ring-out',
//         {
//           from: { phoneNumber: this.configService.get('RC_USERNAME') },
//           to: { phoneNumber: RECIPIENT },
//           playPrompt: false,
//         },
//       );
//       const jsonObj = await resp.json();

//       return jsonObj;
//     } catch (e) {}
//   }

//   async cancelCall_ringoutFn(platform: Platform, ringId: string) {
//     try {
//       const resp = await platform.delete(
//         `/restapi/v1.0/account/~/extension/~/ring-out/${ringId}`,
//       );
//     } catch (e) {
//       console.log(e.message);
//     }
//   }

//   // get chats
//   async getChats(platform: Platform, queryParams: object) {
//     return (
//       await platform.get(`/restapi/v1.0/glip/chats`, queryParams).catch((e) => {
//         throw e;
//       })
//     ).json();
//   }

//   // get conversations
//   async getConversations(platform: Platform, queryParams: object) {
//     return (
//       await platform
//         .get(`/restapi/v1.0/glip/conversations`, queryParams)
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // add chat to favourite
//   async addChatToFavourite(platform: Platform, chatId: string) {
//     return (
//       await platform
//         .post(`/restapi/v1.0/glip/chats/${chatId}/favorite`)
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // remove chat from favourite
//   async removeChatFromFavourite(platform: Platform, chatId: string) {
//     return (
//       await platform
//         .post(`/restapi/v1.0/glip/chats/${chatId}/unfavorite`)
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // get business hours
//   async getBusinessHours(platform: Platform) {
//     return (
//       await platform
//         .get(`/restapi/v1.0/account/~/extension/~/business-hours`)
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // update business hours
//   async updateBusinessHours(
//     platform: Platform,
//     updateBusinessHoursDto: UpdateBusinessHoursDto,
//   ) {
//     return (
//       await platform
//         .put(
//           `/restapi/v1.0/account/~/extension/~/business-hours`,
//           updateBusinessHoursDto,
//         )
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // add number to blocklist or remove from it
//   async addNumberToBlocklist(
//     platform: Platform,
//     blockNumberDto: BlockNumberDto,
//   ) {
//     return (
//       await platform
//         .post(
//           `/restapi/v1.0/account/~/extension/~/caller-blocking/phone-numbers`,
//           blockNumberDto,
//         )
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // get block list
//   async getBlockedList(platform: Platform, queryParams: object) {
//     return (
//       await platform
//         .get(
//           `/restapi/v1.0/account/~/extension/~/caller-blocking/phone-numbers`,
//           queryParams,
//         )
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // get callhandling Rules
//   async getCallHandlingRules(platform: Platform, queryParams: object) {
//     return (
//       await platform
//         .get(`/restapi/v1.0/account/~/extension/~/answering-rule`, queryParams)
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // create call handling rules
//   async createCallHandlingRule(
//     platform: Platform,
//     createCallHandling: CreateCallHandling,
//   ) {
//     return (
//       await platform
//         .post(
//           `/restapi/v1.0/account/~/extension/~/answering-rule`,
//           createCallHandling,
//         )
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // update call handling rules
//   async updateCallHandlingRule(
//     platform: Platform,
//     ruleId: string,
//     updateCallHandling: UpdateCallHandling,
//   ) {
//     return (
//       await platform
//         .put(
//           `/restapi/v1.0/account/~/extension/~/answering-rule/${ruleId}`,
//           updateCallHandling,
//         )
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // delete call handling rule
//   async deleteCallHandlingRule(platform: Platform, ruleId: string) {
//     return (
//       await platform
//         .delete(`/restapi/v1.0/account/~/extension/~/answering-rule/${ruleId}`)
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // get recording
//   async getRecording(platform: Platform, recordingId: string) {
//     return (
//       await platform
//         .get(`/restapi/v1.0/account/~/recording/${recordingId}`)
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // get recording content returns binary data
//   async getCallRecordingsData(platform: Platform, recordingId: string) {
//     return (
//       await platform
//         .get(`/restapi/v1.0/account/~/recording/${recordingId}/content`)
//         .catch((e) => {
//           throw e;
//         })
//     ).json();
//   }

//   // --------------->  RINGCENTRAL FUNCTIONS END HERE  <---------------

//   //  --------------->  RINGCENTRAL APIS START HERE  <---------------

//   // sending a message through api
//   async createMessage(
//     user: IUser,
//     messageDto: RingCentralMessageDto,
//   ): Promise<void> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get messages because you have not set up RingCentral.',
//       );

//     const { message, toUser, to } = messageDto;

//     // const to = await this.User.findById(toUser).select('+ringCentral').lean();

//     // if (!to?.ringCentral?.username || !to?.ringCentral?.password)
//     //   throw new BadRequestException(
//     //     'You cannot send a message to a user who has not set up RingCentral.',
//     //   );

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, password, extension });
//     const response = await this.sendMessage(platform, username, to, message);

//     return response;
//   }

//   async cancelCall_ringout(payload: { user: IUser; ringId: string }) {
//     try {
//       const {
//         ringCentral: { clientId, clientSecret, extension, username, password },
//       } = payload.user;

//       if (!username || !password)
//         throw new BadRequestException(
//           'You cannot update messages because you have not set up RingCentral.',
//         );

//       const server = this.configService.get('RC_SERVER_URL');
//       const rcsdk = new SDK({ server, clientId, clientSecret });

//       const platform = rcsdk.platform();
//       platform.login({ username, extension, password });

//       return await this.cancelCall_ringoutFn(platform, payload.ringId);
//     } catch (e) {
//       console.log(e);
//     }
//   }

//   // sending MMS api
//   async createMMS(
//     user: IUser,
//     messageDto: RingCentralMessageDto,
//     files: any,
//   ): Promise<void> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot send messages because you have not set up RingCentral.',
//       );

//     const { message, to } = messageDto;

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, password, extension });
//     const response = await this.sendMms(platform, username, to, message, files);
//     return response;
//   }

//   async call_ringout(payload: { user: IUser; recipient: string }) {
//     try {
//       const {
//         ringCentral: { clientId, clientSecret, extension, username, password },
//       } = payload.user;

//       if (!username || !password)
//         throw new BadRequestException(
//           'You cannot update messages because you have not set up RingCentral.',
//         );

//       const server = this.configService.get('RC_SERVER_URL');
//       const rcsdk = new SDK({ server, clientId, clientSecret });

//       const platform = rcsdk.platform();
//       platform.login({ username, extension, password });
//       return await this.call_ringoutFn(platform, payload.recipient);
//     } catch (e) {
//       console.log(e);
//     }
//   }

//   // get a message conversation
//   async getAllRingCentralMessages(
//     user: IUser,
//     phoneNumber: string,
//   ): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get messages because you have not set up RingCentral.',
//       );

//     const queryParams = {
//       //availability: undefined,
//       //conversationId: undefined,
//       //dateFrom: undefined,
//       //dateTo: undefined,
//       //direction: undefined,
//       //distinctConversations: undefined,
//       //messageType: undefined,
//       //readStatus: undefined,
//       //page: undefined,
//       //perPage: undefined,
//       phoneNumber,
//     };

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     await platform.login({ username, password, extension });
//     const messageList = await this.messageList(platform, queryParams);

//     return messageList;
//   }

//   // update message status to read
//   async updateMessageList(user: IUser, messageId: number[]): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot update messages because you have not set up RingCentral.',
//       );

//     const queryParams = {
//       //dateFrom: undefined,
//       //type: undefined
//     };

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.updateMessage(platform, messageId, queryParams);

//     return response;
//   }

//   // delete a conversation
//   async deleteConversation(
//     user: IUser,
//     conversationId: number[],
//   ): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get messages because you have not set up RingCentral.',
//       );

//     const queryParams = {
//       conversationId,
//       //dateTo: undefined,
//       //type: undefined
//     };

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.deleteMessageList(platform, queryParams);

//     return response;
//   }

//   // delete a message
//   async deleteRingcentralMessage(
//     user: IUser,
//     messageId: number[],
//     conversationId: number,
//   ): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get call logs because you have not set up RingCentral.',
//       );

//     const queryParams = {
//       //purge: undefined,
//       conversationId,
//     };

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.deleteMessage(platform, messageId, queryParams);

//     return response;
//   }

//   // get call logs of the current user
//   async getCallLogs(
//     user: IUser,
//     query: pagination,
//     dateFrom: string,
//     phoneNumber: string,
//   ): Promise<any> {
//     const page = query.page * 1 || 1;
//     const limit = query.limit * 1 || 100;

//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get call logs because you have not set up RingCentral.',
//       );

//     const queryParams = {
//       //extensionNumber: undefined,
//       //showBlocked: undefined,
//       // phoneNumber: undefined,
//       ...(phoneNumber && { phoneNumber }),
//       //direction: undefined,
//       //sessionId: undefined,
//       //type: undefined,
//       //transport: undefined,
//       //view: undefined,
//       //withRecording: undefined,
//       //recordingType: undefined,
//       //dateTo: undefined,
//       dateFrom: moment(dateFrom).utc().format(),
//       page,
//       perPage: limit,
//       //showDeleted: undefined
//     };

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     await platform.login({ username, extension, password });
//     const response = await this.getLogs(platform, queryParams);

//     return response;
//   }

//   // get internal contacts
//   async getRingCentralInternalContacts(
//     user: IUser,
//     query: pagination,
//   ): Promise<any> {
//     const page = query.page * 1 || 1;
//     const limit = query.limit * 1 || 100;

//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get internal contacts because you have not set up RingCentral.',
//       );

//     const queryParams = {
//       //showFederated: undefined,
//       //type: undefined,
//       page,
//       perPage: limit,
//       //siteId: undefined
//     };

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.getInternalContacts(platform, queryParams);

//     return response;
//   }

//   // get all contacts
//   async getAllRingcentralContacts(type: string, user: IUser): Promise<any> {
//     let internalContacts = {};
//     let externalContacts = {};
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get contacts because you have not set up RingCentral.',
//       );

//     const queryParams = {
//       perPage: 1000,
//     };

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     if (type == 'internal') {
//       internalContacts = await this.getInternalContacts(platform, queryParams);
//     } else if (type == 'external') {
//       externalContacts = await this.getExternalContacts(platform, queryParams);
//     } else {
//       internalContacts = await this.getInternalContacts(platform, queryParams);
//       externalContacts = await this.getExternalContacts(platform, queryParams);
//     }
//     return { internalContacts, externalContacts };
//   }

//   // get external contacts
//   async getRingCentralExternalContacts(
//     user: IUser,
//     query: pagination,
//   ): Promise<any> {
//     const page = query.page * 1 || 1;
//     const limit = query.limit * 1 || 100;

//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get external contacts because you have not set up RingCentral.',
//       );

//     const queryParams = {
//       //startsWith: undefined,
//       //sortBy: undefined,
//       page,
//       perPage: limit,
//       //phoneNumber: undefined
//     };

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.getExternalContacts(platform, queryParams);

//     return response;
//   }

//   // create externa contact api
//   async createRingCentralExternalContact(
//     user: IUser,
//     createContactDto: CreateExternalContactDto,
//   ): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get call logs because you have not set up RingCentral.',
//       );

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.createExternalContact(
//       platform,
//       createContactDto,
//     );

//     return response;
//   }

//   // update external contact api
//   async updateRingCentralExternalContact(
//     user: IUser,
//     contactId: number,
//     updateContactDto: UpdateExternalContactDto,
//   ): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get update contact because you have not set up RingCentral.',
//       );

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.updateExternalContact(
//       platform,
//       contactId,
//       updateContactDto,
//     );

//     return response;
//   }

//   // delete external contact api
//   async deleteRingCentralExternalContact(
//     user: IUser,
//     contactId: number,
//   ): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot delete a contact because you have not set up RingCentral.',
//       );

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.deleteExternalContact(platform, contactId);

//     return { message: 'The contact has been deleted' };
//   }

//   // get chats of the current user
//   async getChatsOfUser(user: IUser, query: pagination): Promise<any> {
//     const page = query.page * 1 || 1;
//     const limit = query.limit * 1 || 100;
//     const skip = (page - 1) * limit;

//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get call logs because you have not set up RingCentral.',
//       );

//     const queryParams = {
//       type: ['Team', 'Personal', 'Direct', 'Group', 'Everyone'],
//       recordCount: limit,
//       // pageToken: skip,
//     };

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.getChats(platform, queryParams);

//     return response;
//   }

//   // get conversations of current user
//   async getConversationsOfUser(user: IUser, query: pagination): Promise<any> {
//     const page = query.page * 1 || 1;
//     const limit = query.limit * 1 || 100;
//     const skip = (page - 1) * limit;

//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get call logs because you have not set up RingCentral.',
//       );

//     const queryParams = {
//       recordCount: limit,
//       // pageToken: skip,
//     };

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.getConversations(platform, queryParams);

//     return response;
//   }

//   // user add chat to favourite by providing chatId
//   async userAddChatToFavourite(user: IUser, chatId: string): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get call logs because you have not set up RingCentral.',
//       );

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.addChatToFavourite(platform, chatId);

//     return response;
//   }

//   // user remove chat from favourite
//   async userRemoveChatToFavourite(user: IUser, chatId: string): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get call logs because you have not set up RingCentral.',
//       );

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.removeChatFromFavourite(platform, chatId);

//     return response;
//   }

//   // user get business hours
//   async userGetBusinesshours(user: IUser): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get Business hours because you have not set up RingCentral.',
//       );

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.getBusinessHours(platform);

//     return response;
//   }

//   // user updateBusinessHours
//   async userUpdateBusinesshours(
//     user: IUser,
//     updateBusinessHoursDto: UpdateBusinessHoursDto,
//   ): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot update Business hours because you have not set up RingCentral.',
//       );

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.updateBusinessHours(
//       platform,
//       updateBusinessHoursDto,
//     );

//     return response;
//   }

//   // user get block list
//   async userGetBlockList(
//     user: IUser,
//     query: pagination,
//     status?: string,
//   ): Promise<any> {
//     const page = query.page * 1 || 1;
//     const limit = query.limit * 1 || 100;

//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get blocked list because you have not set up RingCentral.',
//       );

//     const queryParams = {
//       page: page,
//       perPage: limit,
//       status,
//     };

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.getBlockedList(platform, queryParams);

//     return response;
//   }

//   // user add number to blocklist or remove from it
//   async userUpdateBlockList(
//     user: IUser,
//     blockNumberDto: BlockNumberDto,
//   ): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot update block list because you have not set up RingCentral.',
//       );

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.addNumberToBlocklist(platform, blockNumberDto);

//     return response;
//   }

//   // user get its call handling rules
//   async userGetCallHandlingRules(user: IUser, query: pagination): Promise<any> {
//     const page = query.page * 1 || 1;
//     const limit = query.limit * 1 || 100;

//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get call handling rules because you have not set up RingCentral.',
//       );

//     const queryParams = {
//       //type: undefined,
//       //view: undefined,
//       //enabledOnly: undefined,
//       page: page,
//       perPage: limit,
//     };

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.getCallHandlingRules(platform, queryParams);

//     return response;
//   }

//   // create call handling rule
//   async userCreateCallHandlingRule(
//     user: IUser,
//     createCallHandling: CreateCallHandling,
//   ): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot create call handling rules because you have not set up RingCentral.',
//       );

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.createCallHandlingRule(
//       platform,
//       createCallHandling,
//     );

//     return response;
//   }

//   // user update call handling rule
//   async userUpdateCallHandlingRule(
//     user: IUser,
//     ruleId: string,
//     updateCallHandling: UpdateCallHandling,
//   ): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot update call handling rules because you have not set up RingCentral.',
//       );

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.updateCallHandlingRule(
//       platform,
//       ruleId,
//       updateCallHandling,
//     );

//     return response;
//   }

//   // user delete call handling rule
//   async userDeleteCallHandlingRule(user: IUser, ruleId: string): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot delete call handling rules because you have not set up RingCentral.',
//       );

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.deleteCallHandlingRule(platform, ruleId);

//     return response;
//   }

//   // user get recording by providing recording id
//   async userGetCallRecording(user: IUser, recordingId: string): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get recording because you have not set up RingCentral.',
//       );

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.getRecording(platform, recordingId);

//     return response;
//   }

//   // user get call recording binary data
//   async userGetCallRecordingContent(
//     user: IUser,
//     recordingId: string,
//   ): Promise<any> {
//     const {
//       ringCentral: { clientId, clientSecret, extension, username, password },
//     } = user;

//     if (!username || !password)
//       throw new BadRequestException(
//         'You cannot get recording content because you have not set up RingCentral.',
//       );

//     const server = this.configService.get('RC_SERVER_URL');
//     const rcsdk = new SDK({ server, clientId, clientSecret });
//     const platform = rcsdk.platform();
//     platform.login({ username, extension, password });
//     const response = await this.getCallRecordingsData(platform, recordingId);

//     return response;
//   }

//   // async getAllMessages(
//   //   query: pagination,
//   //   status: string,
//   //   user: IUser,
//   // ): Promise<{ results: number; totalCount: number; data: IRingcentral[] }> {
//   //   // for pagination
//   //   const page = query.page * 1 || 1;
//   //   const limit = query.limit * 1 || 40;
//   //   const skip = (page - 1) * limit;

//   //   let q = {};

//   //   if (['undefined', 'null', null, undefined].includes(status)) status = 'all';

//   //   if (status == 'all') {
//   //     q = {
//   //       status: {
//   //         $in: ['pending', 'sent', 'failed'],
//   //       },
//   //     };
//   //   } else {
//   //     q = { status };
//   //   }
//   //   const [messages, messagesCount] = await Promise.all([
//   //     this.Ringcentral.find({ fromUser: user._id, ...q })
//   //       .populate('toUser', 'firstName lastName photo email')
//   //       .skip(skip)
//   //       .limit(limit)
//   //       .lean(),
//   //     this.Ringcentral.countDocuments(),
//   //   ]);

//   //   return {
//   //     results: messages.length,
//   //     totalCount: messagesCount,
//   //     data: messages as IRingcentral[],
//   //   };
//   // }

//   //  --------------->  RINGCENTRAL APIS END HERE  <---------------
// }
