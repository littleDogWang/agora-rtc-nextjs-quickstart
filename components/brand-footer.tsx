import Image from 'next/image';

export function BrandFooter() {
  return (
    <footer className="fixed bottom-0 right-0 z-40 flex items-center gap-2 px-4 py-5 text-xs font-medium uppercase tracking-wide text-muted-foreground md:px-6">
      <span>Powered by</span>
      <a href="https://www.agora.io/en/" target="_blank" rel="noreferrer" aria-label="Visit Agora">
        <Image src="/agora-logo-rgb-blue.svg" alt="Agora" width={86} height={24} className="h-6 w-auto" />
      </a>
    </footer>
  );
}
