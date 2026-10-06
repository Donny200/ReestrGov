import { ListRow } from '../ui/ListRow';
import { Badge } from '../ui/Badge';
import type { CatalogFunction } from '../../types/api';
import { truncate } from '../../utils/format';
import { useI18n } from '../../contexts/i18n';
import { localizedText } from '../../utils/translations';

interface FunctionListRowProps {
  item: CatalogFunction;
  index: number;
  organizationName: string | undefined;
}

export function FunctionListRow({ item, index, organizationName }: FunctionListRowProps) {
  const { t, locale } = useI18n();
  const name = localizedText(item.name, item.nameTranslations, locale) ?? item.name;
  const description = localizedText(item.description, item.descriptionTranslations, locale);

  return (
    <ListRow
      to={`/functions/${item.id}`}
      index={index}
      title={name}
      lang={locale}
      secondary={description ? truncate(description, 160) : undefined}
      meta={
        <>
          <Badge size="sm">{organizationName ?? t('fn.organizationUnknown', 'Organization unknown')}</Badge>
          {item.category && <Badge size="sm" tone="accent">{item.category}</Badge>}
        </>
      }
    />
  );
}
