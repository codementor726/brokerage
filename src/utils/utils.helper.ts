import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { writeFile } from 'fs';
import { asBlob } from 'html-docx-js';
import { generatePdf } from 'html-pdf-node-ts';
import * as moment from 'moment';
import { promisify } from 'util';

// TYPES
export type leadGraphType = {
  _id: number;
  date: string;
  lead: number;
  month: string;
};

export const matchRoles = (roles: string[], userRoles: string[]) => {
  return roles.some((role) => userRoles.includes(role));
};

export const saveFile = async (html: string) => {
  const converted = asBlob(html, {
    orientation: 'portrait',
    margins: { bottom: 800, left: 700, right: 700, top: 800 },
  });

  const buffer = Buffer.from(await (converted as any).arrayBuffer());

  //  buffer;
  // await promisify(writeFile)('d222ocument.docx', buffer);
  return buffer;
};

export const getImageType = (base64String: string) =>
  base64String.substring('data:image/'.length, base64String.indexOf(';base64'));

export const getBase64Images = (str: string) =>
  str?.match(/(data:image\/[^;]+;base64[^"]+)/g);

export const addBoxFlags = (box: string): string[] => {
  const mailBox = {
    broker: ['\\Seen', '\\Answered'],
    listing: ['\\Seen', '\\Flagged'],
    admin: ['\\Seen', '\\Deleted'],
    buyer: ['\\Seen', '\\Draft'],
  };
  return mailBox[box];
};

export const categorizeByrole = (users: any[]) => {
  let role = null;
  const categorizedUsers = {};
  for (const user of users) {
    if (user.role.includes('broker')) role = 'broker';
    else if (user.role.includes('co-broker')) role = 'co-broker';
    else if (user.role.includes('third-party-broker'))
      role = 'third-party-broker';
    else if (user.role.includes('banker')) role = 'banker';
    else if (user.role.includes('attorney')) role = 'attorney';
    else if (user.role.includes('accountant')) role = 'accountant';
    else if (user.role.includes('job-seeker')) role = 'job-seeker';
    else if (user.role.includes('seller')) role = 'seller';
    else role = user.role[0];

    !!categorizedUsers[role]
      ? categorizedUsers[role].push(user)
      : (categorizedUsers[role] = [user]);
  }

  return categorizedUsers;
};

export const isBoolean = (val) => !!val === val;

export const paginate = (array: any[], limit: number, skip: number) => {
  return array.slice((skip - 1) * limit, (skip + 1) * limit);
};

export const daysRange = (startDate: any, count: number) => {
  const days = [];

  for (let i = 0; i < Number(count); i++) {
    days.push(moment(startDate).add(i, 'days').utc().startOf('day'));
  }

  return days;
};

export const daysCount = (startDate, endDate) => {
  return (
    moment(endDate, 'YYYY-MM-DD')
      .startOf('day')
      .diff(moment(startDate, 'YYYY-MM-DD').startOf('day'), 'days') + 1
  );
};

export const makeRoleObject = (roles: string[] = []) =>
  roles.reduce((prev, current) => ({ [current]: current, ...prev }), {});

export const checkMetaRoles = (obj: object, roles: string[]) => {
  const calcRoles = Object.keys(obj);

  return calcRoles.some((el) => roles?.includes(el));
};

export const objToArr = (obj: object) => Object.keys(obj);

export const toFixed = (value: number) => Number(Number(value).toFixed(2));

export const imageFileFilter = (req: any, file: any, cb: any) => {
  const isUploadingTypeValid = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ].includes(file.mimetype);

  if (isUploadingTypeValid) {
    cb(null, true);
  } else {
    req.fileValidationError = 'only image and pdf files are allowed';

    return cb(
      new BadRequestException({
        status: 'fail',
        message: { error: ['only image and pdf files are allowed'] },
      }),
      false,
    );
  }
};

export const csvFileFilter = (req: any, file: any, cb: any) => {
  if (file.mimetype.startsWith('text/csv')) {
    cb(null, true);
  } else {
    req.fileValidationError = 'only image and pdf files are allowed';
    // file.filename = `.${file.originalname.split('.').at(-1) || 'jpg'}`;
    return cb(null, false);
  }
};

const normalWord = (word?: string): string =>
  word.replace(/([A-Z]+)/g, ' $1').replace(/([A-Z][a-z])/g, '$1');

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const messages = Object.keys(err.keyValue).map(
    (key) =>
      `Duplicate field ${
        normalWord(key) || 'value'
      }: ${value}. Please use another ${normalWord(key) || 'value'}`,
  );
  return messages;
};

const handleValidationErrorDB = (err: any) => {
  const errors = Object.values(err.errors).map(
    (el: any) => `Invalid input: ${el?.message}`,
  );

  return errors;
};

const handleCastErrorDB = (err: any) => [`Invalid ${err.path}: ${err.value}.`];

export const ErrorHanldingFn = (err: any) => {
  // console.log(
  //   {
  //     ErrorName: err.name,
  //     errorCode: err.code,
  //     errorMessage: err.message,
  //     status: err.status,
  //   },
  //   '<------------',
  // );
  console.log(err);

  if (err.code === 11000) {
    throw new HttpException(
      { status: 'fail', message: { error: handleDuplicateFieldsDB(err) } },
      HttpStatus.CONFLICT,
    );
  } else if (err.name === 'ValidationError') {
    throw new HttpException(
      { status: 'fail', message: { error: handleValidationErrorDB(err) } },
      HttpStatus.BAD_REQUEST,
    );
  } else if ('BadRequestException' == err.name) {
    throw new HttpException(
      { status: 'fail', message: { error: [err.message] } },
      HttpStatus.BAD_REQUEST,
    );
  } else if ('NotFoundException' == err.name) {
    throw new HttpException(
      { status: 'fail', message: { error: [err.message] } },
      HttpStatus.NOT_FOUND,
    );
  } else if ('CastError' == err.name) {
    throw new HttpException(
      { status: 'fail', message: { error: handleCastErrorDB(err) } },
      HttpStatus.NOT_FOUND,
    );
  } else {
    throw new HttpException(
      { status: 'fail', message: { error: [err.message] } },
      err.status || HttpStatus.BAD_REQUEST,
    );
  }
};

export const includes = (macthingProp, arr: any[], el = undefined) => {
  if (!el) return arr.some((EL) => String(EL) == String(macthingProp));
  else return arr.some((EL) => String(EL[el]) == String(macthingProp));
};

export const everyFn = (superSet: string[], arr: string[]): boolean =>
  arr.every((EL) => superSet.includes(EL));

export const someFn = (superSet: string[], arr: string[]): boolean =>
  arr.some((EL) => superSet.includes(EL));

export const groupLeads = (leads: object[], key: string) => {
  return Object.entries(
    leads
      .filter((el) => !!el && !!el[key])
      .reduce(function (r, a) {
        r[a[key]] = r[a[key]] || [];
        r[a[key]].push(a);
        return r;
      }, {}),
  );
};

const camelize = (str: string) => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
};

export const extractLeadDetails = (text: string) => {
  if (!text) return undefined;
  const obj = text?.match(/.*:.*/gi)?.reduce((prev, current, i) => {
    const key = camelize(current?.split(':')[0]?.replace(/\*/g, ''));
    const value = String(current?.split(':')[1])?.trim();

    if ([0]?.includes(i)) return prev;
    else if ([9]?.includes(i)) {
      prev[key] = value?.match(/\d+/) ? value?.match(/\d+/)[0] : undefined;
      return prev;
    } else {
      prev[key] = value;
      return prev;
    }
  }, {});

  return obj;
};

// console.log(
//   extractLeadDetails(
//     // `"---------- Forwarded message ---------\nFrom: Tafsol Technologies <tafsoltechnologies101@gmail.com>\nDate: Thu, 25 Aug 2022 at 23:35\nSubject: Fwd: FW: Your Business-for-sale listing 46519076-MN\nTo: <abdulbasit.tafsol@gmail.com>\n\n\n\n*Website*: https://tafsol.com/\n<https://tafsol.com/>\n\n\n---------- Forwarded message ---------\nFrom: Adam Aktar <adam@denverbbs.com>\nDate: Thu, Aug 25, 2022 at 10:36 PM\nSubject: FW: Your Business-for-sale listing 46519076-MN\nTo: Tafsol Technologies <tafsoltechnologies101@gmail.com>\n\n\nSee below\n\n\n\nRegards,\n\n\n\n*Adam Aktar | Buyer’s Concierge *\n\n\n\n<https://na01.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.denverbbs.com%2F&data=04%7C01%7C%7C486364279af7417fca4708d956c3bd94%7C84df9e7fe9f640afb435aaaaaaaaaaaa%7C1%7C0%7C637636221082493189%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C1000&sdata=4%2F8vSTaYyz3lphgnwSgeGw5S70HyvUk5uuugNFRiH6g%3D&reserved=0>\n\nOffice:    720.361.1000 <7203611000>\n\nDirect:    303.268.0007 <3032680007>\n\nadam@denverbbs.com\n\nSchedule a meeting <https://calendly.com/adam>\n\n\n\n7651 Shaffer Parkway, Suite B2\n\nLittleton, Colorado 80127\n\nwww.denverbbs.com\n<https://na01.safelinks.protection.outlook.com/?url=http%3A%2F%2Fwww.denverbbs.com%2F&data=04%7C01%7C%7C486364279af7417fca4708d956c3bd94%7C84df9e7fe9f640afb435aaaaaaaaaaaa%7C1%7C0%7C637636221082503183%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C1000&sdata=qMT585u897TJWFzfzRHa%2FA2O%2FivH7e%2B9vsF3%2FBTeC%2BI%3D&reserved=0>\n\n\n\nNOTICE: This e-mail message and any attachments are intended solely for the\nuse of the intended recipient, and may contain confidential or privileged\ninformation. If you are not the intended recipient, you are not permitted\nto read, disclose, reproduce, disseminate, use or rely upon this message\nand/or any attachments.  We request that you immediately notify the sender\nand delete this message and any attachments as well as any copies thereof.\nDelivery of this message to an unintended recipient is not intended to\nwaive any right or privileged information. Business Brokerage Services, LLC\nis neither qualified nor authorized to give legal or tax advice.\nFurthermore, any such advice should be obtained from a qualified expert\nadvisor of your own choosing.\n\n\n\n\nBegin forwarded message:\n\n*From:* interest@bizbuysell.com\n*Date:* September 9, 2021 at 10:52:27 AM MDT\n*To:* MJ Nuanes <mjn@denverbbs.com>\n*Subject:* *Re: Your Business-for-sale listing 46519076-MN*\n*Reply-To:* sonia@formulaic300.com\n\n﻿\n\nYour request has been sent to respective franchise(s)\n\n[image: Logo]\n<http://www.bizbuysell.com/?utm_source=%25%25UTMsource&utm_medium=email&utm_campaign=buyerinterestalert&utm_content=logo>\n\nNotification: New buyer lead from the BrokerWorks Network\n\nDear MJ Nuanes,\n\nYou've received a message regarding your \"LOW RENT - Liquor Store in South\nDenver - Motivated Seller\" listing.\n\nBuyer Information\n\n*Contact Name*: Sonia Hodgin\n\n*Contact Email*: sonia@formulaic300.com\n\n*Contact Phone*: (602) 723-4572\n\n*Contact Zip*:\n\n*Able to Invest*: Not disclosed\n\n*Purchase Within*: Not disclosed\n\n*Comments*:\n\nLooking for recent sales on liquor stores only and liquor stores with real\nestate. Trying to comp like stores,I am trying to determine if I want to\nsell. I am in pueblo colorado.\n\nListing Information\n\n*Headline*: LOW RENT - Liquor Store in South Denver - Motivated Seller\n*Listing ID*: 1859127\n<https://www.bizbuysell.com/Business-Opportunity/LOW-RENT-Liquor-Store-in-South-Denver-Motivated-Seller/1859127/?utm_source=bizquest&utm_medium=email&utm_campaign=buyerinterestalert&utm_content=listingid>|\nView All Your Listings\n<https://www.bizbuysell.com/business-broker/mj-nuanes/business-brokerage-services-llc/26248/?bplt=10?utm_source=bizquest&utm_medium=email&utm_campaign=buyerinterestalert&utm_content=viewalllistings>\n*Ref ID*: 46519076-MN\n\nYou can reply directly to this email to respond to the buyer.\n\nWe take our lead quality very seriously if you believe this is not a\nlegitimate inquiry, please report it as spam\n<https://www.bizbuysell.com/Emails/Flag/?report=NTU3NzA1LDQwNjE0MTA4OQ==>\n\nThank you,\nBizBuySell\n\nUnsubscribe\n<https://www.bizbuysell.com/unsubscribe.htm?utm_source=bizquest&utm_medium=email&utm_campaign=buyerinterestalert&utm_content=unsub>\n |\nEmail Preferences\n<https://www.bizbuysell.com/users/EmailPreferences.aspx?utm_source=bizquest&utm_medium=email&utm_campaign=buyerinterestalert&utm_content=preferences>\n |\nTerms of Use\n<https://www.bizbuysell.com/terms-of-use/?utm_source=bizquest&utm_medium=email&utm_campaign=buyerinterestalert&utm_content=terms>\n |\nPrivacy Policy\n<https://www.bizbuysell.com/privacy.htm?utm_source=bizquest&utm_medium=email&utm_campaign=buyerinterestalert&utm_content=privacy>\n |\nContact Us\n<https://www.bizbuysell.com/feedback.htm?utm_source=bizquest&utm_medium=email&utm_campaign=buyerinterestalert&utm_content=contact>\n\nThis system email was sent to mjn@denverbbs.com by BizBuySell\n101 California St, 43rd Floor, San Francisco, CA 94111\n`,
//     'lllllllllllll',
//   ),
//   '<----------------------',
// );

// const html = ``;

// saveFile(html).then((file) => {
//   console.log('DONE<000000000000');
// });
