'use client';

import * as React from 'react';

import { renameIndustry, toggleArchiveIndustry } from './_actions';

interface Props {
  id: string;
  name: string;
  archived: boolean;
}

export function IndustryRowControls({ id, name, archived }: Props) {
  const [editing, setEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {editing ? (
        <form
          action={renameIndustry}
          onSubmit={() => setEditing(false)}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="id" value={id} />
          <input
            ref={inputRef}
            type="text"
            name="name"
            defaultValue={name}
            required
            className="rounded border border-border-subtle bg-background px-2 py-1 text-body text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          <button
            type="submit"
            className="text-caption text-accent underline-offset-4 hover:underline"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-caption text-tertiary underline-offset-4 hover:underline"
          >
            Cancel
          </button>
        </form>
      ) : (
        <>
          <span
            className={`text-body ${archived ? 'text-tertiary line-through' : 'text-primary'}`}
          >
            {name}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-caption text-secondary underline-offset-4 hover:text-primary hover:underline"
          >
            Rename
          </button>
          <form action={toggleArchiveIndustry} className="contents">
            <input type="hidden" name="id" value={id} />
            <button
              type="submit"
              className="text-caption text-secondary underline-offset-4 hover:text-primary hover:underline"
            >
              {archived ? 'Restore' : 'Archive'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
