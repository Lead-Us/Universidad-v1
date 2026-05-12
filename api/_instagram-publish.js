// POST /api/instagram-publish
// Publishes a single image post or carousel to Instagram via Graph API.
// Body: { imageUrls: string[], caption: string }
//   imageUrls: array of 1 (single post) or 2-10 (carousel) public URLs
//   caption: post caption text

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const USER_ID      = process.env.INSTAGRAM_USER_ID;
const BASE         = 'https://graph.instagram.com/v21.0';

async function apiCall(path, method = 'POST', body = {}) {
  const url    = `${BASE}${path}`;
  const params = new URLSearchParams({ ...body, access_token: ACCESS_TOKEN });
  const res    = await fetch(method === 'GET' ? `${url}?${params}` : url, {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {},
    body:    method === 'POST' ? params : undefined,
  });
  const data = await res.json();
  if (data.error) throw new Error(`Meta API: ${data.error.message}`);
  return data;
}

async function createSingleContainer(imageUrl, caption) {
  return apiCall(`/${USER_ID}/media`, 'POST', {
    image_url: imageUrl,
    caption,
    media_type: 'IMAGE',
  });
}

async function createCarouselChild(imageUrl) {
  return apiCall(`/${USER_ID}/media`, 'POST', {
    image_url:  imageUrl,
    media_type: 'IMAGE',
    is_carousel_item: 'true',
  });
}

async function createCarouselContainer(childIds, caption) {
  return apiCall(`/${USER_ID}/media`, 'POST', {
    media_type: 'CAROUSEL',
    children:   childIds.join(','),
    caption,
  });
}

async function publishContainer(containerId) {
  return apiCall(`/${USER_ID}/media_publish`, 'POST', {
    creation_id: containerId,
  });
}

async function waitForReady(containerId, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const { status_code } = await apiCall(
      `/${containerId}?fields=status_code`,
      'GET'
    );
    if (status_code === 'FINISHED') return;
    if (status_code === 'ERROR')    throw new Error('Container processing failed');
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error('Container processing timed out');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!ACCESS_TOKEN || !USER_ID) {
    return res.status(500).json({ error: 'Instagram credentials not configured' });
  }

  const { imageUrls, caption } = req.body;

  if (!imageUrls?.length || !caption) {
    return res.status(400).json({ error: 'imageUrls[] and caption are required' });
  }

  try {
    let containerId;

    if (imageUrls.length === 1) {
      // Single image post
      const { id } = await createSingleContainer(imageUrls[0], caption);
      containerId   = id;
    } else {
      // Carousel (2–10 images)
      const childContainers = await Promise.all(
        imageUrls.map(url => createCarouselChild(url))
      );
      const childIds = childContainers.map(c => c.id);

      await Promise.all(childIds.map(id => waitForReady(id)));

      const { id } = await createCarouselContainer(childIds, caption);
      containerId   = id;
    }

    await waitForReady(containerId);
    const { id: postId } = await publishContainer(containerId);

    return res.status(200).json({
      success: true,
      postId,
      message: `Published ${imageUrls.length === 1 ? 'post' : 'carousel'} successfully`,
    });

  } catch (err) {
    console.error('[instagram-publish]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
