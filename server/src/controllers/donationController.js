const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const sms = require('../services/smsService');
const { audit } = require('../services/auditService');

exports.createDonation = async (req, res, next) => {
  try {
    const { campaignId, amount, paymentMethod, message, isAnonymous, paymentRef } = req.body;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (!['active', 'approved'].includes(campaign.status)) {
      return res.status(400).json({ message: 'Campaign is not accepting donations' });
    }
    if (campaign.leaderId.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: 'You cannot donate to your own campaign.' });
    }

    const isMoMo = paymentMethod === 'mobile_money' && paymentRef;
    const donation = await Donation.create({
      sponsorId: req.user._id,
      campaignId,
      amount,
      paymentMethod,
      message,
      isAnonymous,
      status: isMoMo ? 'completed' : 'pending',
      paymentRef: paymentRef || `REF-${Date.now()}`,
    });

    if (!isMoMo) {
      donation.status = 'completed';
      await donation.save();
    }

    const updated = await Campaign.findByIdAndUpdate(
      campaignId,
      { $inc: { raisedAmount: amount, donorCount: 1 } },
      { new: true },
    );

    // Notify the campaign leader (in-app + SMS)
    const leader = await User.findById(updated.leaderId).select('phone');
    const donorName = isAnonymous ? 'An anonymous supporter' : (req.user.fullName || 'A supporter');
    await createNotification({
      userId: updated.leaderId,
      type: 'donation_received',
      title: 'New donation received!',
      body: `${donorName} donated RWF ${Number(amount).toLocaleString()} to "${updated.title}".`,
      link: `/campaigns/${campaignId}`,
    });

    // SMS: donation received
    sms.notifyDonationReceived({ leaderPhone: leader?.phone, donorName, amount, campaignTitle: updated.title });

    // Milestone check: 50% and 100% funded
    const pct = updated.targetAmount > 0 ? (updated.raisedAmount / updated.targetAmount) * 100 : 0;
    const prevPct = updated.targetAmount > 0 ? ((updated.raisedAmount - amount) / updated.targetAmount) * 100 : 0;
    if (pct >= 100 && prevPct < 100) {
      await createNotification({
        userId: updated.leaderId,
        type: 'campaign_milestone',
        title: 'Campaign fully funded!',
        body: `"${updated.title}" has reached its fundraising goal of RWF ${updated.targetAmount.toLocaleString()}. Amazing!`,
        link: `/campaigns/${campaignId}`,
      });
      sms.notifyMilestone({ leaderPhone: leader?.phone, campaignTitle: updated.title, milestone: 100 });
    } else if (pct >= 50 && prevPct < 50) {
      await createNotification({
        userId: updated.leaderId,
        type: 'campaign_milestone',
        title: '50% funded milestone reached!',
        body: `"${updated.title}" is halfway to its fundraising goal.`,
        link: `/campaigns/${campaignId}`,
      });
      sms.notifyMilestone({ leaderPhone: leader?.phone, campaignTitle: updated.title, milestone: 50 });
    }

    audit({ actorId: req.user._id, actorName: req.user.fullName, action: 'donation_created', targetType: 'Campaign', targetId: campaignId, targetLabel: updated.title, metadata: { amount, paymentMethod }, req });

    res.status(201).json(donation);
  } catch (err) {
    next(err);
  }
};

exports.getSponsorDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({ sponsorId: req.user._id })
      .populate('campaignId', 'title community coverImage category')
      .sort({ donatedAt: -1 });
    res.json(donations);
  } catch (err) {
    next(err);
  }
};

exports.getCampaignDonations = async (req, res, next) => {
  try {
    const donations = await Donation.find({ campaignId: req.params.campaignId })
      .populate('sponsorId', 'fullName avatar organisation isAnonymous')
      .sort({ donatedAt: -1 });
    res.json(donations);
  } catch (err) {
    next(err);
  }
};
