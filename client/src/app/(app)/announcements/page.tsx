'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * /announcements is superseded by /feed (Campus Feed).
 * Redirect transparently so existing bookmarks/links still work.
 */
export default function AnnouncementsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/feed'); }, [router]);
  return null;
}
