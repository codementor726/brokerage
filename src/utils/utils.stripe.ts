import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IUser } from 'src/users/interfaces/user.interface';
import Stripe from 'stripe';
import { EmailService } from './utils.email.service';

@Injectable()
export class UtilsStripeService {
  private secretKey = this.configService.get('STRIPE_SECRET_KEY');
  private publicKey = this.configService.get('STRIPE_PUBLIC_KEY');
  private webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
  private stripe: Stripe;

  constructor(
    @InjectModel('User') private readonly User: Model<IUser>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.secretKey, {
      apiVersion: '2020-08-27',
    });
  }

  getproduct = (prodId: string) => this.stripe.products.retrieve(prodId);

  // Stripe payment methods list
  paymentMethodList(cus: string) {
    return this.stripe.paymentMethods.list({
      customer: cus,
      type: 'card',
    });
  }

  // CONTROLLER returns all attached(saved) payment cards including new one
  async attachedPaymentMethod(user: IUser, pmId: string) {
    await this.stripe.paymentMethods.attach(pmId, {
      customer: user?.cus,
    });

    const list = await this.paymentMethodList(user?.cus);
    return list?.data;
  }

  // CONTROLLER returns all attached(saved) payment cards
  async getPaymentMethods(user: IUser) {
    const list = await this.paymentMethodList(user?.cus);

    return list?.data;
  }

  // CONTROLLER returns all attached(saved) payment cards after removing the desired one
  async detachPaymentMethod(user: IUser, pmId: string) {
    await this.stripe.paymentMethods.detach(pmId);

    const list = await this.paymentMethodList(user?.cus);
    return list?.data;
  }

  // creating customer account on signup
  getCustomerKey(email: string, description: string = null) {
    return this.stripe.customers.create({ email, description });
  }

  // Renting products buy using stripe payment method
  async buyPackage(
    user: IUser,
    paymentMethodId: string,
    _price: number,
  ): Promise<[Error, boolean]> {
    let subscription: Stripe.PaymentIntent = null;

    if (!paymentMethodId)
      throw new BadRequestException('plan or paymentMethodId is missing.');

    // for buying one time product
    subscription = await this.stripe.paymentIntents.create({
      amount: _price * 100,
      currency: 'usd',
      payment_method: paymentMethodId,
      payment_method_types: ['card'],
      customer: user.cus,
    });

    const paymentConfrim = await this.stripe.paymentIntents.confirm(
      subscription.id,
    );

    if (paymentConfrim.status === 'succeeded') {
      return [null, true];
    } else {
      return [
        new InternalServerErrorException(
          'Sorry, facing error while proceeding transaction.',
        ),
        null,
      ];
    }
  }
}
