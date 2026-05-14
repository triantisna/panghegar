export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col gap-4 animate-pulse">
      <div className="h-10 w-1/3 bg-slate-200 rounded" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 h-64 bg-slate-200 rounded-xl" />
        <div className="h-64 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}