export function SamplePreviewCard() {
  return (
    <div className="dsg-card overflow-hidden lg:sticky lg:top-6">
      <div className="p-5 border-b border-dsg-gray-200">
        <h3 className="dsg-section-header text-base">What you'll get</h3>
        <p className="text-xs text-dsg-gray-500 mt-1">
          One DSG-branded Word document. Sixty to ninety seconds.
        </p>
      </div>
      <div className="p-5">
        <div
          className="aspect-[8.5/11] rounded border border-dsg-gray-200 bg-white shadow-sm overflow-hidden"
          aria-label="Sample dossier preview"
        >
          <div className="h-2 bg-dsg-red" />
          <div className="p-4 space-y-3">
            <div>
              <div className="h-2 w-20 bg-dsg-navy/60 rounded" />
              <div className="mt-1 h-3 w-40 bg-dsg-gray-900/80 rounded" />
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-dsg-gray-200 rounded" />
              <div className="h-1.5 w-11/12 bg-dsg-gray-200 rounded" />
              <div className="h-1.5 w-10/12 bg-dsg-gray-200 rounded" />
            </div>
            <div className="border-l-2 border-dsg-navy pl-2">
              <div className="h-1.5 w-32 bg-dsg-gray-300 rounded" />
              <div className="mt-1 h-1.5 w-44 bg-dsg-gray-200 rounded" />
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 w-full bg-dsg-gray-200 rounded" />
              <div className="h-1.5 w-9/12 bg-dsg-gray-200 rounded" />
              <div className="h-1.5 w-11/12 bg-dsg-gray-200 rounded" />
              <div className="h-1.5 w-10/12 bg-dsg-gray-200 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="space-y-1">
                <div className="h-1.5 w-16 bg-dsg-navy/40 rounded" />
                <div className="h-1.5 w-full bg-dsg-gray-200 rounded" />
                <div className="h-1.5 w-3/4 bg-dsg-gray-200 rounded" />
              </div>
              <div className="space-y-1">
                <div className="h-1.5 w-16 bg-dsg-navy/40 rounded" />
                <div className="h-1.5 w-full bg-dsg-gray-200 rounded" />
                <div className="h-1.5 w-2/3 bg-dsg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>
        <ul className="mt-5 space-y-2 text-xs text-dsg-gray-700">
          <li>Six research phases. One document.</li>
          <li>Web signals, CRM history, email touchpoints.</li>
          <li>Opening line drafted for the meeting in your inputs.</li>
        </ul>
      </div>
    </div>
  );
}
