const Beneficiary = require('../models/Beneficiary');

// Beneficiary views their own profile
exports.getMyProfile = async (req, res, next) => {
  try {
    let profile = await Beneficiary.findOne({ userId: req.user._id })
      .populate('userId', 'fullName phone community')
      .populate('enrolledCampaigns', 'title status');
    if (!profile) {
      // Auto-create a minimal profile on first access
      profile = await Beneficiary.create({
        userId: req.user._id,
        needsCategory: 'other',
      });
      await profile.populate('userId', 'fullName phone community');
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

exports.updateMyProfile = async (req, res, next) => {
  try {
    const allowed = ['needsCategory', 'householdSize', 'district', 'sector', 'background'];
    const update = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });

    const profile = await Beneficiary.findOneAndUpdate(
      { userId: req.user._id },
      update,
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).populate('userId', 'fullName phone community');

    res.json(profile);
  } catch (err) {
    next(err);
  }
};

// Admin / leader — list all beneficiaries
exports.getAllBeneficiaries = async (req, res, next) => {
  try {
    const { status, district, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (district) filter.district = { $regex: district, $options: 'i' };

    const [list, total] = await Promise.all([
      Beneficiary.find(filter)
        .populate('userId', 'fullName phone community avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Beneficiary.countDocuments(filter),
    ]);
    res.json({ beneficiaries: list, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

// Admin / leader — add assistance record
exports.addAssistance = async (req, res, next) => {
  try {
    const { beneficiaryId } = req.params;
    const { date, type, description, amount, campaignId } = req.body;

    const profile = await Beneficiary.findById(beneficiaryId);
    if (!profile) return res.status(404).json({ message: 'Beneficiary not found' });

    profile.assistanceHistory.push({ date, type, description, amount, campaignId, recordedBy: req.user._id });
    await profile.save();
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

// Admin / leader — add progress update
exports.addProgress = async (req, res, next) => {
  try {
    const { beneficiaryId } = req.params;
    const { date, title, notes } = req.body;

    const profile = await Beneficiary.findById(beneficiaryId);
    if (!profile) return res.status(404).json({ message: 'Beneficiary not found' });

    profile.progressUpdates.push({ date, title, notes, recordedBy: req.user._id });
    await profile.save();
    res.json(profile);
  } catch (err) {
    next(err);
  }
};
