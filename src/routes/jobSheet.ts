import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// -------------------------
// CREATE job sheet
// -------------------------
router.post('/', async (req: Request, res: Response) => {
  const { spareParts, laserData, ...jobSheetData } = req.body;

  try {
    const jobSheet = await prisma.jobSheet.create({
      data: {
        ...jobSheetData,
        date: new Date(jobSheetData.date),
        // nested create for spareParts and laserData if provided
        spareParts: spareParts ? { create: spareParts } : undefined,
        laserData: laserData ? { create: laserData } : undefined,
      },
      include: {
        customer: true,
        machine: true,
        engineer: true,
        spareParts: true,
        laserData: true,
        attachments: true,
      },
    });

    res.status(201).json(jobSheet);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// GET job sheets (history)
// -------------------------
router.get('/', async (req: Request, res: Response) => {
  const { customerName, serialNumber, page = '1', pageSize = '10'} = req.query;
  const pageNum = parseInt(page as string, 10);
  const size = parseInt(pageSize as string, 10);
  try {
    const filters: any = {};

    if (serialNumber) {
      filters.machine = {
        serialNumber: { contains: serialNumber as string, mode: 'insensitive' },
      }
    }

    if (customerName) {
      filters.customer = {
        name: { contains: customerName as string, mode: 'insensitive' },
      }
    }

    const [jobSheets, count] = await Promise.all([prisma.jobSheet.findMany({
      where: filters
     ,
      include: {
        customer: true,
        machine: true,
        engineer: true,
        spareParts: true,
        laserData: true,
        attachments: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * size,
        take: size,
    }),  prisma.jobSheet.count({ where: filters })]);

    
    res.json({jobSheets, count});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// GET job sheet (singular)
// -------------------------
router.get('/:id', async (req: Request, res: Response) => {
  let id = req.params.id;
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
      },
    });

    if (!jobSheet) return res.status(404).json({ error: 'Job Sheet not found' });

    res.json(jobSheet);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// UPDATE Job Sheet with nested SpareParts & LaserData
// -------------------------
router.patch('/:id', async (req: Request, res: Response) => {
  let id = req.params.id;
  if (Array.isArray(id)) id = id[0];
  if (!id) return res.status(400).json({ error: 'Job Sheet ID is required' });

  const { spareParts, laserData,  customerId,
          machineId,
          engineerId,
          attachments,
          customer,
          engineer,
          machine,
          createdAt,
          id:idont,...jobSheetData } = req.body;

  try {
    const jobSheet = await prisma.jobSheet.update({
      where: { id },
      data: {
        ...jobSheetData,
        ...(customerId && { customer: { connect: { id: customerId } } }),
    ...(machineId && { machine: { connect: { id: machineId } } }),
    ...(engineerId && { engineer: { connect: { id: engineerId } } }),
        spareParts: spareParts
          ? {
              upsert: spareParts.map((sp: any) => ({
                where: { id: sp.id || '' }, // If no id, it will fail and we can create
                update: sp,
                create: sp,
              })),
            }
          : undefined,
        // For laserData
        laserData: laserData
          ? {
              upsert: laserData.map((ld: any) => ({
                where: { id: ld.id || '' },
                update: ld,
                create: ld,
              })),
            }
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
    });

    res.json(jobSheet);
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Job Sheet not found' });
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// DELETE Job Sheet
// -------------------------
router.delete('/:id', async (req: Request, res: Response) => {
  let id = req.params.id;
  if (Array.isArray(id)) id = id[0];
  if (!id) return res.status(400).json({ error: 'Job Sheet ID is required' });

  try {
    await prisma.jobSheet.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Job Sheet not found' });
    res.status(500).json({ error: err.message });
  }
});

export default router;
