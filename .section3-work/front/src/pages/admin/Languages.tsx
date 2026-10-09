import React, { useEffect, useState } from 'react';
import { CheckIcon, GlobeIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/layout/AdminLayout';
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/Field';
import { ConfirmModal } from '../../components/ui/Modal';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import { SkeletonText } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/States';
import { useAsync } from '../../hooks/useAsync';
import { useI18n } from '../../contexts/I18nContext';
import { addLanguage, deleteLanguage, getLanguages, searchLanguages } from '../../services/referenceService';
import type { Language, LanguageSearchResult } from '../../types/api';
import { errorMessage } from '../../utils/errors';

export function Languages() {
  const { t, reloadLanguages } = useI18n();
  const languages = useAsync(getLanguages, []);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LanguageSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<unknown>(null);
  const [selectedCode, setSelectedCode] = useState('');
  const [deleting, setDeleting] = useState<Language | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (query.trim().length < 1) {
      setResults([]);
      setSearchError(null);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      searchLanguages(query.trim()).
      then((data) => {
        if (!cancelled) {
          setResults(data);
          setSearchError(null);
        }
      }).
      catch((error: unknown) => {
        if (!cancelled) setSearchError(error);
      }).
      finally(() => {
        if (!cancelled) setSearching(false);
      });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const existingCodes = new Set((languages.data ?? []).map((item) => item.code.toLowerCase()));
  const directCode = !searching && !searchError && results.length === 0 ? query.trim() : '';
  const codeToAdd = selectedCode || directCode;
  const codeAlreadyAdded = existingCodes.has(codeToAdd.toLowerCase());

  const submitAdd = async () => {
    if (!codeToAdd || codeAlreadyAdded) return;
    setSaving(true);
    try {
      await addLanguage(codeToAdd);
      toast.success(t('toast.created'));
      setSelectedCode('');
      setQuery('');
      setResults([]);
      languages.reload();
      await reloadLanguages();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const submitDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      await deleteLanguage(deleting.id);
      toast.success(t('toast.deleted'));
      setDeleting(null);
      languages.reload();
      await reloadLanguages();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Language>[] = [
  { key: 'id', header: t('field.id'), render: (row) => <span className="text-navy-400">#{row.id}</span> },
  {
    key: 'code',
    header: 'ISO / BCP-47',
    render: (row) => <span className="font-mono text-[12px] font-semibold uppercase text-navy-700">{row.code}</span>
  },
  { key: 'name', header: t('field.name'), render: (row) => <span className="text-navy-600">{row.name}</span> },
  {
    key: 'nativeName',
    header: 'Native',
    render: (row) => <span className="font-medium text-navy-900">{row.nativeName}</span>
  },
  {
    key: 'default',
    header: t('lang.default'),
    render: (row) => row.defaultLanguage ? <Badge tone="teal">{t('lang.default')}</Badge> : <span className="text-navy-400">—</span>
  },
  {
    key: 'actions',
    header: t('field.actions'),
    className: 'text-right',
    headerClassName: 'text-right',
    render: (row) =>
    row.defaultLanguage ?
    // Deletion is not offered for the default language.
    <span className="text-[12px] text-navy-400">{t('lang.default')}</span> :

    <Button
      size="sm"
      variant="danger"
      onClick={() => setDeleting(row)}
      icon={<Trash2Icon className="h-3.5 w-3.5" />}>
      
            {t('action.delete')}
          </Button>

  }];


  return (
    <div>
      <PageHeader title={t('lang.title')} description={t('lang.current')} />

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <PanelHeader title={t('lang.current')} description={`${(languages.data ?? []).length}`} />
          <DataTable
            columns={columns}
            rows={languages.data ?? []}
            rowKey={(row) => row.id}
            loading={languages.loading}
            error={languages.error}
            onRetry={languages.reload}
            emptyTitle={t('state.emptyTitle')}
            caption={t('lang.current')} />
          
        </Panel>

        <Panel className="h-fit lg:col-span-2">
          <PanelHeader title={t('lang.searchTitle')} />
          <PanelBody className="space-y-4">
            <label className="relative block">
              <span className="sr-only">{t('lang.searchPlaceholder')}</span>
              <SearchIcon
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-300"
                aria-hidden="true" />
              
              <TextInput
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelectedCode('');
                }}
                placeholder={t('lang.searchPlaceholder')}
                className="pl-9" />
              
            </label>

            <div className="min-h-[120px]">
              {searching ?
              <SkeletonText lines={4} /> :
              searchError ?
              <ErrorState error={searchError} /> :
              query.trim() === '' ?
              <p className="px-1 text-[13px] text-navy-400">{t('lang.searchPlaceholder')}</p> :
              results.length === 0 ?
              <EmptyState title={t('state.emptyTitle')} icon={<GlobeIcon className="h-5 w-5" />} /> :

              <ul className="max-h-64 space-y-1 overflow-y-auto">
                  {results.map((item) => {
                  const already = item.alreadyAdded || existingCodes.has(item.code);
                  const selected = selectedCode === item.code;
                  return (
                    <li key={item.code}>
                        <button
                        type="button"
                        disabled={already}
                        onClick={() => setSelectedCode(item.code)}
                        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                        selected ? 'border-teal-400 bg-teal-50' : 'border-navy-100 hover:border-navy-200'}`
                        }>
                        
                          <span>
                            <span className="block text-[13px] font-medium text-navy-900">{item.nativeName}</span>
                            <span className="block font-mono text-[11px] uppercase text-navy-400">
                              {item.code} · {item.name}
                            </span>
                          </span>
                          {already ?
                        <Badge tone="gray">Qo‘shilgan</Badge> :
                        selected ?
                        <CheckIcon className="h-4 w-4 text-teal-600" aria-hidden="true" /> :
                        null}
                        </button>
                      </li>);

                })}
                </ul>
              }
            </div>

            <Button
              className="w-full"
              onClick={submitAdd}
              disabled={!codeToAdd || codeAlreadyAdded}
              loading={saving}
              icon={<PlusIcon className="h-4 w-4" />}>
              
              {t('lang.addSelected')}
            </Button>
          </PanelBody>
        </Panel>
      </div>

      <ConfirmModal
        open={Boolean(deleting)}
        title={t('action.delete')}
        message={`${deleting?.nativeName ?? ''} — ${t('lang.deleteConfirm')}`}
        confirmLabel={t('action.delete')}
        cancelLabel={t('action.cancel')}
        loading={saving}
        onConfirm={submitDelete}
        onClose={() => setDeleting(null)} />
      
    </div>);

}
