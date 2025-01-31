import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800">404 – Not found</h1>
        <Link href="/" className="mt-4 inline-block text-teal-600 hover:underline">
          Back to MedflowX
        </Link>
      </div>
    </div>
  );
}
