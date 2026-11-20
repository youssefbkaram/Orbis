import { Suspense } from "react";

export default async function WorkspacePlaceholder({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  return (
    <Suspense fallback={<div aria-hidden="true" className="min-h-24" />}>
      <WorkspacePlaceholderContent params={params} />
    </Suspense>
  );
}

async function WorkspacePlaceholderContent({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const title = slug
    .at(-1)
    ?.replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <section>
      <p className="text-sm font-medium text-primary">WORKSPACE</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        This space is ready for you to build. The Orbis app shell will stay in
        place as you add the page content.
      </p>
    </section>
  );
}
