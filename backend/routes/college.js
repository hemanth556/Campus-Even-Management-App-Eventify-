import express from 'express';
import { supabase } from '../db/client.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('colleges')
      .select('id, college_name, college_code');  // ✅ match table
          

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Error fetching colleges:', err.message);
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
});

export default router;
