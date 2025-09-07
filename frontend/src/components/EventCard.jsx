import React, { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";

export default function EventCard({
  event,
  collegeNameMap = {},
  userRegistration,
  attended = false,
  attendanceRow = null,
  onRegister,
  disableRegister = false
}) {
  const collegeName = collegeNameMap[event.college_id] || event.college_id;
  const isRegistered = userRegistration?.status === "Registered" || userRegistration?.registered;
  const isPresent = !!attended;
  const isCompletedOrCancelled = event.completed || event.cancelled;

  const { token } = useContext(AuthContext);

  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [myRating, setMyRating] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
  }, [event.id]);

  const submitRating = async (value) => {
    if (ratingSubmitting) return;
    setError(null);

    if (!isPresent) {
      setError("Only students marked present may submit a rating.");
      return;
    }

    setRatingSubmitting(true);
    try {
      const payload = { event_id: event.id || event.event_id, rating: Number(value) };
      await API.post("/registrations/feedback", payload);
      setMyRating(Number(value));
    } catch (err) {
      console.error("Feedback submit error", err);
      const msg = err?.response?.data?.error || err.message || "Failed to submit rating";
      setError(msg);
    } finally {
      setRatingSubmitting(false);
    }
  };

  return (
    <article className="w-full bg-white border border-sky-100 rounded-2xl shadow-lg p-5 flex flex-col md:flex-row gap-4 items-start md:items-center transition-transform hover:-translate-y-0.5">
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 h-14 w-14 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              {event.title?.charAt(0) || "E"}
            </div>
            <div>
              <h3 className="text-sky-800 text-lg font-semibold leading-tight">{event.title}</h3>
              <p className="text-sm text-sky-600/80 mt-0.5">{event.event_type}</p>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-end gap-2">
            <div className="text-xs text-right text-sky-500 font-medium">
              {new Date(event.start_time).toLocaleString()}
            </div>
            <div className="text-xs text-right text-sky-400">
              {new Date(event.end_time).toLocaleString()}
            </div>
          </div>
        </div>

        <p className="text-gray-700 leading-relaxed mt-1 line-clamp-3">
          {event.description?.slice(0, 220)}{event.description?.length > 220 ? "..." : ""}
        </p>

        <div className="flex flex-wrap items-center gap-3 text-xs text-sky-600 mt-2">
          <span className="px-2 py-1 rounded-full bg-sky-50 border border-sky-100">Location: <span className="font-semibold text-sky-700 ml-1">{event.location}</span></span>
          <span className="px-2 py-1 rounded-full bg-sky-50 border border-sky-100">Sem: <span className="font-semibold text-sky-700 ml-1">{event.sem || "N/A"}</span></span>
          <span className="px-2 py-1 rounded-full bg-sky-50 border border-sky-100">College: <span className="font-semibold text-sky-700 ml-1">{collegeName}</span></span>
        </div>
      </div>

      <div className="w-full md:w-56 flex-shrink-0 flex flex-col items-stretch gap-3">
        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center text-sm font-semibold px-3 py-1 rounded-full shadow-sm ${
              isPresent ? "bg-green-50 text-green-700 border border-green-100" :
              isRegistered ? "bg-sky-50 text-sky-700 border border-sky-100" :
              isCompletedOrCancelled ? "bg-gray-50 text-gray-600 border border-gray-100" :
              "bg-white text-gray-600 border border-sky-50"
            }`}
            role="status"
            aria-label="registration status"
          >
            {isPresent ? "Present" : isRegistered ? "Registered" : isCompletedOrCancelled ? "Registration Closed" : "Not Registered"}
          </span>

          {!isRegistered && !isCompletedOrCancelled && (
            <button
              onClick={onRegister}
              disabled={disableRegister}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-semibold shadow-md hover:from-sky-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Register
            </button>
          )}

          {isRegistered && !isPresent && (
            <button disabled className="w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-600 font-medium border border-gray-200 cursor-not-allowed">
              Registered
            </button>
          )}
        </div>

        {isPresent && event.completed && (
          <div className="mt-1 w-full bg-sky-50/40 border border-sky-50 rounded-lg p-3">
            {myRating ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-sky-700">Your rating</span>
                  <div className="flex items-center">
                    {[1,2,3,4,5].map(n => (
                      <svg key={n} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                        className={`w-5 h-5 ${myRating >= n ? 'text-yellow-400' : 'text-gray-200'}`}>
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.949a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.95c.3.922-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.84-.196-1.54-1.119l1.286-3.949a1 1 0 00-.364-1.118L2.063 9.376c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.949z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-sky-700">Rate</span>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(n => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => submitRating(n)}
                        disabled={ratingSubmitting}
                        className="p-1 rounded focus:outline-none focus:ring-2 focus:ring-sky-200"
                        title={`Rate ${n}`}
                        aria-label={`Rate ${n}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                          className={`w-5 h-5 ${ratingSubmitting ? 'opacity-50 text-gray-300' : 'text-gray-400 hover:text-yellow-400'}`}>
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.949a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.95c.3.922-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.84-.196-1.54-1.119l1.286-3.949a1 1 0 00-.364-1.118L2.063 9.376c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.949z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
            {ratingSubmitting && <div className="text-xs text-gray-600 mt-2">Submitting...</div>}
          </div>
        )}

        {event.completed && !isPresent && <span className="text-xs text-red-600 font-semibold text-right">Event Completed</span>}
        {event.cancelled && <span className="text-xs text-red-500 font-semibold text-right">Event Cancelled</span>}
      </div>
    </article>
  );
}
