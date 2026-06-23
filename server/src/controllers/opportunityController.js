const Opportunity = require('../models/Opportunity');
const VolunteerApplication = require('../models/VolunteerApplication');
const { createNotification } = require('./notificationController');

exports.getOpportunities = async (req, res, next) => {
  try {
    const { status = 'open', community, page = 1, limit = 12 } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (community) filter.community = { $regex: community, $options: 'i' };

    const [items, total] = await Promise.all([
      Opportunity.find(filter)
        .populate('createdBy', 'fullName community')
        .populate('campaignId', 'title')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      Opportunity.countDocuments(filter),
    ]);
    res.json({ opportunities: items, total, page: Number(page) });
  } catch (err) {
    next(err);
  }
};

exports.getOpportunityById = async (req, res, next) => {
  try {
    const opp = await Opportunity.findById(req.params.id)
      .populate('createdBy', 'fullName community')
      .populate('campaignId', 'title');
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
    res.json(opp);
  } catch (err) {
    next(err);
  }
};

exports.createOpportunity = async (req, res, next) => {
  try {
    const opp = await Opportunity.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(opp);
  } catch (err) {
    next(err);
  }
};

exports.updateOpportunity = async (req, res, next) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
    if (req.user.role !== 'admin' && opp.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    Object.assign(opp, req.body);
    await opp.save();
    res.json(opp);
  } catch (err) {
    next(err);
  }
};

exports.applyForOpportunity = async (req, res, next) => {
  try {
    const opp = await Opportunity.findById(req.params.id);
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' });
    if (opp.status !== 'open') return res.status(400).json({ message: 'This opportunity is no longer accepting applications' });
    if (opp.filledSlots >= opp.slots) return res.status(400).json({ message: 'No slots available' });

    const existing = await VolunteerApplication.findOne({ opportunityId: opp._id, userId: req.user._id });
    if (existing) return res.status(409).json({ message: 'You have already applied for this opportunity' });

    const {
      phone, linkedIn, languages, emergencyContactName, emergencyContactPhone,
      cvUrl, idDocumentUrl, coverLetter, experience, message,
      availableFrom, hoursPerWeek,
    } = req.body;

    if (!cvUrl) return res.status(400).json({ message: 'CV/Resume is required' });
    if (!idDocumentUrl) return res.status(400).json({ message: 'ID/Passport document is required' });

    const application = await VolunteerApplication.create({
      opportunityId: opp._id,
      userId: req.user._id,
      phone: phone || '',
      linkedIn: linkedIn || '',
      languages: Array.isArray(languages) ? languages : [],
      emergencyContactName: emergencyContactName || '',
      emergencyContactPhone: emergencyContactPhone || '',
      cvUrl,
      idDocumentUrl,
      coverLetter: coverLetter || '',
      experience: experience || '',
      message: message || '',
      availableFrom: availableFrom || undefined,
      hoursPerWeek: hoursPerWeek || undefined,
    });

    await createNotification({
      userId: opp.createdBy,
      type: 'info',
      title: 'New volunteer application',
      body: `${req.user.fullName} applied for "${opp.title}".`,
      link: `/dashboard/opportunities`,
    });

    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
};

exports.getMyApplications = async (req, res, next) => {
  try {
    const apps = await VolunteerApplication.find({ userId: req.user._id })
      .populate('opportunityId', 'title community startDate endDate slots status')
      .sort({ appliedAt: -1 });
    res.json(apps);
  } catch (err) {
    next(err);
  }
};

exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const app = await VolunteerApplication.findById(req.params.appId).populate('opportunityId');
    if (!app) return res.status(404).json({ message: 'Application not found' });

    const isOrganizer = app.opportunityId.createdBy.toString() === req.user._id.toString();
    if (req.user.role !== 'admin' && !isOrganizer) return res.status(403).json({ message: 'Forbidden' });

    const { status } = req.body;
    app.status = status;
    await app.save();

    if (status === 'accepted') {
      await Opportunity.findByIdAndUpdate(app.opportunityId._id, { $inc: { filledSlots: 1 } });
      await createNotification({
        userId: app.userId,
        type: 'info',
        title: 'Volunteer application accepted!',
        body: `You've been accepted for "${app.opportunityId.title}". Thank you for volunteering!`,
        link: `/dashboard/opportunities/${app.opportunityId._id}`,
      });
    }

    res.json(app);
  } catch (err) {
    next(err);
  }
};
