import { Router, Request, Response } from 'express';
import multer from 'multer';
import cloudinary from '../lib/cloudinary';
import prisma from '../lib/prisma';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  '/',
  upload.single('file'),
  async (req: Request, res: Response) => {
    const { jobSheetId } = req.body;

    if (!req.file || !jobSheetId) {
      return res.status(400).json({ error: 'Missing file or jobSheetId' });
    }

    try {
      const result = await cloudinary.uploader.upload_stream(
        {
          folder: 'job-sheets',
          resource_type: 'auto',
        },
        async (error, result) => {
          if (error || !result) {
            return res.status(500).json({ error: 'Upload failed' });
          }

          const attachment = await prisma.attachment.create({
            data: {
              jobSheetId,
              url: result.secure_url,
              fileType: result.resource_type,
              key: process.env['SENDGRID_API_KEY'] || 'somekey'
            },
          });

          res.status(201).json(attachment);
        }
      );

      result.end(req.file.buffer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;
