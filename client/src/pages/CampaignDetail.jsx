import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, MapPin, Users, Clock, Zap, CheckCircle2,
  Globe, Calendar, Share2, Heart, Package, Truck, Wrench,
  FileText, MoreHorizontal, ChevronDown, ChevronUp, ShieldCheck,
  MessageCircle, ClipboardList, Layers, Download, Loader2,
  Shield, RefreshCw,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import DonationModal from '../components/donations/DonationModal';
import { campaignApi, expenditureApi, beneficiaryRegisterApi, disbursementApi, donationApi, recurringGivingApi } from '../lib/api';
import { formatCurrency, formatDate, progressPercent, categoryColor, statusColor } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CAT_ICONS = {
  supplies: Package, transport: Truck, services: Users,
  equipment: Wrench, admin: FileText, other: MoreHorizontal,
};
const CAT_LABELS = {
  supplies: 'Supplies', transport: 'Transport', services: 'Services',
  equipment: 'Equipment', admin: 'Admin', other: 'Other',
};

const MILESTONE_STATUS = {
  pending:         { label: 'Planned',       color: 'bg-gray-100 text-gray-600' },
  proof_submitted: { label: 'Under Review',  color: 'bg-amber-50 text-amber-700' },
  released:        { label: 'Released',      color: 'bg-forest-50 text-forest-700' },
};

export default function CampaignDetail({ standalone = true }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, effectiveRole } = useAuth();
  const role = effectiveRole ?? user?.role;

  const [campaign, setCampaign]           = useState(null);
  const [expenditures, setExpenditures]   = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [milestones, setMilestones]       = useState([]);
  const [myDonation, setMyDonation]       = useState(null);
  const [loading, setLoading]             = useState(true);
  const [donateOpen, setDonateOpen]       = useState(false);
  const [expandedExp, setExpandedExp]     = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [pledgeOpen, setPledgeOpen]           = useState(false);
  const [pledgeForm, setPledgeForm]           = useState({ amount: '', frequency: 'monthly' });
  const [savingPledge, setSavingPledge]       = useState(false);
  const [pledgeDone, setPledgeDone]           = useState(false);

  useEffect(() => {
    const loaders = [
      campaignApi.getById(id),
      expenditureApi.getByCampaign(id).catch(() => []),
      beneficiaryRegisterApi.getByCampaign(id).catch(() => []),
      disbursementApi.getByCampaign(id).catch(() => []),
    ];
    if (user && role === 'sponsor') {
      loaders.push(donationApi.getMyForCampaign(id).catch(() => null));
    }
    Promise.all(loaders).then(([c, exps, bnfs, msts, myDon]) => {
      setCampaign(c);
      setExpenditures(exps);
      setBeneficiaries(bnfs);
      setMilestones(msts);
      if (myDon !== undefined) setMyDonation(myDon);
    }).catch(() => toast.error('Campaign not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const daysLeft = campaign?.endDate
    ? Math.max(0, Math.ceil((new Date(campaign.endDate) - Date.now()) / 86400000))
    : null;

  const pct = campaign ? progressPercent(campaign.raisedAmount, campaign.targetAmount) : 0;

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success('Link copied to clipboard.');
  };

  const handleWhatsApp = () => {
    const text = `Check out this community campaign on RIVERS: ${campaign?.title} — ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePersonalisedReport = async () => {
    if (!myDonation) return;
    setGeneratingReport(true);
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      const now = new Date().toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' });
      const pct = progressPercent(campaign.raisedAmount, campaign.targetAmount);

      doc.setFillColor(0, 30, 43);
      doc.rect(0, 0, 210, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('RIVERS', 14, 14);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Your Personal Impact Report', 14, 24);
      doc.text(now, 150, 24);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const title = doc.splitTextToSize(campaign.title, 182);
      doc.text(title, 14, 48);

      let y = 48 + title.length * 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`${campaign.community}${campaign.district ? `, ${campaign.district}` : ''}  ·  ${campaign.category?.replace('_', ' ')}`, 14, y);
      y += 10;

      doc.setFillColor(0, 104, 74);
      doc.roundedRect(14, y, 20, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('VERIFIED', 24, y + 5.5, { align: 'center' });
      y += 14;

      doc.setTextColor(0);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Here\'s what you made possible:', 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        body: [
          ['Your Contribution', formatCurrency(myDonation.amount)],
          ['Campaign Progress', `${pct}% funded (${formatCurrency(campaign.raisedAmount)} of ${formatCurrency(campaign.targetAmount)})`],
          ['Total Donors',      String(campaign.donorCount || 0)],
          ['Beneficiaries',     String(campaign.beneficiaryCount || 0)],
          ['Register Records',  String(beneficiaries.length)],
          ['Verified Deliveries', String(beneficiaries.filter(b => b.deliveryConfirmed).length)],
        ],
        headStyles: { fillColor: [0, 104, 74], textColor: 255 },
        alternateRowStyles: { fillColor: [245, 250, 248] },
        styles: { fontSize: 10 },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      });

      y = doc.lastAutoTable.finalY + 10;
      if (expenditures.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Money Trail — How Funds Were Used', 14, y);
        autoTable(doc, {
          startY: y + 4,
          head: [['Date', 'Description', 'Category', 'Amount']],
          body: expenditures.slice(0, 10).map(e => [
            formatDate(e.date), e.description, e.category?.replace('_', ' '), formatCurrency(e.amount),
          ]),
          headStyles: { fillColor: [0, 104, 74], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 250, 248] },
          styles: { fontSize: 9 },
          columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
        });
      }

      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('RIVERS Platform — verified community impact report  ·  rivers.rw', 14, 290);

      const safeName = campaign.title.replace(/[^a-z0-9]/gi, '_').slice(0, 30);
      doc.save(`RIVERS_My_Impact_${safeName}.pdf`);
      toast.success('Your impact report downloaded!');
    } catch {
      toast.error('Failed to generate report.');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        {standalone && <Navbar />}
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size={36} className="text-brand-500" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#f7f8fa]">
        {standalone && <Navbar />}
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center">
            <Globe size={36} className="text-gray-300" />
          </div>
          <h2 className="text-xl font-bold text-[#001E2B]">Campaign not found</h2>
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/campaigns')}>
            Back to campaigns
          </Button>
        </div>
        {standalone && <Footer />}
      </div>
    );
  }

  const totalSpent = expenditures.reduce((s, e) => s + (e.amount || 0), 0);
  const pctTraced = campaign.raisedAmount > 0
    ? Math.min(100, Math.round((totalSpent / campaign.raisedAmount) * 100))
    : 0;
  const transparencyCount = [expenditures.length > 0, beneficiaries.length > 0, milestones.length > 0].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {standalone && <Navbar />}

      {/* ── Full-width hero image ─────────────────────────────── */}
      <div className={`relative h-72 sm:h-96 bg-gradient-to-br from-brand-50 to-[#e8f5ef] overflow-hidden ${!standalone ? 'rounded-xl' : ''}`}>
        {campaign.coverImage ? (
          <img
            src={campaign.coverImage}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe size={72} className="text-brand-200" />
          </div>
        )}

        {/* Deep gradient so title is readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#001E2B]/85 via-[#001E2B]/30 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className={`absolute ${standalone ? 'top-20' : 'top-4'} left-4 sm:left-8 flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium transition-colors bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full`}
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* Urgent badge */}
        {campaign.isUrgent && (
          <span className={`absolute ${standalone ? 'top-20' : 'top-4'} right-4 sm:right-8 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md`}>
            <Zap size={10} /> Urgent
          </span>
        )}

        {/* Title + meta overlaid on gradient */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6 pt-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-2.5">
              <span className={`badge border text-[11px] shadow-sm backdrop-blur-sm ${categoryColor(campaign.category)}`}>
                {t(`categories.${campaign.category}`)}
              </span>
              {(campaign.status === 'active' || campaign.approvedBy) && (
                <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-white/30">
                  <ShieldCheck size={9} /> Verified
                </span>
              )}
              {campaign.status === 'completed' && (
                <span className="flex items-center gap-1 bg-forest-500/80 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 size={9} /> Completed
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight max-w-2xl">
              {campaign.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-white/60 text-xs">
              <span className="flex items-center gap-1.5">
                <MapPin size={11} />
                {campaign.community}{campaign.district ? `, ${campaign.district}` : ''}
              </span>
              {campaign.startDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={11} /> {formatDate(campaign.startDate)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content area ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 pb-14">

        {/* ── Full-width stats strip ────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card p-4 text-center">
            <p className="text-2xl font-black text-[#001E2B]">{campaign.donorCount ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
              <Heart size={10} className="text-red-400" /> Donors
            </p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-black text-[#001E2B]">{campaign.beneficiaryCount ?? 0}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
              <Users size={10} className="text-brand-500" /> Beneficiaries
            </p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-black text-brand-600">{pct}%</p>
            <p className="text-xs text-gray-400 mt-1">Funded</p>
          </div>
          {daysLeft !== null && campaign.status !== 'completed' ? (
            <div className="card p-4 text-center">
              <p className="text-2xl font-black text-[#001E2B]">{daysLeft}</p>
              <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
                <Clock size={10} className="text-amber-500" /> Days left
              </p>
            </div>
          ) : (
            <div className="card p-4 text-center bg-forest-50 border-forest-100">
              <CheckCircle2 size={22} className="text-forest-500 mx-auto mb-1" />
              <p className="text-xs text-forest-700 font-bold">Completed</p>
            </div>
          )}
        </div>

        {/* ── About this campaign — full width ─────────────── */}
        <div className="card p-6 mb-6">
          <h3 className="font-bold text-[#001E2B] mb-3">About this campaign</h3>
          <div
            className="prose-content text-gray-600 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: campaign.description }}
          />
        </div>

        {campaign.adminNote && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-xs font-bold text-amber-700 mb-1 uppercase tracking-wide">Admin Note</p>
            <p className="text-sm text-amber-800">{campaign.adminNote}</p>
          </div>
        )}

        {/* ── Action card — full width horizontal ───────────── */}
        <div className="card p-6 mb-6">
          <div className="grid lg:grid-cols-3 gap-6 items-start">

            {/* Col 1: Raised + progress */}
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-3xl font-black text-[#001E2B] tracking-tight leading-none">
                  {formatCurrency(campaign.raisedAmount)}
                </p>
                <p className="text-xs text-gray-400 mt-1.5">
                  raised of <span className="font-semibold text-gray-600">{formatCurrency(campaign.targetAmount)}</span> goal
                </p>
              </div>
              <div>
                <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #00684A 0%, #00A35C 60%, #00ED64 100%)' }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1.5">
                  <span className="font-bold text-brand-600">{pct}% funded</span>
                  {daysLeft !== null && campaign.status !== 'completed' && (
                    <span className="text-gray-400 flex items-center gap-1"><Clock size={10} /> {daysLeft} days left</span>
                  )}
                </div>
              </div>
            </div>

            {/* Col 2: Actions */}
            <div className="flex flex-col gap-3">
              {campaign.status === 'active' && (
                <Button variant="primary" size="lg" className="w-full" leftIcon={<Heart size={16} />} onClick={() => setDonateOpen(true)}>
                  Donate Now
                </Button>
              )}
              {campaign.status === 'completed' && (
                <div className="flex items-center justify-center gap-2 py-3 bg-forest-50 rounded-xl text-forest-700 text-sm font-bold border border-forest-100">
                  <CheckCircle2 size={16} /> Campaign Completed
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleShare} className="flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-500 hover:text-brand-600 border border-gray-200 rounded-lg hover:border-brand-200 transition-colors font-medium">
                  <Share2 size={13} /> Copy link
                </button>
                <button onClick={handleWhatsApp} className="flex items-center justify-center gap-1.5 py-2.5 text-xs text-white bg-green-500 hover:bg-green-600 transition-colors rounded-lg font-semibold">
                  <MessageCircle size={13} /> WhatsApp
                </button>
              </div>
              {role === 'sponsor' && myDonation && (
                <button onClick={handlePersonalisedReport} disabled={generatingReport} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-forest-700 bg-forest-50 hover:bg-forest-100 transition-colors rounded-lg border border-forest-200 font-semibold disabled:opacity-60">
                  {generatingReport ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                  Download my impact report
                </button>
              )}
              {role === 'sponsor' && campaign?.status === 'active' && !pledgeDone && (
                pledgeOpen ? (
                  <div className="border border-brand-200 rounded-xl p-4 flex flex-col gap-3 bg-brand-50/40">
                    <p className="text-xs font-bold text-brand-800">Set up monthly pledge</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" min="500" placeholder="Amount (RWF)" className="input text-sm" value={pledgeForm.amount} onChange={e => setPledgeForm(f => ({ ...f, amount: e.target.value }))} />
                      <select className="input text-sm" value={pledgeForm.frequency} onChange={e => setPledgeForm(f => ({ ...f, frequency: e.target.value }))}>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" className="flex-1" loading={savingPledge} onClick={async () => {
                        if (!pledgeForm.amount || isNaN(pledgeForm.amount)) return toast.error('Enter a valid amount.');
                        setSavingPledge(true);
                        try {
                          await recurringGivingApi.create(id, { amount: parseFloat(pledgeForm.amount), frequency: pledgeForm.frequency });
                          setPledgeDone(true);
                          toast.success('Recurring pledge saved!');
                        } catch (err) {
                          if (err?.code === '23505') toast.error('You already have a pledge for this campaign.');
                          else toast.error('Failed to save pledge.');
                        } finally { setSavingPledge(false); }
                      }}>Save pledge</Button>
                      <button onClick={() => setPledgeOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 px-2">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setPledgeOpen(true)} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-500 hover:text-brand-600 transition-colors border border-dashed border-gray-200 rounded-lg hover:border-brand-300 hover:bg-brand-50/50 font-medium">
                    <RefreshCw size={12} /> Set up monthly pledge
                  </button>
                )
              )}
              {pledgeDone && (
                <div className="flex items-center gap-1.5 py-2.5 px-3 text-xs text-forest-700 bg-forest-50 border border-forest-200 rounded-lg font-semibold">
                  <CheckCircle2 size={13} /> Recurring pledge active
                </div>
              )}
            </div>

            {/* Col 3: Campaign leader */}
            {campaign.leaderId && (
              <div className="flex flex-col gap-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Campaign Leader</p>
                <div className="flex items-center gap-3">
                  <Avatar name={campaign.leaderId.fullName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-[#001E2B] truncate">{campaign.leaderId.fullName}</p>
                      {campaign.approvedBy && <ShieldCheck size={13} className="text-forest-500 flex-shrink-0" />}
                    </div>
                    {campaign.leaderId.community && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} /> {campaign.leaderId.community}
                      </p>
                    )}
                  </div>
                </div>
                {expenditures.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                      <p className="text-sm font-black text-[#001E2B]">{expenditures.length}</p>
                      <p className="text-[11px] text-gray-400">expenditures</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                      <p className="text-sm font-black text-[#001E2B]">{beneficiaries.filter(b => b.isVerified).length}</p>
                      <p className="text-[11px] text-gray-400">verified</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Transparency section — full width, side-by-side columns ── */}
        {transparencyCount > 0 && (
          <div className={`grid gap-5 ${
            transparencyCount === 1 ? 'grid-cols-1' :
            transparencyCount === 2 ? 'lg:grid-cols-2' :
            'lg:grid-cols-3'
          }`}>

            {/* Money Trail */}
            {expenditures.length > 0 && (
              <div className="card p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-forest-50 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={16} className="text-forest-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#001E2B] text-sm">Money Trail</h3>
                    <p className="text-xs text-gray-400">Full ledger of how funds were spent</p>
                  </div>
                  <span className="text-xs text-forest-700 font-bold bg-forest-50 px-2 py-1 rounded-full border border-forest-200">
                    {pctTraced}%
                  </span>
                </div>

                <div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pctTraced}%`, background: 'linear-gradient(90deg, #2d6a4f 0%, #00A35C 100%)' }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span className="font-semibold">{formatCurrency(totalSpent)} logged</span>
                    <span>{formatCurrency(campaign.raisedAmount)} raised</span>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-50 max-h-72 overflow-y-auto">
                  {expenditures.map((exp) => {
                    const Icon = CAT_ICONS[exp.category] || MoreHorizontal;
                    const isOpen = expandedExp === exp.id;
                    return (
                      <div key={exp.id}>
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors text-left"
                          onClick={() => setExpandedExp(isOpen ? null : exp.id)}
                        >
                          <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                            <Icon size={13} className="text-brand-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#001E2B] truncate">{exp.description}</p>
                            <p className="text-[11px] text-gray-400">
                              {CAT_LABELS[exp.category] || exp.category} · {formatDate(exp.date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {exp.receiptUrl && <CheckCircle2 size={11} className="text-forest-500" />}
                            <span className="text-xs font-bold text-[#001E2B]">{formatCurrency(exp.amount)}</span>
                            {isOpen ? <ChevronUp size={12} className="text-gray-300" /> : <ChevronDown size={12} className="text-gray-300" />}
                          </div>
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-3 pt-1.5 bg-gray-50/70 flex flex-col gap-2">
                            {exp.deliveryNote && (
                              <p className="text-xs text-gray-600 italic border-l-2 border-brand-200 pl-3">"{exp.deliveryNote}"</p>
                            )}
                            {exp.receiptUrl && (
                              <a href={exp.receiptUrl} target="_blank" rel="noopener noreferrer">
                                <img src={exp.receiptUrl} alt="Receipt" className="max-h-32 rounded-lg border border-gray-200 object-contain hover:opacity-90 transition-opacity" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Beneficiary Register */}
            {beneficiaries.length > 0 && (
              <div className="card p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <ClipboardList size={16} className="text-brand-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#001E2B] text-sm">Beneficiary Register</h3>
                    <p className="text-xs text-gray-400">Anonymised delivery records</p>
                  </div>
                  <span className="text-xs text-brand-700 font-bold bg-brand-50 px-2 py-1 rounded-full border border-brand-200">
                    {beneficiaries.length}
                  </span>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 flex items-start gap-2">
                  <Shield size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700">Anonymised IDs only — no personal data stored publicly.</p>
                </div>

                <div className="rounded-xl border border-gray-100 overflow-hidden max-h-72 overflow-y-auto">
                  <div className="grid grid-cols-4 px-3 py-2 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wide border-b border-gray-100 sticky top-0">
                    <span>ID</span><span>Grade</span><span>Kit</span><span>Status</span>
                  </div>
                  {beneficiaries.slice(0, 8).map((b, i) => (
                    <div key={b.id} className={`grid grid-cols-4 px-3 py-2.5 text-xs border-b border-gray-50 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                      <span className="font-mono font-bold text-brand-600 truncate">{b.recordId}</span>
                      <span className="text-gray-600">{b.grade || '—'}</span>
                      <span className="text-gray-600 capitalize">{b.kitType}</span>
                      <span>
                        {b.deliveryConfirmed
                          ? <span className="flex items-center gap-0.5 text-forest-700 font-semibold"><CheckCircle2 size={9} /> Done</span>
                          : b.isVerified
                          ? <span className="flex items-center gap-0.5 text-brand-600 font-semibold"><Shield size={9} /> OK</span>
                          : <span className="text-gray-400">Pending</span>}
                      </span>
                    </div>
                  ))}
                  {beneficiaries.length > 8 && (
                    <div className="px-3 py-2 text-xs text-gray-400 text-center bg-gray-50 font-medium">
                      +{beneficiaries.length - 8} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Fund Release Milestones */}
            {milestones.length > 0 && (
              <div className="card p-5 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Layers size={16} className="text-brand-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#001E2B] text-sm">Fund Release Milestones</h3>
                    <p className="text-xs text-gray-400">Staged disbursement of raised funds</p>
                  </div>
                  <span className="text-xs text-gray-500 font-semibold">
                    {milestones.filter(m => m.status === 'released').length}/{milestones.length} released
                  </span>
                </div>

                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
                  {milestones.map((m, i) => {
                    const cfg = MILESTONE_STATUS[m.status] || MILESTONE_STATUS.pending;
                    const isReleased = m.status === 'released';
                    return (
                      <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isReleased ? 'border-forest-100 bg-forest-50/50' : 'border-gray-100 bg-white'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${isReleased ? 'bg-forest-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {isReleased ? <CheckCircle2 size={12} /> : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#001E2B] truncate">{m.title}</p>
                          {m.description && <p className="text-[11px] text-gray-400 truncate">{m.description}</p>}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-xs font-bold text-[#001E2B]">{formatCurrency(m.targetAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {standalone && <Footer />}

      <DonationModal
        open={donateOpen}
        onClose={() => setDonateOpen(false)}
        campaign={campaign}
      />
    </div>
  );
}
