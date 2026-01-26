import { Router, Request, Response } from 'express'
import prisma from '../lib/prisma'

const router = Router()

// CREATE manufacturer
router.post('/', async (req: Request, res: Response) => {
  const { name } = req.body
  if (!name) return res.status(400).json({ error: 'Name required' })

  try {
    const manufacturer = await prisma.manufacturer.create({ data: { name } })
    res.status(201).json(manufacturer)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET all manufacturers
router.get('/', async (_req, res) => {
  try {
    const manufacturers = await prisma.manufacturer.findMany({
      orderBy: { name: 'asc' },
    })
    res.json(manufacturers)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
