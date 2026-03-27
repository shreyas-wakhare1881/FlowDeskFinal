'use client';

interface FeedItem {
  id: string;
  icon: string;
  iconBg: 'green' | 'blue' | 'orange' | 'red';
  title: string;
  subtitle: string;
  time: string;
}

interface ActivityFeedProps {
  items: FeedItem[];
}

const ICON_BG_CLASS: Record<string, string> = {
  green:  'bg-[#e8fdf6]',
  blue:   'bg-[#eff5ff]',
  orange: 'bg-[#fff8e1]',
  red:    'bg-[#fff0f2]',
};

export default function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-[14px] border border-[#e8ecf0] shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8ecf0]">
        <div className="text-[15px] font-bold text-[#1a1a2e]">
          📰 Catch-Up Feed{' '}
          <span className="text-[12px] font-normal text-[#7a828c] ml-1.5">Since your last visit</span>
        </div>
        <a href="#" className="text-[12px] text-[#4361ee] font-semibold hover:underline">
          See all
        </a>
      </div>

      {/* Card Body */}
      <div className="px-5 py-4">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-start gap-3 py-3 ${
              idx < items.length - 1 ? 'border-b border-[#e8ecf0]' : 'pb-0'
            }`}
          >
            {/* Icon Wrap */}
            <div
              className={`w-9 h-9 rounded-[9px] flex items-center justify-center text-base flex-shrink-0 ${
                ICON_BG_CLASS[item.iconBg]
              }`}
            >
              {item.icon}
            </div>

            {/* Feed Text */}
            <div className="flex-1">
              <strong className="text-[13.5px] font-semibold text-[#1a1a2e] block mb-0.5">
                {item.title}
              </strong>
              <span className="text-[12px] text-[#7a828c]">{item.subtitle}</span>
            </div>

            {/* Time */}
            <span className="text-[11px] text-[#a0a8b1] whitespace-nowrap">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
