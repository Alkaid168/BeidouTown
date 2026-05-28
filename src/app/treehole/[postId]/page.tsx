import { notFound } from 'next/navigation';
import { TreeholePostDetail } from '@/components/treehole/treehole-post-detail';
import { TreeholeShell } from '@/components/treehole/treehole-shell';
import { getCurrentResident } from '@/features/residents/session';
import { getTreeholePostDetail } from '@/features/treehole/posts';

export default async function TreeholePostDetailPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  const resident = await getCurrentResident();
  const detail = await getTreeholePostDetail(resident, postId);

  if (!detail) {
    notFound();
  }

  return (
    <TreeholeShell
      backgroundImage="/treehole-letter-background.jpg"
      eyebrow="OPEN LETTER"
      returnHref="/treehole"
      returnLabel="回到邮局"
      title="信"
    >
      <TreeholePostDetail post={detail.post} replies={detail.replies} resident={resident} />
    </TreeholeShell>
  );
}
