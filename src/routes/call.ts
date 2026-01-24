import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendEmail } from '../services/mailer';

const router = Router();

// CREATE call
router.post('/', async (req: Request, res: Response) => {
  const { customerId, machineId, description } = req.body;

  if (!customerId || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const call = await prisma.call.create({
      data: {
        customerId,
        machineId,
        description,
      },
    });

    res.status(201).json(call);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ASSIGN call to engineer
router.patch('/:id/assign', async (req: Request, res: Response) => {
  const { assignedToId } = req.body;

  if (!assignedToId) {
    return res.status(400).json({ error: 'assignedToId is required' });
  }

  try {
    // Fetch engineer info
    const engineer = await prisma.user.findUnique({
      where: { id: assignedToId },
    });

    if (!engineer) {
      return res.status(404).json({ error: 'Engineer not found' });
    }

    // Update the call
    const call = await prisma.call.update({
      where: { id: req.params.id },
      data: {
        assignedToId,
        assignedAt: new Date(),
      },
      include: {
        customer: true,
        machine: true,
      },
    });

    // Send email to the assigned engineer
    await sendEmail({
      to: engineer.email, // dynamic engineer email
      subject: 'You have been assigned a new call',
      html: `
        <p>Hello ${engineer.name},</p>
        <p>You have been assigned a new service call.</p>
        <p><strong>Customer:</strong> ${call.customer.name}</p>
        <p><strong>Machine Serial:</strong> ${call.machine?.serialNumber || 'N/A'}</p>
        <p><strong>Description:</strong> ${call.description}</p>
        <p><strong>Assigned At:</strong> ${call.assignedAt.toLocaleString()}</p>
        <p>— Maintenance System</p>
      `,
    });

    res.json(call);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// GET calls
router.get('/', async (_req: Request, res: Response) => {
  try {
    const calls = await prisma.call.findMany({
      include: {
        customer: true,
        machine: true,
        assignedTo: true,
      },
      orderBy: { callTime: 'desc' },
    });

    res.json(calls);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
