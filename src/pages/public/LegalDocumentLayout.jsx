import rekntekLogo from "../../assets/rekntek_logo.png";

export default function LegalDocumentLayout({ title, lastUpdated, children }) {
  return (
    <div className="legal-doc min-h-screen w-full flex flex-col bg-[#F5F5F5]">
      <header className="shrink-0 w-full border-b border-black/[0.06] bg-[#F5F5F5] px-4 sm:px-8 py-4">
        <div className="w-full flex items-center">
          <img src={rekntekLogo} alt="Platters.io" className="h-9 w-auto object-contain sm:h-10" />
        </div>
      </header>

      <div className="w-full flex-1 px-4 py-8 sm:px-8">
        <div className="w-full">
          <h1 className="legal-doc__title">{title}</h1>
          <p className="legal-doc__updated mt-2">Last updated: {lastUpdated}</p>

          <article className="mt-8 w-full rounded-none bg-white px-6 py-10 sm:px-8 sm:py-10 lg:px-10 lg:py-10 shadow-none">
            <div className="flex w-full flex-col gap-8">{children}</div>
          </article>
        </div>
      </div>
    </div>
  );
}
