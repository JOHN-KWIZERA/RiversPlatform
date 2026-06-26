import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
  Phone, Mail, Linkedin, FileText, Globe, Calendar, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import { opportunityApi } from '../../lib/api';
import { formatDate, cn } from '../../lib/utils';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted: { label: 'Accepted', className: 'bg-forest-50 text-forest-700 border-forest-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-600 border-red-200' },
};

function StatPill({ label, value, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-colors',
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
      )}
    >
      <span className={cn('text-lg font-black', active ? 'text-white' : 'text-gray-900')}>{value}</span>
      {label}
    </button>
  );
}

function ApplicantRow({ app, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
  const name = app.applicant?.fullName || '—';
  const email = app.applicant?.email || '—';

  const update = async (newStatus) => {
    setUpdating(true);
    try {
      await opportunityApi.updateApplicationStatus(app.opportunityId, app.id, newStatus);
      onStatusChange(app.id, newStatus);
      toast.success(newStatus === 'accepted' ? 'Applicant accepted.' : 'Applicant rejected.');
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Summary row */}
      <div
        className="flex items-center gap-4 px-5 py-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <Avatar name={name} size="sm" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
          <p className="text-xs text-gray-400 truncate">{email}</p>
        </div>

        <p className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
          Applied {formatDate(app.appliedAt)}
        </p>

        <span className={cn('badge border text-xs flex-shrink-0', status.className)}>
          {status.label}
        </span>

        {app.status === 'pending' && (
          <div className="flex gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
            <button
              disabled={updating}
              onClick={() => update('accepted')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-forest-50 text-forest-700 border border-forest-200 text-xs font-semibold hover:bg-forest-100 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={12} /> Accept
            </button>
            <button
              disabled={updating}
              onClick={() => update('rejected')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <XCircle size={12} /> Reject
            </button>
          </div>
        )}

        {app.status !== 'pending' && (
          <div className="flex gap-1.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
            {app.status === 'accepted' && (
              <button
                disabled={updating}
                onClick={() => update('rejected')}
                className="px-2.5 py-1 rounded-md bg-white text-gray-500 border border-gray-200 text-xs font-medium hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            )}
            {app.status === 'rejected' && (
              <button
                disabled={updating}
                onClick={() => update('accepted')}
                className="px-2.5 py-1 rounded-md bg-white text-gray-500 border border-gray-200 text-xs font-medium hover:border-gray-300 transition-colors disabled:opacity-50"
              >
                Accept
              </button>
            )}
          </div>
        )}

        <div className="text-gray-400 flex-shrink-0">
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-5 flex flex-col gap-5">

          {/* Contact info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {app.phone && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Phone size={12} className="text-gray-400 flex-shrink-0" />
                {app.phone}
              </div>
            )}
            {app.applicant?.email && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Mail size={12} className="text-gray-400 flex-shrink-0" />
                {app.applicant.email}
              </div>
            )}
            {app.linkedIn && (
              <a
                href={app.linkedIn.startsWith('http') ? app.linkedIn : `https://${app.linkedIn}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-brand-600 hover:underline"
              >
                <Linkedin size={12} className="flex-shrink-0" />
                LinkedIn
                <ExternalLink size={10} />
              </a>
            )}
            {app.availableFrom && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                Available {formatDate(app.availableFrom)}
              </div>
            )}
            {app.hoursPerWeek && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Clock size={12} className="text-gray-400 flex-shrink-0" />
                {app.hoursPerWeek} hrs/week
              </div>
            )}
          </div>

          {/* Languages */}
          {app.languages?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Globe size={12} className="text-gray-400" />
              {app.languages.map(l => (
                <span key={l} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[11px] text-gray-600 font-medium">{l}</span>
              ))}
            </div>
          )}

          {/* Cover letter */}
          {app.coverLetter && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Cover Letter</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white rounded-lg p-4 border border-gray-100">
                {app.coverLetter}
              </p>
            </div>
          )}

          {/* Experience */}
          {app.experience && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Skills & Experience</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white rounded-lg p-4 border border-gray-100">
                {app.experience}
              </p>
            </div>
          )}

          {/* Documents */}
          {(app.cvUrl || app.idDocumentUrl) && (
            <div className="flex gap-3">
              {app.cvUrl && (
                <a
                  href={app.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:border-gray-300 transition-colors"
                >
                  <FileText size={13} className="text-gray-400" /> View CV
                  <ExternalLink size={10} className="text-gray-400" />
                </a>
              )}
              {app.idDocumentUrl && (
                <a
                  href={app.idDocumentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:border-gray-300 transition-colors"
                >
                  <FileText size={13} className="text-gray-400" /> View ID
                  <ExternalLink size={10} className="text-gray-400" />
                </a>
              )}
            </div>
          )}

          {/* Emergency contact */}
          {app.emergencyContactName && (
            <div className="text-xs text-gray-500 bg-white border border-gray-100 rounded-lg px-4 py-3">
              <span className="font-semibold text-gray-700">Emergency contact: </span>
              {app.emergencyContactName}
              {app.emergencyContactPhone && ` · ${app.emergencyContactPhone}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OpportunityApplicants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opp, setOpp] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    Promise.all([
      opportunityApi.getById(id),
      opportunityApi.getApplications(id),
    ]).then(([oppData, apps]) => {
      setOpp(oppData);
      setApplications(apps);
    }).catch(() => {
      toast.error('Could not load applicants.');
      navigate(`/dashboard/opportunities/${id}`);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = (appId, newStatus) => {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
  };

  if (loading) {
    return <div className="flex justify-center py-24"><Spinner size={28} className="text-brand-500" /></div>;
  }

  const counts = {
    all:      applications.length,
    pending:  applications.filter(a => a.status === 'pending').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  const visible = filter === 'all' ? applications : applications.filter(a => a.status === filter);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate(`/dashboard/opportunities/${id}`)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-3 transition-colors"
          >
            <ArrowLeft size={15} /> Back to Opportunity
          </button>
          <h1 className="page-header">Applicants</h1>
          {opp && (
            <p className="text-sm text-gray-500 mt-1">{opp.title}</p>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        <StatPill label="All"      value={counts.all}      active={filter === 'all'}      onClick={() => setFilter('all')} />
        <StatPill label="Pending"  value={counts.pending}  active={filter === 'pending'}  onClick={() => setFilter('pending')} />
        <StatPill label="Accepted" value={counts.accepted} active={filter === 'accepted'} onClick={() => setFilter('accepted')} />
        <StatPill label="Rejected" value={counts.rejected} active={filter === 'rejected'} onClick={() => setFilter('rejected')} />
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="card p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Users size={22} className="text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500">
            {filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
          </p>
          <p className="text-xs text-gray-400">
            {filter === 'all' ? 'Applications will appear here once volunteers apply.' : 'Change the filter to see other applications.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visible.map(app => (
            <ApplicantRow
              key={app.id}
              app={app}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
