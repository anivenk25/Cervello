'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { XMarkIcon, MagnifyingGlassIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatDate, truncateText } from '@/lib/utils';

export function Sidebar({ 
  isOpen = true, 
  onClose, 
  history = [], 
  onHistoryItemClick,
  className = ''
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHistory, setFilteredHistory] = useState(history);
  const pathname = usePathname();
  
  // Update filtered history when search query or history changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredHistory(history);
      return;
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = history.filter(item => 
      (item.question && item.question.toLowerCase().includes(lowerQuery)) ||
      (item.answer && item.answer.toLowerCase().includes(lowerQuery))
    );
    
    setFilteredHistory(filtered);
  }, [searchQuery, history]);
  
  // Check if current path is active
  const isActivePath = (path) => {
    return pathname === path;
  };
  
  // Group history items by date
  const groupHistoryByDate = () => {
    const groups = {};
    
    filteredHistory.forEach(item => {
      const date = new Date(item.createdAt || item.timestamp || Date.now());
      const dateStr = formatDate(date, 'PP'); // 'PP' = 'Apr 5, 2025'
      
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      
      groups[dateStr].push(item);
    });
    
    return groups;
  };
  
  const historyByDate = groupHistoryByDate();
  
  // Render the mobile sidebar (with overlay)
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={onClose}
          />
        )}
        
        {/* Mobile Sidebar */}
        <aside 
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          } md:hidden`}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-black/[.06] dark:border-white/[.08] flex items-center justify-between">
              <h2 className="text-lg font-semibold">Menu</h2>
              <button 
                onClick={onClose}
                className="p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <SidebarContent 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              historyByDate={historyByDate}
              onHistoryItemClick={(item) => {
                onHistoryItemClick(item);
                onClose();
              }}
              isActivePath={isActivePath}
            />
          </div>
        </aside>
      </>
    );
  }
  
  // Render the desktop sidebar
  return (
    <aside className={`hidden ${className} bg-white dark:bg-gray-800 border-r border-black/[.06] dark:border-white/[.08] overflow-y-auto`}>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-black/[.06] dark:border-white/[.08]">
          <h2 className="text-lg font-semibold mb-1">History</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Your previous Q&A sessions
          </p>
        </div>
        
        <SidebarContent 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          historyByDate={historyByDate}
          onHistoryItemClick={onHistoryItemClick}
          isActivePath={isActivePath}
        />
      </div>
    </aside>
  );
}

// Sidebar content component (used in both mobile and desktop)
function SidebarContent({ 
  searchQuery, 
  setSearchQuery, 
  historyByDate, 
  onHistoryItemClick,
  isActivePath
}) {
  return (
    <>
      {/* Search box */}
      <div className="p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Navigation links */}
      <nav className="px-2 py-2">
        <Link
          href="/qa"
          className={`flex items-center px-3 py-2 rounded-md text-sm ${
            isActivePath('/qa')
              ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          New Question
        </Link>
      </nav>
      
      {/* History section */}
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {Object.keys(historyByDate).length > 0 ? (
          Object.entries(historyByDate).map(([date, items]) => (
            <div key={date} className="mb-6">
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {date}
              </h3>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item._id || item.id}>
                    <button
                      onClick={() => onHistoryItemClick(item)}
                      className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                    >
                      <div className="flex items-start space-x-2">
                        <ClockIcon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            {truncateText(item.question, 60)}
                          </p>
                          {item.answer && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {truncateText(item.answer, 80)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No matching history found.' : 'No history yet.'}
          </div>
        )}
      </div>
    </>
  );
}