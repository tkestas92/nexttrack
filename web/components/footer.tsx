export function Footer() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Embeddings and metadata only. Previews play from Deezer.</p>
        <nav aria-label="Site" className="flex gap-5">
          <a
            href="https://github.com/tkestas92/nexttrack"
            className="text-cream underline-offset-4 hover:underline"
          >
            GitHub
          </a>
          <a
            href="https://kantrybes.lt"
            className="text-cream underline-offset-4 hover:underline"
          >
            kantrybes.lt
          </a>
        </nav>
      </div>
    </footer>
  );
}
