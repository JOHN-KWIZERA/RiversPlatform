import { useState, useEffect } from 'react';
import { FileText, Download, Globe, Megaphone, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import { campaignApi, analyticsApi, donationApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, progressPercent } from '../lib/utils';

async function generatePlatformPdf(analytics) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();

  const now = new Date().toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' });

  // Header
  doc.setFillColor(0, 30, 43);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RIVERS Platform', 14, 13);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Platform-Wide Impact Report', 14, 22);
  doc.text(`Generated: ${now}`, 140, 22);

  doc.setTextColor(0, 0, 0);

  // Summary stats
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, 42);

  const stats = [
    ['Total Campaigns', analytics?.campaigns?.total ?? '—'],
    ['Active Campaigns', analytics?.campaigns?.active ?? '—'],
    ['Total Raised (RWF)', formatCurrency(analytics?.donations?.totalAmount ?? 0)],
    ['Total Donations', analytics?.donations?.totalCount ?? '—'],
    ['Registered Users', analytics?.users?.total ?? '—'],
    ['Families Supported', analytics?.familiesSupported ?? '—'],
    ['Campaign Success Rate', analytics?.campaigns?.successRate != null ? `${analytics.campaigns.successRate}%` : '—'],
  ];

  autoTable(doc, {
    startY: 46,
    head: [['Metric', 'Value']],
    body: stats,
    headStyles: { fillColor: [0, 104, 74], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 250, 248] },
    styles: { fontSize: 10 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });

  // Campaign breakdown
  const y = doc.lastAutoTable.finalY + 12;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Campaign Status Breakdown', 14, y);

  const statusData = (analytics?.charts?.campaignsByStatus || []).map(s => [
    s._id?.replace('_', ' ')?.toUpperCase() || '—',
    String(s.count),
  ]);

  if (statusData.length > 0) {
    autoTable(doc, {
      startY: y + 4,
      head: [['Status', 'Count']],
      body: statusData,
      headStyles: { fillColor: [0, 104, 74], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 },
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`RIVERS Platform Impact Report  ·  Page ${i} of ${pageCount}  ·  Confidential`, 14, 290);
  }

  doc.save(`RIVERS_Platform_Report_${now.replace(/\s/g, '_')}.pdf`);
}

async function generateCampaignPdf(campaign, donations = []) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();

  const now = new Date().toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' });
  const pct = progressPercent(campaign.raisedAmount, campaign.targetAmount);

  // Header
  doc.setFillColor(0, 30, 43);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RIVERS', 14, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Campaign Impact Report', 14, 20);
  doc.text(`Generated: ${now}`, 130, 20);

  doc.setTextColor(0, 0, 0);

  // Campaign title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(campaign.title, 180);
  doc.text(titleLines, 14, 42);

  let curY = 42 + titleLines.length * 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Community: ${campaign.community || '—'}  ·  District: ${campaign.district || '—'}  ·  Category: ${campaign.category?.replace('_', ' ') || '—'}`, 14, curY);
  curY += 8;
  doc.setTextColor(0);

  // Progress bar (drawn manually)
  doc.setFillColor(230, 230, 230);
  doc.roundedRect(14, curY, 182, 6, 3, 3, 'F');
  const barWidth = Math.round(182 * pct / 100);
  if (barWidth > 0) {
    doc.setFillColor(0, 104, 74);
    doc.roundedRect(14, curY, barWidth, 6, 3, 3, 'F');
  }
  curY += 10;
  doc.setFontSize(9);
  doc.text(`${pct}% funded`, 14, curY);
  curY += 8;

  // Key stats table
  autoTable(doc, {
    startY: curY,
    head: [['Metric', 'Value']],
    body: [
      ['Target Amount', formatCurrency(campaign.targetAmount)],
      ['Raised Amount', formatCurrency(campaign.raisedAmount)],
      ['Number of Donors', String(campaign.donorCount || 0)],
      ['Beneficiaries', String(campaign.beneficiaryCount || 0)],
      ['Status', campaign.status?.replace('_', ' ') || '—'],
      ['Start Date', campaign.startDate ? formatDate(campaign.startDate) : '—'],
      ['End Date', campaign.endDate ? formatDate(campaign.endDate) : '—'],
    ],
    headStyles: { fillColor: [0, 104, 74], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 250, 248] },
    styles: { fontSize: 10 },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
  });

  curY = doc.lastAutoTable.finalY + 12;

  // Description
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Campaign Description', 14, curY);
  curY += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const descLines = doc.splitTextToSize(campaign.description || 'No description provided.', 182);
  doc.text(descLines, 14, curY);
  curY += descLines.length * 5 + 10;

  // Donations table (if any)
  if (donations.length > 0) {
    if (curY > 240) { doc.addPage(); curY = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Donation History', 14, curY);

    autoTable(doc, {
      startY: curY + 4,
      head: [['Date', 'Amount (RWF)', 'Payment Method', 'Status']],
      body: donations.slice(0, 30).map(d => [
        d.donatedAt ? formatDate(d.donatedAt) : '—',
        formatCurrency(d.amount),
        d.paymentMethod?.replace('_', ' ') || '—',
        d.status || '—',
      ]),
      headStyles: { fillColor: [0, 104, 74], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 250, 248] },
      styles: { fontSize: 9 },
    });
  }

  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`RIVERS Campaign Report  ·  Page ${i} of ${pageCount}  ·  Confidential`, 14, 290);
  }

  const safeName = campaign.title.replace(/[^a-z0-9]/gi, '_').slice(0, 40);
  doc.save(`RIVERS_Campaign_${safeName}_${now.replace(/\s/g, '_')}.pdf`);
}

export default function ReportsPage() {
  const { user, effectiveRole } = useAuth();
  const role = effectiveRole ?? user?.role;
  const [campaigns, setCampaigns] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [generating, setGenerating] = useState(null); // id or 'platform'

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (role === 'admin') {
          const [c, a] = await Promise.all([campaignApi.getAll({ limit: 50 }), analyticsApi.admin()]);
          setCampaigns(c.campaigns || []);
          setAnalytics(a);
        } else if (role === 'community_leader') {
          const c = await campaignApi.getMy();
          setCampaigns(Array.isArray(c) ? c : c.campaigns || []);
        } else if (role === 'sponsor') {
          // show donation history only; no campaign list needed
        }
      } catch {
        toast.error('Failed to load report data.');
      } finally {
        setLoadingCampaigns(false);
      }
    };
    fetchData();
  }, [role]);

  const handlePlatformReport = async () => {
    setGenerating('platform');
    try {
      await generatePlatformPdf(analytics);
      toast.success('Platform report downloaded!');
    } catch (err) {
      toast.error('Failed to generate report.');
    } finally {
      setGenerating(null);
    }
  };

  const handleCampaignReport = async (campaign) => {
    setGenerating(campaign._id);
    try {
      let donations = [];
      try { donations = await donationApi.getCampaignDonations(campaign._id); } catch { /* no donations yet */ }
      await generateCampaignPdf(campaign, Array.isArray(donations) ? donations : []);
      toast.success(`Report for "${campaign.title}" downloaded!`);
    } catch (err) {
      toast.error('Failed to generate report.');
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="page-header">Impact Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Generate and download PDF reports for campaigns and platform activity.</p>
      </div>

      {/* Platform-wide (admin only) */}
      {role === 'admin' && (
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Globe size={20} className="text-brand-500" />
              </div>
              <div>
                <h3 className="font-semibold text-[#001E2B]">Platform-Wide Impact Report</h3>
                <p className="text-sm text-gray-500 mt-0.5">Full summary of all campaigns, donations, users, and impact metrics.</p>
              </div>
            </div>
            <Button
              variant="primary"
              leftIcon={generating === 'platform' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              loading={generating === 'platform'}
              onClick={handlePlatformReport}
              size="sm"
              className="flex-shrink-0"
            >
              Download PDF
            </Button>
          </div>
        </div>
      )}

      {/* Per-campaign reports */}
      <div>
        <h2 className="font-semibold text-[#001E2B] mb-3">
          {role === 'admin' ? 'Per-Campaign Reports' : 'My Campaign Reports'}
        </h2>

        {loadingCampaigns ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size={28} className="text-brand-500" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="card p-10 text-center">
            <FileText size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {role === 'community_leader' ? 'Create a campaign to generate reports.' : 'No campaigns found.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {campaigns.map((c) => {
              const pct = progressPercent(c.raisedAmount, c.targetAmount);
              const isGenerating = generating === c._id;
              return (
                <div key={c._id} className="card p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-brand-50 flex-shrink-0">
                    {c.coverImage
                      ? <img src={c.coverImage} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Megaphone size={18} className="text-brand-300" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#001E2B] truncate">{c.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{c.community} · {pct}% funded · {c.donorCount || 0} donors</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`badge text-[10px] ${
                        c.status === 'active' ? 'bg-forest-50 text-forest-700' :
                        c.status === 'completed' ? 'bg-brand-50 text-brand-700' :
                        c.status === 'pending_review' ? 'bg-amber-50 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{c.status?.replace('_', ' ')}</span>
                      {c.status === 'completed' && <CheckCircle2 size={12} className="text-forest-500" />}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400 mb-2">{formatCurrency(c.raisedAmount)} raised</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                      loading={isGenerating}
                      onClick={() => handleCampaignReport(c)}
                    >
                      PDF
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sponsor: donation history report */}
      {role === 'sponsor' && (
        <div className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-forest-50 flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-forest-600" />
              </div>
              <div>
                <h3 className="font-semibold text-[#001E2B]">My Donation Summary</h3>
                <p className="text-sm text-gray-500 mt-0.5">PDF of all your donation history and supported campaigns.</p>
              </div>
            </div>
            <Button
              variant="primary"
              leftIcon={generating === 'sponsor' ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              loading={generating === 'sponsor'}
              onClick={async () => {
                setGenerating('sponsor');
                try {
                  const donations = await donationApi.getMy();
                  const { jsPDF } = await import('jspdf');
                  const { default: autoTable } = await import('jspdf-autotable');
                  const doc = new jsPDF();
                  const now = new Date().toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' });

                  doc.setFillColor(0, 30, 43);
                  doc.rect(0, 0, 210, 30, 'F');
                  doc.setTextColor(255, 255, 255);
                  doc.setFontSize(16);
                  doc.setFont('helvetica', 'bold');
                  doc.text('RIVERS', 14, 13);
                  doc.setFontSize(10);
                  doc.setFont('helvetica', 'normal');
                  doc.text('My Donation Summary', 14, 22);
                  doc.text(`Generated: ${now}`, 130, 22);
                  doc.setTextColor(0, 0, 0);

                  const rows = (Array.isArray(donations) ? donations : []).map(d => [
                    d.donatedAt ? formatDate(d.donatedAt) : '—',
                    d.campaignId?.title || '—',
                    formatCurrency(d.amount),
                    d.paymentMethod?.replace('_', ' ') || '—',
                    d.status || '—',
                  ]);

                  autoTable(doc, {
                    startY: 40,
                    head: [['Date', 'Campaign', 'Amount (RWF)', 'Method', 'Status']],
                    body: rows.length ? rows : [['No donations yet', '', '', '', '']],
                    headStyles: { fillColor: [0, 104, 74], textColor: 255, fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [245, 250, 248] },
                    styles: { fontSize: 9 },
                  });

                  const totalRaised = (Array.isArray(donations) ? donations : []).reduce((s, d) => s + (d.amount || 0), 0);
                  const y = doc.lastAutoTable.finalY + 10;
                  doc.setFontSize(11);
                  doc.setFont('helvetica', 'bold');
                  doc.text(`Total Contributed: ${formatCurrency(totalRaised)}`, 14, y);

                  doc.setFontSize(8);
                  doc.setTextColor(150);
                  doc.text(`RIVERS Donation Summary  ·  Confidential`, 14, 290);

                  doc.save(`RIVERS_My_Donations_${now.replace(/\s/g, '_')}.pdf`);
                  toast.success('Donation summary downloaded!');
                } catch (err) {
                  toast.error('Failed to generate report.');
                } finally {
                  setGenerating(null);
                }
              }}
              size="sm"
              className="flex-shrink-0"
            >
              Download PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
