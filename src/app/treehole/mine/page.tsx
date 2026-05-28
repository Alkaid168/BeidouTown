import Link from 'next/link';
import { TreeholeMyPosts } from '@/components/treehole/treehole-my-posts';
import { TreeholeShell } from '@/components/treehole/treehole-shell';
import { getCurrentResident } from '@/features/residents/session';
import { listResidentTreeholePosts } from '@/features/treehole/posts';

export default async function TreeholeMinePage() {
  const resident = await getCurrentResident();
  const posts = await listResidentTreeholePosts(resident);

  return (
    <TreeholeShell
      backgroundImage="/treehole-background.jpg"
      eyebrow="MY LETTERS"
      returnHref="/treehole"
      returnLabel="回到邮局"
      title="我的信件"
    >
      {resident ? (
        <TreeholeMyPosts posts={posts.filter((post) => !post.isDeleted)} />
      ) : (
        <div className="rounded-[0.35rem] border border-[rgba(232,188,128,0.20)] bg-[linear-gradient(175deg,rgba(30,20,13,0.68),rgba(14,10,7,0.78))] p-10 text-center shadow-[inset_0_1px_0_rgba(255,244,226,0.06),0_24px_56px_rgba(0,0,0,0.34)]">
          <p className="text-2xl text-stone-100">登录后查看</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link className="border-0 bg-transparent px-1 py-3 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]" href="/login">
              登录
            </Link>
            <Link className="border-0 bg-transparent px-1 py-3 text-sm tracking-[0.45em] text-stone-100/58 transition duration-500 hover:text-white hover:drop-shadow-[0_0_14px_rgba(255,214,245,0.85)]" href="/register">
              成为居民
            </Link>
          </div>
        </div>
      )}
    </TreeholeShell>
  );
}
