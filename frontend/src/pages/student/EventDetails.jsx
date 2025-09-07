import React, { useEffect, useState } from 'react';
import API from '../../api/api';
import { useParams } from 'react-router-dom';

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    API.get(`/events/${id}`).then(r => setEvent(r.data.event)).catch(console.error);
  }, [id]);

  async function register() {
    try {
      await API.post('/registrations/register', { event_id: id });
      alert('Registered successfully');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  async function submitFeedback() {
    try {
      await API.post('/registrations/feedback', { event_id: id, rating, comment });
      alert('Feedback submitted');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  }

  if (!event) return <div>Loading...</div>;
  return (
    <div className="card">
      <h2 className="text-2xl mb-2">{event.title}</h2>
      <p className="mb-2">{event.description}</p>
      <p className="text-sm mb-2">{event.event_type} • {new Date(event.start_time).toLocaleString()}</p>
      <div className="flex gap-2">
        <button onClick={register} className="bg-brand-500 text-white px-3 py-1 rounded">Register</button>
      </div>

      <div className="mt-4">
        <h3 className="font-bold">Leave feedback</h3>
        <select value={rating} onChange={e=>setRating(e.target.value)} className="border p-2 mb-2">
          <option value={5}>5</option>
          <option value={4}>4</option>
          <option value={3}>3</option>
          <option value={2}>2</option>
          <option value={1}>1</option>
        </select>
        <textarea className="w-full p-2 border mb-2" value={comment} onChange={e=>setComment(e.target.value)} placeholder="Comment (optional)" />
        <button onClick={submitFeedback} className="bg-brand-500 text-white px-3 py-1 rounded">Submit</button>
      </div>
    </div>
  );
}
