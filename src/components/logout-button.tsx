import { logoutResidentAction } from '@/features/residents/actions';

export function LogoutButton() {
  return (
    <form action={logoutResidentAction}>
      <button className="rounded-full border border-stone-400/30 px-4 py-2 text-sm text-stone-200 transition hover:border-amber-200/60 hover:text-amber-100" type="submit">
        离开小镇
      </button>
    </form>
  );
}
