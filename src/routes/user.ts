import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import crypto from 'crypto';
import { sendEmail } from '../services/mailer';

const router = Router();

// ================== TYPES ==================

interface FirstAdminBody {
  email: string;
  name: string;
  password: string;
}

interface InviteUserBody {
  email: string;
  name: string;
  role: string;
}

interface LoginBody {
  email: string;
  password: string;
}

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';


// ================== FIRST ADMIN ==================
// Only allowed if no users exist

router.post('/register-first-admin', async (req: Request<{}, {}, FirstAdminBody>, res: Response) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const count = await prisma.user.count();
    if (count > 0) {
      return res.status(403).json({ error: 'Admin already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        email,
        name,
        role: 'ADMIN',
        password: hashedPassword,
      },
    });

    res.status(201).json({ data: admin, message: 'Admin created' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ================== INVITE USER (ADMIN ONLY) ==================

router.post('/invite', async (req: Request, res: Response) => {
  const { email, name, role } = req.body;

  if (!email || !name || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    const user = await prisma.user.create({
      data: {...req.body, inviteTokenExpiry},
    });

    const setupUrl = `${process.env.FRONTEND_URL}/setup-password?token=${inviteToken}&id=${user.id}`;

    await sendEmail({
      to: user.email,
      subject: 'You have been invited to the Maintenance System',
      html: `
        <p>Hello ${user.name},</p>
        <p>An administrator has created an account for you.</p>
        <p>Please click the link below to set your password:</p>
        <p>
          <a href="${setupUrl}">Set your password</a>
        </p>
        <p>This link expires in 24 hours.</p>
        <p>— Maintenance System</p>
      `,
    });

    res.status(201).json({ message: 'User invited successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ================== SET PASSWORD (INVITED USERS) ==================

router.post('/setup-password', async (req: Request, res: Response) => {
  const { userId, token, password } = req.body;

  if (!userId || !token || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (
      !user ||
      user.inviteToken !== token ||
      !user.inviteTokenExpiry ||
      user.inviteTokenExpiry < new Date()
    ) {
      return res.status(400).json({ error: 'Invalid or expired invite link' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        inviteToken: null,
        inviteTokenExpiry: null,
      },
    });

    res.json({ success: true, message: 'Password set successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ================== LOGIN ==================

router.post('/login', async (req: Request<{}, {}, LoginBody>, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.password) return res.status(403).json({ error: 'User has not set a password yet' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ================== FORGOT / RESET PASSWORD ==================
// (UNCHANGED logic, compatible with invited users)

router.post('/forgot-password', async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 15);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&id=${user.id}`;

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <p>Hello ${user.name},</p>
        <p>You requested a password reset.</p>
        <p><a href="${resetUrl}">Reset Password</a></p>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  const { userId, token, newPassword } = req.body;

  if (!userId || !token || !newPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (
      !user ||
      user.resetToken !== token ||
      !user.resetTokenExpiry ||
      user.resetTokenExpiry < new Date()
    ) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ success: true, message: 'Password set successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// ===== UPDATE SINGLE USER =====
router.patch('/:id', async (req: Request, res: Response) => {
  let { id } = req.params; // id from the URL
  const body = req.body; // fields to update
  if (Array.isArray(id)) id = id[0];
  try {
    const user = await prisma.user.update({
      where: { id }, // Prisma expects an object
      data: body,
    });

    res.json(user); // return updated user
  } catch (err: any) {
    if (err.code === 'P2025') {
      // Prisma error code for "record not found"
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: err.message || 'Failed to update user' });
  }
});

// ===== FETCH SINGLE USER =====
router.get('/:id', async (req: Request, res: Response) => {
  let { id } = req.params;
  if (Array.isArray(id)) id = id[0];
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch user' });
  }
});

// ===== FETCH MULTIPLE USERS (with optional filters) =====
router.get('/', async (req: Request, res: Response) => {
  const { page = '1', pageSize = '10', role, name } = req.query;
  const pageNum = parseInt(page as string, 10);
  const size = parseInt(pageSize as string, 10);

  try {
   const filters: any = {};

if (role) {
  filters.role = {
    in: (role as string).split(','),
  };
}

if (name) {
  filters.name = {
    contains: name as string,
    mode: 'insensitive',
  };
}


    const [users, count] = await Promise.all([
      prisma.user.findMany({
        where: filters,
        skip: (pageNum - 1) * size,
        take: size,
      }),
      prisma.user.count({ where: filters }),
    ]);

    const usersWithoutPasswords = users.map((u: { [x: string]: any; password: any; }) => {
      const { password, ...rest } = u;
      return rest;
    });

    res.json({ users: usersWithoutPasswords, count });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch users' });
  }
});

export default router;
