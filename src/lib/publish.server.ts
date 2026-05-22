// Server-only publishers for LinkedIn (UGC API) and Instagram (Graph API).

export type PublishResult = { externalId: string };

function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

/** LinkedIn UGC post (text + optional image). */
export async function publishToLinkedIn(opts: {
  text: string;
  imageUrl?: string;
}): Promise<PublishResult> {
  const token = need("LINKEDIN_ACCESS_TOKEN");
  const author = need("LINKEDIN_AUTHOR_URN"); // e.g. urn:li:person:xxxx or urn:li:organization:xxxx

  let mediaAsset: string | undefined;
  if (opts.imageUrl) {
    // 1. Register upload
    const reg = await fetch("https://api.linkedin.com/v2/assets?action=registerUpload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
          owner: author,
          serviceRelationships: [
            { relationshipType: "OWNER", identifier: "urn:li:userGeneratedContent" },
          ],
        },
      }),
    });
    if (!reg.ok) throw new Error(`LinkedIn registerUpload failed: ${reg.status} ${await reg.text()}`);
    const regData = await reg.json();
    const uploadUrl: string =
      regData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]
        .uploadUrl;
    mediaAsset = regData.value.asset;

    // 2. Fetch image bytes and upload
    const imgRes = await fetch(opts.imageUrl);
    if (!imgRes.ok) throw new Error(`Failed to fetch image for LinkedIn: ${imgRes.status}`);
    const imgBytes = new Uint8Array(await imgRes.arrayBuffer());
    const up = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: imgBytes,
    });
    if (!up.ok) throw new Error(`LinkedIn image upload failed: ${up.status} ${await up.text()}`);
  }

  // 3. Create the UGC post
  const body = {
    author,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: opts.text },
        shareMediaCategory: mediaAsset ? "IMAGE" : "NONE",
        ...(mediaAsset
          ? {
              media: [
                {
                  status: "READY",
                  description: { text: "" },
                  media: mediaAsset,
                  title: { text: "" },
                },
              ],
            }
          : {}),
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const post = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  if (!post.ok) throw new Error(`LinkedIn post failed: ${post.status} ${await post.text()}`);
  const id = post.headers.get("x-restli-id") ?? "unknown";
  return { externalId: id };
}

/** Instagram Graph: requires a publicly-fetchable image URL. */
export async function publishToInstagram(opts: {
  caption: string;
  imageUrl: string;
}): Promise<PublishResult> {
  const token = need("META_ACCESS_TOKEN");
  const igId = need("INSTAGRAM_BUSINESS_ACCOUNT_ID");

  // 1. Create container
  const containerRes = await fetch(
    `https://graph.facebook.com/v21.0/${igId}/media?` +
      new URLSearchParams({
        image_url: opts.imageUrl,
        caption: opts.caption,
        access_token: token,
      }),
    { method: "POST" },
  );
  if (!containerRes.ok) {
    throw new Error(`Instagram container failed: ${containerRes.status} ${await containerRes.text()}`);
  }
  const { id: creationId } = await containerRes.json();

  // 2. Publish
  const pubRes = await fetch(
    `https://graph.facebook.com/v21.0/${igId}/media_publish?` +
      new URLSearchParams({ creation_id: creationId, access_token: token }),
    { method: "POST" },
  );
  if (!pubRes.ok) {
    throw new Error(`Instagram publish failed: ${pubRes.status} ${await pubRes.text()}`);
  }
  const { id } = await pubRes.json();
  return { externalId: id };
}
