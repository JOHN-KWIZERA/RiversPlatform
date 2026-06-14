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
      totalDonations,
      donationAgg,
      campaignsByCategory,
      monthlyDonations,
    ] = await Promise.all([
      Campaign.countDocuments(),
      Campaign.countDocuments({ status: 'active' }),
      Campaign.countDocuments({ status: 'pending_review' }),
      Campaign.countDocuments({ status: 'completed' }),
      User.countDocuments(),
      Donation.countDocuments({ status: 'completed' }),
      Donation.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Campaign.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
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
    ]);

    res.json({
      campaigns: { total: totalCampaigns, active: activeCampaigns, pending: pendingCampaigns, completed: completedCampaigns },
      users: { total: totalUsers },
      donations: {
        count: totalDonations,
        totalAmount: donationAgg[0]?.total || 0,
      },
      charts: {
        campaignsByCategory,
        monthlyDonations,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getLeaderStats = async (req, res, next) => {
  try {
    const leaderId = req.user._id;
    const [campaigns, donations] = await Promise.all([
      Campaign.find({ leaderId }),
      Donation.find({ campaignId: { $in: (await Campaign.find({ leaderId }).select('_id')).map((c) => c._id) }, status: 'completed' }),
    ]);

    const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0);
    res.json({
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      totalRaised,
      totalDonors: donations.length,
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
