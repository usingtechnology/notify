import { Module } from '@nestjs/common';
import { GcNotifyService } from './gc-notify.service';

/**
 * GC Notify core module - provides GcNotifyService.
 * Controllers are in GcNotifyApiModule (core) and GcNotifyManagementModule (extensions).
 */
@Module({
  providers: [GcNotifyService],
  exports: [GcNotifyService],
})
export class GcNotifyModule {}
