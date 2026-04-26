import { v2 as cloudinary } from 'cloudinary';

export async function signCloudinaryUpload(_req, res) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({ success: false, message: 'Cloudinary is not configured.' });
    }

    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

    const folder = process.env.CLOUDINARY_CMS_FOLDER || 'grovyn/cms';
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, apiSecret);

    return res.status(200).json({
      success: true,
      data: {
        signature,
        timestamp,
        cloudName,
        apiKey,
        folder,
      },
    });
  } catch (e) {
    console.error('signCloudinaryUpload', e);
    return res.status(500).json({ success: false, message: 'Could not create upload signature.' });
  }
}
