'use client';

interface PulseItem {
  id: string;
  avatar: string;
  avatarGradient: string;
  status: 'online' | 'idle' | 'offline';
  name: string;
  task: string;
}

interface TeamPulseProps {
  items: PulseItem[];
}

const STATUS_DOT_CLASS: Record<string, string> = {
  online:  'bg-[#06b47e]',
  idle:    'bg-[#f9a825]',
  offline: 'bg-[#bbb]',
};

export default function TeamPulse({ items }: TeamPulseProps) {
  const handleNudge = (name: string) => {
    alert(`📩 Nudge sent to ${name}!`);
  };

  return (
    <div className="bg-white rounded-[14px] border border-[#e8ecf0] shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8ecf0]">
        <div className="text-[15px] font-bold text-[#1a1a2e]">💚 Team Pulse</div>
        <a href="#" className="text-[12px] text-[#4361ee] font-semibold hover:underline">
          All members
        </a>
      </div>

      {/* Card Body */}
      <div className="px-5 py-4">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-center gap-2.5 py-2.5 ${
              idx < items.length - 1 ? 'border-b border-[#e8ecf0]' : ''
            }`}
          >
            {/* Pulse Avatar */}
            <div className="relative w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0" style={{ background: item.avatarGradient }}>
              {item.avatar}
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                  STATUS_DOT_CLASS[item.status]
                }`}
              />
            </div>

            {/* Pulse Info */}
            <div className="flex-1 overflow-hidden">
              <div className="text-[13px] font-semibold text-[#1a1a2e]">{item.name}</div>
              <div className="text-[11.5px] text-[#7a828c] whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                {item.task}
              </div>
            </div>

            {/* Nudge Button */}
            <button
              onClick={() => handleNudge(item.name)}
              className="text-[11px] font-semibold px-2.5 py-1 border border-[#e8ecf0] rounded-md bg-white text-[#7a828c] hover:border-[#4361ee] hover:text-[#4361ee] hover:bg-[#eff5ff] transition-all whitespace-nowrap"
            >
              Nudge
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
