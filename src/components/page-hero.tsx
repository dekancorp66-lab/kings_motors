export function PageHero({
  eyebrow,
  title,
  subtitle,
  image,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  image: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-navy">
      <img
        src={image}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-55"
      />
      <div className="absolute inset-0 bg-linear-to-r from-navy via-navy/80 to-navy/40" />
      <div className="relative mx-auto flex min-h-[22rem] max-w-4xl flex-col items-center justify-center px-5 py-20 text-center">
        {eyebrow ? (
          <p className="text-[0.7rem] font-semibold tracking-[0.28em] text-inverse/70 uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 font-serif text-4xl text-inverse md:text-6xl">{title}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-inverse/75 md:text-base">{subtitle}</p>
      </div>
    </section>
  );
}
