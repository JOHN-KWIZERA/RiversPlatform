import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, MapPin, Users, Clock, Zap, CheckCircle2,
  Globe, Calendar, Share2, Heart,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Progress from '../components/ui/Progress';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import DonationModal from '../components/donations/DonationModal';
import { campaignApi } from '../lib/api';
import { formatCurrency, formatDate, progressPercent, categoryColor, statusColor } from '../lib/utils';
import toast from 'react-hot-toast';

export default function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [donateOpen, setDonateOpen] = useState(false);

  useEffect(() => {
    campaignApi.getById(id)
      .then(setCampaign)
      .catch(() => toast.error('Campaign not found.'))
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size={36} className="text-brand-500" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <Globe size={48} className="text-gray-200" />
          <h2 className="text-xl font-bold text-[#001E2B]">Campaign not found</h2>
          <Button variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/campaigns')}>
            Back to campaigns
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left — main content */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Cover image */}
              <div className="relative rounded-lg overflow-hidden h-72 bg-brand-50">
                {campaign.coverImage ? (
                  <img src={campaign.coverImage} alt={campaign.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Globe size={56} className="text-brand-200" />
                  </div>
                )}
                {/* Badges on image */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {campaign.isUrgent && (
                    <span className="flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-sm shadow">
                      <Zap size={11} /> Urgent
                    </span>
                  )}
                </div>
              </div>

              {/* Title + meta */}
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`badge border ${categoryColor(campaign.category)}`}>
                    {t(`categories.${campaign.category}`)}
                  </span>
                  <span className={`badge ${statusColor(campaign.status)}`}>
                    {t(`status.${campaign.status}`)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#001E2B] leading-tight">{campaign.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5"><MapPin size={14} />{campaign.community}{campaign.district ? `, ${campaign.district}` : ''}</span>
                  {campaign.startDate && (
                    <span className="flex items-center gap-1.5"><Calendar size={14} />{formatDate(campaign.startDate)}</span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="prose prose-sm max-w-none">
                <h3 className="text-base font-bold text-[#001E2B] mb-2">About this campaign</h3>
                <div
                  className="prose-content text-gray-600"
                  dangerouslySetInnerHTML={{ __html: campaign.description }}
                />
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Donors', value: campaign.donorCount, icon: Heart },
                  { label: 'Beneficiaries', value: campaign.beneficiaryCount, icon: Users },
                  ...(daysLeft !== null && campaign.status !== 'completed'
                    ? [{ label: 'Days left', value: daysLeft, icon: Clock }]
                    : []),
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="card p-4 text-center">
                    <Icon size={18} className="text-brand-500 mx-auto mb-1" />
                    <p className="text-xl font-black text-[#001E2B]">{value}</p>
                    <p className="text-xs text-gray-400">{label}</p>
                  </div>
                ))}
              </div>

              {/* Admin note */}
              {campaign.adminNote && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <p className="text-xs font-bold text-amber-700 mb-1">Admin Note</p>
                  <p className="text-sm text-amber-800">{campaign.adminNote}</p>
                </div>
              )}
            </div>

            {/* Right — sticky sidebar */}
            <div className="flex flex-col gap-4">
              <div className="card p-5 sticky top-24">
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xl font-black text-[#001E2B]">{formatCurrency(campaign.raisedAmount)}</span>
                    <span className="text-sm text-gray-400">{pct}%</span>
                  </div>
                  <Progress value={pct} size="lg" />
                  <p className="text-xs text-gray-400 mt-1.5">
                    of {formatCurrency(campaign.targetAmount)} goal
                  </p>
                </div>

                {/* End date */}
                {campaign.endDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                    <Clock size={14} className="text-brand-400" />
                    {campaign.status === 'completed'
                      ? 'Campaign completed'
                      : `${daysLeft} days remaining`
                    }
                  </div>
                )}

                {/* Action buttons */}
                {campaign.status === 'active' && (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    leftIcon={<Heart size={16} />}
                    onClick={() => setDonateOpen(true)}
                  >
                    Donate Now
                  </Button>
                )}
                {campaign.status === 'completed' && (
                  <div className="flex items-center justify-center gap-2 py-3 bg-brand-50 rounded-md text-brand-700 text-sm font-semibold">
                    <CheckCircle2 size={16} /> Campaign Completed
                  </div>
                )}

                <button
                  onClick={handleShare}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-brand-600 transition-colors"
                >
                  <Share2 size={14} /> Share this campaign
                </button>

                {/* Leader info */}
                {campaign.leaderId && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-2">Campaign Leader</p>
                    <div className="flex items-center gap-2">
                      <Avatar name={campaign.leaderId.fullName} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-[#001E2B]">{campaign.leaderId.fullName}</p>
                        {campaign.leaderId.community && (
                          <p className="text-xs text-gray-400">{campaign.leaderId.community}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <DonationModal
        open={donateOpen}
        onClose={() => setDonateOpen(false)}
        campaign={campaign}
      />
    </div>
  );
}
