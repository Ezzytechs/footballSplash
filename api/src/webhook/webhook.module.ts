import { Module } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import { PublishNotifierService } from './publish-notifier.service';
import { WebhookService } from './webhook.service';

@Module({
  providers: [WebhookService, FacebookService, PublishNotifierService],
  exports: [WebhookService, FacebookService, PublishNotifierService],
})
export class WebhookModule {}
