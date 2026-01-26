import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

// CREATE model
router.post('/', async (req: Request, res: Response) => {
  const { name, manufacturerId } = req.body
  if (!name || !manufacturerId) {
    return res.status(400).json({ error: 'Missing fields' })
  }

  try {
    const model = await prisma.model.create({
      data: { name, manufacturerId },
    })
    res.status(201).json(model)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET models (optional filter by manufacturer)
router.get('/', async (req: Request, res: Response) => {
  const { manufacturerId } = req.query

  try {
    const models = await prisma.model.findMany({
      where: manufacturerId ? { manufacturerId: manufacturerId as string } : undefined,
      include: { manufacturer: true },
      orderBy: { name: 'asc' },
    })
    res.json(models)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
