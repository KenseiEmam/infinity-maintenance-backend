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

export default router;
