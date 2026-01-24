import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendEmail } from '../services/mailer';

const router = Router();

// CREATE scheduled visit
router.post('/', async (req: Request, res: Response) => {
  const { machineId, visitDate, notes } = req.body;

  if (!machineId || !visitDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const visit = await prisma.scheduledVisit.create({
      data: { machineId, visitDate, notes },
    });
     await sendEmail({
          to: "maintenance@infinitymedicalkwt.com",
          subject: 'A new booking was scheduled!',
          html: `
            <p>Hello Team,</p>
            <p>A new visit for Machine ${machineId} has been booked on ${new Date(visitDate).toLocaleDateString('en', {day:"2-digit" ,month:"short", year:'numeric'})}.</p>
            <p>Notes if any : ${notes}</p>
            <p>— Maintenance System</p>
          `,
      })
    res.status(201).json(visit);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET visits
router.get('/', async (_req: Request, res: Response) => {
  try {
    const visits = await prisma.scheduledVisit.findMany({
      include: {
        machine: {
          include: { customer: true },
        },
      },
      orderBy: { visitDate: 'asc' },
    });

    res.json(visits);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
