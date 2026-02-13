import { Module } from '@nestjs/common';
import { GcNotifyManagementController } from './gc-notify-management.controller';
import { GcNotifyModule } from '../../gc-notify.module';

@Module({
  imports: [GcNotifyModule],
  controllers: [GcNotifyManagementController],
})
export class GcNotifyManagementModule {}
