import type { TreeholePostView } from '@/features/treehole/types';
import { TreeholePostCard } from './treehole-post-card';

export function TreeholePostGrid({ posts, showActions = false }: { posts: TreeholePostView[]; showActions?: boolean }) {
  if (posts.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[rgba(200,155,100,0.14)] bg-[rgba(36,24,17,0.22)] p-10 text-center text-sm tracking-[0.24em] text-amber-50/52 shadow-[inset_0_1px_0_rgba(255,244,226,0.02)]">邮局里还没有信。</p>;
  }

  return (
    <div className="w-full min-w-0 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <TreeholePostCard key={post.id} post={post} showActions={showActions} />
      ))}
    </div>
  );
}
