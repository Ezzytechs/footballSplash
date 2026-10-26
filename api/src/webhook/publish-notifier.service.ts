import { Injectable, Logger } from '@nestjs/common';
import { FacebookService } from './facebook.service';
import {
  ArticleWebhookPayload,
  ChannelDeliveryStatus,
  WebhookService,
} from './webhook.service';

export type { ArticleWebhookPayload } from './webhook.service';

export interface ChannelSelection {
  whatsapp?: boolean;
  facebook?: boolean;
}

export interface ChannelResult {
  whatsapp: ChannelDeliveryStatus;
  facebook: ChannelDeliveryStatus;
}

/**
 * Notifies the configured channels (Make.com webhook for WhatsApp, Facebook
 * Page) when an article is published. Each channel is independent: one
 * failing never affects the other, and publishing never fails because of
 * notifications.
 */
@Injectable()
export class PublishNotifierService {
  private readonly logger = new Logger(PublishNotifierService.name);

  constructor(
    private readonly webhook: WebhookService,
    private readonly facebook: FacebookService,
  ) {}

  async notifyArticlePublished(
    article: ArticleWebhookPayload,
    selection: ChannelSelection = {},
  ): Promise<ChannelResult> {
    const wantsWhatsapp = selection.whatsapp ?? true;
    const wantsFacebook = selection.facebook ?? true;

    const results = await Promise.allSettled([
      wantsWhatsapp
        ? this.webhook.publishArticle(article)
        : Promise.resolve<ChannelDeliveryStatus>('skipped'),
      wantsFacebook
        ? this.facebook.publishToPage(article)
        : Promise.resolve<ChannelDeliveryStatus>('skipped'),
    ]);

    return {
      whatsapp: this.resolve(results[0], 'webhook'),
      facebook: this.resolve(results[1], 'facebook'),
    };
  }

  private resolve(
    result: PromiseSettledResult<ChannelDeliveryStatus>,
    channel: string,
  ): ChannelDeliveryStatus {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    this.logger.error(
      `${channel} notification crashed: ${
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason)
      }`,
    );

    return 'failed';
  }
}
