import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, MapPin, Users, Bell, ChevronLeft, ChevronRight, Twitch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const events = [
  {
    id: 1,
    title: "Sunday Bonus Hunt",
    type: "Stream",
    date: "2024-12-22",
    time: "20:00 CET",
    description: "Join us for our weekly bonus hunt! Multiple slots, big potential.",
    platform: "Twitch",
    expectedViewers: "10K+",
    recurring: true,
  },
  {
    id: 2,
    title: "Christmas Eve Special",
    type: "Special Event",
    date: "2024-12-24",
    time: "18:00 CET",
    description: "Special Christmas stream with exclusive giveaways and bonus drops!",
    platform: "Twitch",
    expectedViewers: "25K+",
    recurring: false,
    featured: true,
  },
  {
    id: 3,
    title: "High Roller Monday",
    type: "Stream",
    date: "2024-12-23",
    time: "22:00 CET",
    description: "High stakes session with bets up to $1000 per spin.",
    platform: "Twitch",
    expectedViewers: "8K+",
    recurring: true,
  },
  {
    id: 4,
    title: "New Year's Mega Stream",
    type: "Special Event",
    date: "2024-12-31",
    time: "20:00 CET",
    description: "12-hour marathon stream to ring in the new year! Massive giveaways all night.",
    platform: "Twitch",
    expectedViewers: "50K+",
    recurring: false,
    featured: true,
  },
  {
    id: 5,
    title: "Community GTW Session",
    type: "Community",
    date: "2024-12-25",
    time: "19:00 CET",
    description: "Guess The Win community event with double points!",
    platform: "Twitch",
    expectedViewers: "15K+",
    recurring: false,
  },
];

const eventTypes = {
  Stream: "bg-primary/20 text-primary",
  "Special Event": "bg-accent/20 text-accent",
  Community: "bg-green-500/20 text-green-500",
};

export default function Events() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 11)); // December 2024

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString("default", { month: "long", year: "numeric" });

  const getEventsForDay = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date === dateStr);
  };

  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen py-8 px-6">
      <div className="container mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Event <span className="gradient-text">Calendar</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Don't miss our streams, bonus hunts, and special events
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="glass rounded-2xl p-6">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold">{monthName}</h2>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  const dayEvents = getEventsForDay(day);
                  const isToday = day === new Date().getDate() && 
                    currentMonth.getMonth() === new Date().getMonth() &&
                    currentMonth.getFullYear() === new Date().getFullYear();

                  return (
                    <div
                      key={index}
                      className={`min-h-[80px] p-2 rounded-lg border transition-colors ${
                        day
                          ? isToday
                            ? "border-primary bg-primary/10"
                            : dayEvents.length > 0
                            ? "border-accent/50 bg-accent/5"
                            : "border-border hover:border-primary/30"
                          : "border-transparent"
                      }`}
                    >
                      {day && (
                        <>
                          <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>
                            {day}
                          </span>
                          <div className="mt-1 space-y-1">
                            {dayEvents.slice(0, 2).map((event) => (
                              <div
                                key={event.id}
                                className={`text-xs px-1.5 py-0.5 rounded truncate ${
                                  eventTypes[event.type as keyof typeof eventTypes]
                                }`}
                              >
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <span className="text-xs text-muted-foreground">
                                +{dayEvents.length - 2} more
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Upcoming Events */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-xl border ${
                      event.featured
                        ? "border-accent/50 bg-accent/5"
                        : "border-border hover:border-primary/30"
                    } transition-colors`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        eventTypes[event.type as keyof typeof eventTypes]
                      }`}>
                        {event.type}
                      </span>
                      {event.featured && (
                        <span className="text-xs text-accent font-medium">Featured</span>
                      )}
                    </div>
                    <h3 className="font-semibold mb-2">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(event.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        {event.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {event.expectedViewers}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <Button variant="glow" className="w-full gap-2">
                  <Bell className="w-4 h-4" />
                  Enable Notifications
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-wrap gap-4"
        >
          {Object.entries(eventTypes).map(([type, classes]) => (
            <div key={type} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${classes.replace("text-", "bg-").split(" ")[0]}`} />
              <span className="text-sm text-muted-foreground">{type}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
