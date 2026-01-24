import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// CREATE customer
router.post('/', async (req: Request, res: Response) => {
  const { name, address } = req.body;

  if (!name) return res.status(400).json({ error: 'Customer name is required' });

  try {
    const customer = await prisma.customer.create({
      data: { name, address },
    });

    res.status(201).json(customer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET all customers
router.get('/', async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(customers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  let id = req.params.id;

  // Ensure id is a string
  if (Array.isArray(id)) id = id[0];

  if (!id) return res.status(400).json({ error: 'Customer ID is required' });

  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
    });
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
