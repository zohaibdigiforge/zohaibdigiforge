import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { COUNTRY_PHONE_CODES, CountryPhoneCode } from '../data/countryCodes';

interface PhoneInputWithCountryProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  selectedCountry?: CountryPhoneCode;
  onCountryChange?: (country: CountryPhoneCode) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const PhoneInputWithCountry: React.FC<PhoneInputWithCountryProps> = ({
  id = 'checkout-whatsapp-number',
  value,
  onChange,
  selectedCountry,
  onCountryChange,
  placeholder,
  required = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCountry, setCurrentCountry] = useState<CountryPhoneCode>(
    selectedCountry || COUNTRY_PHONE_CODES[0]
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedCountry) {
      setCurrentCountry(selectedCountry);
    }
  }, [selectedCountry]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredCountries = COUNTRY_PHONE_CODES.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.dialCode.includes(searchQuery) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCountry = (country: CountryPhoneCode) => {
    setCurrentCountry(country);
    if (onCountryChange) {
      onCountryChange(country);
    }
    setIsOpen(false);
  };

  const hasValidLength = value.replace(/[^0-9]/g, '').length >= 7;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative flex items-center">
        {/* Country Selector Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-2 top-1.5 bottom-1.5 flex items-center gap-1.5 px-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-medium text-xs transition-colors cursor-pointer z-10"
        >
          <span className="text-base leading-none">{currentCountry.flag}</span>
          <span className="font-mono text-slate-300 font-semibold">{currentCountry.dialCode}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#22C55E]' : ''}`} />
        </button>

        {/* Input Field */}
        <input
          id={id}
          type="tel"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || currentCountry.placeholder}
          className="w-full min-h-[46px] pl-28 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-mono text-base placeholder:text-slate-500 focus:outline-none focus:border-[#22C55E] focus:ring-1 focus:ring-[#22C55E]/40 transition-all"
        />

        {/* Valid Checkmark */}
        {hasValidLength && (
          <div className="absolute right-3.5 text-[#22C55E] flex items-center pointer-events-none">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Country Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 max-w-[90vw] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box */}
          <div className="p-2.5 border-b border-slate-800 bg-slate-950/60">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search country or code..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>

          {/* Country List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/40 p-1 custom-scrollbar">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c) => {
                const isSelected = c.code === currentCountry.code;
                return (
                  <button
                    key={`${c.code}-${c.dialCode}`}
                    type="button"
                    onClick={() => handleSelectCountry(c)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#22C55E]/15 text-[#22C55E] font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate pr-2">
                      <span className="text-base shrink-0">{c.flag}</span>
                      <span className="truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-mono text-slate-400 text-[11px]">{c.dialCode}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#22C55E]" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
