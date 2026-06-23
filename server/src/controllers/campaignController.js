const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const sms = require('../services/smsService');
const { audit } = require('../services/auditService');

exports.getCampaigns = async (req, res, next) => {
  try {
    const { status, category, community, page = 1, limit = 12, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (community) filter.community = { $regex: community, $options: 'i' };
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .populate('leaderId', 'fullName avatar community')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Campaign.countDocuments(filter),
    ]);

    res.json({ campaigns, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.getCampaignById = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('leaderId', 'fullName avatar community phone')
      .populate('approvedBy', 'fullName');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    next(err);
  }
};

exports.createCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.create({ ...req.body, leaderId: req.user._id });
    audit({ actorId: req.user._id, actorName: req.user.fullName, action: 'campaign_created', targetType: 'Campaign', targetId: campaign._id, targetLabel: campaign.title, req });
    res.status(201).json(campaign);
  } catch (err) {
    next(err);
  }
};

exports.updateCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const isOwner = campaign.leaderId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Forbidden' });

    if (isAdmin) {
      Object.assign(campaign, req.body);
    } else {
      // Leaders may only update content fields; any edit triggers re-review
      const LEADER_FIELDS = ['title', 'description', 'category', 'community', 'sector', 'district',
        'targetAmount', 'beneficiaryCount', 'startDate', 'endDate', 'coverImage', 'isUrgent'];
      LEADER_FIELDS.forEach((k) => { if (req.body[k] !== undefined) campaign[k] = req.body[k]; });
      campaign.status = 'pending_review';
    }

    await campaign.save();
    audit({ actorId: req.user._id, actorName: req.user.fullName, action: 'campaign_updated', targetType: 'Campaign', targetId: campaign._id, targetLabel: campaign.title, req });
    res.json(campaign);
  } catch (err) {
    next(err);
  }
};

exports.approveCampaign = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminNote,
        approvedBy: req.user._id,
        approvedAt: new Date(),
      },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const isApproved = status === 'active' || status === 'approved';
    await createNotification({
      userId: campaign.leaderId,
      type: isApproved ? 'campaign_approved' : 'campaign_rejected',
      title: isApproved ? 'Campaign Approved!' : 'Campaign Needs Revision',
      body: isApproved
        ? `Your campaign "${campaign.title}" has been approved and is now live.`
        : `Your campaign "${campaign.title}" was not approved. ${adminNote ? `Admin note: ${adminNote}` : ''}`,
      link: `/campaigns/${campaign._id}`,
    });

    audit({ actorId: req.user._id, actorName: req.user.fullName, action: isApproved ? 'campaign_approved' : 'campaign_rejected', targetType: 'Campaign', targetId: campaign._id, targetLabel: campaign.title, metadata: { adminNote }, req });

    // SMS
    const leader = await User.findById(campaign.leaderId).select('phone');
    if (isApproved) {
      sms.notifyCampaignApproved({ leaderPhone: leader?.phone, campaignTitle: campaign.title });
    } else {
      sms.notifyCampaignRejected({ leaderPhone: leader?.phone, campaignTitle: campaign.title, adminNote });
    }

    res.json(campaign);
  } catch (err) {
    next(err);
  }
};

exports.getLeaderCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ leaderId: req.user._id }).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    next(err);
  }
};
