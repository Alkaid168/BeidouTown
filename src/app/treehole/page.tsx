import { TreeholeClient } from '@/components/treehole/treehole-client';
import { getCurrentResident } from '@/features/residents/session';
import { listRecentTreeholePosts } from '@/features/treehole/posts';

export default async function TreeholePage() {
  const resident = await getCurrentResident();
  const posts = await listRecentTreeholePosts(resident);

  return (
    <main className="min-h-screen overflow-hidden bg-[#02030a] px-6 py-8 text-stone-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(79,70,229,0.26),transparent_32%),radial-gradient(circle_at_82%_8%,rgba(234,179,8,0.10),transparent_26%),linear-gradient(180deg,rgba(15,23,42,0),#02030a_80%)]" />
      <div className="relative mx-auto w-full max-w-6xl">
        <TreeholeClient initialPosts={posts} resident={resident} />
      </div>
    </main>
  );
}
