import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// -------------------------
// CREATE job sheet
// -------------------------
router.post('/', async (req: Request, res: Response) => {
  const { callId, spareParts, laserData, ...jobSheetData } = req.body;

  try {
    const jobSheet = await prisma.jobSheet.create({
      data: {
        ...jobSheetData,
        date: new Date(jobSheetData.date),
        callId: callId || undefined,
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

  const {
    spareParts = [],
    laserData = [],
    customerId,
    machineId,
    engineerId,
    attachments,
    customer,
    engineer,
    machine,
    createdAt,
    id:idont,
    ...jobSheetData
  } = req.body;

  try {
    // Fetch current sheet to know which nested items exist
    const existingSheet = await prisma.jobSheet.findUnique({
      where: { id },
      include: { spareParts: true, laserData: true },
    });

    if (!existingSheet) return res.status(404).json({ error: 'Job Sheet not found' });

    // Determine which spareParts to delete (removed from frontend)
    const sparePartsToDelete = existingSheet.spareParts
      .filter(sp => !spareParts.some((s: any) => s.id === sp.id))
      .map(sp => ({ id: sp.id }));

    const laserDataToDelete = existingSheet.laserData
      .filter(ld => !laserData.some((l: any) => l.id === ld.id))
      .map(ld => ({ id: ld.id }));

    // Split incoming items into new vs existing
    const existingSpareParts = spareParts.filter((sp: any) => sp.id);
    const newSpareParts = spareParts.filter((sp: any) => !sp.id);

    const existingLaserData = laserData.filter((ld: any) => ld.id);
    const newLaserData = laserData.filter((ld: any) => !ld.id);

    const jobSheet = await prisma.jobSheet.update({
      where: { id },
      data: {
        ...jobSheetData,
        ...(customerId && { customer: { connect: { id: customerId } } }),
        ...(machineId && { machine: { connect: { id: machineId } } }),
        ...(engineerId && { engineer: { connect: { id: engineerId } } }),
        spareParts: {
          // Delete removed items
          delete: sparePartsToDelete,
          // Update existing
          update: existingSpareParts.map((sp: any) => ({ where: { id: sp.id }, data: sp })),
          // Create new
          create: newSpareParts,
        },
        laserData: {
          delete: laserDataToDelete,
          update: existingLaserData.map((ld: any) => ({ where: { id: ld.id }, data: ld })),
          create: newLaserData,
        },
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
