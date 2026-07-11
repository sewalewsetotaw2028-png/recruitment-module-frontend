import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/common/Toast';
import { Modal } from '@/components/ui/Modal';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/lib/permissions-shared';
import {
  createRecruitmentChannel,
  deleteRecruitmentChannel,
  fetchRecruitmentChannels,
  updateRecruitmentChannel,
} from '@/hooks/useRecruitmentChannels';
import {
  createRecruitmentSource,
  deleteRecruitmentSource,
  fetchRecruitmentSources,
  updateRecruitmentSource,
} from '@/hooks/useRecruitmentSources';
import type { RecruitmentChannel } from '@/hooks/useRecruitmentChannels';
import type { RecruitmentSource } from '@/hooks/useRecruitmentSources';

type Tab = 'channels' | 'sources';
type Mode = 'create' | 'edit';

type ChannelDraft = {
  name: string;
  description: string;
  isAutomated: boolean;
  isActive: boolean;
  apiUrl: string;
  apiToken: string;
  apiUsername: string; // used as Telegram chat_id (or other channel's username)
  shareTemplate: string;
};

type SourceDraft = {
  name: string;
  description: string;
  isActive: boolean;
};

const emptyChannelDraft = (): ChannelDraft => ({
  name: '',
  description: '',
  isAutomated: false,
  isActive: true,
  apiUrl: '',
  apiToken: '',
  apiUsername: '',
  shareTemplate: '',
});

const emptySourceDraft = (): SourceDraft => ({
  name: '',
  description: '',
  isActive: true,
});

const AccessDenied = () => (
  <div className="mx-auto my-12 flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm shadow-xs animate-fade-in">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-200/60 bg-red-50 shadow-xs">
      <span className="material-symbols-outlined text-xl text-red-500">
        lock
      </span>
    </div>
    <div className="space-y-1">
      <h2 className="text-sm font-bold text-slate-900">Access Denied</h2>
      <p className="max-w-xs text-xs font-medium leading-relaxed text-slate-500">
        You don't have permission to access configuration settings. Contact your
        HR Administrator.
      </p>
    </div>
  </div>
);

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const StatusPill = ({
  active,
  label = 'Active',
}: {
  active: boolean;
  label?: string;
}) => (
  <span
    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
      active
        ? 'border-green-200/60 bg-green-50 text-green-700'
        : 'border-slate-200 bg-slate-100 text-slate-600'
    }`}
  >
    {active ? label : 'Inactive'}
  </span>
);

const FieldCard = ({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
    <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
      {label}
    </p>
    <div
      className={`text-sm leading-relaxed text-slate-700 ${
        mono ? 'break-all font-mono text-xs' : ''
      }`}
    >
      {value}
    </div>
  </div>
);

export const ChannelsSourcesPage: React.FC = () => {
  const { can } = usePermissions();
  const { toast } = useToast();

  if (!can(PERMISSIONS.CONFIG_MANAGE)) return <AccessDenied />;
  const canWrite = can(PERMISSIONS.CONFIG_MANAGE);

  const [activeTab, setActiveTab] = useState<Tab>('channels');
  const [channels, setChannels] = useState<RecruitmentChannel[]>([]);
  const [sources, setSources] = useState<RecruitmentSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null,
  );
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  const [channelSearch, setChannelSearch] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');

  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [channelMode, setChannelMode] = useState<Mode>('create');
  const [sourceMode, setSourceMode] = useState<Mode>('create');
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [channelDraft, setChannelDraft] = useState<ChannelDraft>(
    emptyChannelDraft(),
  );
  const [sourceDraft, setSourceDraft] = useState<SourceDraft>(
    emptySourceDraft(),
  );
  const [savingChannel, setSavingChannel] = useState(false);
  const [savingSource, setSavingSource] = useState(false);
  const [deletingChannel, setDeletingChannel] =
    useState<RecruitmentChannel | null>(null);
  const [deletingSource, setDeletingSource] =
    useState<RecruitmentSource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadData = useCallback(
    async (options?: {
      preferredChannelId?: string | null;
      preferredSourceId?: string | null;
    }) => {
      setLoading(true);
      setError(null);

      try {
        const [channelData, sourceData] = await Promise.all([
          fetchRecruitmentChannels(),
          fetchRecruitmentSources(),
        ]);

        setChannels(channelData);
        setSources(sourceData);

        setSelectedChannelId((current) => {
          const candidate =
            options?.preferredChannelId !== undefined
              ? options.preferredChannelId
              : current;
          if (candidate && channelData.some((item) => item.id === candidate)) {
            return candidate;
          }
          return channelData[0]?.id ?? null;
        });

        setSelectedSourceId((current) => {
          const candidate =
            options?.preferredSourceId !== undefined
              ? options.preferredSourceId
              : current;
          if (candidate && sourceData.some((item) => item.id === candidate)) {
            return candidate;
          }
          return sourceData[0]?.id ?? null;
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === selectedChannelId) ?? null,
    [channels, selectedChannelId],
  );

  const selectedSource = useMemo(
    () => sources.find((source) => source.id === selectedSourceId) ?? null,
    [selectedSourceId, sources],
  );

  useEffect(() => {
    if (activeTab === 'channels' && !selectedChannel && channels.length > 0) {
      setSelectedChannelId(channels[0].id);
    }
  }, [activeTab, channels, selectedChannel]);

  useEffect(() => {
    if (activeTab === 'sources' && !selectedSource && sources.length > 0) {
      setSelectedSourceId(sources[0].id);
    }
  }, [activeTab, selectedSource, sources]);

  const filteredChannels = useMemo(() => {
    const query = channelSearch.trim().toLowerCase();
    if (!query) return channels;
    return channels.filter((channel) => {
      return (
        channel.name.toLowerCase().includes(query) ||
        (channel.description ?? '').toLowerCase().includes(query) ||
        (channel.api_url ?? '').toLowerCase().includes(query)
      );
    });
  }, [channelSearch, channels]);

  const filteredSources = useMemo(() => {
    const query = sourceSearch.trim().toLowerCase();
    if (!query) return sources;
    return sources.filter((source) => {
      return (
        source.name.toLowerCase().includes(query) ||
        (source.description ?? '').toLowerCase().includes(query)
      );
    });
  }, [sourceSearch, sources]);

  const openCreateChannel = () => {
    setChannelMode('create');
    setEditingChannelId(null);
    setChannelDraft(emptyChannelDraft());
    setChannelModalOpen(true);
  };

  const openEditChannel = (channel: RecruitmentChannel) => {
    setChannelMode('edit');
    setEditingChannelId(channel.id);
    setChannelDraft({
      name: channel.name,
      description: channel.description ?? '',
      isAutomated: channel.is_automated,
      isActive: channel.is_active,
      apiUrl: channel.api_url ?? '',
      apiToken: channel.api_token ?? '',
      apiUsername: channel.api_username ?? '',
      shareTemplate: channel.share_template ?? '',
    });
    setChannelModalOpen(true);
  };

  const openCreateSource = () => {
    setSourceMode('create');
    setEditingSourceId(null);
    setSourceDraft(emptySourceDraft());
    setSourceModalOpen(true);
  };

  const openEditSource = (source: RecruitmentSource) => {
    setSourceMode('edit');
    setEditingSourceId(source.id);
    setSourceDraft({
      name: source.name,
      description: source.description ?? '',
      isActive: source.is_active,
    });
    setSourceModalOpen(true);
  };

  const closeChannelModal = () => {
    setChannelModalOpen(false);
    setEditingChannelId(null);
    setChannelDraft(emptyChannelDraft());
  };

  const closeSourceModal = () => {
    setSourceModalOpen(false);
    setEditingSourceId(null);
    setSourceDraft(emptySourceDraft());
  };

  const submitChannel = async () => {
    if (!channelDraft.name.trim()) {
      toast('Channel name is required', 'error');
      return;
    }

    setSavingChannel(true);
    try {
      const payload = {
        name: channelDraft.name.trim(),
        description: channelDraft.description.trim() || undefined,
        isAutomated: channelDraft.isAutomated,
        isActive: channelDraft.isActive,
        apiUrl: channelDraft.apiUrl.trim() || undefined,
        apiToken: channelDraft.apiToken.trim() || undefined,
        apiUsername: channelDraft.apiUsername.trim() || undefined,
        shareTemplate: channelDraft.shareTemplate.trim() || undefined,
      };

      if (channelMode === 'edit' && editingChannelId) {
        await updateRecruitmentChannel(editingChannelId, payload);
        toast('Channel updated successfully', 'success');
        await loadData({ preferredChannelId: editingChannelId });
      } else {
        const created = await createRecruitmentChannel(payload);
        toast('Channel created successfully', 'success');
        await loadData({ preferredChannelId: created.id });
      }

      closeChannelModal();
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : 'Failed to save channel',
        'error',
      );
    } finally {
      setSavingChannel(false);
    }
  };

  const submitSource = async () => {
    if (!sourceDraft.name.trim()) {
      toast('Source name is required', 'error');
      return;
    }

    setSavingSource(true);
    try {
      const payload = {
        name: sourceDraft.name.trim(),
        description: sourceDraft.description.trim() || undefined,
        isActive: sourceDraft.isActive,
      };

      if (sourceMode === 'edit' && editingSourceId) {
        await updateRecruitmentSource(editingSourceId, payload);
        toast('Source updated successfully', 'success');
        await loadData({ preferredSourceId: editingSourceId });
      } else {
        const created = await createRecruitmentSource(payload);
        toast('Source created successfully', 'success');
        await loadData({ preferredSourceId: created.id });
      }

      closeSourceModal();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Failed to save source', 'error');
    } finally {
      setSavingSource(false);
    }
  };

  const handleToggleChannel = async (channel: RecruitmentChannel) => {
    try {
      await updateRecruitmentChannel(channel.id, {
        isActive: !channel.is_active,
      });
      await loadData({ preferredChannelId: channel.id });
      toast(
        `Channel ${channel.is_active ? 'deactivated' : 'activated'}`,
        'success',
      );
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : 'Failed to update channel',
        'error',
      );
    }
  };

  const handleToggleSource = async (source: RecruitmentSource) => {
    try {
      await updateRecruitmentSource(source.id, {
        isActive: !source.is_active,
      });
      await loadData({ preferredSourceId: source.id });
      toast(
        `Source ${source.is_active ? 'deactivated' : 'activated'}`,
        'success',
      );
    } catch (err: unknown) {
      toast(
        err instanceof Error ? err.message : 'Failed to update source',
        'error',
      );
    }
  };

  const handleDeleteChannel = async () => {
    if (!deletingChannel) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteRecruitmentChannel(deletingChannel.id);
      setDeletingChannel(null);
      if (selectedChannelId === deletingChannel.id) {
        setSelectedChannelId(null);
      }
      await loadData();
      toast('Channel deleted', 'success');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete channel';
      setDeleteError(message);
      toast(message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSource = async () => {
    if (!deletingSource) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteRecruitmentSource(deletingSource.id);
      setDeletingSource(null);
      if (selectedSourceId === deletingSource.id) {
        setSelectedSourceId(null);
      }
      await loadData();
      toast('Source deleted', 'success');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete source';
      setDeleteError(message);
      toast(message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderChannelDetail = () => {
    if (!selectedChannel) {
      return (
        <div className="flex h-full min-h-0 items-center justify-center p-8">
          <div className="max-w-md rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-xs">
            <span className="material-symbols-outlined text-4xl text-slate-300">
              campaign
            </span>
            <h3 className="mt-4 text-sm font-bold text-slate-900">
              No channel selected
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Select a channel from the left to view its configuration and make
              changes.
            </p>
            {canWrite && (
              <button
                type="button"
                onClick={openCreateChannel}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <span className="material-symbols-outlined text-sm leading-none">
                  add
                </span>
                Add Channel
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-slate-200 bg-white">
          <div className="flex items-start justify-between gap-4 px-6 py-5">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
                Recruitment Channel
              </p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <h2 className="truncate text-xl font-extrabold tracking-tight text-slate-800">
                  {selectedChannel.name}
                </h2>
                <StatusPill active={selectedChannel.is_active} />
                {selectedChannel.is_automated && (
                  <span className="inline-flex items-center rounded-md border border-blue-200/60 bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-700">
                    Automated
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-500">
                {selectedChannel.description || 'No description set'}
              </p>
            </div>

            {canWrite && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => openEditChannel(selectedChannel)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-sm leading-none">
                    edit
                  </span>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleChannel(selectedChannel)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700"
                >
                  <span className="material-symbols-outlined text-sm leading-none">
                    {selectedChannel.is_active ? 'toggle_off' : 'toggle_on'}
                  </span>
                  {selectedChannel.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeletingChannel(selectedChannel);
                    setDeleteError(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700 shadow-xs transition hover:bg-red-50"
                >
                  <span className="material-symbols-outlined text-sm leading-none">
                    delete
                  </span>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <FieldCard
              label="Description"
              value={selectedChannel.description || 'No description set'}
            />
            <FieldCard
              label="API URL"
              value={selectedChannel.api_url || 'Not configured'}
              mono
            />
            <FieldCard
              label="API Token / Bot Token"
              value={selectedChannel.api_token ? 'Configured ✓' : 'Not configured'}
            />
            {selectedChannel.api_username && (
              <FieldCard
                label={
                  selectedChannel.name.toLowerCase().includes('telegram')
                    ? 'Telegram Chat ID'
                    : 'API Username'
                }
                value={selectedChannel.api_username}
                mono
              />
            )}
            <FieldCard
              label="Share Template"
              value={selectedChannel.share_template || 'Not configured'}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FieldCard
              label="Active"
              value={<StatusPill active={selectedChannel.is_active} />}
            />
            <FieldCard label="Automated" value={selectedChannel.is_automated ? 'Yes' : 'No'} />
            <FieldCard
              label="Created"
              value={formatDate(selectedChannel.created_at)}
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Audit Trail
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <FieldCard
                label="Updated"
                value={formatDate(selectedChannel.updated_at)}
              />
              <FieldCard
                label="Channel ID"
                value={selectedChannel.id}
                mono
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSourceDetail = () => {
    if (!selectedSource) {
      return (
        <div className="flex h-full min-h-0 items-center justify-center p-8">
          <div className="max-w-md rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-xs">
            <span className="material-symbols-outlined text-4xl text-slate-300">
              public
            </span>
            <h3 className="mt-4 text-sm font-bold text-slate-900">
              No source selected
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Select a source from the left to view its detail and manage its
              active state.
            </p>
            {canWrite && (
              <button
                type="button"
                onClick={openCreateSource}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
              >
                <span className="material-symbols-outlined text-sm leading-none">
                  add
                </span>
                Add Source
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-slate-200 bg-white">
          <div className="flex items-start justify-between gap-4 px-6 py-5">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
                Recruitment Source
              </p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <h2 className="truncate text-xl font-extrabold tracking-tight text-slate-800">
                  {selectedSource.name}
                </h2>
                <StatusPill active={selectedSource.is_active} />
              </div>
              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-500">
                {selectedSource.description || 'No description set'}
              </p>
            </div>

            {canWrite && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={() => openEditSource(selectedSource)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
                >
                  <span className="material-symbols-outlined text-sm leading-none">
                    edit
                  </span>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSource(selectedSource)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700"
                >
                  <span className="material-symbols-outlined text-sm leading-none">
                    {selectedSource.is_active ? 'toggle_off' : 'toggle_on'}
                  </span>
                  {selectedSource.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeletingSource(selectedSource);
                    setDeleteError(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-700 shadow-xs transition hover:bg-red-50"
                >
                  <span className="material-symbols-outlined text-sm leading-none">
                    delete
                  </span>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FieldCard
              label="Description"
              value={selectedSource.description || 'No description set'}
            />
            <FieldCard
              label="Active"
              value={<StatusPill active={selectedSource.is_active} />}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FieldCard label="Created" value={formatDate(selectedSource.created_at)} />
            <FieldCard label="Updated" value={formatDate(selectedSource.updated_at)} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <p className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Audit Trail
            </p>
            <FieldCard label="Source ID" value={selectedSource.id} mono />
          </div>
        </div>
      </div>
    );
  };

  const channelModalTitle =
    channelMode === 'create' ? 'Create Recruitment Channel' : 'Edit Recruitment Channel';
  const sourceModalTitle =
    sourceMode === 'create' ? 'Create Recruitment Source' : 'Edit Recruitment Source';

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden text-sm animate-fade-in">
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-5 select-none">
        <div className="mb-2 flex items-center gap-3">
          <Link
            to="/dashboard/configuration"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
          >
            <span className="material-symbols-outlined text-base">
              arrow_back
            </span>
            Back to Hub
          </Link>
        </div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600">
          Configuration
        </p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-800">
              Channels &amp; Sources
            </h1>
            <p className="mt-1 text-xs font-medium leading-normal text-slate-500">
              Manage recruitment channels and sources with a persistent list on
              the left and a live detail pane on the right.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 flex shrink-0 items-center gap-3 rounded-xl border border-red-200/60 bg-red-50/60 p-4 text-xs text-red-700 select-none">
          <span className="material-symbols-outlined text-lg leading-none text-red-500">
            error
          </span>
          <span className="font-bold">{error}</span>
          <button
            type="button"
            onClick={() => loadData()}
            className="ml-auto cursor-pointer text-xs font-extrabold text-red-700 underline underline-offset-2 transition hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="flex w-[360px] shrink-0 flex-col min-h-0 border-r border-slate-200 bg-white">
          <div className="shrink-0 border-b border-slate-100 bg-white px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Recruitment
                </p>
                <h2 className="mt-1 text-sm font-extrabold tracking-tight text-slate-800">
                  {activeTab === 'channels' ? 'Channels' : 'Sources'}
                </h2>
              </div>

              {canWrite && (
                <button
                  type="button"
                  onClick={activeTab === 'channels' ? openCreateChannel : openCreateSource}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  <span className="material-symbols-outlined text-[15px] leading-none">
                    add
                  </span>
                  New
                </button>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('channels')}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                  activeTab === 'channels'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Channels
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sources')}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                  activeTab === 'sources'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Sources
              </button>
            </div>

            <input
              type="text"
              value={activeTab === 'channels' ? channelSearch : sourceSearch}
              onChange={(e) =>
                activeTab === 'channels'
                  ? setChannelSearch(e.target.value)
                  : setSourceSearch(e.target.value)
              }
              placeholder={`Search ${activeTab}...`}
              className="mt-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 transition"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/30 p-3 space-y-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-100 bg-white px-4 py-3.5 shadow-xs animate-pulse"
                >
                  <div className="h-3 w-2/3 rounded-md bg-slate-200" />
                  <div className="mt-2 h-2.5 w-1/2 rounded-md bg-slate-100" />
                </div>
              ))
            ) : activeTab === 'channels' ? (
              filteredChannels.length === 0 ? (
                <div className="rounded-xl border border-slate-100 bg-white px-5 py-12 text-center text-slate-400 shadow-xs">
                  {channelSearch.trim()
                    ? 'No channels match your search.'
                    : 'No channels found.'}
                </div>
              ) : (
                filteredChannels.map((channel) => {
                  const isSelected = channel.id === selectedChannelId;
                  return (
                    <div
                      key={channel.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedChannelId(channel.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedChannelId(channel.id);
                        }
                      }}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition overflow-hidden ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                          : 'border-slate-100 bg-white shadow-xs hover:border-slate-200 hover:bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`truncate text-xs font-extrabold uppercase tracking-wide ${
                                isSelected ? 'text-indigo-600' : 'text-slate-700'
                              }`}
                            >
                              {channel.name}
                            </span>
                            <StatusPill active={channel.is_active} />
                            {channel.is_automated && (
                              <span className="inline-flex items-center rounded-md border border-blue-200/60 bg-blue-50 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-blue-700">
                                Automated
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 block max-w-full truncate text-[11px] font-medium leading-relaxed text-slate-500">
                            {channel.description || 'No description set'}
                          </p>
                        </div>

                        {canWrite && (
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditChannel(channel);
                              }}
                              className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700"
                              title="Edit channel"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                edit
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleChannel(channel);
                              }}
                              className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700"
                              title={channel.is_active ? 'Deactivate' : 'Activate'}
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                {channel.is_active ? 'toggle_on' : 'toggle_off'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingChannel(channel);
                                setDeleteError(null);
                              }}
                              className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              title="Delete channel"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                delete
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )
            ) : filteredSources.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-white px-5 py-12 text-center text-slate-400 shadow-xs">
                {sourceSearch.trim()
                  ? 'No sources match your search.'
                  : 'No sources found.'}
              </div>
            ) : (
              filteredSources.map((source) => {
                const isSelected = source.id === selectedSourceId;
                return (
                  <div
                    key={source.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedSourceId(source.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedSourceId(source.id);
                      }
                    }}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition overflow-hidden ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-xs'
                        : 'border-slate-100 bg-white shadow-xs hover:border-slate-200 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`truncate text-xs font-extrabold uppercase tracking-wide ${
                              isSelected ? 'text-indigo-600' : 'text-slate-700'
                            }`}
                          >
                            {source.name}
                          </span>
                          <StatusPill active={source.is_active} />
                        </div>
                        <p className="mt-0.5 block max-w-full truncate text-[11px] font-medium leading-relaxed text-slate-500">
                          {source.description || 'No description set'}
                        </p>
                      </div>

                      {canWrite && (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditSource(source);
                            }}
                            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700"
                            title="Edit source"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              edit
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSource(source);
                            }}
                            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700"
                            title={source.is_active ? 'Deactivate' : 'Activate'}
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {source.is_active ? 'toggle_on' : 'toggle_off'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingSource(source);
                              setDeleteError(null);
                            }}
                            className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Delete source"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              delete
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-hidden bg-slate-50/30">
          {activeTab === 'channels' ? renderChannelDetail() : renderSourceDetail()}
        </main>
      </div>

      <Modal
        isOpen={channelModalOpen}
        onClose={closeChannelModal}
        title={channelModalTitle}
        size="xl"
      >
        <form
          className="space-y-5 text-sm"
          onSubmit={(event) => {
            event.preventDefault();
            void submitChannel();
          }}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5 md:col-span-2">
              <label
                htmlFor="channel-name"
                className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500"
              >
                Channel Name
              </label>
              <input
                id="channel-name"
                type="text"
                value={channelDraft.name}
                onChange={(event) =>
                  setChannelDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                placeholder="e.g. LinkedIn"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label
                htmlFor="channel-description"
                className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500"
              >
                Description
              </label>
              <textarea
                id="channel-description"
                value={channelDraft.description}
                onChange={(event) =>
                  setChannelDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                placeholder="Short description of this channel"
              />
            </div>

            <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
              <div>
                <p className="text-sm font-bold text-slate-800">Active</p>
                <p className="text-xs text-slate-500">
                  Inactive channels stay saved but won't be used for active
                  operations.
                </p>
              </div>
              <input
                type="checkbox"
                checked={channelDraft.isActive}
                onChange={(event) =>
                  setChannelDraft((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 md:col-span-2">
              <div>
                <p className="text-sm font-bold text-slate-800">Automated</p>
                <p className="text-xs text-slate-500">
                  Automated channels can integrate with APIs or publishing
                  workflows.
                </p>
              </div>
              <input
                type="checkbox"
                checked={channelDraft.isAutomated}
                onChange={(event) =>
                  setChannelDraft((current) => ({
                    ...current,
                    isAutomated: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
              />
            </label>

            <div className="space-y-1.5 md:col-span-2">
              <label
                htmlFor="channel-api-url"
                className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500"
              >
                API URL
              </label>
              <input
                id="channel-api-url"
                type="text"
                value={channelDraft.apiUrl}
                onChange={(event) =>
                  setChannelDraft((current) => ({
                    ...current,
                    apiUrl: event.target.value,
                  }))
                }
                spellCheck={false}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                placeholder="https://example.com/api"
              />
              <p className="text-[11px] text-slate-500">
                If this is blank, the channel stays manual.
              </p>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="channel-api-token"
                className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500"
              >
                API Token / Bot Token
              </label>
              <input
                id="channel-api-token"
                type="password"
                value={channelDraft.apiToken}
                onChange={(event) =>
                  setChannelDraft((current) => ({
                    ...current,
                    apiToken: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                placeholder="Optional token"
              />
              {channelDraft.name.toLowerCase().includes('telegram') && (
                <p className="text-[11px] text-indigo-600 font-medium">
                  For Telegram: paste your bot token from @BotFather
                </p>
              )}
            </div>

            {/* Telegram chat_id / API username */}
            <div className="space-y-1.5">
              <label
                htmlFor="channel-api-username"
                className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500"
              >
                {channelDraft.name.toLowerCase().includes('telegram')
                  ? 'Telegram Chat ID'
                  : 'API Username / Chat ID'}
              </label>
              <input
                id="channel-api-username"
                type="text"
                value={channelDraft.apiUsername}
                onChange={(event) =>
                  setChannelDraft((current) => ({
                    ...current,
                    apiUsername: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                placeholder={
                  channelDraft.name.toLowerCase().includes('telegram')
                    ? 'e.g. -1001234567890 or @yourgroup'
                    : 'Optional username or ID'
                }
              />
              {channelDraft.name.toLowerCase().includes('telegram') && (
                <p className="text-[11px] text-slate-500">
                  Your channel or group chat ID. Forward a message to{' '}
                  <span className="font-semibold text-indigo-600">@userinfobot</span>{' '}
                  to find it, or use a negative group ID like{' '}
                  <span className="font-mono">-1001234567890</span>.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="channel-share-template"
                className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500"
              >
                Share Template
              </label>
              <input
                id="channel-share-template"
                type="text"
                value={channelDraft.shareTemplate}
                onChange={(event) =>
                  setChannelDraft((current) => ({
                    ...current,
                    shareTemplate: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                placeholder="Template reference or shortcode"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeChannelModal}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingChannel}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {savingChannel ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm leading-none">
                    progress_activity
                  </span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={sourceModalOpen}
        onClose={closeSourceModal}
        title={sourceModalTitle}
        size="lg"
      >
        <form
          className="space-y-5 text-sm"
          onSubmit={(event) => {
            event.preventDefault();
            void submitSource();
          }}
        >
          <div className="space-y-1.5">
            <label
              htmlFor="source-name"
              className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500"
            >
              Source Name
            </label>
            <input
              id="source-name"
              type="text"
              value={sourceDraft.name}
              onChange={(event) =>
                setSourceDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              placeholder="e.g. Employee Referral"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="source-description"
              className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500"
            >
              Description
            </label>
            <textarea
              id="source-description"
              value={sourceDraft.description}
              onChange={(event) =>
                setSourceDraft((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-xs focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              placeholder="Short description of this source"
            />
          </div>

          <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-slate-800">Active</p>
              <p className="text-xs text-slate-500">
                Inactive sources stay saved but are hidden from active use.
              </p>
            </div>
            <input
              type="checkbox"
              checked={sourceDraft.isActive}
              onChange={(event) =>
                setSourceDraft((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeSourceModal}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingSource}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {savingSource ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm leading-none">
                    progress_activity
                  </span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deletingChannel || !!deletingSource}
        onClose={() => {
          setDeletingChannel(null);
          setDeletingSource(null);
          setDeleteError(null);
        }}
        title={`Delete ${
          deletingChannel ? 'Channel' : deletingSource ? 'Source' : 'Item'
        }`}
        size="sm"
      >
        <div className="space-y-5 text-sm">
          <div className="flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50/60 p-4">
            <span className="material-symbols-outlined mt-0.5 shrink-0 text-lg text-red-500">
              warning
            </span>
            <div>
              <p className="text-xs font-bold leading-normal text-red-800">
                Delete{' '}
                &ldquo;{deletingChannel?.name || deletingSource?.name}&rdquo;?
              </p>
              <p className="mt-1 text-[11px] font-medium leading-normal text-red-600">
                This removes the configuration item if nothing else depends on
                it.
              </p>
            </div>
          </div>

          {deleteError && (
            <p className="rounded-xl border border-red-200/60 bg-red-50 px-3.5 py-2.5 text-xs font-semibold leading-relaxed text-red-700">
              {deleteError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setDeletingChannel(null);
                setDeletingSource(null);
                setDeleteError(null);
              }}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (deletingChannel) {
                  void handleDeleteChannel();
                } else if (deletingSource) {
                  void handleDeleteSource();
                }
              }}
              disabled={isDeleting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
            >
              {isDeleting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm leading-none">
                    progress_activity
                  </span>
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default ChannelsSourcesPage;
