'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import WsSidebar from '@/components/workspace/WsSidebar';
import WsTopbar from '@/components/workspace/WsTopbar';

type ThreadView = 'cards' | 'table';

interface Thread {
  id: number;
  title: string;
  author: string;
  authorAvatar: string;
  authorColor: string;
  time: string;
  preview: string;
  replies: number;
  status: 'active' | 'archived';
  pinned: boolean;
  isDecision: boolean;
}

interface ChatMessage {
  author: string;
  avatar: string;
  avatarColor: string;
  text: string;
  time: string;
  reactions: string[];
  isMe?: boolean;
}

interface CheckIn {
  name: string;
  avatar: string;
  color: string;
  status: 'replied' | 'pending';
}

const initialThreads: Thread[] = [
  { id: 1, title: 'UI/UX Design Decisions', author: 'Sarah Johnson', authorAvatar: 'SJ', authorColor: '#ef233c', time: '2 hours ago', preview: 'We need to finalize the color scheme for the dashboard. I\'m thinking primary blue with accent purple.', replies: 8, status: 'active', pinned: true, isDecision: true },
  { id: 2, title: 'Sprint Planning – Week 12', author: 'Michael Chen', authorAvatar: 'MC', authorColor: '#f9a825', time: '5 hours ago', preview: 'Let\'s discuss the tasks for next week. I think we should focus on API integration.', replies: 12, status: 'active', pinned: false, isDecision: false },
  { id: 3, title: 'Bug Report: Login Authentication', author: 'Emily Davis', authorAvatar: 'ED', authorColor: '#06d6a0', time: '1 day ago', preview: 'Users are reporting issues with login timeout. We need to investigate.', replies: 5, status: 'active', pinned: false, isDecision: false },
  { id: 4, title: 'Team Outing Ideas', author: 'James Wilson', authorAvatar: 'JW', authorColor: '#7209b7', time: '2 days ago', preview: 'How about we plan a team lunch next Friday? Any suggestions for restaurants?', replies: 15, status: 'archived', pinned: false, isDecision: false },
];

const initialMessages: ChatMessage[] = [
  { author: 'Sarah', avatar: 'SJ', avatarColor: '#ef233c', text: 'Hey team! Good morning 🌅', time: '9:30 AM', reactions: ['👍 3', '☕ 2'] },
  { author: 'Michael', avatar: 'MC', avatarColor: '#f9a825', text: 'Morning! Ready for the stand-up?', time: '9:32 AM', reactions: ['✅ 2'] },
  { author: 'Emily', avatar: 'ED', avatarColor: '#06d6a0', text: 'Yes! I\'ve completed the dashboard updates.', time: '9:35 AM', reactions: ['🎉 4', '🔥 2'] },
];

const checkIns: CheckIn[] = [
  { name: 'Sarah Johnson', avatar: 'SJ', color: '#ef233c', status: 'replied' },
  { name: 'Michael Chen', avatar: 'MC', color: '#f9a825', status: 'replied' },
  { name: 'Emily Davis', avatar: 'ED', color: '#06d6a0', status: 'replied' },
  { name: 'James Wilson', avatar: 'JW', color: '#7209b7', status: 'pending' },
  { name: 'Jessica Brown', avatar: 'JB', color: '#3a86ff', status: 'replied' },
  { name: 'David Lee', avatar: 'DL', color: '#ff6b35', status: 'pending' },
];

const announcements = [
  { icon: '🎉', title: 'Holiday Notice', text: 'Monday is a public holiday. Office will be closed.' },
  { icon: '🚀', title: 'New Feature Released', text: 'The new task automation feature is now live in production!' },
];

// ─── Threads ──────────────────────────────────────────────────────────────────

function WsThreads({ threads, threadView, setThreadView }: {
  threads: Thread[];
  threadView: ThreadView;
  setThreadView: (v: ThreadView) => void;
}) {
  const [toast, setToast] = useState('');

  function openThread(t: Thread) {
    setToast(`📖 Opening: "${t.title}"`);
    setTimeout(() => setToast(''), 2500);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">💬 Message Board</h3>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-50 rounded-lg p-0.5 border border-slate-200 gap-0.5">
            <button onClick={() => setThreadView('cards')} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${threadView === 'cards' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Cards</button>
            <button onClick={() => setThreadView('table')} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${threadView === 'table' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>Table</button>
          </div>
          <button className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            + New Thread
          </button>
        </div>
      </div>

      {threadView === 'cards' ? (
        <div className="space-y-3">
          {threads.map((t) => (
            <div
              key={t.id}
              onClick={() => openThread(t)}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-blue-200 hover:shadow-md ${t.pinned ? 'border-blue-200 bg-blue-50' : 'border-slate-100 bg-slate-50'}`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                  {t.pinned ? '📌' : '💬'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900 truncate">
                      {t.pinned && <span className="text-blue-600 mr-1">📌</span>}
                      {t.title}
                    </span>
                    {t.isDecision && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full">📌 Decision</span>}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {t.status === 'active' ? '🟢 Active' : '📦 Archived'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mb-1">{t.preview}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>By {t.author} • {t.time}</span>
                    <span>{t.replies} replies</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {['Thread', 'Author', 'Status', 'Replies', 'Time'].map((h) => (
                <th key={h} className="py-2 text-left text-xs text-slate-500 font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {threads.map((t) => (
              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => openThread(t)}>
                <td className="py-2 text-xs font-semibold text-slate-900 max-w-[180px] truncate">{t.pinned ? '📌 ' : ''}{t.title}</td>
                <td className="py-2 text-xs text-slate-600">{t.author}</td>
                <td className="py-2"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${t.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{t.status}</span></td>
                <td className="py-2 text-xs text-blue-600 font-bold">{t.replies}</td>
                <td className="py-2 text-[10px] text-slate-400">{t.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {toast && (
        <div className="mt-3 bg-slate-800 text-white text-xs font-medium px-3 py-2 rounded-lg animate-fadeIn">{toast}</div>
      )}
    </div>
  );
}

// ─── Campfire Chat ────────────────────────────────────────────────────────────

function WsCampfireChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMessage() {
    const text = inputText.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { author: 'You', avatar: 'SW', avatarColor: '#4361ee', text, time: 'Just now', reactions: [], isMe: true },
    ]);
    setInputText('');
  }

  function addReaction(msgIdx: number, emoji: string) {
    setMessages((prev) =>
      prev.map((m, i) =>
        i === msgIdx
          ? { ...m, reactions: [...m.reactions, `${emoji} 1`] }
          : m
      )
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">🔥 Campfire Chat</h3>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-slate-500">{messages.length} messages</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[280px]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: msg.avatarColor }}
            >
              {msg.avatar}
            </div>
            <div className={`max-w-[75%] ${msg.isMe ? 'items-end' : ''} flex flex-col`}>
              <div className={`flex items-center gap-2 mb-1 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                <span className="text-xs font-bold text-slate-800">{msg.author}</span>
                <span className="text-[10px] text-slate-400">{msg.time}</span>
              </div>
              <div className={`px-3 py-2 rounded-xl text-xs text-slate-800 ${msg.isMe ? 'bg-blue-100 rounded-tr-none' : 'bg-slate-100 rounded-tl-none'}`}>
                {msg.text}
              </div>
              {msg.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {msg.reactions.map((r, j) => (
                    <button
                      key={j}
                      onClick={() => addReaction(i, r.split(' ')[0])}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded-full text-slate-600 transition-colors"
                    >
                      {r}
                    </button>
                  ))}
                  <button
                    onClick={() => addReaction(i, '👍')}
                    className="text-[10px] bg-slate-100 hover:bg-blue-100 px-1.5 py-0.5 rounded-full text-slate-500 transition-colors"
                  >
                    ➕
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
        <button className="text-slate-400 hover:text-yellow-500 transition-colors text-lg">😊</button>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 bg-slate-50 border-0 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          onClick={sendMessage}
          className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white text-sm hover:bg-blue-700 transition-colors"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WsDiscussionsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [threadView, setThreadView] = useState<ThreadView>('cards');

  const repliedCount = checkIns.filter((c) => c.status === 'replied').length;
  const checkInPct = Math.round((repliedCount / checkIns.length) * 100);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <WsSidebar projectId={projectId} projectName={projectId} />

      <div className="flex-1 flex flex-col overflow-hidden ml-[220px]">
        <WsTopbar
          title="Discussions"
          subtitle="Team communication"
          projectId={projectId}
          extraAction={
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-blue-300 transition-colors">
              🎤 Audio Huddle
            </button>
          }
        />

        <main className="flex-1 overflow-auto pt-6 px-8 pb-8">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column (2/3 width) */}
            <div className="col-span-2 space-y-5">
              {/* Announcements */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">📢 Announcements</h3>
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div key={a.title} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xl">{a.icon}</span>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{a.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{a.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Threads */}
              <WsThreads
                threads={initialThreads}
                threadView={threadView}
                setThreadView={setThreadView}
              />

              {/* Daily Check-ins */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">📋 Daily Check-ins</h3>
                  <span className="text-xs text-slate-500">{repliedCount}/{checkIns.length} replied</span>
                </div>
                {/* Progress Bar */}
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-700"
                    style={{ width: `${checkInPct}%` }}
                  />
                </div>
                <div className="space-y-2">
                  {checkIns.map((c) => (
                    <div key={c.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: c.color }}
                        >
                          {c.avatar}
                        </div>
                        <span className="text-xs font-medium text-slate-800">{c.name}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {c.status === 'replied' ? '✅ Replied' : '⏳ Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column (1/3 width) */}
            <div className="space-y-5">
              <WsCampfireChat />

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">⚡ Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-300 transition-all text-left">
                    <span className="text-xl">🎤</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Start Audio Huddle</div>
                      <div className="text-[10px] text-slate-500">Quick voice meeting</div>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-100 hover:border-green-300 transition-all text-left">
                    <span className="text-xl">✅</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Convert to Task</div>
                      <div className="text-[10px] text-slate-500">Turn message into task</div>
                    </div>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100 hover:border-purple-300 transition-all text-left">
                    <span className="text-xl">📌</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Pin Announcement</div>
                      <div className="text-[10px] text-slate-500">Add team announcement</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
