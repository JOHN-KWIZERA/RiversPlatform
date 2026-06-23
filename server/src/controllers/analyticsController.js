const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const User = require('../models/User');

exports.getAdminStats = async (req, res, next) => {
  try {
    const [
      totalCampaigns,
      activeCampaigns,
      pendingCampaigns,
      completedCampaigns,
      totalUsers,
      activeSponsorCount,
      totalDonations,
      donationAgg,
      familiesAgg,
      campaignsByCategory,
      campaignsByStatus,
      monthlyDonations,
      monthlyUsers,
    ] = await Promise.all([
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: 'active' }),
      Campaign.countDocuments({ status: 'pending_review' }),
      Campaign.countDocuments({ status: 'completed' }),
      User.countDocuments(),
      User.countDocuments({ role: 'sponsor', isActive: true }),
      Donation.countDocuments({ status: 'completed' }),
      Donation.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Campaign.aggregate([
        { $match: { status: { $in: ['active', 'completed', 'approved'] } } },
        { $group: { _id: null, total: { $sum: '$beneficiaryCount' } } },
      ]),
      Campaign.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Campaign.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Donation.aggregate([
        { $match: { status: 'completed' } },
        {
          $group: {
            _id: { month: { $month: '$donatedAt' }, year: { $year: '$donatedAt' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
      User.aggregate([
        { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 6 },
      ]),
    ]);

    const successRate = (activeCampaigns + completedCampaigns) > 0
      ? Math.round((completedCampaigns / (activeCampaigns + completedCampaigns)) * 100)
      : 0;

    res.json({
      campaigns: { total: totalCampaigns, active: activeCampaigns, pending: pendingCampaigns, completed: completedCampaigns, successRate },
      users: { total: totalUsers, activeSponsorCount },
      donations: { count: totalDonations, totalAmount: donationAgg[0]?.total || 0 },
      familiesSupported: familiesAgg[0]?.total || 0,
      charts: { campaignsByCategory, campaignsByStatus, monthlyDonations, monthlyUsers },
    });
  } catch (err) {
    next(err);
  }
};

exports.getLeaderStats = async (req, res, next) => {
  try {
    const leaderId = req.user._id;
    const campaigns = await Campaign.find({ leaderId });
    const campaignIds = campaigns.map((c) => c._id);

    const [donations, monthlyDonations] = await Promise.all([
      Donation.find({ campaignId: { $in: campaignIds }, status: 'completed' }),
      Donation.aggregate([
        { $match: { campaignId: { $in: campaignIds }, status: 'completed' } },
        {
          $group: {
            _id: { month: { $month: '$donatedAt' }, year: { $year: '$donatedAt' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 6 },
      ]),
    ]);

    const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0);
    res.json({
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      totalRaised,
      totalDonors: donations.length,
      charts: { monthlyDonations },
    });
  } catch (err) {
    next(err);
  }
};

exports.getSponsorStats = async (req, res, next) => {
  try {
    const donations = await Donation.find({ sponsorId: req.user._id, status: 'completed' });
    const totalGiven = donations.reduce((sum, d) => sum + d.amount, 0);
    const uniqueCampaigns = new Set(donations.map((d) => d.campaignId.toString())).size;

    res.json({
      totalDonations: donations.length,
      totalGiven,
      campaignsSupported: uniqueCampaigns,
    });
  } catch (err) {
    next(err);
  }
};
