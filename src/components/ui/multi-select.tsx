"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type MultiSelectOption = { value: string; label: string };

interface MultiSelectProps {
  /** Either plain strings (value === label) or {value,label} pairs. */
  options: string[] | MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  /** When set, a hidden <input type="hidden"> mirrors `value` as a JSON
   *  string[] so the field rides along in a plain <form action> FormData
   *  submit — read server-side with the form's existing jsonArray() helper. */
  name?: string;
  /** Allow adding free-text values not present in `options` (e.g. Studio). */
  allowCustom?: boolean;
  className?: string;
}

function normalizeOptions(options: string[] | MultiSelectOption[]): MultiSelectOption[] {
  return options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
}

/** Searchable multi-select with chips — a lightweight react-select stand-in
 *  (no extra dependency) used for Genre and, later, Countries/Platforms/
 *  Cinemas. Fully controlled: the caller owns `value`/`onChange`. */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  name,
  allowCustom = false,
  className,
}: MultiSelectProps) {
  const normalized = useMemo(() => normalizeOptions(options), [options]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalized;
    return normalized.filter((o) => o.label.toLowerCase().includes(q));
  }, [normalized, query]);

  const exactMatch = useMemo(
    () => normalized.some((o) => o.label.toLowerCase() === query.trim().toLowerCase()),
    [normalized, query]
  );
  const showCustomOption = allowCustom && query.trim().length > 0 && !exactMatch;

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  // Close on outside click — same pattern as CurrencySwitcher/LocaleSwitcher.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open]);

  function labelFor(v: string) {
    return normalized.find((o) => o.value === v)?.label ?? v;
  }

  function toggleValue(v: string) {
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  }

  function removeValue(v: string) {
    onChange(value.filter((x) => x !== v));
  }

  function addCustom(raw: string) {
    const v = raw.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const active = filtered[activeIndex];
      if (open && active) {
        toggleValue(active.value);
        setQuery("");
      } else if (showCustomOption) {
        addCustom(query);
        setQuery("");
      }
    } else if (e.key === "Backspace" && !query && value.length > 0) {
      removeValue(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <div
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
        className="flex min-h-[2.5rem] w-full flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card px-2 py-1.5 text-sm transition-colors focus-within:border-primary"
      >
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-primary"
          >
            {labelFor(v)}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeValue(v);
              }}
              aria-label={`Remove ${labelFor(v)}`}
              className="rounded-full p-0.5 transition-colors hover:bg-primary/20"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          className="min-w-[6rem] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none",
            open && "rotate-180"
          )}
        />
      </div>

      {open && (filtered.length > 0 || showCustomOption) && (
        <ul
          id={listboxId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-border bg-card py-1 shadow-lg shadow-black/10"
        >
          {filtered.map((o, i) => {
            const selected = value.includes(o.value);
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    toggleValue(o.value);
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                    i === activeIndex && "bg-muted",
                    selected ? "font-semibold text-primary" : "text-foreground"
                  )}
                >
                  {o.label}
                  {selected && <Check className="h-4 w-4 shrink-0" />}
                </button>
              </li>
            );
          })}
          {showCustomOption && (
            <li>
              <button
                type="button"
                onClick={() => {
                  addCustom(query);
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-muted"
              >
                Add “{query.trim()}”
              </button>
            </li>
          )}
        </ul>
      )}

      {name && <input type="hidden" name={name} value={JSON.stringify(value)} />}
    </div>
  );
}
