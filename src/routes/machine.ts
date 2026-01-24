import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// CREATE machine
router.post('/', async (req: Request, res: Response) => {
  const { serialNumber, customerId, modelId, underWarranty } = req.body;

  if (!serialNumber || !customerId || !modelId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const machine = await prisma.machine.create({
      data: { serialNumber, customerId, modelId, underWarranty },
    });
    res.status(201).json(machine);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET machines (by customer or serial)
router.get('/', async (req: Request, res: Response) => {
  const { customerId, serialNumber } = req.query;

  try {
    const machines = await prisma.machine.findMany({
      where: {
        customerId: customerId as string | undefined,
        serialNumber: serialNumber
          ? { contains: serialNumber as string, mode: 'insensitive' }
          : undefined,
      },
      include: {
        customer: true,
        model: { include: { manufacturer: true } },
      },
    });

    res.json(machines);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// GET Single Machine
// -------------------------
router.get('/:id', async (req: Request, res: Response) => {
  let id = req.params.id;
  if (Array.isArray(id)) id = id[0];
  if (!id) return res.status(400).json({ error: 'Machine ID is required' });

  try {
    const machine = await prisma.machine.findUnique({
      where: { id },
      include: {
        customer: true,
        model: { include: { manufacturer: true } },
        jobSheets: true,
        calls: true,
        scheduledVisits: true,
      },
    });

    if (!machine) return res.status(404).json({ error: 'Machine not found' });

    res.json(machine);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// UPDATE Machine
// -------------------------
router.patch('/:id', async (req: Request, res: Response) => {
  let id = req.params.id;
  if (Array.isArray(id)) id = id[0];
  if (!id) return res.status(400).json({ error: 'Machine ID is required' });

  try {
    const machine = await prisma.machine.update({
      where: { id },
      data: req.body, // partial updates allowed
      include: {
        customer: true,
        model: { include: { manufacturer: true } },
      },
    });

    res.json(machine);
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// DELETE Machine
// -------------------------
router.delete('/:id', async (req: Request, res: Response) => {
  let id = req.params.id;
  if (Array.isArray(id)) id = id[0];
  if (!id) return res.status(400).json({ error: 'Machine ID is required' });

  try {
    await prisma.machine.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Machine not found' });
    }
    res.status(500).json({ error: err.message });
  }
});

export default router;
