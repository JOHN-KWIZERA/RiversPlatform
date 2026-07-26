import { Link } from 'react-router-dom';
import RiversMark from '../ui/RiversMark';

export function LegalPage({ title, updated, children }) {
  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <header className="bg-[#001E2B] h-14 flex items-center px-6 sm:px-10 justify-between flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5">
          <RiversMark size={32} />
          <span className="font-black text-white tracking-tight">RIVERS</span>
        </Link>
        <Link to="/" className="text-sm text-[#889397] hover:text-white transition-colors">Back to home</Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-[#001E2B]">{title}</h1>
        <p className="text-sm text-gray-400 mt-1">Last updated: {updated}</p>

        <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <section className="mb-7 last:mb-0">
      <h2 className="text-base font-black text-[#001E2B] mb-2">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1">
        {children}
      </div>
    </section>
  );
}
