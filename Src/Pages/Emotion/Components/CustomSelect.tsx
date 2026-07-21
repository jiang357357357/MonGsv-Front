import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface SelectOption {
  id: string | number;
  name: string;
}

interface CustomSelectProps {
  label?: string;
  icon?: React.ReactNode;
  value: string | number;
  options: SelectOption[];
  onChange: (value: any) => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
  variant?: 'ghost' | 'filled';
  align?: 'left' | 'right';
  searchable?: boolean;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  icon,
  value,
  options,
  onChange,
  disabled,
  isLoading,
  placeholder,
  className = "",
  variant = 'ghost',
  align = 'left',
  searchable = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside both the container and the dropdown
      const isOutsideContainer = containerRef.current && !containerRef.current.contains(target);
      const isOutsideDropdown = dropdownRef.current && !dropdownRef.current.contains(target);
      
      if (isOutsideContainer && isOutsideDropdown) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate dropdown position when it opens
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const dropdownWidth = Math.max(rect.width, 240);
      setDropdownPosition({
        top: rect.bottom + 12,
        left: align === 'right' ? rect.right - dropdownWidth : rect.left,
        width: dropdownWidth
      });
    }
  }, [isOpen, align]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find(opt => opt.id === value);

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter(opt => opt.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  const variantStyles = variant === 'filled' 
    ? `theme-input hover:border-[var(--color-amber-400)]`
    : `theme-card-soft hover:border-[var(--color-amber-400)] hover:shadow-[var(--shadow-amber)]`;

  return (
    <div className={`relative group ${className}`} ref={containerRef}>
      <div 
        onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
        className={`flex flex-col items-start px-5 py-2.5 rounded-[20px] transition-all duration-300 cursor-pointer border backdrop-blur-md ${
          disabled 
            ? 'theme-button-disabled opacity-50 cursor-not-allowed' 
            : isOpen
              ? 'theme-input border-[var(--color-amber-400)]'
              : variantStyles
        }`}
      >
        {label && (
          <span className="theme-subtitle text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 mb-1">
            {icon && React.cloneElement(icon as React.ReactElement<{ className?: string }>, { 
              className: `w-3 h-3 transition-colors ${isOpen ? 'theme-accent-text' : 'theme-subtitle group-hover:text-[var(--color-amber-500)]'}` 
            })}
            {label}
          </span>
        )}
        <div className="flex items-center justify-between w-full gap-3">
          <span className={`text-sm font-black truncate tracking-tight ${!selectedOption ? 'theme-kicker' : 'theme-title'}`}>
            {isLoading ? '加载中...' : selectedOption ? selectedOption.name : placeholder}
          </span>
          <ChevronDown className={`theme-kicker w-4 h-4 transition-transform duration-500 ${isOpen ? 'rotate-180 !text-[var(--color-gray-900)]' : 'group-hover:!text-[var(--color-gray-900)]'}`} />
        </div>
      </div>

      {/* Dropdown Menu - Rendered via Portal to avoid overflow clipping */}
      {isOpen && !disabled && typeof document !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="theme-dropdown-panel fixed backdrop-blur-xl rounded-[24px] z-[9999] py-3 animate-dropdown"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: '400px'
          }}
        >
          {/* Search Input */}
          {searchable && (
            <div className="px-3 pb-2">
              <div className="theme-input flex items-center gap-2 px-3 py-2 rounded-xl">
                <Search className="theme-kicker w-4 h-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索..."
                  className="theme-title flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-[var(--color-gray-400)]"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
          
          <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-6 py-8 text-[10px] font-black text-[var(--color-gray-300)] uppercase tracking-widest text-center">
                {searchQuery ? '未找到匹配项' : 'NO DATA FOUND'}
              </div>
            ) : (
              <div className="px-2 space-y-1">
                {filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group/opt cursor-pointer ${
                      value === option.id 
                        ? 'theme-button-primary shadow-lg' 
                        : 'theme-subtitle hover:bg-[rgba(255,237,201,0.6)] hover:text-[var(--color-amber-500)]'
                    }`}
                  >
                    <span className="truncate tracking-tight">{option.name}</span>
                    {value === option.id && <Check className="theme-accent-text w-4 h-4" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CustomSelect;
