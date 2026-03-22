import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { getSafeNext } from '@/features/auth/redirects';

interface Props {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SignUpPage({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const nextValue = Array.isArray(resolvedSearchParams.next)
    ? resolvedSearchParams.next[0]
    : resolvedSearchParams.next;
  const next = getSafeNext(nextValue);

  return (
    <div className="min-h-screen bg-bg-main flex flex-col items-center justify-center p-4">
      <SignUpForm next={next} />
    </div>
  );
}
