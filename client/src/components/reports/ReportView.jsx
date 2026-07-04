import {
  BarChart3, ShieldCheck, ClipboardList, Layers, Heart, AlignLeft, Globe,
} from 'lucide-react';
import RiversMark from '../ui/RiversMark';
import { formatCurrency, formatDate, progressPercent } from '../../lib/utils';

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n').replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n').trim();
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-4 py-6 text-center min-w-0 overflow-hidden">
      <p className="text-lg sm:text-xl lg:text-2xl font-black text-[#001E2B] leading-tight break-words tabular-nums">{value}</p>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mt-2">{label}</p>
    </div>
  );
}

function SectionHeader({ num, title, Icon }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-xl bg-[#001E2B] flex items-center justify-center flex-shrink-0">
        {Icon ? <Icon size={18} className="text-[#00ED64]" /> : <span className="text-[#00ED64] font-black text-sm">{num}</span>}
      </div>
      <h2 className="text-xl font-black text-[#001E2B]">{title}</h2>
    </div>
  );
}

function Table({ head, rows, align = {} }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100">
      <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {head.map((h, i) => (
              <th key={h} className={`px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide ${align[i] === 'right' ? 'text-right' : 'text-left'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-gray-50 last:border-0 even:bg-gray-50/40">
              {r.map((cell, ci) => (
                <td key={ci} className={`px-4 py-3 text-gray-700 ${align[ci] === 'right' ? 'text-right font-semibold text-[#001E2B]' : ''}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TYPE_LINES = {
  campaign: ['Campaign', 'Impact Report'],
  platform: ['Platform', 'Impact Report'],
  donor:    ['Donation', 'Summary'],
};

export default function ReportView({ title, snapshot = {} }) {
  const type = snapshot.type || 'campaign';
  const sections = snapshot.sections || {};
  const [line1, line2] = TYPE_LINES[type] || TYPE_LINES.campaign;
  const campaigns = snapshot.campaigns || [];
  const totals = snapshot.totals || {};
  const analytics = snapshot.analytics || {};
  const generated = snapshot.generatedAt ? formatDate(snapshot.generatedAt) : '';
  let num = 0;

  return (
    <div className="max-w-4xl mx-auto [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
      {/* Cover band */}
      <div className="relative overflow-hidden rounded-3xl bg-[#001E2B] p-8 sm:p-12 mb-8">
        <div className="w-10 h-0.5 bg-[#00ED64] mb-6" />
        <div className="flex items-center gap-2 mb-6">
          <RiversMark size={26} />
          <span className="text-[11px] font-black tracking-[0.3em] text-white/50 uppercase">Rivers Platform</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white leading-none">{line1}</h1>
        <h2 className="text-2xl sm:text-3xl font-black text-white/60 leading-none mt-1">{line2}</h2>
        <p className="text-white/70 mt-5 max-w-xl">{title || snapshot.title}</p>
        {(snapshot.dateFrom || snapshot.dateTo) && (
          <p className="text-white/40 text-sm mt-3">
            Period: {snapshot.dateFrom || '—'} → {snapshot.dateTo || 'present'}
          </p>
        )}
        <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-x-10 gap-y-2 text-sm">
          {type === 'campaign' && (
            <>
              <span className="text-white/50">Campaigns <b className="text-white ml-1">{campaigns.length}</b></span>
              <span className="text-white/50">Total raised <b className="text-white ml-1">{formatCurrency(totals.raised || 0)}</b></span>
              <span className="text-white/50">Donors <b className="text-white ml-1">{totals.donors || 0}</b></span>
            </>
          )}
          {type === 'platform' && (
            <>
              <span className="text-white/50">Campaigns <b className="text-white ml-1">{analytics.totalCampaigns ?? '—'}</b></span>
              <span className="text-white/50">Total raised <b className="text-white ml-1">{formatCurrency(analytics.totalRaised || 0)}</b></span>
              <span className="text-white/50">Users <b className="text-white ml-1">{analytics.totalUsers ?? '—'}</b></span>
            </>
          )}
          {generated && <span className="text-white/50">Generated <b className="text-white ml-1">{generated}</b></span>}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* ── CAMPAIGN ─────────────────────────────────────── */}
        {type === 'campaign' && sections.overview && (
          <section>
            <SectionHeader num={++num} title="Overview" Icon={BarChart3} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <MetricCard label="Target" value={formatCurrency(totals.target || 0)} />
              <MetricCard label="Raised" value={formatCurrency(totals.raised || 0)} />
              <MetricCard label="Donors" value={totals.donors || 0} />
              <MetricCard label="Beneficiaries" value={totals.beneficiaries || 0} />
            </div>
            {campaigns.length > 0 && (
              <Table
                head={['Campaign', 'Status', 'Raised', '%', 'Donors']}
                align={{ 2: 'right', 3: 'right', 4: 'right' }}
                rows={campaigns.map((c) => [
                  c.title,
                  (c.status || '').replace(/_/g, ' '),
                  formatCurrency(c.raisedAmount || 0),
                  `${progressPercent(c.raisedAmount, c.targetAmount)}%`,
                  c.donorCount || 0,
                ])}
              />
            )}
          </section>
        )}

        {type === 'campaign' && sections.description && campaigns.some((c) => c.description) && (
          <section>
            <SectionHeader num={++num} title="Campaign Description" Icon={AlignLeft} />
            <div className="flex flex-col gap-4">
              {campaigns.filter((c) => c.description).map((c) => (
                <div key={c.id} className="border-l-4 border-[#00684A] bg-gray-50 rounded-r-2xl p-5">
                  <p className="font-bold text-[#001E2B] mb-1">{c.title}</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{stripHtml(c.description)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {type === 'campaign' && sections.moneyTrail && (snapshot.expenditures || []).length > 0 && (
          <section>
            <SectionHeader num={++num} title="Money Trail" Icon={ShieldCheck} />
            <Table
              head={['Date', 'Description', 'Category', 'Amount', 'Receipt']}
              align={{ 3: 'right' }}
              rows={snapshot.expenditures.map((e) => [
                e.date ? formatDate(e.date) : '—',
                e.description || '—',
                (e.category || '—').replace(/_/g, ' '),
                formatCurrency(e.amount || 0),
                e.hasReceipt ? 'Yes' : 'No',
              ])}
            />
          </section>
        )}

        {type === 'campaign' && sections.beneficiaries && (snapshot.beneficiaries || []).length > 0 && (
          <section>
            <SectionHeader num={++num} title="Beneficiary Register" Icon={ClipboardList} />
            <Table
              head={['Record ID', 'Grade', 'Age Band', 'Kit', 'Verified', 'Delivered']}
              rows={snapshot.beneficiaries.map((b) => [
                b.recordId || '—',
                b.grade || '—',
                b.ageBand || '—',
                b.kitType || '—',
                b.isVerified ? 'Yes' : 'No',
                b.deliveryConfirmed ? 'Yes' : 'No',
              ])}
            />
          </section>
        )}

        {type === 'campaign' && sections.milestones && (snapshot.milestones || []).length > 0 && (
          <section>
            <SectionHeader num={++num} title="Fund Release Milestones" Icon={Layers} />
            <Table
              head={['Milestone', 'Amount', 'Due Date', 'Status']}
              align={{ 1: 'right' }}
              rows={snapshot.milestones.map((m) => [
                m.title || '—',
                formatCurrency(m.targetAmount || 0),
                m.dueDate ? formatDate(m.dueDate) : '—',
                (m.status || '—').replace(/_/g, ' '),
              ])}
            />
          </section>
        )}

        {(type === 'campaign' || type === 'donor') && sections.donations && (snapshot.donations || []).length > 0 && (
          <section>
            <SectionHeader num={++num} title="Donation History" Icon={Heart} />
            <Table
              head={['Date', 'Campaign', 'Amount', 'Method', 'Status']}
              align={{ 2: 'right' }}
              rows={snapshot.donations.map((d) => [
                d.donatedAt ? formatDate(d.donatedAt) : '—',
                d.campaignTitle || '—',
                formatCurrency(d.amount || 0),
                (d.paymentMethod || '—').replace(/_/g, ' '),
                d.status || '—',
              ])}
            />
          </section>
        )}

        {/* ── PLATFORM ─────────────────────────────────────── */}
        {type === 'platform' && (
          <section>
            <SectionHeader num={++num} title="Platform Summary" Icon={Globe} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <MetricCard label="Total Campaigns" value={analytics.totalCampaigns ?? 0} />
              <MetricCard label="Active" value={analytics.activeCampaigns ?? 0} />
              <MetricCard label="Total Raised" value={formatCurrency(analytics.totalRaised || 0)} />
              <MetricCard label="Users" value={analytics.totalUsers ?? 0} />
            </div>
            <Table
              head={['Metric', 'Value']}
              align={{ 1: 'right' }}
              rows={[
                ['Families Supported', analytics.familiesSupported ?? '—'],
                ['Campaign Success Rate', analytics.successRate != null ? `${analytics.successRate}%` : '—'],
                ...((analytics.statusBreakdown || []).map((s) => [
                  `Status — ${(s.status || '').replace(/_/g, ' ')}`, s.count,
                ])),
              ]}
            />
          </section>
        )}

        {/* ── DONOR overview ───────────────────────────────── */}
        {type === 'donor' && sections.overview && (
          <section>
            <SectionHeader num={++num} title="Giving Summary" Icon={Heart} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <MetricCard label="Total Given" value={formatCurrency(totals.raised || 0)} />
              <MetricCard label="Donations" value={(snapshot.donations || []).length} />
              <MetricCard label="Campaigns Backed" value={totals.donors || 0} />
            </div>
          </section>
        )}
      </div>

      <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <span className="font-semibold text-[#001E2B]">RIVERS Impact Platform</span>
        <span>{generated ? `Generated ${generated}` : ''} · Confidential</span>
      </div>
    </div>
  );
}
