// src/components/FeedbackForm.jsx
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function FeedbackForm({ eventId, onSubmitted }) {
  const { token } = useContext(AuthContext); // expects your AuthContext to expose token
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [message, setMessage] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!eventId) return setMessage({ type: 'error', text: 'Missing event id' });
    if (!rating || rating < 1 || rating > 5) return setMessage({ type: 'error', text: 'Please select rating 1 to 5' });

    setSubmitting(true);
    try {
      const res = await fetch('/api/registrations/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined
        },
        body: JSON.stringify({ event_id: eventId, rating, comments })
      });

      const body = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(body.error || body.message || 'Submit failed');

      setMessage({ type: 'success', text: 'Thanks — your feedback was submitted.' });
      setAlreadySubmitted(true);
      if (typeof onSubmitted === 'function') onSubmitted();
    } catch (err) {
      console.error('Submit feedback error', err);
      setMessage({ type: 'error', text: err.message || 'Failed to submit feedback' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Your rating</label>
          <div className="flex items-center gap-2">
            {[1,2,3,4,5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                disabled={submitting || alreadySubmitted}
                className="p-1 rounded"
                aria-label={`Rate ${n}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-6 h-6 ${rating >= n || hover >= n ? 'text-yellow-400' : 'text-gray-300'}`}>
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.949a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.95c.3.922-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.84-.196-1.54-1.119l1.286-3.949a1 1 0 00-.364-1.118L2.063 9.376c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.949z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Comments (optional)</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={3}
            className="w-full rounded-md border px-3 py-2"
            placeholder="What did you like? What could be improved?"
            disabled={submitting || alreadySubmitted}
          />
        </div>

        {message && (
          <div className={`p-2 rounded ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message.text}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting || alreadySubmitted}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : alreadySubmitted ? 'Submitted' : 'Submit feedback'}
          </button>

          <button
            type="button"
            onClick={() => { setRating(0); setComments(''); setMessage(null); }}
            className="px-3 py-2 border rounded-xl text-sm"
            disabled={submitting}
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
