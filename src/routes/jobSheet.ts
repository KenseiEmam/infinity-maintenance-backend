import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// CREATE job sheet
router.post('/', async (req: Request, res: Response) => {
  try {
    const jobSheet = await prisma.jobSheet.create({
      data: req.body,
    });
    res.status(201).json(jobSheet);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET job sheets (history)
router.get('/', async (req: Request, res: Response) => {
  const { customerId, serialNumber } = req.query;

  try {
    const jobSheets = await prisma.jobSheet.findMany({
      where: {
        customerId: customerId as string | undefined,
        machine: serialNumber
          ? { serialNumber: { contains: serialNumber as string, mode: 'insensitive' } }
          : undefined,
      },
      include: {
        customer: true,
        machine: true,
        engineer: true,
        spareParts: true,
        laserData: true,
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(jobSheets);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
