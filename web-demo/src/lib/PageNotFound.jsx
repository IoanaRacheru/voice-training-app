import { useLocation } from "react-router-dom";

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md border-2 border-foreground bg-white p-8 text-center shadow-[7px_7px_0_rgba(17,17,17,0.14)]">
        <p className="inline-block bg-foreground px-2 py-1 font-mono text-[11px] uppercase text-white">
          Error 404
        </p>

        <h1 className="mt-5 font-display text-7xl uppercase leading-none text-primary">
          Missing
        </h1>

        <p className="mt-4 text-sm font-semibold uppercase leading-6 text-muted-foreground">
          The page <span className="font-black text-foreground">"{pageName}"</span> could not be found in this application.
        </p>

        <button
          onClick={() => {
            window.location.href = "/";
          }}
          className="mt-8 inline-flex items-center border-2 border-foreground bg-foreground px-4 py-2 text-sm font-black uppercase text-white shadow-[4px_4px_0_#e50914] hover:bg-primary"
        >
          Go home
        </button>
      </div>
    </div>
  );
}
