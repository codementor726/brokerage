import { Schema } from 'mongoose';

const OperationHourSchema = new Schema(
  {
    days: {
      type: String,
      required: [true, 'Day(s) is/are required'],
    },
    hours: {
      type: String,
      required: [true, 'Hours are required'],
    },
  },
  { timestamps: true },
);

const AboutSchema = new Schema(
  {
    pageName: {
      type: String,
      required: [true, 'Please add a page name'],
    },
    section1_title: {
      type: String,
      required: [true, 'Please add a section 1 title'],
    },
    section1_subTitle1: {
      type: String,
      required: [true, 'Please add a section 1 sub title 1'],
    },
    section1_subTitle2: {
      type: String,
      required: [true, 'Please add a section 1 sub title 2'],
    },
    section1_subTitle3: {
      type: String,
      required: [true, 'Please add a section 1 sub title 3'],
    },
    section1_image: {
      type: String,
      default: '',
    },
    section2_title: {
      type: String,
      required: [true, 'Please add a section2 title'],
    },
    section2_description: {
      type: String,
      required: [true, 'Please add a section2 description'],
    },
    section3_title: {
      type: String,
      required: [true, 'Please add a section3 title'],
    },
    section3_description: {
      type: String,
      required: [true, 'Please add a section3 description'],
    },
    section3_image: {
      type: String,
      default: '',
    },
    section4_description: {
      type: String,
      required: [true, 'Please add a section4 description'],
    },
    section4_image: {
      type: String,
      default: '',
    },
    section5_description: {
      type: String,
      required: [true, 'Please add a section5 description'],
    },
    section5_image: {
      type: String,
      default: '',
    },
  },
  { timestamps: true },
);

const SellYourBusinessSchema = new Schema(
  {
    pageName: {
      type: String,
      required: [true, 'Please add a page name'],
    },

    section1_title: {
      type: String,
      required: [true, 'Please add a title'],
    },
    section1_image: {
      type: String,
      default: '',
    },
    section1_description: {
      type: String,
      required: [true, 'Please add a section1 description'],
    },
    section2_title: {
      type: String,
      required: [true, 'Please add a section2 title'],
    },
    section2_image: {
      type: String,
      default: '',
    },
    section2_description: {
      type: String,
      required: [true, 'Please add a section2 description'],
    },
    section3_title: {
      type: String,
      required: [true, 'Please add a section3 title'],
    },
    section3_image: {
      type: String,
      default: '',
    },
    section3_description: {
      type: String,
      required: [true, 'Please add a section3 description'],
    },
    section4_title: {
      type: String,
      required: [true, 'Please add a section4 title'],
    },
    section4_image: {
      type: String,
      default: '',
    },
    section4_description: {
      type: String,
      required: [true, 'Please add a section4 description'],
    },
  },
  { timestamps: true },
);

const ServicesSchema = new Schema(
  {
    pageName: {
      type: String,
      required: [true, 'Please add a page name'],
    },
    main_title: {
      type: String,
      required: [true, 'Please add a main title'],
    },
    section1_title: {
      type: String,
      required: [true, 'Please add a section1 title'],
    },
    section1_description: {
      type: String,
      required: [true, 'Please add a section1 description'],
    },
    section1_image: {
      type: String,
      default: '',
    },
    section2_title: {
      type: String,
      required: [true, 'Please add a section2 title'],
    },
    section2_description: {
      type: String,
      required: [true, 'Please add a section2 description'],
    },
    section2_image: {
      type: String,
      default: '',
    },
    section3_title: {
      type: String,
      required: [true, 'Please add a section3 title'],
    },
    section3_description: {
      type: String,
      required: [true, 'Please add a section3 description'],
    },
    section3_image: {
      type: String,
      default: '',
    },
    section4_icons: [
      {
        key: {
          type: String,
          required: [true, 'icon key is required'],
        },
        title: {
          type: String,
          required: [true, 'icon title is required'],
        },
      },
    ],
    section4_title: {
      type: String,
      required: [true, 'Please add a section4 title'],
    },
    section4_description: {
      type: String,
      required: [true, 'Please add a section4 description'],
    },
  },
  { timestamps: true },
);

const ContactUsSchema = new Schema(
  {
    pageName: {
      type: String,
      required: [true, 'Please add a page name'],
    },

    title: {
      type: String,
      required: [true, 'Please add a section1 title'],
    },
    description: {
      type: String,
      required: [true, 'Please add a section1 description'],
    },
    callUs: {
      type: [String],
      required: [true, 'Call Us number is required'],
    },
    visitUs: {
      type: String,
      required: [true, 'Visit us address is required'],
    },
    haveQuestions: {
      type: String,
      required: [true, 'Have questions is required'],
    },
    hoursOfOperation: { type: [OperationHourSchema] },
    footer_title1: {
      type: String,
      required: [true, 'Please add footer title1'],
    },
    footer_description1: {
      type: String,
      required: [true, 'Please add footer description1'],
    },
    footer_title2: {
      type: String,
      required: [true, 'Please add footer title2'],
    },
    footer_description2: {
      type: String,
      required: [true, 'Please add footer descripiton2'],
    },
    getInTouchImage: {
      type: String,
      default: '',
    },
    getInTouchTitle: {
      type: String,
      required: [true, 'Please add footer getInTouchTitle'],
    },
  },
  { timestamps: true },
);

const HomeSchema = new Schema(
  {
    pageName: {
      type: String,
      required: [true, 'Please add a page name'],
    },

    section1_image: {
      type: String,
    },
    section1_title: {
      type: String,
      required: [true, 'Please add a section1 title'],
    },
    section1_subTitle: {
      type: String,
      required: [true, 'Please add a section1 sub title'],
    },
    section1_description: {
      type: String,
      required: [true, 'Please add a section1 description'],
    },
    section2_icon1: {
      type: String,
      default: '',
    },
    section2_title1: {
      type: String,
      required: [true, 'Please add a section2 title 1'],
    },
    section2_description1: {
      type: String,
      required: [true, 'Please add a section2 description 1'],
    },
    section2_icon2: {
      type: String,
      default: '',
    },
    section2_title2: {
      type: String,
      required: [true, 'Please add a section2 title 2'],
    },
    section2_description2: {
      type: String,
      required: [true, 'Please add a section2 description 2'],
    },
    section3_title: {
      type: String,
      required: [true, 'Please add a section3 title'],
    },
    section3_description: {
      type: String,
      required: [true, 'Please add a section3 description'],
    },
    section3_image: {
      type: String,
      default: '',
    },
    section4_icons: [
      {
        key: {
          type: String,
          required: [true, 'icon key is required'],
        },
        title: {
          type: String,
          required: [true, 'icon title is required'],
        },
      },
    ],
    section5_title1: {
      type: String,
      required: [true, 'Please add a section5 title1'],
    },
    section5_description1: {
      type: String,
      required: [true, 'Please add a section5 description1'],
    },
    section5_title2: {
      type: String,
      required: [true, 'Please add a section5 title2'],
    },
    section5_description2: {
      type: String,
      required: [true, 'Please add a section5 description2'],
    },
  },
  { timestamps: true },
);

const ListingPageSchema = new Schema(
  {
    pageName: {
      type: String,
      required: [true, 'Please add a page name'],
    },

    section1_title: {
      type: String,
      required: [true, 'Please add a section1 title'],
    },
    section1_image: {
      type: String,
      default: '',
    },
    section1_subTitle: {
      type: String,
      required: [true, 'Please add a section1 sub title'],
    },
    section1_description: {
      type: String,
      required: [true, 'Please add a section1 description'],
    },
    section2_title: {
      type: String,
      required: [true, 'Please add a section2 title'],
    },
    section2_description: {
      type: String,
      required: [true, 'Please add a section2 description'],
    },
  },
  { timestamps: true },
);

const CareerOpportunitiesSchema = new Schema(
  {
    pageName: {
      type: String,
      required: [true, 'Please add a page name'],
    },

    section1_title: {
      type: String,
      required: [true, 'Please add a section1 title'],
    },
    section1_description: {
      type: String,
      required: [true, 'Please add a section1 description'],
    },
    section2_title: {
      type: String,
      required: [true, 'Please add a section2 title'],
    },
    section2_subTitle1: {
      type: String,
      required: [true, 'Please add a section2 sub title1'],
    },
    section2_description1: {
      type: String,
      required: [true, 'Please add a section2 description1'],
    },
    section2_subTitle2: {
      type: String,
      required: [true, 'Please add a section2 sub title2'],
    },
    section2_description2: {
      type: String,
      required: [true, 'Please add a section2 description2'],
    },
  },
  { timestamps: true },
);

const FooterSchema = new Schema(
  {
    pageName: {
      type: String,
      required: [true, 'Please add a page name'],
    },
    footer_title: {
      type: String,
      required: [true, 'Please add footer title'],
    },
    footer_image: {
      type: String,
      default: '',
    },
    footer_description: {
      type: String,
      required: [true, 'Please add footer description'],
    },
    footer_icons: [
      {
        icon_type: {
          type: String,
          enum: {
            values: ['facebook', 'linkedIn', 'twitter', 'instagram'],
            message: 'enum mismatch!',
          },
          required: [true, 'icon type is required'],
        },
        link: {
          type: String,
          required: [true, 'icon link is required'],
        },
      },
    ],
    contactNo: {
      type: String,
      required: [true, 'Contact no is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
    },
  },
  { timestamps: true },
);

const CmsSchema = new Schema(
  {
    home: {
      type: HomeSchema,
    },
    contact: {
      type: ContactUsSchema,
    },
    about: {
      type: AboutSchema,
    },
    services: {
      type: ServicesSchema,
    },
    listing: {
      type: ListingPageSchema,
    },
    sellYourBusiness: {
      type: SellYourBusinessSchema,
    },
    careerOpportunities: {
      type: CareerOpportunitiesSchema,
    },
    footer: {
      type: FooterSchema,
    },
  },
  { timestamps: true },
);

export { CmsSchema };
