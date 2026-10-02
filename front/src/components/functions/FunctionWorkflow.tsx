import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { CheckCircle2Icon, PowerOffIcon, RotateCcwIcon, SendIcon, UndoIcon, WorkflowIcon } from 'lucide-react';
import { useAuth } from '../../contexts/auth';
import { useI18n } from '../../contexts/i18n';
import { Button } from '../ui/Button';
import { Card, CardBody, CardHeader } from '../ui/Card';
import { Field } from '../ui/Field';
import { Textarea } from '../ui/Input';
import { ConfirmModal, Modal } from '../ui/Modal';
import { useDeactivateFunction, useTransitionFunction } from '../../features/functions/queries';
import { REASON_MAX } from '../../features/functions/schema';
import { InlineAlert } from '../../features/functions/InlineAlert';
import { errorMessage } from '../../utils/errors';
import type { AdminFunction, FunctionTransition } from '../../types/adminFunctions';

interface Props {
  record: AdminFunction;
  dirty: boolean;
  busy: boolean;
}

type Dialog = 'reject' | 'deactivate' | null;

export function FunctionWorkflow({ record, dirty, busy }: Props) {
  const { hasPermission } = useAuth();
  const { t } = useI18n();
  const transition = useTransitionFunction(record.id);
  const deactivate = useDeactivateFunction(record.id);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<unknown>(null);
  const running = transition.isPending || deactivate.isPending;
  const disabled = dirty || busy;

  const canSubmit = record.status === 'DRAFT' && hasPermission('FUNCTIONS_SUBMIT_REVIEW');
  const canReview = record.status === 'PENDING_REVIEW' && hasPermission('FUNCTIONS_REVIEW');
  const canPublish = record.status === 'PENDING_REVIEW' && hasPermission('FUNCTIONS_PUBLISH');
  const canDeactivate = record.status === 'PUBLISHED' && hasPermission('FUNCTIONS_DEACTIVATE');
  const canReactivate = record.status === 'DEACTIVATED' && hasPermission('FUNCTIONS_REACTIVATE');
  if (!(canSubmit || canReview || canPublish || canDeactivate || canReactivate)) return null;

  async function run(action: FunctionTransition | 'deactivate') {
    if (disabled) return;
    setError(null);
    try {
      if (action === 'deactivate') {
        await deactivate.mutateAsync(undefined);
      } else {
        await transition.mutateAsync({ action, reason: action === 'reject' ? reason.trim() : undefined });
      }
      setDialog(null);
      setReason('');
      toast.success(t('fnAdmin.saved'));
    } catch (failure) {
      setError(failure);
    }
  }

  const openDialog = (next: Exclude<Dialog, null>) => {
    setError(null);
    setDialog(next);
  };

  const submitReject = (event: FormEvent) => {
    event.preventDefault();
    void run('reject');
  };

  return (
    <Card>
      <CardHeader title={t('fnAdmin.workflow', 'Workflow')} icon={<WorkflowIcon className="h-4 w-4" />} />
      <CardBody className="space-y-3">
        <div className="grid gap-2">
          {canSubmit && (
            <Button icon={<SendIcon />} disabled={disabled || record.organizationId === null} loading={transition.isPending} onClick={() => void run('submit-for-review')}>
              {t('fnAdmin.submit')}
            </Button>
          )}
          {canPublish && (
            <Button variant="gradient" icon={<CheckCircle2Icon />} disabled={disabled} loading={transition.isPending} onClick={() => void run('publish')}>
              {t('fnAdmin.publish')}
            </Button>
          )}
          {canReview && (
            <Button variant="outline" icon={<UndoIcon />} disabled={disabled} onClick={() => openDialog('reject')}>
              {t('fnAdmin.reject')}
            </Button>
          )}
          {canReactivate && (
            <Button icon={<RotateCcwIcon />} disabled={disabled} loading={transition.isPending} onClick={() => void run('reactivate')}>
              {t('fnAdmin.reactivate')}
            </Button>
          )}
          {canDeactivate && (
            <Button variant="danger" icon={<PowerOffIcon />} disabled={disabled} onClick={() => openDialog('deactivate')}>
              {t('action.deactivate')}
            </Button>
          )}
        </div>
        {dirty && <InlineAlert tone="warning">{t('fnAdmin.saveFirst')}</InlineAlert>}
        {canSubmit && record.organizationId === null && <InlineAlert tone="warning">{t('fnAdmin.assignFirst')}</InlineAlert>}
        {Boolean(error) && dialog !== 'reject' && <InlineAlert tone="danger">{errorMessage(error, t)}</InlineAlert>}
      </CardBody>

      <Modal
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        closeDisabled={running}
        title={t('fnAdmin.reject')}
        icon={<UndoIcon className="h-4 w-4" />}
      >
        <form className="space-y-4" onSubmit={submitReject}>
          <Field label={t('fnAdmin.reason')} required>
            {(control) => (
              <Textarea {...control} rows={4} maxLength={REASON_MAX} value={reason} disabled={running} onChange={(event) => setReason(event.target.value)} />
            )}
          </Field>
          {Boolean(error) && <InlineAlert tone="danger">{errorMessage(error, t)}</InlineAlert>}
          <div className="flex justify-end">
            <Button type="submit" icon={<UndoIcon />} loading={running} disabled={disabled || !reason.trim()}>
              {t('fnAdmin.reject')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={dialog === 'deactivate'}
        onClose={() => setDialog(null)}
        onConfirm={() => void run('deactivate')}
        loading={running}
        title={t('action.deactivate')}
        message={t('fnAdmin.deactivateConfirm')}
        confirmLabel={t('action.deactivate')}
        cancelLabel={t('action.cancel')}
      />
    </Card>
  );
}
