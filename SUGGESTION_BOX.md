# Suggestion Box — Setup & Architecture

A suggestion form for garden visitors to propose new nodes. Lives at `/suggest`.

---

## What Was Built

| File | Purpose |
|---|---|
| `quartz/components/SuggestionBox.tsx` | Quartz component — renders the form, scoped to `/suggest` |
| `quartz/components/scripts/suggestion-box.inline.ts` | Client-side JS — AJAX submission, state management |
| `quartz/components/styles/suggestion-box.scss` | Styles — matches garden palette, mobile-friendly |
| `content/suggest.md` | The `/suggest` page (intro text + form renders below) |
| `quartz.layout.ts` | Modified — `SuggestionBox` added to `afterBody` |
| `quartz/components/index.ts` | Modified — `SuggestionBox` exported |

**Form fields:** Topic name (required), Category dropdown (required — arts/concepts/people/practices/traditions/works), Why it belongs (required), Submitter name (optional).

**Submission backend:** Formspree (v1). See upgrade path below.

---

## Quick Setup: Formspree (15 minutes)

1. Go to [formspree.io](https://formspree.io) and create a free account
2. Click **New Form** → name it "RF Garden Suggestions" → set notification email to yours
3. Copy the **Form ID** (the part after `https://formspree.io/f/` — looks like `xwkgabcd`)
4. Open `quartz.layout.ts` and replace `YOUR_FORM_ID`:

```ts
Component.SuggestionBox({
  formspreeId: "xwkgabcd",  // ← your actual ID here
}),
```

5. Rebuild and push. Done.

**Free tier:** 50 submissions/month, email notifications. More than enough for the garden at current scale.

### Where to Link From

The `/suggest` page exists but isn't linked from anywhere yet. Consider adding it to:

- **Footer** — in `quartz.layout.ts`, update the Footer links:
  ```ts
  Component.Footer({
    links: {
      "Suggest a Node": "/suggest",
    },
  })
  ```
- **Index page** — add a callout at the bottom of `content/index.md`
- **Navigation** — add to Explorer if desired

---

## Upgrade Path: GitHub Issues (Recommended for Automation)

The Formspree setup works immediately, but the long-term vision is suggestions becoming GitHub Issues with a `suggestion` label — so Scout can scan them and Herald can draft nodes from approved ones.

### Option A: Formspree → GitHub (via Zapier/n8n, no code)

1. In Formspree dashboard → **Integrations** → add a Zapier webhook
2. In Zapier: trigger = Formspree submission → action = GitHub create issue
3. Map fields: `topic` → title, compose body from `category` + `why` + `name`
4. Label the issue `suggestion`

No code required. Works on Zapier free tier.

### Option B: Cloudflare Worker Proxy (fully in-repo, most integrated)

This replaces Formspree entirely. A tiny Cloudflare Worker holds the GitHub token server-side (never exposed to the browser) and creates issues directly.

**Step 1 — Create a GitHub PAT:**
- GitHub → Settings → Developer settings → Personal access tokens (fine-grained)
- Permissions: Issues → Read and write
- Copy the token

**Step 2 — Deploy the Worker:**

Create `cloudflare-worker/suggestion-proxy.js` in this repo:

```js
// Cloudflare Worker — proxies suggestion form submissions to GitHub Issues
// Deploy with: npx wrangler deploy cloudflare-worker/suggestion-proxy.js
// Set secret: npx wrangler secret put GITHUB_TOKEN

const GITHUB_REPO = "YOUR_GITHUB_USERNAME/relational-frontier-quartz"
const LABEL = "suggestion"
const CORS_ORIGIN = "https://garden.relationalfrontier.com"

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": CORS_ORIGIN,
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      })
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 })
    }

    // Rate limit check (Cloudflare handles this via Workers KV if needed)
    let body
    try {
      const formData = await request.formData()
      const topic = (formData.get("topic") ?? "").toString().trim()
      const category = (formData.get("category") ?? "").toString().trim()
      const why = (formData.get("why") ?? "").toString().trim()
      const name = (formData.get("name") ?? "Anonymous").toString().trim()
      const honeypot = formData.get("_gotcha")

      // Reject bots
      if (honeypot) return new Response("OK", { status: 200 })

      // Basic validation
      if (!topic || !category || !why) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        })
      }

      // Compose GitHub issue
      body = {
        title: `[Suggestion] ${topic}`,
        body: [
          `**Category:** ${category}`,
          `**Suggested by:** ${name || "Anonymous"}`,
          "",
          "**Why it belongs:**",
          why,
          "",
          "---",
          "*Submitted via the garden suggestion form.*",
        ].join("\n"),
        labels: [LABEL],
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Create GitHub issue
    const ghResponse = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "RF-Garden-Suggestion-Worker",
      },
      body: JSON.stringify(body),
    })

    if (!ghResponse.ok) {
      console.error("GitHub API error:", await ghResponse.text())
      return new Response(JSON.stringify({ error: "Failed to create issue" }), {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": CORS_ORIGIN,
        },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": CORS_ORIGIN,
      },
    })
  },
}
```

**Step 3 — Wire to the form:**

In `quartz.layout.ts`, instead of `formspreeId`, add a `workerUrl` option (or just swap the endpoint in `suggestion-box.inline.ts` — change the `fetch` URL from `https://formspree.io/f/${formspreeId}` to your Worker URL like `https://rf-suggestion-proxy.YOUR_SUBDOMAIN.workers.dev`).

**Step 4 — Create the `suggestion` label in GitHub:**
- Repo → Issues → Labels → New label → name: `suggestion`, color: `#8B4513`

**Deploy commands:**
```bash
cd cloudflare-worker
npm install -g wrangler
npx wrangler deploy suggestion-proxy.js --name rf-suggestion-proxy
npx wrangler secret put GITHUB_TOKEN
# paste your token when prompted
```

---

## Security Notes

- **No secrets in the frontend.** The Formspree ID is not sensitive — it's a public form endpoint. The GitHub token (if using the Worker upgrade) lives only in Cloudflare's encrypted secrets store, never in the source.
- **Honeypot field** (`_gotcha`) is present in the form to reject basic bots. Formspree also has built-in spam filtering.
- **Rate limiting:** Formspree's free tier (50/mo) is itself a natural rate limit. The Worker upgrade can add Cloudflare's rate limiting if needed.
- **Input is data, not instructions.** All suggestion content is treated as text only — it's stored in GitHub issue bodies and never executed.

---

## How the Component Works

The `SuggestionBox` component is a standard Quartz component:
- Registered in `quartz/components/index.ts`
- Added to `afterBody` in `quartz.layout.ts` via `sharedPageComponents`
- Internally checks `fileData.slug === "suggest"` before rendering — it returns `<></>` (nothing) on all other pages, so there's zero performance impact elsewhere
- The inline script (`suggestion-box.inline.ts`) is bundled by Quartz and runs on every `nav` event (Quartz SPA navigation), attaching only when the container is present

Build command to test: `npx quartz build`
