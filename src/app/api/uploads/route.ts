import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { requireContentEditor, requireMember } from "@/lib/auth/require";
import { getLocale } from "@/lib/data/locale";
import { makeUI } from "@/lib/i18n";
import { UPLOADS_DIR } from "@/lib/uploads-dir";
import {
  STAFF_UPLOAD_MESSAGES,
  memberUploadMessages,
  storeUpload,
  type StoredUpload,
} from "@/lib/uploads-store";

/** Multipart upload endpoint — the twin of the `uploadImage` /
 *  `uploadMemberImage` Server Actions, and the only reason it exists: a browser
 *  reports NO upload progress for a Server Action (nor for fetch()), so a 50 MB
 *  trailer used to sit behind a spinner with nothing moving. XMLHttpRequest
 *  against a plain route DOES fire `upload.onprogress`, so the client posts
 *  here instead (src/lib/upload-xhr.ts).
 *
 *  Everything past the gate is the SAME code the actions run — validation,
 *  size caps, the safeSegment() folder handling and the write all live in
 *  lib/uploads-store.ts. Only the auth gate is repeated here, and it calls the
 *  very same guards, so the two doors cannot drift apart.
 *
 *  Body size: this route is NOT subject to `experimental.proxyClientMaxBodySize`
 *  (52 MB in next.config.ts). That cap only bites when the request body has to
 *  be cloned for the proxy, and src/proxy.ts's matcher excludes `/api/…`, so
 *  the body is never cloned for this path. `serverActions.bodySizeLimit` is
 *  likewise action-only. The cap that actually applies is MAX_BYTES_VIDEO
 *  (50 MB) inside the store — plus whatever the host's own front end allows. */
export async function POST(req: NextRequest) {
  // Scope rides in the query string, not the body: the gate has to run BEFORE
  // formData() buffers 50 MB of someone else's file into this process.
  const scope = req.nextUrl.searchParams.get("scope") === "member" ? "member" : "staff";

  // Same-origin check, the one thing a Server Action gets for free and a route
  // handler does not. The session cookie is SameSite=Lax (lib/auth/session.ts),
  // so a cross-SITE POST carries no session at all — but "same site" covers
  // every subdomain of igovazd.am, and this is what stops one of those from
  // pushing files into the media library on a signed-in editor's behalf.
  //
  // Sec-Fetch-Site rather than Origin-vs-Host: the app runs behind Passenger,
  // which is already known to leave Next with a bind-address view of its own
  // URL (the 0.0.0.0:3000 redirect, IA-31), so a Host comparison is the kind of
  // check that passes locally and locks the panel out in production. A header
  // the browser itself computes has no such failure mode. Absent = not a
  // browser, and the auth gate below still applies.
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") {
    return NextResponse.json({ error: "Bad origin." }, { status: 403 });
  }

  // There was a content-length early-out here, sized as "the video cap plus the
  // poster frame". The owner removed the video cap on 2026-08-19 (see
  // MAX_BYTES_VIDEO), and this check could not survive it: the route cannot
  // tell a clip from a still until formData() has parsed the body, so any
  // ceiling it kept would cap video uploads under a different name.
  //
  // What that costs: the body is buffered into this process before storeUpload
  // sees it, so a very large POST is that much resident memory on shared
  // hosting. The gate below still means only a signed-in editor or member can
  // reach it, and Passenger's own request-body limit applies in front.

  let userId: number;
  try {
    const user = scope === "member" ? await requireMember() : await requireContentEditor();
    userId = user.id;
  } catch {
    // The shared guards answer a rejected request the way a PAGE needs it —
    // redirect() to the login page, or notFound(). Both throw, and an XHR would
    // silently follow the redirect and read the login HTML as a successful
    // upload. Anything the guard throws (including an unexpected failure inside
    // it) therefore fails closed with a JSON 403 the uploader can show.
    return NextResponse.json({ error: "Not signed in, or not allowed to upload." }, { status: 403 });
  }

  const fd = await req.formData();

  let result: StoredUpload;
  if (scope === "member") {
    // Hard-scoped to the caller's own namespace, exactly like
    // uploadMemberImage: the `dir` field can only ever pick a subfolder of it.
    result = await storeUpload(fd, {
      root: path.join(UPLOADS_DIR, "members", String(userId)),
      publicPrefix: `/uploads/members/${userId}`,
      messages: memberUploadMessages(makeUI(await getLocale())),
    });
  } else {
    result = await storeUpload(fd, {
      root: UPLOADS_DIR,
      publicPrefix: "/uploads",
      messages: STAFF_UPLOAD_MESSAGES,
    });
  }

  // A rejected file answers 400 so the client can tell a real rejection from a
  // login page or an error page it might have been handed instead.
  return NextResponse.json(result, { status: result.error ? 400 : 200 });
}
