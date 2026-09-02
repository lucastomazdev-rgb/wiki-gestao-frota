import React, { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';

/**
 * Premium Searchable Select Component for consistent filtering UI
 */
export default function SearchableSelect({ placeholder, options, value, onChange, icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const IconComponent = icon;

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const filteredOptions = (options || []).filter(opt => {
    const stringOpt = typeof opt === 'string' ? opt : String(opt || '');
    return stringOpt.toLowerCase().includes((search || '').toLowerCase());
  });

  return (
    <div className="relative group flex-1" ref={wrapperRef}>
      {IconComponent && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
          <IconComponent size={18} className={`transition-colors ${isOpen ? 'text-teal-500' : 'text-slate-400'}`} />
        </div>
      )}
      
      <input 
        type="text" 
        placeholder={value || placeholder}
        className={`w-full bg-white border text-sm rounded-xl ${IconComponent ? 'pl-10' : 'pl-4'} pr-4 py-3 outline-none transition-all shadow-sm cursor-pointer ${
          isOpen ? 'border-teal-500 ring-4 ring-teal-500/10' : 'border-slate-200 group-hover:border-teal-300'
        } ${value ? 'font-bold text-slate-800' : 'text-slate-400 font-medium'}`}
        value={isOpen ? search : (value || '')}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => setSearch(e.target.value)}
        readOnly={!isOpen && !!value}
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl z-[100] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar">
          <div className="p-1.5">
            <button 
              onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
              className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 mb-1"
            >
              Limpar Filtro (Todos)
            </button>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all border border-transparent flex items-center justify-between ${
                    value === opt 
                      ? 'bg-teal-50 text-teal-700 border-teal-100 shadow-sm' 
                      : 'text-slate-700 hover:bg-slate-50 hover:border-slate-100'
                  }`}
                >
                  {opt}
                  {value === opt && <Check size={16} className="text-teal-500" />}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                Nenhum resultado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
