import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendEmail } from '../services/mailer';

const router = Router();

// CREATE call
router.post('/', async (req: Request, res: Response) => {
  const { customerId, machineId, description, callTime, assignedTo } = req.body;
  
  if (!customerId || !description) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const call = await prisma.call.create({
      data: {
        callTime: callTime ? new Date(callTime) : undefined,
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

    let id = req.params.id;

  // Ensure id is a string
  if (Array.isArray(id)) id = id[0];
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
      where: { id},
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
        <p><strong>Assigned At:</strong> ${call.assignedAt?.toLocaleString()}</p>
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
     const { page = '1', pageSize = '10'} = _req.query;
  const pageNum = parseInt(page as string, 10);
  const size = parseInt(pageSize as string, 10);
    const [calls,count] = await Promise.all([
      prisma.call.findMany({
        skip: (pageNum - 1) * size,
        take: size,
      include: {
        customer: true,
        machine: true,
        assignedTo: true,
        jobSheet:true
      },
      orderBy: { callTime: 'desc' },
    }),
    prisma.call.count()
    ])

    res.json({calls, count});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/:id', async (req: Request, res: Response) => {
  let id = req.params.id;

  // Ensure id is a string
  if (Array.isArray(id)) id = id[0];

  if (!id) return res.status(400).json({ error: 'Call ID is required' });

  try {
    const call = await prisma.call.findUnique({
      where: { id },
        include: {
        customer: true,
        machine: true,
        assignedTo: true,
        jobSheet:true
      },
    });
    if (!call) return res.status(404).json({ error: 'Call not found' });
    res.json(call);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
export default router;
