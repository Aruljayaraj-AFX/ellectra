import { useEffect, useState } from "react";

export default function VisitTracker() {
  const [visits, setVisits] = useState(0);

  useEffect(() => {
    const storedVisits = localStorage.getItem("visitCount");
    const newCount = storedVisits ? parseInt(storedVisits) + 1 : 1;

    localStorage.setItem("visitCount", newCount);
    setVisits(newCount);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-3xl font-bold mb-4 text-blue-600">
        👋 Welcome to the Demo Visiting Test
      </h1>
      <p className="text-xl text-gray-700 mb-6">
        You have visited this page <strong>{visits}</strong> time(s).
      </p>
      <button
        onClick={() => {
          localStorage.removeItem("visitCount");
          setVisits(0);
        }}
        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
      >
        Reset Visits
      </button>
    </div>
  );
}
