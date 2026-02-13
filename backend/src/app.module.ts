import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { GcNotifyModule } from './gc-notify/gc-notify.module';
import { GcNotifyApiModule } from './gc-notify/v2/core/gc-notify-api.module';
import { GcNotifyManagementModule } from './gc-notify/v2/contrib/gc-notify-management.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    HealthModule,
    NotificationsModule,
    GcNotifyModule,
    GcNotifyManagementModule,
    GcNotifyApiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
