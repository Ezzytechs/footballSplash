import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';

export const ARTICLE_PUBLISHED_EVENT = 'article.published';

export type ChannelDeliveryStatus = 'sent' | 'skipped' | 'failed';

export interface ArticleWebhookPayload {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  url: string;
  coverImage: string | null;
  images: string[];
  publishedAt: Date | null;
  views: number;
  commentCount: number;
  likeCount: number;
  author: { id: string; name: string };
  category: { id: string; name: string; slug: string };
  tags: { id: string; name: string; slug: string }[];
}

/**
 * Posts published articles to ARTICLE_WEBHOOK_URL, e.g. a Make.com
 * "Custom webhook" scenario that forwards the payload to a WhatsApp channel.
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly config: ConfigService) {}

  async publishArticle(
    article: ArticleWebhookPayload,
  ): Promise<ChannelDeliveryStatus> {
    const url = this.config.get<string>('ARTICLE_WEBHOOK_URL');

    if (!url) {
      this.logger.debug(
        'ARTICLE_WEBHOOK_URL is not set; skipping the published article webhook',
      );
      return 'skipped';
    }

    const body = JSON.stringify({
      event: ARTICLE_PUBLISHED_EVENT,
      sentAt: new Date().toISOString(),
      article,
    });

    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'user-agent': 'SportNews-Webhook/1.0',
      'x-webhook-event': ARTICLE_PUBLISHED_EVENT,
    };

    const secret = this.config.get<string>('ARTICLE_WEBHOOK_SECRET');
    if (secret) {
      headers['x-webhook-signature'] = createHmac('sha256', secret)
        .update(body)
        .digest('hex');
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        this.logger.warn(
          `Article webhook returned ${response.status} ${response.statusText}`,
        );
        return 'failed';
      }

      this.logger.log(`Article published webhook delivered (${article.slug})`);
      return 'sent';
    } catch (error) {
      this.logger.error(
        `Article webhook failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 'failed';
    }
  }
}
