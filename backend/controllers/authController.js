import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { supabase } from '../db/client.js';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_SIGNUP_KEY = process.env.ADMIN_SIGNUP_KEY;

// ---------------- SIGNUP ----------------
export async function signup(req, res) {
  try {
    const { email, password, full_name, role = 'student', college_id, sem, admin_key } = req.body;
    console.log(sem)

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Admin key validation
    if (role === 'admin') {
      if (admin_key !== ADMIN_SIGNUP_KEY) {
        return res.status(403).json({ error: 'Invalid admin key' });
      }
    }

    // Students must provide college_id and sem
    if (role === 'student') {
      if (!college_id) {
        return res.status(400).json({ error: 'College selection is required for students' });
      }
      if (!sem) {
        return res.status(400).json({ error: 'Semester is required for students' });
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user into Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([{ email, password_hash, full_name, role, college_id, sem }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        college_id: data.college_id,
        sem: data.sem,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        college_id: data.college_id,
        sem: data.sem,
      },
    });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ---------------- LOGIN ----------------
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // Fetch user by email
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Compare password
    const match = await bcrypt.compare(password, data.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: data.id,
        email: data.email,
        role: data.role,
        college_id: data.college_id,
        sem: data.sem,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        college_id: data.college_id,
        sem: data.sem,
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
