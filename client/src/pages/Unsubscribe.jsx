import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MailX, CheckCircle2, AlertCircle } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import { authApi } from '../lib/api';

export default function Unsubscribe() {
  const { token } = useParams();
  const [state, setState] = useState('loading'); // loading | done | error

  useEffect(() => {
    authApi.unsubscribe(token)
      .then((ok) => setState(ok ? 'done' : 'error'))
      .catch(() => setState('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-10 text-center flex flex-col items-center gap-4">
        {state === 'loading' && <Spinner size={28} className="text-[#00684A]" />}

        {state === 'done' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-forest-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-forest-600" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#001E2B]">You've been unsubscribed</h1>
              <p className="text-sm text-gray-500 mt-2">You will no longer receive email notifications from RIVERS. You can re-enable them anytime in your account settings.</p>
            </div>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <AlertCircle size={28} className="text-gray-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#001E2B]">Link not recognised</h1>
              <p className="text-sm text-gray-500 mt-2">This unsubscribe link is invalid or has expired. You can manage email preferences from your account settings.</p>
            </div>
          </>
        )}

        {state !== 'loading' && (
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00684A] hover:underline mt-2">
            <MailX size={14} /> Back to RIVERS
          </Link>
        )}
      </div>
    </div>
  );
}
