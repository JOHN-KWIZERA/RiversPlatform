import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Download, FileX, ArrowLeft, Link2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import ReportView from '../components/reports/ReportView';
import { sharedReportApi } from '../lib/api';

export default function ReportViewerPage() {
  const { token } = useParams();
  const [report, setReport] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | error
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link.');
    }
  };

  useEffect(() => {
    let active = true;
    sharedReportApi.getByToken(token)
      .then((data) => {
        if (!active) return;
        if (data && data.snapshot) { setReport(data); setState('ready'); }
        else setState('error');
      })
      .catch(() => active && setState('error'));
    return () => { active = false; };
  }, [token]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner size={32} className="text-[#00684A]" />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
          <FileX size={28} className="text-gray-300" />
        </div>
        <div>
          <p className="font-black text-[#001E2B] text-lg">Report not found</p>
          <p className="text-sm text-gray-400 mt-1">This share link is invalid or has been removed.</p>
        </div>
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00684A] hover:underline">
          <ArrowLeft size={14} /> Back to RIVERS
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-sm font-black tracking-tight text-[#001E2B]">RIVERS</Link>
          <div className="flex items-center gap-2">
            <button
              onClick={copyLink}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-[#001E2B] border border-gray-200 text-sm font-bold rounded-xl transition-colors"
            >
              {copied ? <Check size={15} className="text-forest-600" /> : <Link2 size={15} />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#001E2B] hover:bg-[#002d42] text-white text-sm font-bold rounded-xl transition-colors"
            >
              <Download size={15} /> Download PDF
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-10">
        <ReportView title={report.title} snapshot={report.snapshot} config={report.config} />
      </div>
    </div>
  );
}
