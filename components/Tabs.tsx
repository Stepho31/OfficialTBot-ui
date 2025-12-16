import { ReactNode } from 'react';

type Tab = {
  id: string;
  label: string;
  content: ReactNode;
};

type TabsProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
};

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div>
      <div className="tabs-header" style={{ 
        display: 'flex', 
        gap: 8, 
        borderBottom: '1px solid var(--border)',
        marginBottom: 24
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={activeTab === tab.id ? 'tab-active' : 'tab-inactive'}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 600 : 400,
              fontSize: '0.95rem',
              transition: 'all 0.2s',
              position: 'relative',
              bottom: '-1px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
}








