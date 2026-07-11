import React, { useLayoutEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchCompanyProfile } from '@/hooks/useCompanyProfile';
import {
  applyCompanyThemeToDocument,
  applyDefaultCompanyTheme,
  buildCompanyTheme,
} from '@/utils/companyTheme';

const getThemeCacheKey = (organizationId?: string) =>
  organizationId ? `company-theme:${organizationId}` : 'company-theme:default';

const getLastThemeCacheKey = () => 'company-theme:last';

const readCachedTheme = (organizationId?: string) => {
  try {
    if (organizationId) {
      const raw = localStorage.getItem(getThemeCacheKey(organizationId));
      if (raw) {
        return JSON.parse(raw) as unknown;
      }
    }
    const lastRaw = localStorage.getItem(getLastThemeCacheKey());
    return lastRaw ? (JSON.parse(lastRaw) as unknown) : null;
  } catch {
    return null;
  }
};

const writeCachedTheme = (organizationId: string | undefined, theme: unknown) => {
  try {
    localStorage.setItem(getLastThemeCacheKey(), JSON.stringify(theme));
    localStorage.setItem(getThemeCacheKey(organizationId), JSON.stringify(theme));
  } catch {
    // Non-blocking cache write.
  }
};

if (typeof document !== 'undefined') {
  const bootstrapTheme = readCachedTheme();
  if (bootstrapTheme && typeof bootstrapTheme === 'object') {
    applyCompanyThemeToDocument(
      bootstrapTheme as Parameters<typeof applyCompanyThemeToDocument>[0],
    );
  }
}

export const CompanyThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { user, loading, isAuthenticated } = useAuth();

  useLayoutEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      applyDefaultCompanyTheme();
      return;
    }

    const organizationId = user.organizationId;
    const cachedTheme = readCachedTheme(organizationId);

    if (cachedTheme && typeof cachedTheme === 'object') {
      applyCompanyThemeToDocument(cachedTheme as Parameters<typeof applyCompanyThemeToDocument>[0]);
    } else {
      applyDefaultCompanyTheme();
    }

    let cancelled = false;

    void (async () => {
      try {
        const profile = await fetchCompanyProfile();
        if (cancelled) return;

        const theme = buildCompanyTheme({
          primary_color: profile.primary_color,
          secondary_color: profile.secondary_color,
        });
        applyCompanyThemeToDocument(theme);
        writeCachedTheme(organizationId, theme);
      } catch {
        if (!cancelled && !cachedTheme) {
          applyDefaultCompanyTheme();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, loading, user]);

  return <>{children}</>;
};
