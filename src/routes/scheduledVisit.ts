import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendEmail } from '../services/mailer';

const router = Router();

// -------------------------
// CREATE Scheduled Visit
// -------------------------
router.post('/', async (req: Request, res: Response) => {
  let { machineId, visitDate, notes } = req.body;

  if (!machineId || !visitDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const visit = await prisma.scheduledVisit.create({
      data: {
        machineId,
        visitDate: new Date(visitDate),
        notes,
      },
      include: {
        machine: { include: { customer: true } },
      },
    });

    // send notification email
    await sendEmail({
      to: "maintenance@infinitymedicalkwt.com",
      subject: 'A new booking was scheduled!',
      html: `
        <p>Hello Team,</p>
        <p>A new visit for Machine ${visit.machine.serialNumber} (Customer: ${visit.machine.customer.name}) has been booked on ${visit.visitDate.toLocaleDateString('en', { day: "2-digit", month: "short", year: 'numeric' })}.</p>
        <p>Notes if any: ${notes || 'None'}</p>
        <p>— Maintenance System</p>
      `,
    });

    res.status(201).json(visit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// GET All Scheduled Visits
// -------------------------
router.get('/', async (_req: Request, res: Response) => {
  try {
    const visits = await prisma.scheduledVisit.findMany({
      include: {
        machine: { include: { customer: true } },
      },
      orderBy: { visitDate: 'asc' },
    });

    res.json(visits);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// GET Single Visit
// -------------------------
router.get('/:id', async (req: Request, res: Response) => {
  let id = req.params.id;
  if (Array.isArray(id)) id = id[0];

  try {
    const visit = await prisma.scheduledVisit.findUnique({
      where: { id },
      include: {
        machine: { include: { customer: true } },
      },
    });

    if (!visit) return res.status(404).json({ error: 'Visit not found' });
    res.json(visit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// UPDATE Scheduled Visit
// -------------------------
router.patch('/:id', async (req: Request, res: Response) => {
  let id = req.params.id;
  if (Array.isArray(id)) id = id[0];

  try {
    const visit = await prisma.scheduledVisit.update({
      where: { id },
      data: req.body,
      include: { machine: { include: { customer: true } } },
    });

    res.json(visit);
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Visit not found' });
    res.status(500).json({ error: err.message });
  }
});

// -------------------------
// DELETE Scheduled Visit
// -------------------------
router.delete('/:id', async (req: Request, res: Response) => {
  let id = req.params.id;
  if (Array.isArray(id)) id = id[0];

  try {
    await prisma.scheduledVisit.delete({ where: { id } });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Visit not found' });
    res.status(500).json({ error: err.message });
  }
});

export default router;
