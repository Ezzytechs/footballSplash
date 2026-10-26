# Publishing channels

When an article becomes published (created as `PUBLISHED`, or a draft published later), the API notifies every configured channel. Notifications are fire-and-forget and independent: a channel outage never blocks or fails publishing, and editing an already-published article does **not** re-post.

Payload sent to both channels:

```json
{
  "event": "article.published",
  "sentAt": "2026-10-22T20:45:00.000Z",
  "article": {
    "id": "…", "title": "…", "slug": "…", "excerpt": "…", "content": "…",
    "url": "<WEB_URL>/articles/<slug>",
    "coverImage": "…", "images": ["…"], "publishedAt": "…",
    "views": 0, "commentCount": 0, "likeCount": 0,
    "author": { "id": "…", "name": "…" },
    "category": { "id": "…", "name": "…", "slug": "…" },
    "tags": [{ "id": "…", "name": "…", "slug": "…" }]
  }
}
```

Channels that are not configured are skipped silently.

### Per-channel flags

`POST /api/v1/articles` accepts two booleans so only the selected channels fire when the article is published:

```json
{
  "title": "Transfer confirmed",
  "content": "…",
  "categoryId": "<uuid>",
  "status": "PUBLISHED",
  "shareOnWhatsapp": true,
  "shareOnFacebook": false
}
```

Both default to `true`; set a flag to `false` to hold that channel back.

### Manual share

`POST /api/v1/articles/:id/share` — available to `AUTHOR`, `EDITOR` and `ADMIN` — reposts any published article on demand and reports the delivery status of each channel:

```bash
curl -X POST http://localhost:3000/api/v1/articles/<id>/share \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{ "whatsapp": true, "facebook": true }'
```

```json
{
  "message": "Share requested",
  "channels": { "whatsapp": "sent", "facebook": "sent" }
}
```

Each channel reports `sent`, `skipped` (not configured or explicitly disabled) or `failed` (endpoint error — see the API logs). Omitting the body shares on both configured channels. Drafts and unpublished articles cannot be shared (400).

---

## 1. WhatsApp channel (via Make.com)

WhatsApp Channels have no official public posting API, so the supported route is a webhook that a Make.com scenario receives and forwards to the channel through a WhatsApp Business provider.

### 1.1 Create the Make.com scenario

1. Sign in at <https://www.make.com> → **Scenarios** → **Create a new scenario**.
2. Add the first module: **Webhooks → Custom webhook**.
3. Click **Add** to create a webhook, name it `sportnews-articles`, and **Copy the address** — this is your `ARTICLE_WEBHOOK_URL`.
4. Leave the scenario open; Make listens for the first payload to auto-detect the data structure.

### 1.2 Configure the API

Add to `.env`:

```env
ARTICLE_WEBHOOK_URL=https://hook.eu1.make.com/xxxxxxxxxxxxxxx
ARTICLE_WEBHOOK_SECRET=some-long-random-string
```

Restart the API and publish an article (see §3). Make now knows the payload shape.

### 1.3 Verify the payload (recommended)

1. Add a second module: **Webhooks → Verify webhook** (HMAC-SHA256).
2. Set **Algorithm** `HMAC-SHA256`, **Secret** to the same value as `ARTICLE_WEBHOOK_SECRET`, and **Incoming data** to the raw request body from the first module.
3. The `x-webhook-signature` header carries the hex digest; a mismatch means the request is not from your API.

### 1.4 Deliver to the channel

WhatsApp Channels are posted through a WhatsApp Business API provider. Add the app your provider offers in Make (WATI, Interakt, Gupshup, Twilio, Meta Cloud API, …) and map the message:

| Provider field | Value |
| --- | --- |
| Message text | `article.title` + ` article.url` |
| Media URL (optional) | `article.coverImage` (or first of `article.images`) |

Without a provider, you can still post via **WhatsApp → Send a message to a phone number** only for 1:1 chats — Channels need the Business API route.

### 1.5 Activate

Toggle the scenario **ON** (top-left). Publish an article and confirm delivery in the channel.

---

## 2. Facebook Page (native, no third party)

The API posts directly to the Page through the Meta Graph API.

### 2.1 Create the Facebook app

1. Go to <https://developers.facebook.com/apps> → **Create App** → type **Business**.
2. Add the **Facebook Login** product (it is only used to mint the user token).

### 2.2 Grant the permissions

Open <https://developers.facebook.com/tools/explorer>:

1. Select your app, then **Add permissions**: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `pages_manage_engagement`.
2. Click **Generate Access Token**, pick your Facebook account, and approve the prompts.
3. From **Access Tokens**, copy your *User* token into the **Access Token** field of **Tools → Access Token Debugger** and click **Extend Access Token**. Short-lived tokens expire in ~1 hour; the extended one lasts ~60 days.

### 2.3 Get the Page ID and Page token

In the Graph API Explorer call:

```text
GET /me/accounts
```

This returns each managed Page with its `id` (the Page ID) and a long-lived `access_token`. Copy both:

```env
FB_PAGE_ID=123456789012345
FB_PAGE_ACCESS_TOKEN=EAAG...long-page-token...
FB_API_VERSION=v21.0
```

> The Page token, not the user token, is what the API sends. It works without a fixed expiry as long as the user remains an admin of the Page.

### 2.4 Verify

Publish an article (see §3) and check your Page timeline. The post contains the title, excerpt, canonical link, cover image and up to five hashtags derived from the article tags. The API logs `Facebook Page post delivered (<slug>, post <id>)` on success or the Graph error body on failure.

### 2.5 Troubleshooting

| Symptom | Fix |
| --- | --- |
| `(#200) Permission denied` | Token lacks `pages_manage_posts`; regenerate with all permissions in §2.2. |
| `Error validating access token` | User token was used, or it expired; use the Page token from `/me/accounts`. |
| Post not visible | Check the Page's posting-visibility settings, or look for it under "Manage" → posts. |
| Link preview missing | Ensure `WEB_URL` is publicly reachable and `og:` tags are served. |

---

## 3. End-to-end test

Publish an article as an author/editor/admin:

```bash
curl -X POST http://localhost:3000/api/v1/articles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Transfer confirmed",
    "excerpt": "Striker signs a four-year deal.",
    "content": "Full story…",
    "categoryId": "<uuid>",
    "tagIds": ["<uuid>"],
    "status": "PUBLISHED",
    "coverImage": "https://cdn.example.com/cover.jpg"
  }'
```

Or publish an existing draft:

```bash
curl -X PATCH http://localhost:3000/api/v1/articles/<article-id> \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"PUBLISHED"}'
```

Both should appear in the WhatsApp channel and on the Facebook Page within a few seconds.

## 4. Trigger rules

| Action | Notifies channels? |
| --- | --- |
| Create article with `status: PUBLISHED` | Yes |
| Publish a draft (`PATCH` → `PUBLISHED`) | Yes |
| Unpublish then republish | Yes |
| Edit a published article | No |
| Create a draft | No |
| Delete an article | No |
