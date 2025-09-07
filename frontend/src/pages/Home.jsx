import React, { useEffect, useState, useContext } from "react";
import API from "../api/api";
import EventCard from "../components/EventCard";
import { AuthContext } from "../context/AuthContext";

export default function Home() {
  const [events, setEvents] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [collegeMap, setCollegeMap] = useState({});
  const [filters, setFilters] = useState({
    college_id: "",
    event_type: "",
    sem: "",
    sortBy: "",
  });
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    API.get("/colleges")
      .then((res) => {
        setColleges(Array.isArray(res.data) ? res.data : []);
        const map = (res.data || []).reduce((acc, college) => {
          acc[college.college_code] = college.college_name;
          return acc;
        }, {});
        setCollegeMap(map);
      })
      .catch(console.error);
  }, [user]);

  const loadEvents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.college_id) params.append("college_id", filters.college_id);
      if (filters.event_type) params.append("event_type", filters.event_type);
      if (filters.sem) params.append("sem", filters.sem);
      if (filters.sortBy) params.append("sortBy", filters.sortBy);

      const res = await API.get(`/events?${params.toString()}`);
      const eventsData = res.data?.events || [];

      const normalized = eventsData.map((ev) => {
        const evId = ev.id || ev.event_id || ev._id || null;
        const embedded =
          ev.registration ||
          ev.user_registration ||
          ev.userRegistration ||
          (ev.status ? { status: ev.status } : null);
        const userRegistration = embedded
          ? {
              status:
                embedded.status ||
                embedded.registration_status ||
                "Registered",
            }
          : null;
        const attendanceRow =
          ev.attendanceRow || ev.attendance || ev.my_attendance || null;
        return { ...ev, id: evId, userRegistration, attendanceRow };
      });

      setEvents(normalized);
    } catch (err) {
      console.error("Failed to load events", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [filters, user]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (eventId) => {
    if (!user) return;
    const prevEvents = events;

    setEvents((prev) =>
      prev.map((ev) =>
        String(ev.id) === String(eventId)
          ? { ...ev, userRegistration: { status: "Registered" } }
          : ev
      )
    );

    try {
      const res = await API.post("/registrations/register", {
        event_id: eventId,
      });
      const registration = res.data?.registration || res.data || null;
      if (registration) {
        setEvents((prev) =>
          prev.map((ev) =>
            String(ev.id) === String(eventId)
              ? {
                  ...ev,
                  userRegistration: {
                    status: registration.status || "Registered",
                  },
                  registration,
                }
              : ev
          )
        );
      }
      window.dispatchEvent(
        new CustomEvent("registration:created", {
          detail: {
            eventId,
            registration: registration || { status: "Registered" },
          },
        })
      );
      localStorage.setItem(
        "registration:latest",
        JSON.stringify({
          eventId,
          registration: registration || { status: "Registered" },
          t: Date.now(),
        })
      );
      alert("Registered successfully!");
    } catch (err) {
      console.error("Register failed", err);
      setEvents(prevEvents);
      alert(err.response?.data?.error || err.message || "Registration failed");
    }
  };

  useEffect(() => {
    function onStorage(e) {
      if (e.key !== "registration:latest") return;
      try {
        const payload = JSON.parse(e.newValue);
        if (!payload?.eventId) return;
        const { eventId, registration } = payload;
        setEvents((prev) =>
          prev.map((ev) =>
            String(ev.id) === String(eventId)
              ? {
                  ...ev,
                  userRegistration: {
                    status: registration?.status || "Registered",
                  },
                  registration,
                }
              : ev
          )
        );
      } catch {}
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-sky-50 to-blue-100">
        <h1 className="text-5xl font-extrabold text-blue-700 mb-4">
          Welcome to Eventify
        </h1>
        <p className="text-lg text-gray-700 max-w-xl text-center">
          Please <span className="font-semibold text-blue-600">Login</span> or{" "}
          <span className="font-semibold text-blue-600">Signup</span> to explore
          upcoming campus events and opportunities.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-sky-50">
      <div className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-blue-700 mb-3">
          Campus Events
        </h1>
        <p className="text-gray-600">
          Browse workshops, hackathons, seminars and more
        </p>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <select
            name="college_id"
            value={filters.college_id}
            onChange={handleFilterChange}
            className="border border-blue-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Colleges</option>
            {colleges.map((college) => (
              <option key={college.id} value={college.college_code}>
                {college.college_name}
              </option>
            ))}
          </select>

          <select
            name="event_type"
            value={filters.event_type}
            onChange={handleFilterChange}
            className="border border-blue-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Types</option>
            <option value="Workshop">Workshop</option>
            <option value="Seminar">Seminar</option>
            <option value="Fest">Fest</option>
            <option value="Hackathon">Hackathon</option>
          </select>

          {/* <select
            name="sem"
            value={filters.sem}
            onChange={handleFilterChange}
            className="border border-blue-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">All Semesters</option>
            {[...Array(8).keys()].map((i) => (
              <option key={i + 1} value={i + 1}>
                Semester {i + 1}
              </option>
            ))}
          </select> */}

          <select
            name="sortBy"
            value={filters.sortBy}
            onChange={handleFilterChange}
            className="border border-blue-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Sort By</option>
            <option value="popularity">Popularity</option>
            <option value="date">Date</option>
            <option value="sem">Semester</option>
          </select>
        </div>
      </div>

      {/* Event Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6 pb-12">
        {loading && (
          <p className="col-span-full text-center text-blue-600 font-medium">
            Loading events...
          </p>
        )}
        {!loading && events.length === 0 && (
          <p className="col-span-full text-center text-gray-500">
            No events found.
          </p>
        )}
        {!loading &&
          events.map((e) => (
            <EventCard
              key={e.id}
              event={e}
              collegeNameMap={collegeMap}
              userRegistration={e.userRegistration}
              attendanceStatus={
                (e.attendanceRow && e.attendanceRow.status) || null
              }
              onRegister={() => handleRegister(e.id)}
            />
          ))}
      </div>
    </div>
  );
}
