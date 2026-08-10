import {
  Bus,
  CalendarDays,
  Clapperboard,
  MonitorPlay,
  MoveVertical,
  PanelTop,
  Radio,
  Signpost,
  Tv,
  type LucideIcon,
} from "lucide-react";

/** One icon per AD_CHANNELS code. Lives next to the pages rather than in
 *  src/lib/ad-channels.ts so that module stays pure data — the header imports
 *  it just for the URL list and has no business pulling icons in. */
export const AD_CHANNEL_ICONS: Record<string, LucideIcon> = {
  PLACEMENT: Clapperboard,
  EVENTS: CalendarDays,
  VIDEO: MonitorPlay,
  RADIO: Radio,
  TV: Tv,
  BANNER: PanelTop,
  BILLBOARD: Signpost,
  LIFTS: MoveVertical,
  TRANSIT: Bus,
};
