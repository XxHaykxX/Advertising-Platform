// Member capability predicates (2026-08-11, stage A of the dual-side account
// plan). Deliberately NOT "server-only": src/components/header.tsx is a
// client component and needs these same two functions. `role` never appears
// here — it stays the member-vs-staff discriminator (see require.ts,
// staff-roles.ts), not a capability. Staff rows carry isCreator/isBrand=false,
// so these read exactly as false for them, same as the old `role === "BRAND"`.
export type MemberSides = { isCreator: boolean; isBrand: boolean };

/** May sell (own projects/ad-spaces, reach the creator cabinet). */
export function canSell(u: MemberSides | null | undefined): boolean {
  return u?.isCreator === true;
}

/** May buy (apply, favorite, reach the brand cabinet). */
export function canBuy(u: MemberSides | null | undefined): boolean {
  return u?.isBrand === true;
}
