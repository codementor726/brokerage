import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ICms,
  Home,
  ContactUs,
  About,
  Services,
  Listing,
  Footer,
  SellYourBusiness,
  CareerOpportunities,
} from './interfaces/cms.interface';
import { S3Storage } from 'src/utils/utils.s3';
import { ITestimonial } from 'src/testimonials/interfaces/testimonial.interface';
import { IFaqs } from 'src/faqs/interfaces/faq.interface';
import { IAppConfig } from 'src/app-configs/interfaces/appConfig.interface';
import { IService } from 'src/services/interfaces/services.interface';
import { IReview } from 'src/reviews/interfaces/review.interface';
import { ICoreValues } from 'src/core-values/interfaces/core-values.interface';
import { IOurTeam } from 'src/our-team/interfaces/our-team.interface';

@Injectable()
export class CmsService {
  constructor(
    @InjectModel('Cms')
    private readonly Cms: Model<ICms>,
    @InjectModel('Testimonial')
    private readonly Testimonial: Model<ITestimonial>,
    @InjectModel('Faq') private readonly Faq: Model<IFaqs>,
    @InjectModel('AppConfigs') private readonly AppConfigs: Model<IAppConfig>,
    @InjectModel('Service') private readonly Service: Model<IService>,
    @InjectModel('Review') private readonly Review: Model<IReview>,
    @InjectModel('CoreValue') private readonly CoreValues: Model<ICoreValues>,
    @InjectModel('OurTeam') private readonly OurTeam: Model<IOurTeam>,
    private readonly s3Storage: S3Storage,
  ) {}

  async getPage(
    page: string,
    testimonials: string,
    faqs: string,
  ): Promise<any> {
    let allTestimonials: ITestimonial[];
    let allFaqs: IFaqs[];

    let [doc, footer, contactInfo] = await Promise.all([
      this.Cms.findOne({ [page]: { $exists: true } }).lean(),
      this.Cms.findOne({ ['footer']: { $exists: true } }).lean(),
      this.AppConfigs.findOne({ KeyType: 'ContactInfo' }).lean(),
    ]);

    if (page == 'home') {
      const homeServices = await this.Service.find({ type: 'home' });
      (doc as any).homeServices = homeServices;
    }

    // if (page == 'services') {
    //   const services = await this.Service.find({ type: 'services' });
    //   (doc as any).services = services;
    // }

    if (testimonials == 'true') {
      allTestimonials = await this.Testimonial.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();
    }

    if (faqs == 'true') {
      allFaqs = await this.Faq.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean();
    }

    const data = {
      page: (doc as ICms) || {},
      footer: footer['footer'] || {},
      contactInfo,
      allTestimonials,
      allFaqs,
    };

    return data;
  }

  async updatePage(
    pageName: string,
    files: any,
    _id: string,
    body: any,
  ): Promise<any> {
    let doc = null;

    if (!_id || !pageName) throw new BadRequestException('params are missing');

    let page = {
      [pageName]: { ...body },
    };

    if (pageName === 'home') {
      doc = await this.updateHomePage(page[pageName], _id, files);
    } else if (pageName === 'about') {
      doc = await this.updateAboutPage(page[pageName], _id, files);
    } else if (pageName === 'sellYourBusiness') {
      doc = await this.updateSellYourBusiness(page[pageName], _id, files);
    } else if (pageName === 'listing') {
      doc = await this.updateListingPage(page[pageName], _id, files);
    } else if (pageName === 'contact') {
      doc = await this.updateContactPage(page[pageName], _id, files);
    } else if (pageName === 'services') {
      doc = await this.updateServicesPage(page[pageName], _id, files);
    } else if (pageName === 'footer') {
      doc = await this.updateFooterPage(page[pageName], _id, files);
    } else if (pageName === 'careerOpportunities') {
      doc = await this.updateCareerOpportunitiesPage(page[pageName], _id);
    } else throw new BadRequestException('page name is undefined');

    doc = await this.Cms.findById(_id).lean();

    doc = await this.Cms.findByIdAndUpdate(_id, page, { new: true });
    return doc;
  }

  async updateHomePage(page: Home, id: string, files: any): Promise<ICms> {
    /*
    
    old page m s ye nhi hatay ga oldPage?.[pageName]?
    pr 

    page[pageName] is m s "[pageName]" remove krna h "
    
    */
    let oldPage = await this.Cms.findById(id).lean();
    const pageName = 'home';

    if (files?.section1_image) {
      page.section1_image = files.section1_image[0].key;
      await this.s3Storage.deleteImage(oldPage?.[pageName]?.section1_image);
    }

    if (files?.section2_icon1) {
      page.section2_icon1 = files.section2_icon1[0].key;
      await this.s3Storage.deleteImage(oldPage?.[pageName]?.section2_icon1);
    }

    if (files?.section2_icon2) {
      page.section2_icon2 = files.section2_icon2[0].key;
      await this.s3Storage.deleteImage(oldPage?.[pageName]?.section2_icon2);
    }

    if (files?.section3_image) {
      page.section3_image = files.section3_image[0].key;
      await this.s3Storage.deleteImage(oldPage?.[pageName]?.section3_image);
    }

    const doc = await this.Cms.findByIdAndUpdate(id, page, { new: true });

    return doc as ICms;
  }

  async updateFooterPage(page: Footer, id: string, files: any): Promise<ICms> {
    const pageName = 'footer';
    let footer = await this.Cms.findById(id).lean();

    if (files?.footer_image) {
      if (page?.footer_image)
        await this.s3Storage.deleteImage(footer?.[pageName]?.footer_image);
      page.footer_image = files.footer_image[0].key;
    }

    if (page.footer_icons && (page.footer_icons as any).length > 0)
      page.footer_icons = (page.footer_icons as any).map((obj) =>
        JSON.parse(obj),
      );

    const doc = await this.Cms.findByIdAndUpdate(id, page, {
      new: true,
    });

    return doc as ICms;
  }

  async updateServicesPage(
    page: Services,
    id: string,
    files: any,
  ): Promise<ICms> {
    let product = await this.Cms.findById(id).lean();
    const pageName = 'services';

    if (files?.section1_image) {
      if (page?.section1_image)
        await this.s3Storage.deleteImage(product?.[pageName]?.section1_image);
      page.section1_image = files.section1_image[0].key;
    }

    if (files?.section2_image) {
      if (page?.section2_image)
        await this.s3Storage.deleteImage(product?.[pageName]?.section2_image);
      page.section2_image = files.section2_image[0].key;
    }

    if (files?.section3_image) {
      if (page?.section3_image)
        await this.s3Storage.deleteImage(product?.[pageName]?.section3_image);
      page.section3_image = files.section3_image[0].key;
    }

    const doc = await this.Cms.findByIdAndUpdate(id, page, { new: true });

    return doc as ICms;
  }

  async updateSellYourBusiness(
    page: SellYourBusiness,
    id: string,
    files: any,
  ): Promise<any> {
    const pageName = 'sellYourBusiness';

    let _sellYourBusiness = await this.Cms.findById(id).lean();

    if (files?.section1_image) {
      if (page?.section1_image)
        await this.s3Storage.deleteImage(
          _sellYourBusiness?.[pageName]?.section1_image,
        );
      page.section1_image = files.section1_image[0].key;
    }

    if (files?.section2_image) {
      if (page?.section2_image)
        await this.s3Storage.deleteImage(
          _sellYourBusiness?.[pageName]?.section2_image,
        );
      page.section2_image = files.section2_image[0].key;
    }

    if (files?.section3_image) {
      if (page?.section3_image)
        await this.s3Storage.deleteImage(
          _sellYourBusiness?.[pageName]?.section3_image,
        );
      page.section3_image = files.section3_image[0].key;
    }

    if (files?.section4_image) {
      if (page?.section4_image)
        await this.s3Storage.deleteImage(
          _sellYourBusiness?.[pageName]?.section4_image,
        );
      page.section4_image = files.section4_image[0].key;
    }

    // page.section1_image = _howItWorks?.[pageName]?.section1_image;
    // page.section2_image = _howItWorks?.[pageName]?.section2_image;
    // page.section3_image = _howItWorks?.[pageName]?.section3_image;
    // page.section4_image = _howItWorks?.[pageName]?.section4_image;

    const doc = await this.Cms.findByIdAndUpdate(id, page, { new: true });
    return doc;
  }

  async updateListingPage(page: Listing, id, files: any): Promise<any> {
    const pageName = 'listing';
    let listingPage = await this.Cms.findById(id).lean();

    page.section1_image = listingPage?.[pageName].section1_image;

    if (files?.section1_image) {
      if (page?.section1_image)
        await this.s3Storage.deleteImage(
          listingPage?.[pageName]?.section1_image,
        );
      page.section1_image = files.section1_image[0].key;
    }

    const doc = await this.Cms.findByIdAndUpdate(id, page, {
      new: true,
    }).lean();

    return doc;
  }

  async updateAboutPage(page: About, id: string, files: any): Promise<any> {
    const pageName = 'about';
    let aboutPage = await this.Cms.findById(id).lean();

    page.section1_image = aboutPage?.[pageName]?.section1_image;
    page.section3_image = aboutPage?.[pageName]?.section3_image;
    page.section4_image = aboutPage?.[pageName]?.section4_image;
    page.section5_image = aboutPage?.[pageName]?.section5_image;

    if (files?.section1_image) {
      if (page?.section1_image)
        await this.s3Storage.deleteImage(aboutPage?.[pageName]?.section1_image);
      page.section1_image = files.section1_image[0].key;
    }

    if (files?.section3_image) {
      if (page?.section3_image)
        await this.s3Storage.deleteImage(aboutPage?.[pageName]?.section3_image);
      page.section3_image = files.section3_image[0].key;
    }

    if (files?.section4_image) {
      if (page?.section4_image)
        await this.s3Storage.deleteImage(aboutPage?.[pageName]?.section4_image);
      page.section4_image = files.section4_image[0].key;
    }

    if (files?.section5_image) {
      if (page?.[pageName]?.section5_image)
        await this.s3Storage.deleteImage(aboutPage?.[pageName]?.section5_image);
      page.section5_image = files.section5_image[0].key;
    }

    const doc = await this.Cms.findByIdAndUpdate(id, page, {
      new: true,
    }).lean();
    return doc;
  }

  async updateContactPage(
    page: ContactUs,
    id: string,
    files: any,
  ): Promise<any> {
    let pageName = 'contact';
    let contactPage = await this.Cms.findById(id).lean();

    if (page.hoursOfOperation && (page.hoursOfOperation as any).length > 0)
      page.hoursOfOperation = (page.hoursOfOperation as any).map((obj) =>
        JSON.parse(obj),
      );

    if (files?.getInTouchImage) {
      if (page?.getInTouchImage)
        await this.s3Storage.deleteImage(
          contactPage?.[pageName]?.getInTouchImage,
        );
      page.getInTouchImage = files.getInTouchImage[0].key;
    } else page.getInTouchImage = contactPage?.[pageName]?.getInTouchImage;

    const doc = await this.Cms.findByIdAndUpdate(id, page, { new: true });
    return doc;
  }

  async updateCareerOpportunitiesPage(
    page: ContactUs,
    id: string,
  ): Promise<any> {
    const doc = await this.Cms.findByIdAndUpdate(id, page, { new: true });
    return doc;
  }

  async getDynamicPage(pages: string, all: string): Promise<any> {
    if (all == 'true') {
      const _pages = await this.Cms.find({}).lean();
      const pagesDynamicArray = [
        'home',
        'contactInfo',
        'sellYourBusiness',
        'about',
        'listing',
        'services',
        'footer',
        'careerOpportunities',
        'contact',
      ];
      let newArray = [];

      const homeServices = await this.Service.find({ type: 'home' });
      const services = await this.Service.find({ type: 'services' }).sort(
        'order',
      );
      const buyerFaqs = await this.Faq.find({
        isActive: true,
        type: 'buyer',
      }).sort('order');
      const sellerFaqs = await this.Faq.find({
        isActive: true,
        type: 'seller',
      }).sort('order');
      const faqs = { buyerFaqs, sellerFaqs };
      const coreValues = await this.CoreValues.find().sort('order');
      const ourTeam = await this.OurTeam.find().sort('order');
      const reviews = await this.Review.find();

      _pages.map((item, i) => {
        pagesDynamicArray.map(async (pg) => {
          if (item[pg]) {
            item[pg]._id = item?._id;

            if (item[pg].pageName == 'home') {
              item[pg].homeServices = homeServices;
              item[pg].reviews = reviews;
            }
            if (item[pg].pageName == 'about') {
              item[pg].coreValues = coreValues;
              item[pg].ourTeam = ourTeam;
            }

            if (item[pg].pageName == 'services') item[pg].services = services;
            newArray.push(item[pg]);
          }
        });
      });

      newArray.push({ pageName: 'faqs', data: faqs });

      return newArray;
    } else {
      const data = await this.Cms.findOne({ [pages]: { $exists: true } });
      if (!data) throw new Error('page not found');
      const doc = data[pages] || null;
      return doc;
    }
  }
}
