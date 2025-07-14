"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Settings,
  Menu,
  Clock,
  MapPin,
  Users,
  Calendar,
  Pause,
  Sparkles,
  X,
  Phone,
  Check,
  Trash2,
} from "lucide-react"

// Event type definition
interface Event {
  id: number
  title: string
  startTime: string
  endTime: string
  color: string
  day: number
  description: string
  location: string
  attendees: string[]
  organizer: string
  date?: string // Add date for scheduling
}

// Notification state type
interface NotificationState {
  event: Event | null
  isActive: boolean
  acknowledged: boolean
  showAcknowledgment: boolean
}

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showAIPopup, setShowAIPopup] = useState(false)
  const [typedText, setTypedText] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [selectedDay, setSelectedDay] = useState(1) // Default to Sunday
  const [notificationState, setNotificationState] = useState<NotificationState>({
    event: null,
    isActive: false,
    acknowledged: false,
    showAcknowledgment: false,
  })
  const [events, setEvents] = useState<Event[]>([])
  const [acknowledgedEvents, setAcknowledgedEvents] = useState<Set<number>>(new Set())

  // Audio refs
  const callAudioRef = useRef<HTMLAudioElement>(null)
  const bellAudioRef = useRef<HTMLAudioElement>(null)

  const BOT_TOKEN = '7750981606:AAG5RfYO2RYURoWaEREPkecK4WskrtKtArw';
  const CHAT_ID = '1994924243';

  // localStorage functions
  const loadEventsFromStorage = () => {
    if (typeof window !== 'undefined') {
      const savedEvents = localStorage.getItem('calendar-events');
      if (savedEvents) {
        return JSON.parse(savedEvents);
      }
    }
    return [];
  };

  const saveEventsToStorage = (eventsToSave: Event[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('calendar-events', JSON.stringify(eventsToSave));
    }
  };

  // localStorage functions for acknowledged events
  const loadAcknowledgedEventsFromStorage = () => {
    if (typeof window !== 'undefined') {
      const savedAcknowledged = localStorage.getItem('acknowledged-events');
      if (savedAcknowledged) {
        return new Set(JSON.parse(savedAcknowledged));
      }
    }
    return new Set<number>();
  };

  const saveAcknowledgedEventsToStorage = (acknowledgedSet: Set<number>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('acknowledged-events', JSON.stringify(Array.from(acknowledgedSet)));
    }
  };

  // Telegram notification function
  const sendTelegramNotification = async (message: string) => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        console.error('Failed to send Telegram notification');
      }
    } catch (error) {
      console.error('Error sending Telegram notification:', error);
    }
  };

  // Play sound function
  const playSound = (soundType: 'call' | 'bell') => {
    const audio = soundType === 'call' ? callAudioRef.current : bellAudioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(error => console.error('Error playing sound:', error));
    }
  };

  // Check for upcoming events
  const checkUpcomingEvents = () => {
    console.log("Checking upcoming events", events.length, "events found")
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    events.forEach(event => {
      // Skip if this event has already been acknowledged
      if (acknowledgedEvents.has(event.id)) {
        console.log(`Event ${event.title} (ID: ${event.id}) already acknowledged, skipping`);
        return;
      }

      const [hours, minutes] = event.startTime.split(':').map(Number);
      const eventTime = hours * 60 + minutes;
      const eventDay = event.day; // 1 = Sunday, 2 = Monday, etc.

      console.log(`Event: ${event.title}, Day: ${eventDay}, Current Day: ${currentDay}, Event Time: ${eventTime}, Current Time: ${currentTime}`);

      // Check if event is starting now (within 1 minute)
      // Convert event day to match JavaScript's getDay() format (0 = Sunday)
      const adjustedEventDay = eventDay === 1 ? 0 : eventDay - 1;

      if (adjustedEventDay === currentDay && Math.abs(eventTime - currentTime) <= 1) {
        console.log("Event found______", event)
        triggerEventNotification(event);
      }
    });
  };

  // Trigger event notification
  const triggerEventNotification = (event: Event) => {
    const message = `
🔔 <b>Meeting Reminder</b>

📅 <b>${event.title}</b>
⏰ Time: ${event.startTime} - ${event.endTime}
📍 Location: ${event.location}
👥 Attendees: ${event.attendees.join(', ')}
📝 Description: ${event.description}

Please join your meeting now!
    `;

    // Send Telegram notification
    sendTelegramNotification(message);

    // Set notification state
    setNotificationState({
      event,
      isActive: true,
      acknowledged: false,
      showAcknowledgment: false,
    });

    // Play first sound
    playSound('call');

    // Set timeout for second sound (2 minutes)
    setTimeout(() => {
      setNotificationState(prev => {
        if (!prev.acknowledged) {
          playSound('bell');
          return {
            ...prev,
            showAcknowledgment: true,
          };
        }
        return prev;
      });
    }, 2 * 60 * 1000); // 2 minutes
  };

  // Test notification function
  const testNotification = () => {
    const testEvent: Event = {
      id: 999,
      title: "Test Meeting",
      startTime: "14:00",
      endTime: "15:00",
      color: "bg-red-500",
      day: 1,
      description: "This is a test notification",
      location: "Test Room",
      attendees: ["Test User"],
      organizer: "Test Organizer",
    };
    triggerEventNotification(testEvent);
  };

  // Debug function to create a test event for current time
  const createTestEventForNow = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Convert to your day format (1 = Sunday, 2 = Monday, etc.)
    const adjustedDay = currentDay === 0 ? 1 : currentDay + 1;

    // Create event for 1 minute from now
    const futureMinute = currentMinute + 1;
    const futureHour = futureMinute >= 60 ? currentHour + 1 : currentHour;
    const adjustedMinute = futureMinute >= 60 ? futureMinute - 60 : futureMinute;

    const startTime = `${futureHour.toString().padStart(2, '0')}:${adjustedMinute.toString().padStart(2, '0')}`;
    const endTime = `${futureHour.toString().padStart(2, '0')}:${(adjustedMinute + 30).toString().padStart(2, '0')}`;

    const testEvent: Event = {
      id: Date.now(),
      title: "Test Event for Now",
      startTime,
      endTime,
      color: "bg-green-500",
      day: adjustedDay,
      description: "This event should trigger in 1 minute",
      location: "Test Location",
      attendees: ["You"],
      organizer: "You",
    };

    console.log("Creating test event:", testEvent);
    const updatedEvents = [...events, testEvent];
    setEvents(updatedEvents);
    saveEventsToStorage(updatedEvents);
  };

  // Clear acknowledged events (for testing)
  const clearAcknowledgedEvents = () => {
    setAcknowledgedEvents(new Set());
    saveAcknowledgedEventsToStorage(new Set());
    console.log("Cleared all acknowledged events");
  };

  // Create new event function
  const createNewEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now(), // Use timestamp as unique ID
    };
    const updatedEvents = [...events, newEvent];
    setEvents(updatedEvents);
    saveEventsToStorage(updatedEvents);
    setShowCreateEvent(false);

    // Reset form
    setSelectedDay(1);
    if (typeof window !== 'undefined') {
      const form = document.getElementById('createEventForm') as HTMLFormElement;
      if (form) form.reset();
    }
  };

  // Delete event function
  const deleteEvent = (eventId: number) => {
    const updatedEvents = events.filter(event => event.id !== eventId);
    setEvents(updatedEvents);
    saveEventsToStorage(updatedEvents);
    setSelectedEvent(null);
  };

  // Acknowledge notification
  const acknowledgeNotification = () => {
    // Add the current event to acknowledged events
    if (notificationState.event) {
      const newAcknowledgedEvents = new Set(acknowledgedEvents);
      newAcknowledgedEvents.add(notificationState.event.id);
      setAcknowledgedEvents(newAcknowledgedEvents);
      saveAcknowledgedEventsToStorage(newAcknowledgedEvents);
      console.log(`Event ${notificationState.event.title} (ID: ${notificationState.event.id}) acknowledged and added to tracking`);
    }

    setNotificationState(prev => ({
      ...prev,
      acknowledged: true,
      isActive: false,
      showAcknowledgment: false,
    }));

    // Stop sounds
    if (callAudioRef.current) {
      callAudioRef.current.pause();
      callAudioRef.current.currentTime = 0;
    }
    if (bellAudioRef.current) {
      bellAudioRef.current.pause();
      bellAudioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    setIsLoaded(true)

    // Load events from localStorage
    const savedEvents = loadEventsFromStorage();
    setEvents(savedEvents);

    // Load acknowledged events from localStorage
    const savedAcknowledgedEvents = loadAcknowledgedEventsFromStorage();
    setAcknowledgedEvents(savedAcknowledgedEvents as Set<number>);

    // Show AI popup after 3 seconds
    const popupTimer = setTimeout(() => {
      setShowAIPopup(true)
    }, 3000)

    return () => {
      clearTimeout(popupTimer)
    }
  }, [])

  // Separate useEffect for event checking with proper dependencies
  useEffect(() => {
    // Check for events every minute
    const eventCheckInterval = setInterval(checkUpcomingEvents, 60 * 1000);

    return () => {
      clearInterval(eventCheckInterval)
    }
  }, [events, acknowledgedEvents]) // Add events and acknowledgedEvents as dependencies

  useEffect(() => {
    if (showAIPopup) {
      const text =
        "LLooks like you don't have that many meetings today. Shall I play some Hans Zimmer essentials to help you get into your Flow State?"
      let i = 0
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          setTypedText((prev) => prev + text.charAt(i))
          i++
        } else {
          clearInterval(typingInterval)
        }
      }, 50)

      return () => clearInterval(typingInterval)
    }
  }, [showAIPopup])

  const [currentView, setCurrentView] = useState("week")
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  const handleEventClick = async (event: Event) => {
    console.log(event)
    setSelectedEvent(event)
  }

  // Sample calendar days for the week view
  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    return new Date(firstDayOfWeek.setDate(firstDayOfWeek.getDate() + i)).getDate();
  })
  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 8) // 8 AM to 7 PM

  // Helper function to calculate event position and height
  const calculateEventStyle = (startTime: string, endTime: string) => {
    const start = Number.parseInt(startTime.split(":")[0]) + Number.parseInt(startTime.split(":")[1]) / 60
    const end = Number.parseInt(endTime.split(":")[0]) + Number.parseInt(endTime.split(":")[1]) / 60
    const top = (start - 8) * 80 // 80px per hour
    const height = (end - start) * 80
    return { top: `${top}px`, height: `${height}px` }
  }

  // Helper function to calculate current time position
  const calculateCurrentTimePosition = () => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeInHours = currentHour + currentMinute / 60

    // If current time is before 8 AM, return 0 (top of calendar)
    if (currentTimeInHours < 8) return 0

    // If current time is after 7 PM, return the bottom position
    if (currentTimeInHours >= 19) return 12 * 80 // 12 hours * 80px per hour

    // Calculate position within the visible time range (8 AM to 7 PM)
    const position = (currentTimeInHours - 8) * 80
    return Math.max(0, position)
  }

  // Get current day of week (0 = Sunday, 1 = Monday, etc.)
  const getCurrentDayOfWeek = () => {
    return new Date().getDay() + 1 // Convert to 1-based index to match our day system
  }

  // Sample calendar for mini calendar
  const currentMonthDate = new Date()
  const daysInMonth = new Date(
    currentMonthDate.getFullYear(),
    currentMonthDate.getMonth() + 1,
    0
  ).getDate()
  const firstDayOffset = new Date(
    currentMonthDate.getFullYear(),
    currentMonthDate.getMonth(),
    1
  ).getDay()
  const miniCalendarDays = Array.from({ length: daysInMonth + firstDayOffset }, (_, i) =>
    i < firstDayOffset ? null : i - firstDayOffset + 1,
  )

  const currentDay = new Date().getDate()
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  const currentDate = new Date().toLocaleString('default', { month: 'long', day: 'numeric' })

  // Sample my calendars
  const myCalendars = [
    { name: "My Calendar", color: "bg-blue-500" },
    { name: "Work", color: "bg-green-500" },
    { name: "Personal", color: "bg-purple-500" },
    { name: "Family", color: "bg-orange-500" },
  ]

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    // Here you would typically also control the actual audio playback
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Audio elements */}
      <audio ref={callAudioRef} src="/you-have-a-call.mp3" preload="auto" />
      <audio ref={bellAudioRef} src="/bell-notification.mp3" preload="auto" />

      {/* Background Image */}
      <Image
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
        alt="Beautiful mountain landscape"
        fill
        className="object-cover"
        priority
      />

      {/* Navigation */}
      <header
        className={`absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-6 opacity-0 ${isLoaded ? "animate-fade-in" : ""}`}
        style={{ animationDelay: "0.2s" }}
      >
        <div className="flex items-center gap-4">
          <Menu className="h-6 w-6 text-white" />
          <span className="text-2xl font-semibold text-white drop-shadow-lg">Calendar</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
            <input
              type="text"
              placeholder="Search"
              className="rounded-full bg-white/10 backdrop-blur-sm pl-10 pr-4 py-2 text-white placeholder:text-white/70 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
          <button
            onClick={testNotification}
            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
          >
            Test Notification
          </button>
          <button
            onClick={createTestEventForNow}
            className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
          >
            Create Test Event
          </button>
          <button
            onClick={clearAcknowledgedEvents}
            className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm"
          >
            Clear Ack
          </button>
          <div className="text-white text-xs bg-black/20 px-2 py-1 rounded">
            Events: {events.length} | Ack: {acknowledgedEvents.size}
          </div>
          <Settings className="h-6 w-6 text-white drop-shadow-md" />
          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-md">
            U
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative h-screen w-full pt-20 flex">
        {/* Sidebar */}
        <div
          className={`w-64 h-full bg-white/10 backdrop-blur-lg p-4 shadow-xl border-r border-white/20 rounded-tr-3xl opacity-0 ${isLoaded ? "animate-fade-in" : ""} flex flex-col justify-between`}
          style={{ animationDelay: "0.4s" }}
        >
          <div>
            <button
              className="mb-6 flex items-center justify-center gap-2 rounded-full bg-blue-500 px-4 py-3 text-white w-full"
              onClick={() => setShowCreateEvent(true)}
            >
              <Plus className="h-5 w-5" />
              <span>Create</span>
            </button>

            {/* Mini Calendar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-medium">{currentMonth}</h3>
                <div className="flex gap-1">
                  <button className="p-1 rounded-full hover:bg-white/20">
                    <ChevronLeft className="h-4 w-4 text-white" />
                  </button>
                  <button className="p-1 rounded-full hover:bg-white/20">
                    <ChevronRight className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                  <div key={i} className="text-xs text-white/70 font-medium py-1">
                    {day}
                  </div>
                ))}

                {miniCalendarDays.map((day, i) => (
                  <div
                    key={i}
                    className={`text-xs rounded-full w-7 h-7 flex items-center justify-center ${day === currentDay ? "bg-blue-500 text-white" : "text-white hover:bg-white/20"
                      } ${!day ? "invisible" : ""}`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* My Calendars */}
            <div>
              <h3 className="text-white font-medium mb-3">My calendars</h3>
              <div className="space-y-2">
                {myCalendars.map((cal, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-sm ${cal.color}`}></div>
                    <span className="text-white text-sm">{cal.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New position for the big plus button */}
          <button
            className="mt-6 flex items-center justify-center gap-2 rounded-full bg-blue-500 p-4 text-white w-14 h-14 self-start"
            onClick={() => setShowCreateEvent(true)}
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {/* Calendar View */}
        <div
          className={`flex-1 flex flex-col opacity-0 ${isLoaded ? "animate-fade-in" : ""}`}
          style={{ animationDelay: "0.6s" }}
        >
          {/* Calendar Controls */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 text-white bg-blue-500 rounded-md">Today</button>
              <div className="flex">
                <button className="p-2 text-white hover:bg-white/10 rounded-l-md">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button className="p-2 text-white hover:bg-white/10 rounded-r-md">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-white">{currentDate}</h2>
            </div>

            <div className="flex items-center gap-2 rounded-md p-1">
              <button
                // onClick={() => setCurrentView("day")}
                className={`px-3 py-1 rounded ${currentView === "day" ? "bg-white/20" : ""} text-white text-sm`}
              >
                Day
              </button>
              <button
                onClick={() => setCurrentView("week")}
                className={`px-3 py-1 rounded ${currentView === "week" ? "bg-white/20" : ""} text-white text-sm`}
              >
                Week
              </button>
              <button
                // onClick={() => setCurrentView("month")}
                className={`px-3 py-1 rounded ${currentView === "month" ? "bg-white/20" : ""} text-white text-sm`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Week View */}
          <div className="flex-1 overflow-auto p-4">
            <div className="bg-white/20 backdrop-blur-lg rounded-xl border border-white/20 shadow-xl h-full">
              {/* Week Header */}
              <div className="grid grid-cols-8 border-b border-white/20">
                <div className="p-2 text-center text-white/50 text-xs"></div>
                {weekDays.map((day, i) => (
                  <div key={i} className="p-2 text-center border-l border-white/20">
                    <div className="text-xs text-white/70 font-medium">{day}</div>
                    <div
                      className={`text-lg font-medium mt-1 text-white ${weekDates[i] === currentDay ? "bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center mx-auto" : ""}`}
                    >
                      {weekDates[i]}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className="grid grid-cols-8 relative">
                {/* Time Labels */}
                <div className="text-white/70">
                  {timeSlots.map((time, i) => (
                    <div key={i} className="h-20 border-b border-white/10 pr-2 text-right text-xs">
                      {time > 12 ? `${time - 12} PM` : `${time} AM`}
                    </div>
                  ))}
                </div>

                {/* Days Columns */}
                {Array.from({ length: 7 }).map((_, dayIndex) => (
                  <div key={dayIndex} className="border-l border-white/20 relative">
                    {timeSlots.map((_, timeIndex) => (
                      <div key={timeIndex} className="h-20 border-b border-white/10"></div>
                    ))}

                    {/* Events */}
                    {events
                      .filter((event) => event.day === dayIndex + 1)
                      .map((event, i) => {
                        const eventStyle = calculateEventStyle(event.startTime, event.endTime)
                        return (
                          <div
                            key={i}
                            className={`absolute ${event.color} rounded-md p-2 text-white text-xs shadow-md cursor-pointer transition-all duration-200 ease-in-out hover:translate-y-[-2px] hover:shadow-lg`}
                            style={{
                              ...eventStyle,
                              left: "4px",
                              right: "4px",
                            }}
                            onClick={() => handleEventClick(event)}
                          >
                            <div className="font-medium">{event.title}</div>
                            <div className="opacity-80 text-[10px] mt-1">{`${event.startTime} - ${event.endTime}`}</div>
                          </div>
                        )
                      })}
                  </div>
                ))}

                {/* Current Time Indicator - Red Line */}
                {getCurrentDayOfWeek() >= 1 && getCurrentDayOfWeek() <= 7 && (
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{
                      top: `${calculateCurrentTimePosition()}px`,
                      transform: 'translateY(-1px)' // Center the line
                    }}
                  >
                    <div className="flex items-center">
                      {/* Red dot on the left */}
                      <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg flex-shrink-0"></div>
                      {/* Red line across all columns */}
                      <div className="flex-1 h-0.5 bg-red-500 shadow-sm"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Popup */}
        {showAIPopup && (
          <div className="fixed bottom-8 right-8 z-20">
            <div className="w-[450px] relative bg-gradient-to-br from-blue-400/30 via-blue-500/30 to-blue-600/30 backdrop-blur-lg p-6 rounded-2xl shadow-xl border border-blue-300/30 text-white">
              <button
                onClick={() => setShowAIPopup(false)}
                className="absolute top-2 right-2 text-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-blue-300" />
                </div>
                <div className="min-h-[80px]">
                  <p className="text-base font-light">{typedText}</p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={togglePlay}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors font-medium"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowAIPopup(false)}
                  className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors font-medium"
                >
                  No
                </button>
              </div>
              {isPlaying && (
                <div className="mt-4 flex items-center justify-between">
                  <button
                    className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-white text-sm hover:bg-white/20 transition-colors"
                    onClick={togglePlay}
                  >
                    <Pause className="h-4 w-4" />
                    <span>Pause Hans Zimmer</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Event Notification Popup */}
        {notificationState.isActive && notificationState.event && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${notificationState.event.color} p-6 rounded-lg shadow-xl max-w-md w-full mx-4 text-white`}>
              <div className="flex items-center gap-3 mb-4">
                <Phone className="h-6 w-6" />
                <h3 className="text-2xl font-bold">Meeting Reminder</h3>
              </div>

              <div className="space-y-3">
                <h4 className="text-xl font-semibold">{notificationState.event.title}</h4>
                <p className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  {`${notificationState.event.startTime} - ${notificationState.event.endTime}`}
                </p>
                <p className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  {notificationState.event.location}
                </p>
                <p className="flex items-start">
                  <Users className="mr-2 h-5 w-5 mt-1" />
                  <span>
                    <strong>Attendees:</strong>
                    <br />
                    {notificationState.event.attendees.join(", ")}
                  </span>
                </p>
                <p>
                  <strong>Description:</strong> {notificationState.event.description}
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  className="flex-1 bg-white text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center justify-center gap-2"
                  onClick={acknowledgeNotification}
                >
                  <Check className="h-5 w-5" />
                  Join Meeting
                </button>
                <button
                  className="flex-1 bg-white/20 hover:bg-white/30 px-4 py-3 rounded-lg transition-colors font-medium"
                  onClick={acknowledgeNotification}
                >
                  Dismiss
                </button>
              </div>

              {notificationState.showAcknowledgment && (
                <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                  <p className="text-sm font-medium">
                    ⚠️ You haven't joined the meeting yet. Please acknowledge to stop the reminder.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Event Modal */}
        {showCreateEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-2xl font-bold mb-4 text-gray-800">Create New Event</h3>

              <form id="createEventForm" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                  <input
                    type="text"
                    id="eventTitle"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter event title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
                  <select
                    id="eventDay"
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {weekDays.map((day, index) => (
                      <option key={index} value={index + 1}>
                        {day} ({weekDates[index]})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <input
                      type="time"
                      id="startTime"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <input
                      type="time"
                      id="endTime"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    id="location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter location"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id="description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Enter event description"
                    required
                  />
                </div>
              </form>

              <div className="mt-6 flex gap-3">
                <button
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                  onClick={() => {
                    const title = (document.getElementById('eventTitle') as HTMLInputElement)?.value;
                    const startTime = (document.getElementById('startTime') as HTMLInputElement)?.value;
                    const endTime = (document.getElementById('endTime') as HTMLInputElement)?.value;
                    const location = (document.getElementById('location') as HTMLInputElement)?.value;
                    const description = (document.getElementById('description') as HTMLTextAreaElement)?.value;

                    if (title && startTime && endTime && location && description) {
                      createNewEvent({
                        title,
                        startTime,
                        endTime,
                        location,
                        description,
                        color: "bg-blue-500",
                        day: selectedDay,
                        attendees: ["You"],
                        organizer: "You",
                      });
                    }
                  }}
                >
                  Create Event
                </button>
                <button
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  onClick={() => setShowCreateEvent(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${selectedEvent.color} p-6 rounded-lg shadow-xl max-w-md w-full mx-4`}>
              <h3 className="text-2xl font-bold mb-4 text-white">{selectedEvent.title}</h3>
              <div className="space-y-3 text-white">
                <p className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  {`${selectedEvent.startTime} - ${selectedEvent.endTime}`}
                </p>
                <p className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  {selectedEvent.location}
                </p>
                <p className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  {`${weekDays[selectedEvent.day - 1]}, ${weekDates[selectedEvent.day - 1]} ${currentMonth}`}
                </p>
                <p className="flex items-start">
                  <Users className="mr-2 h-5 w-5 mt-1" />
                  <span>
                    <strong>Attendees:</strong>
                    <br />
                    {selectedEvent.attendees.join(", ") || "No attendees"}
                  </span>
                </p>
                <p>
                  <strong>Organizer:</strong> {selectedEvent.organizer}
                </p>
                <p>
                  <strong>Description:</strong> {selectedEvent.description}
                </p>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors font-medium flex items-center justify-center gap-2"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this event?')) {
                      deleteEvent(selectedEvent.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Event
                </button>
                <button
                  className="flex-1 bg-white text-gray-800 px-4 py-2 rounded hover:bg-gray-100 transition-colors font-medium"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Action Button - Removed */}
      </main>
    </div>
  )
}
