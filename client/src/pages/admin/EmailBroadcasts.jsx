import { useState, useEffect } from 'react';
import { Mail, Send, Loader2, Users, Eye, Trash2, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import RichTextEditor from '../../components/ui/RichTextEditor';
import { broadcastApi } from '../../lib/api';
import { formatDate, cn } from '../../lib/utils';

const SEGMENTS = [
  { value: 'all',              label: 'All users' },
  { value: 'sponsor',          label: 'Sponsors' },
  { value: 'community_leader', label: 'Community leaders' },
  { value: 'volunteer',        label: 'Volunteers' },
];

const isEmptyHtml = (h) => !h || h === '<p></p>' || h.trim() === '<p></p>';

export default function EmailBroadcasts() {
  const [subject, setSubject] = useState('');
  const [segment, setSegment] = useState('all');
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = () => {
    broadcastApi.getAll()
      .then(setHistory)
      .catch(() => toast.error('Failed to load broadcast history.'))
      .finally(() => setLoading(false));
  };
  useEffect(loadHistory, []);

  const handleSend = async () => {
    if (!subject.trim()) return toast.error('Add a subject.');
    if (isEmptyHtml(body)) return toast.error('Write a message body.');
    const segLabel = SEGMENTS.find(s => s.value === segment)?.label || 'recipients';
    if (!window.confirm(`Send this email to ${segLabel}? This cannot be undone.`)) return;

    setSending(true);
    try {
      const draft = await broadcastApi.create({ subject: subject.trim(), bodyHtml: body, segment });
      const res = await broadcastApi.send(draft._id || draft.id);
      toast.success(`Broadcast sent to ${res?.recipientCount ?? 0} recipient(s).`);
      setSubject(''); setBody(''); setSegment('all'); setPreview(false);
      loadHistory();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to send broadcast.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (b) => {
    if (!window.confirm('Delete this broadcast record?')) return;
    try {
      await broadcastApi.remove(b._id || b.id);
      setHistory(prev => prev.filter(x => (x._id || x.id) !== (b._id || b.id)));
    } catch {
      toast.error('Failed to delete.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">Email Broadcasts</h1>
        <p className="text-sm text-gray-500 mt-1">Send announcements and campaigns to your audience. Recipients who opted out are automatically excluded.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        {/* Composer */}
        <div className="card p-6 flex flex-col gap-5">
          <Input label="Subject" placeholder="e.g. New campaigns need your support this month" value={subject} onChange={(e) => setSubject(e.target.value)} />

          <div>
            <label className="block text-sm font-medium text-[#1a1a2e] mb-1.5">Audience</label>
            <div className="flex flex-wrap gap-2">
              {SEGMENTS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setSegment(s.value)}
                  className={cn(
                    'px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-1.5',
                    segment === s.value ? 'border-brand-500 bg-brand-50 text-brand-700 font-semibold' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}
                >
                  <Users size={13} /> {s.label}
                </button>
              ))}
            </div>
          </div>

          {preview ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-[#1a1a2e]">Preview</label>
                <button onClick={() => setPreview(false)} className="text-xs text-brand-600 font-semibold">← Back to editor</button>
              </div>
              <div className="rounded-xl border border-gray-200 p-6 bg-gray-50">
                <div className="max-w-lg mx-auto bg-white rounded-lg p-6 shadow-sm">
                  <div className="inline-block bg-[#00684A] rounded-md px-3 py-1 mb-4">
                    <span className="text-[#00ED64] font-black text-sm tracking-tight">RIVERS</span>
                  </div>
                  <h2 className="text-xl font-black text-[#001E2B] mb-3">{subject || 'Subject preview'}</h2>
                  <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: body || '<p>Your message…</p>' }} />
                  <p className="text-[11px] text-gray-400 mt-6">Rivers Impact Platform · Kigali, Rwanda · Unsubscribe</p>
                </div>
              </div>
            </div>
          ) : (
            <RichTextEditor label="Message" value={body} onChange={setBody} placeholder="Write your announcement…" />
          )}

          <div className="flex items-center gap-2">
            <Button variant="secondary" leftIcon={<Eye size={15} />} onClick={() => setPreview(p => !p)}>
              {preview ? 'Edit' : 'Preview'}
            </Button>
            <Button leftIcon={sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} onClick={handleSend} loading={sending}>
              Send broadcast
            </Button>
          </div>
        </div>

        {/* History */}
        <div className="card p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Mail size={15} className="text-gray-400" />
            <h3 className="font-semibold text-sm text-[#001E2B]">Recent broadcasts</h3>
          </div>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner size={22} className="text-brand-500" /></div>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">No broadcasts sent yet.</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100">
              {history.map(b => (
                <div key={b._id || b.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#001E2B] truncate">{b.subject}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                      <span className="capitalize">{(b.segment || 'all').replace('_', ' ')}</span>
                      <span>·</span>
                      {b.status === 'sent' ? (
                        <span className="flex items-center gap-1 text-forest-600"><CheckCircle2 size={11} /> {b.recipientCount} sent</span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-600"><Clock size={11} /> {b.status}</span>
                      )}
                      {b.sentAt && <span>· {formatDate(b.sentAt)}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(b)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0" title="Delete record">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
