import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ArticleWebhookPayload } from './webhook.service';
import { ChannelDeliveryStatus } from './webhook.service';

/**
 * Posts published articles to a Facebook Page via the Meta Graph API.
 *
 * Required env: FB_PAGE_ID, FB_PAGE_ACCESS_TOKEN.
 * Optional: FB_API_VERSION (default v21.0), FB_GRAPH_BASE (default
 * https://graph.facebook.com — override only for tests or a proxy).
 */
@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);

  constructor(private readonly config: ConfigService) {}

  async publishToPage(
    article: ArticleWebhookPayload,
  ): Promise<ChannelDeliveryStatus> {
    const pageId = this.config.get<string>('FB_PAGE_ID');
    const accessToken = this.config.get<string>('FB_PAGE_ACCESS_TOKEN');

    if (!pageId || !accessToken) {
      this.logger.debug(
        'FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN not set; skipping the Facebook Page post',
      );
      return 'skipped';
    }

    const version = this.config.get<string>('FB_API_VERSION', 'v21.0');
    const base = this.config
      .get<string>('FB_GRAPH_BASE', 'https://graph.facebook.com')
      .replace(/\/+$/, '');

    const params = new URLSearchParams({
      message: this.buildMessage(article),
      link: article.url,
      access_token: accessToken,
    });

    const image = article.coverImage ?? article.images[0];
    if (image) {
      params.set('picture', image);
    }

    try {
      const response = await fetch(
        `${base}/${version}/${encodeURIComponent(pageId)}/feed`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
          signal: AbortSignal.timeout(10_000),
        },
      );

      const raw = await response.text();

      if (!response.ok) {
        this.logger.warn(
          `Facebook Page post failed (${response.status}): ${raw}`,
        );
        return 'failed';
      }

      let postId: string | undefined;
      try {
        postId = (JSON.parse(raw) as { id?: string }).id;
      } catch {
        postId = undefined;
      }

      this.logger.log(
        `Facebook Page post delivered (${article.slug}${postId ? `, post ${postId}` : ''})`,
      );
      return 'sent';
    } catch (error) {
      this.logger.error(
        `Facebook Page post failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 'failed';
    }
  }

  private buildMessage(article: ArticleWebhookPayload): string {
    const lines = [`New article: ${article.title}`];

    if (article.excerpt) {
      lines.push(article.excerpt);
    }

    lines.push(article.url);

    const hashtags = article.tags
      .map((tag) => `#${tag.name.replace(/[^a-zA-Z0-9]/g, '')}`)
      .filter((tag) => tag.length > 1)
      .slice(0, 5);

    if (hashtags.length) {
      lines.push(hashtags.join(' '));
    }

    return lines.join('\n\n');
  }
}
