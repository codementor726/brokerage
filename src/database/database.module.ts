import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { yellow } from 'cli-color';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri: string = String(configService.get('DATABASE')).replace(
          '<PASSWORD>',
          configService.get('DATABASE_PASSWORD'),
        );
        console.log('DB is connected..');
        console.log(yellow('SERVER has started successfully..'));
        return { uri };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [],
  providers: [],
})
export class DatabaseModule {}
