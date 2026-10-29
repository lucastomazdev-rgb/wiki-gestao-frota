import React, { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';

/**
 * Premium Searchable Select Component for consistent filtering UI
 * Supports single selection (default) and multi-selection with checkboxes (multiple = true)
 */
export default function SearchableSelect({
  placeholder,
  options,
  value,
  onChange,
  icon,
  multiple = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const IconComponent = icon;

  const selectedValues = multiple
    ? (Array.isArray(value) ? value : (value ? [value] : []))
    : [];

  const hasValue = multiple ? selectedValues.length > 0 : Boolean(value);

  const displayText = multiple
    ? (selectedValues.length === 1
      ? selectedValues[0]
      : selectedValues.length > 1
        ? `${selectedValues.length} selecionados (${selectedValues.join(', ')})`
        : '')
    : (value || '');

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

  const handleClear = (e) => {
    if (e) e.stopPropagation();
    onChange(multiple ? [] : '');
    setIsOpen(false);
    setSearch('');
  };

  const handleSelectOption = (opt) => {
    if (multiple) {
      const exists = selectedValues.includes(opt);
      const next = exists
        ? selectedValues.filter((item) => item !== opt)
        : [...selectedValues, opt];
      onChange(next);
    } else {
      onChange(opt);
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div className="relative group flex-1" ref={wrapperRef}>
      {IconComponent && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
          <IconComponent size={18} className={`transition-colors ${isOpen || hasValue ? 'text-teal-500' : 'text-slate-400'}`} />
        </div>
      )}
      
      <input 
        type="text" 
        placeholder={displayText || placeholder}
        title={multiple && selectedValues.length > 0 ? selectedValues.join(', ') : undefined}
        className={`w-full bg-white border text-sm rounded-xl ${IconComponent ? 'pl-10' : 'pl-4'} ${hasValue ? 'pr-8' : 'pr-4'} py-3 outline-none transition-all shadow-sm cursor-pointer truncate ${
          isOpen ? 'border-teal-500 ring-4 ring-teal-500/10' : 'border-slate-200 group-hover:border-teal-300'
        } ${hasValue ? 'font-bold text-slate-800 placeholder:text-slate-800 placeholder:font-bold' : 'text-slate-400 font-medium'}`}
        value={isOpen ? search : displayText}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        onChange={(e) => setSearch(e.target.value)}
        readOnly={!isOpen && hasValue}
      />

      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-rose-500 transition-colors cursor-pointer z-10"
          title="Limpar seleção"
          aria-label="Limpar seleção"
        >
          <X size={14} />
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl z-[100] max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200 custom-scrollbar">
          <div className="p-1.5 space-y-0.5">
            <button
              type="button"
              onClick={() => handleClear()}
              className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 mb-1 cursor-pointer flex items-center justify-between"
            >
              <span>Limpar Filtro (Todos)</span>
              {multiple && selectedValues.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-black tracking-normal">
                  {selectedValues.length}
                </span>
              )}
            </button>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const isSelected = multiple ? selectedValues.includes(opt) : value === opt;
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all border flex items-center justify-between gap-2.5 cursor-pointer ${
                      isSelected 
                        ? 'bg-teal-50 text-teal-700 border-teal-200/80 shadow-2xs' 
                        : 'text-slate-700 border-transparent hover:bg-slate-50 hover:border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {multiple && (
                        <span
                          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? 'bg-teal-600 border-teal-600 text-white shadow-2xs'
                              : 'bg-white border-slate-300 text-transparent'
                          }`}
                        >
                          <Check size={11} strokeWidth={3.5} />
                        </span>
                      )}
                      <span className="truncate">{opt}</span>
                    </div>
                    {!multiple && isSelected && <Check size={16} className="text-teal-500 shrink-0" />}
                  </button>
                );
              })
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
