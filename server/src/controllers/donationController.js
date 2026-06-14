const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');

exports.createDonation = async (req, res, next) => {
  try {
    const { campaignId, amount, paymentMethod, message, isAnonymous } = req.body;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    if (!['active', 'approved'].includes(campaign.status)) {
      return res.status(400).json({ message: 'Campaign is not accepting donations' });
    }

    const donation = await Donation.create({
      sponsorId: req.user._id,
      campaignId,
      amount,
      paymentMethod,
      message,
      isAnonymous,
      status: 'pending',
      paymentRef: `REF-${Date.now()}`,
    });

    // Simulate immediate payment success (replace with real gateway logic)
    donation.status = 'completed';
    await donation.save();

    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { raisedAmount: amount, donorCount: 1 },
    });

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
