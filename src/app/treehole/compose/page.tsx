import { TreeholeComposeForm } from '@/components/treehole/treehole-compose-form';
import { TreeholeShell } from '@/components/treehole/treehole-shell';
import { getCurrentResident } from '@/features/residents/session';

export default async function TreeholeComposePage() {
  const resident = await getCurrentResident();

  return (
    <TreeholeShell
      backgroundImage="/treehole-compose-background.png"
      eyebrow="WRITE A LETTER"
      title="投稿"
    >
      <TreeholeComposeForm resident={resident} />
    </TreeholeShell>
  );
}
