"use client";

import { useEffect, useState, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";

interface WeekData {
  date: string;
  label: string;
  avg: number;
  count: number;
}

interface Stats {
  goodThisMonth: number;
  replyRate: number;
  avgRating: number;
  beforeAvg: number | null;
}

export default function RatingChart() {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [signupDate, setSignupDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch("/api/analytics/ratings")
      .then((r) => r.json())
      .then((data) => {
        setWeeks(data.weeks ?? []);
        setStats(data.stats ?? null);
        setSignupDate(data.signupDate ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  const ratingChange = stats?.beforeAvg != null && stats.avgRating
    ? (stats.avgRating - stats.beforeAvg).toFixed(1)
    : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-1">Rating Trend</h2>
      <p className="text-xs text-gray-400 mb-5">Past 90 days · Weekly average</p>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.goodThisMonth}</div>
            <div className="text-xs text-green-600 mt-0.5">Good reviews this month</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.replyRate}%</div>
            <div className="text-xs text-blue-600 mt-0.5">Reply rate</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-yellow-700">
              {ratingChange != null ? (
                <span>{Number(ratingChange) >= 0 ? "+" : ""}{ratingChange} ⭐</span>
              ) : (
                <span>{stats.avgRating} ⭐</span>
              )}
            </div>
            <div className="text-xs text-yellow-600 mt-0.5">
              {ratingChange != null ? "Rating change since signup" : "Avg rating"}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading chart...</div>
      ) : weeks.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
          No review data yet. Send your first review request to get started!
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weeks} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              formatter={(value: number) => [`${value} ⭐`, "Avg Rating"]}
              labelFormatter={(label) => `Week of ${label}`}
            />
            {signupDate && (
              <ReferenceLine
                x={weeks.find((w) => w.date >= signupDate)?.label}
                stroke="#6366f1"
                strokeDasharray="4 4"
                label={{ value: "Joined StarLoop", position: "top", fontSize: 10, fill: "#6366f1" }}
              />
            )}
            <Line
              type="monotone"
              dataKey="avg"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#2563eb", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
