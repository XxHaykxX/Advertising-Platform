"use client";

import { useMemo } from "react";
import { PhoneInput as IntlPhoneInput, defaultCountries } from "react-international-phone";
import "react-international-phone/style.css";
import { cn } from "@/lib/utils";

/** International phone field: a country picker with the flag and dial code
 *  built in, then the national part masked to that country's format. Replaces
 *  the bare <input type="tel"> the application popup and the brand profile
 *  used to have, where the whole "+374 …" had to be typed by hand and any
 *  string at all could be submitted.
 *
 *  ⚠ The library renders flags from a CDN by default (twemoji on cdnjs). We
 *  serve them ourselves from /public/flags (the flag-icons set, copied in at
 *  2026-07-29) — a marketplace form must not depend on a third-party host
 *  being reachable, and it must not announce every visitor to one either. */
const LOCAL_FLAGS = defaultCountries.map((c) => {
  // defaultCountries rows are tuples [name, iso2, dialCode, …]; iso2 is the
  // file name in /public/flags.
  const iso2 = c[1] as string;
  return { iso2, src: `/flags/${iso2}.svg` };
});

export function PhoneInput({
  id,
  value,
  onChange,
  required,
  disabled,
  className,
}: {
  id?: string;
  /** E.164, e.g. "+37499105115" — the shape the server action and the DB
   *  already store. */
  value: string;
  onChange: (e164: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const flags = useMemo(() => LOCAL_FLAGS, []);

  return (
    <div className={cn("igv-phone mt-1.5", className)}>
      <IntlPhoneInput
        // Armenia first: the marketplace's home country, and the country the
        // validation rule (exactly 8 national digits) is written for.
        defaultCountry="am"
        // Where the buyers actually are: without this the list opens on
        // Afghanistan and Armenia is 8 rows down, behind a scroll.
        preferredCountries={["am", "ru", "ge", "us", "gb", "fr", "de", "ae"]}
        value={value}
        // The first argument is the E.164 string ("+37499105115"); the meta
        // object carries the masked one the user sees. We hand the caller the
        // former, so what reaches the DB is never the version with spaces.
        onChange={(phone) => onChange(phone)}
        flags={flags}
        disabled={disabled}
        // Deliberately no `name`: every caller submits the E.164 value through
        // its own hidden field or server action argument, and a second named
        // input would put the masked string into the same FormData key.
        inputProps={{ id, required }}
      />
    </div>
  );
}
