import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/auth';
import { useI18n } from '../../contexts/i18n';
import { Button } from '../ui/Button';
import { Field, TextArea } from '../ui/Field';
import { Modal, ConfirmModal } from '../ui/Modal';
import { ErrorState } from '../ui/States';
import { Panel, PanelBody } from '../ui/Card';
import { transitionFunction, deactivateFunction, getAdminFunction } from '../../services/adminFunctionService';
import type { AdminFunction } from '../../types/adminFunctions';

interface Props {
  record: AdminFunction;
  dirty: boolean;
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onUpdate: (record: AdminFunction) => void;
}
export function FunctionWorkflow({ record, dirty, busy, onBusy, onUpdate }: Props) {
  const { hasPermission } = useAuth();
  const { t } = useI18n();
  const [dialog, setDialog] = useState<'reject' | 'deactivate' | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [running, setRunning] = useState(false);
  const disabled = dirty || busy;
  async function run(action: 'submit-for-review' | 'reject' | 'publish' | 'reactivate' | 'deactivate') {
    if (disabled) return;
    setRunning(true); onBusy(true); setError(null);
    try {
      const updated = action === 'deactivate'
        ? await deactivateFunction(record.id).then(() => getAdminFunction(record.id))
        : await transitionFunction(record.id, action, action === 'reject' ? reason.trim() : undefined);
      onUpdate(updated); setDialog(null); setReason(''); toast.success(t('fnAdmin.saved'));
    } catch (failure) { setError(failure); } finally { onBusy(false); setRunning(false); }
  }
  const canSubmit = record.status === 'DRAFT' && hasPermission('FUNCTIONS_SUBMIT_REVIEW');
  const canReview = record.status === 'PENDING_REVIEW' && hasPermission('FUNCTIONS_REVIEW');
  const canPublish = record.status === 'PENDING_REVIEW' && hasPermission('FUNCTIONS_PUBLISH');
  const canDeactivate = record.status === 'PUBLISHED' && hasPermission('FUNCTIONS_DEACTIVATE');
  const canReactivate = record.status === 'DEACTIVATED' && hasPermission('FUNCTIONS_REACTIVATE');
  if (!(canSubmit || canReview || canPublish || canDeactivate || canReactivate)) return null;
  return <Panel className="mb-5"><PanelBody>
    <div className="flex flex-wrap gap-3">
      {canSubmit && <Button disabled={disabled || record.organizationId === null} loading={running}
        onClick={() => void run('submit-for-review')}>{t('fnAdmin.submit')}</Button>}
      {canPublish && <Button disabled={disabled} loading={running} onClick={() => void run('publish')}>{t('fnAdmin.publish')}</Button>}
      {canReview && <Button variant="outline" disabled={disabled} onClick={() => { setError(null); setDialog('reject'); }}>{t('fnAdmin.reject')}</Button>}
      {canDeactivate && <Button variant="danger" disabled={disabled} onClick={() => { setError(null); setDialog('deactivate'); }}>{t('action.deactivate')}</Button>}
      {canReactivate && <Button disabled={disabled} loading={running} onClick={() => void run('reactivate')}>{t('fnAdmin.reactivate')}</Button>}
    </div>
    {dirty && <p className="mt-3 text-sm text-amber-700">{t('fnAdmin.saveFirst')}</p>}
    {canSubmit && record.organizationId === null && <p role="alert" className="mt-3 text-sm text-amber-700">{t('fnAdmin.assignFirst')}</p>}
    {Boolean(error) && dialog !== 'reject' && <ErrorState error={error} />}
    <Modal open={dialog === 'reject'} onClose={() => setDialog(null)} closeDisabled={busy} title={t('fnAdmin.reject')}>
      <form className="space-y-4" onSubmit={event => { event.preventDefault(); void run('reject'); }}>
        <Field label={t('fnAdmin.reason')} required>{() =>
          <TextArea rows={4} value={reason} maxLength={2000} disabled={busy} onChange={event => setReason(event.target.value)} />}</Field>
        {Boolean(error) && <ErrorState error={error} />}
        <Button type="submit" loading={running} disabled={disabled || !reason.trim()}>{t('fnAdmin.reject')}</Button>
      </form>
    </Modal>
    <ConfirmModal open={dialog === 'deactivate'} onClose={() => setDialog(null)}
      onConfirm={() => void run('deactivate')} loading={running} title={t('action.deactivate')}
      message={t('fnAdmin.deactivateConfirm')} confirmLabel={t('action.deactivate')} cancelLabel={t('action.cancel')} />
  </PanelBody></Panel>;
}
