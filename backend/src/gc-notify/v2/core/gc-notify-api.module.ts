import { Module } from '@nestjs/common';
import { GcNotifyController } from './gc-notify.controller';
import { GcNotifyModule } from '../../gc-notify.module';

/**
 * GC Notify core API module - notifications, templates (read), bulk.
 * Registered after GcNotifyManagementModule to ensure route order
 * (notifications/senders before notifications/:notificationId).
 */
@Module({
  imports: [GcNotifyModule],
  controllers: [GcNotifyController],
})
export class GcNotifyApiModule {}
