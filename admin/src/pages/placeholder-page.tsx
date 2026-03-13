type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div>
      <h1>{title}</h1>
      <p className="hint">Connect this page to its FastAPI endpoints.</p>
    </div>
  );
}
