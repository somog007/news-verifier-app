// ThemeSelector.jsx - Dark, Light, and System Theme Switcher
import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check, ChevronDown } from 'lucide-react';

export default function ThemeSelector({ themeMode, onThemeChange, effectiveTheme }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes = [
    { id: 'system', label: 'System', icon: Monitor },
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
  ];

  const currentThemeObj = themes.find(t => t.id === themeMode) || themes[0];
  const CurrentIcon = currentThemeObj.icon;

  return (
    <div className="theme-selector-container" ref={menuRef}>
      <button 
        className="theme-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={`Theme: ${currentThemeObj.label} (${effectiveTheme} active)`}
        aria-label="Toggle theme settings"
      >
        <CurrentIcon size={16} className="theme-btn-icon" />
        <span className="theme-label">{currentThemeObj.label}</span>
        <ChevronDown size={12} className={`theme-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="theme-dropdown-menu">
          <div className="theme-dropdown-header">Theme Mode</div>
          {themes.map((t) => {
            const Icon = t.icon;
            const isSelected = themeMode === t.id;
            return (
              <button
                key={t.id}
                className={`theme-option-btn ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onThemeChange(t.id);
                  setIsOpen(false);
                }}
              >
                <Icon size={15} />
                <span className="option-label">{t.label}</span>
                {isSelected && <Check size={14} className="check-icon" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
