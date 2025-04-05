'use client';

import { useState, useEffect, useRef } from 'react';
import { PaperClipIcon, XMarkIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';

export default function QueryForm({ 
  onSubmit, 
  isLoading, 
  placeholder = "Ask something...", 
  initialValue = "", 
  autoFocus = true 
}) {
  const [question, setQuestion] = useState(initialValue || '');
  const [attachments, setAttachments] = useState([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const attachMenuRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [question]);
  
  // Set focus on component mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setShowAttachMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((question.trim() || attachments.length > 0) && !isLoading) {
      onSubmit(question, attachments);
      setQuestion('');
      setAttachments([]);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Handle submit with Cmd/Ctrl + Enter
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const newAttachments = files.map(file => ({
      id: generateId(),
      file,
      type: file.type.startsWith('image/') ? 'image' : 'document',
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file)
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Hide attach menu
    setShowAttachMenu(false);
  };

  // Remove an attachment
  const handleRemoveAttachment = (id) => {
    setAttachments(prev => {
      const filtered = prev.filter(item => item.id !== id);
      
      // Revoke object URLs to prevent memory leaks
      const removed = prev.find(item => item.id === id);
      if (removed?.url) {
        URL.revokeObjectURL(removed.url);
      }
      
      return filtered;
    });
  };

  // Generate a random ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="bg-[#111827] rounded-xl shadow-lg shadow-[#3b82f6]/5 border border-[#2d3748] p-3">
        {/* Attachments display */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map(file => (
              <div 
                key={file.id} 
                className="relative group flex items-center bg-[#1e293b] rounded-lg p-2 pr-8 border border-[#2d3748]"
              >
                {file.type === 'image' ? (
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded overflow-hidden mr-2 border border-[#3b82f6]/30">
                      <img src={file.url} alt={file.name} className="h-full w-full object-cover" />
                    </div>
                    <span className="text-xs truncate max-w-[120px] text-white/90">{file.name}</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <DocumentIcon className="h-6 w-6 mr-2 text-[#3b82f6]" />
                    <div className="flex flex-col">
                      <span className="text-xs truncate max-w-[120px] text-white/90">{file.name}</span>
                      <span className="text-xs text-white/60">{formatFileSize(file.size)}</span>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(file.id)}
                  className="absolute right-1 top-1 p-1 rounded-full text-white/60 hover:text-white hover:bg-[#0a0e17]/50"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          className="w-full resize-none border-0 bg-transparent p-2 focus:ring-0 focus:outline-none text-base text-white placeholder-white/40"
          disabled={isLoading}
        />
        
        {/* Bottom toolbar */}
        <div className="flex justify-between items-center pt-2 border-t border-[#2d3748]">
          <div className="flex items-center">
            {/* Attachment button */}
            <div className="relative" ref={attachMenuRef}>
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="p-2 rounded-full text-white/60 hover:text-white hover:bg-[#1e293b] transition-colors"
                aria-label="Attach files"
              >
                <PaperClipIcon className="h-5 w-5" />
              </button>
              
              {/* Attachment menu */}
              {showAttachMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-[#1e293b] rounded-lg shadow-lg shadow-black/20 border border-[#2d3748] p-2 w-48 z-10">
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current.accept = 'image/*';
                      fileInputRef.current.click();
                    }}
                    className="flex items-center w-full p-2 text-left rounded-md hover:bg-[#0a0e17] text-white"
                  >
                    <PhotoIcon className="h-5 w-5 mr-2 text-[#3b82f6]" />
                    <span className="text-sm">Upload image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current.accept = '.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx';
                      fileInputRef.current.click();
                    }}
                    className="flex items-center w-full p-2 text-left rounded-md hover:bg-[#0a0e17] text-white"
                  >
                    <DocumentIcon className="h-5 w-5 mr-2 text-[#3b82f6]" />
                    <span className="text-sm">Upload document</span>
                  </button>
                </div>
              )}
              
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
            </div>
            
            {/* Status text */}
            <div className="ml-2 text-xs text-white/50">
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#3b82f6]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span>
                  Powered by <span className="text-[#3b82f6]">Pathway's RAG</span>
                  <span className="hidden sm:inline ml-1">(Cmd/Ctrl + Enter to submit)</span>
                </span>
              )}
            </div>
          </div>
          
          {/* Submit button */}
          <button
            type="submit"
            disabled={(question.trim() === '' && attachments.length === 0) || isLoading}
            className="rounded-full bg-[#3b82f6] text-white px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2563eb] transition-colors"
            aria-label={isLoading ? 'Asking...' : 'Ask'}
          >
            {isLoading ? 'Asking...' : 'Ask'}
          </button>
        </div>
      </div>
    </form>
  );
}