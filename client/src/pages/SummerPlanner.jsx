import { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const MONTHS = ['Jun', 'Jul', 'Aug'];

const HEARTED_EVENTS = [
  { id: 'evt-1', name: 'Art Adventures Camp', provider: 'The Art Garage', date: '2026-07-14', time: '9:00 AM', age: '7-10', price: '$300', color: 'bg-pink-100 border-pink-300 text-pink-800', hearted: true },
  { id: 'evt-2', name: 'Musical Theatre Week', provider: 'ZACH Theatre', date: '2026-07-15', time: '10:00 AM', age: '6-9', price: '$275', color: 'bg-purple-100 border-purple-300 text-purple-800', hearted: true },
  { id: 'evt-3', name: 'Coding with Python', provider: 'Neuron Garage', date: '2026-07-16', time: '1:00 PM', age: '8-12', price: '$425', color: 'bg-blue-100 border-blue-300 text-blue-800', hearted: true },
  { id: 'evt-4', name: 'Soccer Clinic Week 2', provider: 'South Austin Soccer', date: '2026-07-08', time: '8:30 AM', age: '5-7', price: '$180', color: 'bg-green-100 border-green-300 text-green-800', hearted: true },
  { id: 'evt-5', name: 'Robotics Build Camp', provider: 'Code Galaxy', date: '2026-07-22', time: '9:30 AM', age: '9-14', price: '$500', color: 'bg-cyan-100 border-cyan-300 text-cyan-800', hearted: true },
  { id: 'evt-6', name: 'Pottery & Sculpture', provider: 'The Art Garage', date: '2026-07-23', time: '10:30 AM', age: '8-13', price: '$320', color: 'bg-amber-100 border-amber-300 text-amber-800', hearted: true },
  { id: 'evt-7', name: 'Nature Explorers', provider: 'Wildflower Center', date: '2026-07-09', time: '9:00 AM', age: '5-10', price: '$200', color: 'bg-emerald-100 border-emerald-300 text-emerald-800', hearted: true },
  { id: 'evt-8', name: 'Dance Fusion Camp', provider: 'Ballet Austin', date: '2026-07-29', time: '11:00 AM', age: '6-12', price: '$350', color: 'bg-rose-100 border-rose-300 text-rose-800', hearted: true },
];

function getWeekId(dateStr) {
  const d = new Date(dateStr);
  const start = new Date(d.getFullYear(), 0, 1);
  const weekNum = Math.ceil((((d - start) / 86400000) + start.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function getWeekLabel(dateStrs) {
  const dates = dateStrs.map(d => new Date(d)).sort((a, b) => a - b);
  if (dates.length === 0) return '';
  const first = dates[0];
  const last = dates[dates.length - 1];
  const fmt = (d) => `${MONTHS[d.getMonth() - 5]} ${d.getDate()}`;
  return `${fmt(first)} — ${fmt(last)}`;
}

function groupByWeek(events) {
  const groups = {};
  events.forEach(evt => {
    const weekId = getWeekId(evt.date);
    if (!groups[weekId]) groups[weekId] = [];
    groups[weekId].push(evt);
  });
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

export default function SummerPlanner() {
  const [plannerView, setPlannerView] = useState('calendar');
  const [hearted, setHearted] = useState(HEARTED_EVENTS.filter(e => e.hearted));
  const [showPrintCmd, setShowPrintCmd] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const weeks = groupByWeek(hearted);

  const toggleHeart = (evtId) => {
    setHearted(prev =>
      prev.find(e => e.id === evtId)
        ? prev.filter(e => e.id !== evtId)
        : [...prev, ...HEARTED_EVENTS.filter(e => e.id === evtId)]
    );
  };

  const handleExport = () => {
    const lines = hearted.map(e =>
      `${e.date} | ${e.time} | ${e.name} @ ${e.provider} | Ages ${e.age} | ${e.price}`
    ).join('\n');
    const blob = new Blob([lines], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kidcircle-summer-planner.ics';
    a.click();
    URL.revokeObjectURL(url);
    showToast('📅 Calendar file downloaded!');
  };

  const handlePrint = () => {
    setShowPrintCmd(true);
    setTimeout(() => {
      window.print();
      setShowPrintCmd(false);
    }, 100);
  };

  return (
    <div className="px-4 pb-32">
      <SEO
        title="Summer Week Planner"
        description="Plan your Austin summer with KidCircle's weekly camp planner. See hearted events in a calendar layout."
        url="/summer-planner"
      />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium shadow-lg animate-fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="pt-2 mb-4">
        <h1 className="text-xl font-bold text-text mb-0">☀️ Summer Planner</h1>
        <p className="text-xs text-text-light">Your hearted events, organized by week</p>
      </div>

      {/* View switcher */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setPlannerView('calendar')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
            plannerView === 'calendar'
              ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
              : 'bg-gray-50 text-text-light hover:bg-gray-100'
          }`}
        >
          📅 Calendar View
        </button>
        <button
          onClick={() => setPlannerView('list')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
            plannerView === 'list'
              ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
              : 'bg-gray-50 text-text-light hover:bg-gray-100'
          }`}
        >
          📋 List View
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={handleExport}
          disabled={hearted.length === 0}
          className="flex-1 py-2.5 text-sm font-medium text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Export to Calendar
        </button>
        <button
          onClick={handlePrint}
          disabled={hearted.length === 0}
          className="flex-1 py-2.5 text-sm font-medium text-text bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print for Fridge
        </button>
      </div>

      {/* Print command hint */}
      {showPrintCmd && (
        <div className="bg-blue-50 rounded-xl p-3 mb-4 text-xs text-blue-700 text-center">
          🖨️ Your summer planner is opening the print dialog. Hang it on the fridge!
        </div>
      )}

      {hearted.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❤️</span>
          </div>
          <h3 className="text-base font-semibold text-text mb-1">No events saved yet</h3>
          <p className="text-sm text-text-light mb-4">Heart events from the Discover page to build your summer plan.</p>
          <Link to="/providers" className="btn-primary text-sm inline-flex items-center gap-1">
            🔍 Browse Events
          </Link>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-text-light">
              <span className="font-semibold text-text">{hearted.length}</span> events across <span className="font-semibold text-text">{weeks.length}</span> weeks
            </p>
          </div>

          {/* Calendar View */}
          {plannerView === 'calendar' && (
            <div className="space-y-4">
              {weeks.map(([weekId, events]) => (
                <div key={weekId} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setSelectedWeek(selectedWeek === weekId ? null : weekId)}
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-transparent hover:bg-primary/5 transition-colors"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-text">Week of {getWeekLabel(events.map(e => e.date))}</h3>
                      <p className="text-xs text-text-light">{events.length} {events.length === 1 ? 'event' : 'events'}</p>
                    </div>
                    <svg className={`w-4 h-4 text-text-muted transition-transform ${selectedWeek === weekId ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Mini calendar grid for the week */}
                  {(selectedWeek === null || selectedWeek === weekId) && (
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-5 gap-1 mb-2">
                        {WEEKDAYS.map(day => (
                          <div key={day} className="text-[10px] text-text-muted text-center font-medium py-1">{day}</div>
                        ))}
                      </div>
                      <div className="space-y-1.5">
                        {events.sort((a, b) => new Date(a.date) - new Date(b.date)).map(evt => {
                          const d = new Date(evt.date);
                          const dayIdx = (d.getDay() + 6) % 7; // Mon=0, Sun=6
                          return (
                            <div key={evt.id} className={`rounded-xl border px-3 py-2 ${evt.color} flex items-center justify-between`} style={{ marginLeft: `${dayIdx * 20}%` }}>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-semibold truncate">{evt.name}</p>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleHeart(evt.id); }}
                                    className="flex-shrink-0"
                                  >
                                    <span className="text-sm">{hearted.find(e => e.id === evt.id) ? '❤️' : '🤍'}</span>
                                  </button>
                                </div>
                                <p className="text-[10px] opacity-75">{evt.provider} · {evt.time} · Ages {evt.age}</p>
                              </div>
                              <span className="text-xs font-bold ml-2">{evt.price}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {plannerView === 'list' && (
            <div className="space-y-2">
              {hearted.sort((a, b) => new Date(a.date) - new Date(b.date)).map(evt => (
                <div key={evt.id} className={`rounded-xl border px-4 py-3 ${evt.color} flex items-center justify-between`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{evt.name}</p>
                      <button onClick={() => toggleHeart(evt.id)} className="flex-shrink-0">
                        <span className="text-sm">❤️</span>
                      </button>
                    </div>
                    <p className="text-xs opacity-75">{evt.provider}</p>
                    <div className="flex items-center gap-3 text-[10px] opacity-60 mt-1">
                      <span>📅 {evt.date}</span>
                      <span>⏰ {evt.time}</span>
                      <span>👤 Ages {evt.age}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold ml-2">{evt.price}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Pro Tips */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 mt-6 border border-amber-100">
        <h3 className="text-sm font-bold text-text mb-2">☀️ Summer Planning Tips</h3>
        <ul className="text-xs text-text-light space-y-1.5">
          <li>• Heart events from the provider list to save them here</li>
          <li>• Use <strong>Export to Calendar</strong> to sync with your phone</li>
          <li>• <strong>Print for Fridge</strong> creates a handy weekly overview</li>
          <li>• Check the Swap Marketplace for last-minute deals on popular camps</li>
        </ul>
      </div>
    </div>
  );
}