import type { PostingChannel, JobPostingChannelState } from '@/types';

/** BRD FR-19 — Internal and external posting channels */
export const POSTING_CHANNELS: PostingChannel[] = [
  {
    id: 'ch-internal',
    name: 'Internal Careers Portal',
    slug: 'internal_portal',
    description: 'Visible to existing employees for internal transfers and mobility',
    supportsInternal: true,
    supportsExternal: false,
  },
  {
    id: 'ch-website',
    name: 'Company Website',
    slug: 'company_website',
    description: 'Published to capitalbank.et/careers',
    supportsInternal: false,
    supportsExternal: true,
  },
  {
    id: 'ch-linkedin',
    name: 'LinkedIn',
    slug: 'linkedin',
    description: 'Job slot integration (Premium Subscription)',
    supportsInternal: false,
    supportsExternal: true,
  },
  {
    id: 'ch-telegram',
    name: 'Telegram',
    slug: 'telegram',
    description: 'Capital Bank careers Telegram channel',
    supportsInternal: false,
    supportsExternal: true,
  },
  {
    id: 'ch-facebook',
    name: 'Facebook',
    slug: 'facebook',
    description: 'Facebook careers page integration',
    supportsInternal: false,
    supportsExternal: true,
  },
];

export const defaultChannelStates = (enabledSlugs: string[] = ['internal_portal', 'company_website']): JobPostingChannelState[] =>
  POSTING_CHANNELS.map((ch) => ({
    channelSlug: ch.slug,
    channelId: ch.id,
    channelName: ch.name,
    enabled: enabledSlugs.includes(ch.slug),
    syncStatus: enabledSlugs.includes(ch.slug)
      ? ('pending' as const)
      : ch.slug === 'linkedin' || ch.slug === 'facebook'
        ? ('not_linked' as const)
        : ('not_linked' as const),
    lastSyncAt: enabledSlugs.includes(ch.slug) ? new Date().toISOString() : undefined,
  }));
