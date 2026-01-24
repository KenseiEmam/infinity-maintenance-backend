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

// GET job sheet (Singular)
router.get('/:id', async (req: Request, res: Response) => {
    let id = req.params.id;

  // Ensure id is a string
  if (Array.isArray(id)) id = id[0];

  if (!id) return res.status(400).json({ error: 'Sheet ID is required' });

  try {
    const jobSheet = await prisma.jobSheet.findUnique({
      where: { id },
      include: {
        customer: true,
        machine: true,
        engineer: true,
        spareParts: true,
        laserData: true,
        attachments: true,
      }
    });

    res.json(jobSheet);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// UPDATE Job Sheet
// -------------------------
router.patch('/:id', async (req: Request, res: Response) => {
  let id = req.params.id;
  if (Array.isArray(id)) id = id[0];
  if (!id) return res.status(400).json({ error: 'Job Sheet ID is required' });

  try {
    const jobSheet = await prisma.jobSheet.update({
      where: { id },
      data: req.body, // req.body can include partial updates
      include: {
        customer: true,
        machine: true,
        engineer: true,
        spareParts: true,
        laserData: true,
        attachments: true,
      },
    });

    res.json(jobSheet);
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Job Sheet not found' });
    }
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// DELETE Job Sheet (optional)
// -------------------------
router.delete('/:id', async (req: Request, res: Response) => {
  let id = req.params.id;
  if (Array.isArray(id)) id = id[0];
  if (!id) return res.status(400).json({ error: 'Job Sheet ID is required' });

  try {
    await prisma.jobSheet.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Job Sheet not found' });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
