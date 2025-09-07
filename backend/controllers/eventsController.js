import { supabase } from '../db/client.js';

export async function createEvent(req, res) {
  const creator = req.user;
  const { title, description, event_type, location, start_time, end_time,  college_id } = req.body;
  const use_college = college_id || creator.college_id;
  if (!use_college) return res.status(400).json({ error: 'college_id required' });

  const { data, error } = await supabase
    .from('events')
    .insert([{
      title, description, event_type, location, start_time, end_time,  college_id: use_college, created_by: creator.id
    }])
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json({ event: data });
}

export async function updateEvent(req, res) {
  const id = req.params.id;
  const updates = req.body;
  const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ event: data });
}

export async function cancelEvent(req, res) {
 try {
    const { id } = req.params;
    const { error } = await supabase
      .from("events")
      .update({ cancelled: true })
      .eq("id", id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: "Event marked as cancelled" });
  } catch (err) {
    console.error("Cancel Event Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Mark event as completed




export async function getEvents(req, res) {
  try {
    const { college_id, event_type, sem, sortBy } = req.query;
    console.log("this is college id " + college_id);

    // Fetch events with filters
    let q = supabase.from('events').select('*');
    if (college_id) q = q.eq('college_id', college_id);
    if (event_type) q = q.eq('event_type', event_type);
    if (sem) q = q.eq('sem', sem);

    const { data: events, error: eventError } = await q;
    if (eventError) return res.status(400).json({ error: eventError.message });

    let sortedEvents = [...events];

    // Sorting
    if (sortBy === 'popularity') {
      const eventIds = events.map(e => e.id);
      const { data: regs, error: regError } = await supabase
        .from('registrations')
        .select('event_id')
        .in('event_id', eventIds);

      if (regError) return res.status(400).json({ error: regError.message });

      const counts = {};
      regs.forEach(r => counts[r.event_id] = (counts[r.event_id] || 0) + 1);

      sortedEvents = events
        .map(e => ({ ...e, registrations: counts[e.id] || 0 }))
        .sort((a, b) => b.registrations - a.registrations);

    } else if (sortBy === 'date') {
      sortedEvents = events.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    } else if (sortBy === 'sem') {
      sortedEvents = events.sort((a, b) => (a.sem || 0) - (b.sem || 0));
    }

    res.json({ events: sortedEvents });

  } catch (err) {
    console.error('Get Events Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}


export async function getEventById(req, res) {
  const id = req.params.id;
  const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
  if (error) return res.status(404).json({ error: 'Event not found' });
  res.json({ event: data });
}

export async function getEventsForAdmin(req, res) {
  const admin = req.user;
  const { data, error } = await supabase.from('events').select('*').eq('created_by', admin.id).order('start_time', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ events: data });
}



export const getEligibleEvents = async (req, res) => {
  try {
    const { college_id, sem } = req.query;
    const semNumber = sem ? parseInt(sem) : null;

    // 1️⃣ Fetch events for this college & semester
    let q = supabase
      .from('events')
      .select('*')
      .eq('college_id', college_id)
      .or(`sem.eq.${semNumber},sem.is.null`)
      .order('start_time', { ascending: true });

    const { data: events, error: eventsError } = await q;
    if (eventsError) throw eventsError;

    // 2️⃣ Fetch registrations for current user
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', req.user.id);

    if (regError) throw regError;

    // 3️⃣ Map registrations to events
    const eventsWithStatus = events.map(event => {
      const reg = registrations.find(r => r.event_id === event.id);
      return { 
        ...event, 
        registration: reg ? { status: 'Registered', ...reg } : null 
      };
    });

    res.json({ events: eventsWithStatus });
  } catch (err) {
    console.error('getEligibleEvents Error:', err);
    res.status(500).json({ error: 'Failed to fetch eligible events' });
  }
};



