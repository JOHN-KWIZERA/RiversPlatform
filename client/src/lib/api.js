import { supabase, deepCamelCase, uploadFile } from './supabase';

// ── helpers ───────────────────────────────────────────────────

async function uid() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

// Throws if error, otherwise returns camelCased data
async function q(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return deepCamelCase(data);
}

// Single-row version — also supports null (not found)
async function qOne(promise) {
  const { data, error } = await promise;
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data ? deepCamelCase(data) : null;
}

function range(page = 1, limit = 10) {
  const from = (page - 1) * limit;
  return { from, to: from + limit - 1 };
}

// PostgREST embeds the joined table under the alias key.
// The Express API returned it under the FK field name (populated style).
// This renames joined objects to match what the pages expect.
function normalizeCampaign(c) {
  if (!c) return c;
  if (c.leader !== undefined) { c.leaderId = c.leader; delete c.leader; }
  return c;
}
function normalizeDonation(d) {
  if (!d) return d;
  if (d.sponsor !== undefined) { d.sponsorId = d.sponsor; delete d.sponsor; }
  if (d.campaign !== undefined) { d.campaignId = d.campaign; delete d.campaign; }
  return d;
}
function normalizeApplication(a) {
  if (!a) return a;
  if (a.opportunity !== undefined) { a.opportunityId = a.opportunity; delete a.opportunity; }
  if (a.user !== undefined)        { a.userId = a.user; delete a.user; }
  return a;
}
function normalizeBeneficiary(b) {
  if (!b) return b;
  if (b.user !== undefined) { b.userId = b.user; delete b.user; }
  return b;
}

// ── authApi ───────────────────────────────────────────────────

export const authApi = {
  me: async () => {
    const id = await uid();
    return qOne(supabase.from('users').select('*').eq('id', id).single());
  },

  updateProfile: async (data) => {
    const id = await uid();
    // Convert camelCase keys back to snake_case for the update
    const snake = {};
    const map = {
      fullName: 'full_name', phone: 'phone', location: 'location',
      avatar: 'avatar', organisation: 'organisation', community: 'community',
      skills: 'skills', accessLevel: 'access_level',
    };
    Object.entries(data).forEach(([k, v]) => { snake[map[k] ?? k] = v; });
    return qOne(
      supabase.from('users').update({ ...snake, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
    );
  },

  // Kept for backwards compat — Supabase Auth handles password reset natively
  forgotPassword: (email) =>
    supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    }),
};

// ── campaignApi ───────────────────────────────────────────────

export const campaignApi = {
  getAll: async (params = {}) => {
    const { status, category, community, search, page = 1, limit = 12, archived = false } = params;
    const { from, to } = range(page, limit);

    let query = supabase
      .from('campaigns')
      .select('*, leader:leader_id(id, full_name, avatar, community)', { count: 'exact' })
      .eq('is_archived', archived)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status)    query = query.eq('status', status);
    if (category)  query = query.eq('category', category);
    if (community) query = query.ilike('community', `%${community}%`);
    if (search)    query = query.ilike('title', `%${search}%`);

    const { data, count, error } = await query;
    if (error) throw error;
    const campaigns = Array.isArray(data) ? deepCamelCase(data).map(normalizeCampaign) : [];
    return { campaigns, total: count ?? campaigns.length };
  },

  getById: async (id) => {
    const data = await qOne(
      supabase.from('campaigns')
        .select('*, leader:leader_id(id, full_name, avatar, community, phone)')
        .eq('id', id)
        .single()
    );
    return normalizeCampaign(data);
  },

  getMy: async ({ archived = false } = {}) => {
    const id = await uid();
    const data = await q(
      supabase.from('campaigns')
        .select('*')
        .eq('leader_id', id)
        .eq('is_archived', archived)
        .order('created_at', { ascending: false })
    );
    return Array.isArray(data) ? data : [];
  },

  create: async (data) => {
    const id = await uid();
    const payload = {
      leader_id:         id,
      title:             data.title,
      description:       data.description,
      category:          data.category,
      target_amount:     data.targetAmount,
      community:         data.community,
      sector:            data.sector            || '',
      district:          data.district          || '',
      cover_image:       data.coverImage        || '',
      images:            data.images            || [],
      start_date:        data.startDate         || null,
      end_date:          data.endDate           || null,
      tags:              data.tags              || [],
      is_urgent:         data.isUrgent          || false,
      is_featured:       data.isFeatured        || false,
      beneficiary_count: data.beneficiaryCount  || 0,
      status:            data.status            || 'pending_review',
    };
    return qOne(supabase.from('campaigns').insert(payload).select().single());
  },

  update: async (id, data) => {
    const snake = {};
    const map = {
      title: 'title', description: 'description', category: 'category',
      targetAmount: 'target_amount', community: 'community', sector: 'sector',
      district: 'district', coverImage: 'cover_image', images: 'images',
      startDate: 'start_date', endDate: 'end_date', tags: 'tags',
      isUrgent: 'is_urgent', isFeatured: 'is_featured', status: 'status',
      beneficiaryCount: 'beneficiary_count', adminNote: 'admin_note',
      verificationEvidence: 'verification_evidence',
    };
    Object.entries(data).forEach(([k, v]) => { snake[map[k] ?? k] = v; });
    return qOne(
      supabase.from('campaigns').update({ ...snake, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
    );
  },

  archive: async (id) =>
    qOne(supabase.from('campaigns').update({ is_archived: true,  updated_at: new Date().toISOString() }).eq('id', id).select().single()),

  unarchive: async (id) =>
    qOne(supabase.from('campaigns').update({ is_archived: false, updated_at: new Date().toISOString() }).eq('id', id).select().single()),

  // Admin approves or rejects — triggers handle notification
  approve: async (id, { status, adminNote }) => {
    const me = await uid();
    const patch = {
      status,
      admin_note:  adminNote || '',
      updated_at:  new Date().toISOString(),
    };
    if (status === 'approved') {
      patch.approved_by = me;
      patch.approved_at = new Date().toISOString();
    }
    return qOne(
      supabase.from('campaigns').update(patch).eq('id', id).select().single()
    );
  },
};

// ── donationApi ───────────────────────────────────────────────

export const donationApi = {
  create: async (data) => {
    const id = await uid();
    const payload = {
      sponsor_id:     id,
      campaign_id:    data.campaignId,
      amount:         data.amount,
      currency:       data.currency       || 'RWF',
      status:         data.status         || 'completed',
      payment_method: data.paymentMethod  || 'mobile_money',
      payment_ref:    data.paymentRef     || '',
      message:        data.message        || '',
      is_anonymous:   data.isAnonymous    || false,
    };
    return qOne(supabase.from('donations').insert(payload).select().single());
  },

  getMy: async () => {
    const id = await uid();
    const data = await q(
      supabase.from('donations')
        .select('*, campaign:campaign_id(id, title, cover_image, category)')
        .eq('sponsor_id', id)
        .order('donated_at', { ascending: false })
    );
    return Array.isArray(data) ? data.map(normalizeDonation) : [];
  },

  getCampaignDonations: async (campaignId) => {
    const data = await q(
      supabase.from('donations')
        .select('*, sponsor:sponsor_id(id, full_name, avatar)')
        .eq('campaign_id', campaignId)
        .order('donated_at', { ascending: false })
    );
    return Array.isArray(data) ? data.map(normalizeDonation) : [];
  },

  getMyForCampaign: async (campaignId) => {
    const id = await uid();
    const { data, error } = await supabase.from('donations')
      .select('*')
      .eq('sponsor_id', id)
      .eq('campaign_id', campaignId)
      .eq('status', 'completed')
      .order('donated_at', { ascending: false });
    if (error) return null;
    return data?.length ? deepCamelCase(data[0]) : null;
  },
};

// ── analyticsApi ──────────────────────────────────────────────

export const analyticsApi = {
  admin: async () => {
    const [
      { count: total },
      { count: active },
      { count: pending },
      { data: donations },
      { count: totalUsers },
      { count: sponsorCount },
      { data: beneficiaries },
      { data: campaigns },
      { data: users },
    ] = await Promise.all([
      supabase.from('campaigns').select('*', { count: 'exact', head: true }),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).in('status', ['approved', 'active']),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
      supabase.from('donations').select('amount, donated_at').eq('status', 'completed'),
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'sponsor'),
      supabase.from('beneficiaries').select('household_size').eq('status', 'active'),
      supabase.from('campaigns').select('category, status'),
      supabase.from('users').select('created_at'),
    ]);

    const totalAmount = (donations || []).reduce((s, d) => s + (d.amount || 0), 0);
    const familiesSupported = (beneficiaries || []).reduce((s, b) => s + (b.household_size || 1), 0);
    const completed = (campaigns || []).filter(c => c.status === 'completed').length;
    const successRate = total ? Math.round((completed / total) * 100) : 0;

    // Monthly donations (last 6 months)
    const donationsByMonth = {};
    (donations || []).forEach(d => {
      const dt = new Date(d.donated_at);
      const key = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
      donationsByMonth[key] = (donationsByMonth[key] || 0) + d.amount;
    });
    const monthlyDonations = Object.entries(donationsByMonth).map(([k, total]) => {
      const [year, month] = k.split('-').map(Number);
      return { _id: { year, month }, total };
    }).sort((a, b) => a._id.year !== b._id.year ? a._id.year - b._id.year : a._id.month - b._id.month);

    // Campaign distribution
    const catMap = {}, statusMap = {};
    (campaigns || []).forEach(c => {
      catMap[c.category]  = (catMap[c.category]  || 0) + 1;
      statusMap[c.status] = (statusMap[c.status] || 0) + 1;
    });

    // Monthly user registrations
    const usersByMonth = {};
    (users || []).forEach(u => {
      const dt = new Date(u.created_at);
      const key = `${dt.getFullYear()}-${dt.getMonth() + 1}`;
      usersByMonth[key] = (usersByMonth[key] || 0) + 1;
    });
    const monthlyUsers = Object.entries(usersByMonth).map(([k, count]) => {
      const [year, month] = k.split('-').map(Number);
      return { _id: { year, month }, count };
    }).sort((a, b) => a._id.year !== b._id.year ? a._id.year - b._id.year : a._id.month - b._id.month);

    return {
      campaigns:  { total: total ?? 0, active: active ?? 0, pending: pending ?? 0, successRate },
      donations:  { totalAmount },
      users:      { total: totalUsers ?? 0, activeSponsorCount: sponsorCount ?? 0 },
      familiesSupported,
      charts: {
        monthlyDonations,
        campaignsByCategory: Object.entries(catMap).map(([name, count]) => ({ name, count })),
        campaignsByStatus:   Object.entries(statusMap).map(([status, count]) => ({ status, count })),
        monthlyUsers,
      },
    };
  },

  leader: async () => {
    const id = await uid();
    const [
      { data: campaigns },
      { data: donations },
    ] = await Promise.all([
      supabase.from('campaigns').select('id, title, status, raised_amount, target_amount, donor_count, beneficiary_count').eq('leader_id', id),
      supabase.from('donations').select('amount, donated_at, campaign_id').eq('status', 'completed')
        .in('campaign_id', (await supabase.from('campaigns').select('id').eq('leader_id', id)).data?.map(c => c.id) || []),
    ]);
    const totalRaised = (campaigns || []).reduce((s, c) => s + (c.raised_amount || 0), 0);
    const totalDonors = (campaigns || []).reduce((s, c) => s + (c.donor_count || 0), 0);
    return { campaigns: deepCamelCase(campaigns || []), totalRaised, totalDonors, donations: deepCamelCase(donations || []) };
  },

  sponsor: async () => {
    const id = await uid();
    const { data: donations } = await supabase.from('donations')
      .select('amount, donated_at, status, campaign:campaign_id(id, title, cover_image, category)')
      .eq('sponsor_id', id).order('donated_at', { ascending: false });
    const completed = (donations || []).filter(d => d.status === 'completed');
    const totalDonated = completed.reduce((s, d) => s + (d.amount || 0), 0);
    return { donations: deepCamelCase(donations || []).map(normalizeDonation), totalDonated, campaignsSupported: new Set(completed.map(d => d.campaign_id)).size };
  },
};

// ── userApi ───────────────────────────────────────────────────

export const userApi = {
  getAll: async (params = {}) => {
    const { page = 1, limit = 100, role, search } = params;
    const { from, to } = range(page, limit);

    let query = supabase.from('users').select('*').order('created_at', { ascending: false }).range(from, to);
    if (role)   query = query.eq('role', role);
    if (search) query = query.ilike('full_name', `%${search}%`);

    const data = await q(query);
    const users = Array.isArray(data) ? data : [];
    return { users };
  },

  verify: async (id, isVerified) =>
    qOne(
      supabase.from('users')
        .update({ is_verified: isVerified, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
    ),

  changeRole: async (id, role) =>
    qOne(
      supabase.from('users')
        .update({ role, roles: [role], updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
    ),

  suspend: async (id, isSuspended) =>
    qOne(
      supabase.from('users')
        .update({ is_suspended: isSuspended, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
    ),

  delete: async (id) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── beneficiaryApi ────────────────────────────────────────────

export const beneficiaryApi = {
  getMyProfile: async () => {
    const id = await uid();
    const data = await qOne(
      supabase.from('beneficiaries')
        .select('*, assistance:beneficiary_assistance(*), progress:beneficiary_progress(*)')
        .eq('user_id', id)
        .single()
    );
    return normalizeBeneficiary(data);
  },

  updateMyProfile: async (data) => {
    const id = await uid();
    const snake = {
      user_id:          id,
      needs_category:   data.needsCategory,
      household_size:   data.householdSize,
      district:         data.district,
      sector:           data.sector,
      background:       data.background,
      status:           data.status,
      updated_at:       new Date().toISOString(),
    };
    // upsert — creates profile on first save
    return qOne(
      supabase.from('beneficiaries').upsert(snake, { onConflict: 'user_id' }).select().single()
    );
  },

  getAll: async (params = {}) => {
    const { page = 1, limit = 20 } = params;
    const { from, to } = range(page, limit);
    const data = await q(
      supabase.from('beneficiaries')
        .select('*, user:user_id(id, full_name, email, avatar, phone, location, community, district)')
        .order('created_at', { ascending: false })
        .range(from, to)
    );
    return Array.isArray(data) ? data.map(normalizeBeneficiary) : [];
  },

  addAssistance: async (beneficiaryId, data) => {
    const id = await uid();
    return qOne(
      supabase.from('beneficiary_assistance').insert({
        beneficiary_id: beneficiaryId,
        recorded_by:    id,
        date:           data.date,
        type:           data.type,
        description:    data.description || '',
        amount:         data.amount      || 0,
        campaign_id:    data.campaignId  || null,
      }).select().single()
    );
  },

  addProgress: async (beneficiaryId, data) => {
    const id = await uid();
    return qOne(
      supabase.from('beneficiary_progress').insert({
        beneficiary_id: beneficiaryId,
        recorded_by:    id,
        date:           data.date,
        title:          data.title,
        notes:          data.notes || '',
      }).select().single()
    );
  },
};

// ── opportunityApi ────────────────────────────────────────────

export const opportunityApi = {
  getAll: async (params = {}) => {
    const { status, community, search, page = 1, limit = 20, archived = false } = params;
    const { from, to } = range(page, limit);

    let query = supabase
      .from('opportunities')
      .select('*, createdByUser:created_by(id, full_name, avatar)', { count: 'exact' })
      .eq('is_archived', archived)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status && status !== 'all') query = query.eq('status', status);
    if (community) query = query.ilike('community', `%${community}%`);
    if (search)    query = query.ilike('title', `%${search}%`);

    const { data, count, error } = await query;
    if (error) throw error;
    const opportunities = Array.isArray(data) ? deepCamelCase(data) : [];
    return { opportunities, total: count ?? opportunities.length };
  },

  getById: async (id) =>
    qOne(
      supabase.from('opportunities')
        .select('*, createdByUser:created_by(id, full_name, avatar, community)')
        .eq('id', id).single()
    ),

  create: async (data) => {
    const id = await uid();
    return qOne(
      supabase.from('opportunities').insert({
        created_by:  id,
        title:       data.title,
        description: data.description,
        campaign_id: data.campaignId  || null,
        community:   data.community,
        district:    data.district    || '',
        skills:      data.skills      || [],
        start_date:  data.startDate,
        end_date:    data.endDate,
        slots:              data.slots             || 10,
        status:             data.status            || 'open',
        application_fields: data.applicationFields || {},
      }).select().single()
    );
  },

  update: async (id, data) => {
    const snake = {};
    const map = {
      title: 'title', description: 'description', community: 'community',
      district: 'district', skills: 'skills', startDate: 'start_date',
      endDate: 'end_date', slots: 'slots', status: 'status', campaignId: 'campaign_id',
      applicationFields: 'application_fields',
    };
    Object.entries(data).forEach(([k, v]) => { snake[map[k] ?? k] = v; });
    return qOne(
      supabase.from('opportunities')
        .update({ ...snake, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
    );
  },

  archive: async (id) =>
    qOne(supabase.from('opportunities').update({ is_archived: true,  updated_at: new Date().toISOString() }).eq('id', id).select().single()),

  unarchive: async (id) =>
    qOne(supabase.from('opportunities').update({ is_archived: false, updated_at: new Date().toISOString() }).eq('id', id).select().single()),

  apply: async (opportunityId, data) => {
    const id = await uid();
    return qOne(
      supabase.from('volunteer_applications').insert({
        opportunity_id:          opportunityId,
        user_id:                 id,
        phone:                   data.phone                   || '',
        linked_in:               data.linkedIn                || '',
        languages:               data.languages               || [],
        emergency_contact_name:  data.emergencyContactName    || '',
        emergency_contact_phone: data.emergencyContactPhone   || '',
        cv_url:                  data.cvUrl                   || '',
        id_document_url:         data.idDocumentUrl           || '',
        cover_letter:            data.coverLetter             || '',
        experience:              data.experience              || '',
        message:                 data.message                 || '',
        available_from:          data.availableFrom           || null,
        hours_per_week:          data.hoursPerWeek            || null,
      }).select().single()
    );
  },

  getMyApplications: async () => {
    const id = await uid();
    const data = await q(
      supabase.from('volunteer_applications')
        .select('*, opportunity:opportunity_id(id, title, community, start_date, end_date, status)')
        .eq('user_id', id)
        .order('applied_at', { ascending: false })
    );
    return Array.isArray(data) ? data.map(normalizeApplication) : [];
  },

  getApplications: async (opportunityId) => {
    const data = await q(
      supabase.from('volunteer_applications')
        .select('*, applicant:user_id(id, full_name, email, avatar, community)')
        .eq('opportunity_id', opportunityId)
        .order('applied_at', { ascending: false })
    );
    return Array.isArray(data) ? deepCamelCase(data) : [];
  },

  updateApplicationStatus: async (opportunityId, appId, status) => {
    const result = await qOne(
      supabase.from('volunteer_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', appId).select('*, applicant:user_id(id)').single()
    );
    // Fire email best-effort — don't let it block or break the status update
    if (status === 'accepted' || status === 'rejected') {
      supabase.functions
        .invoke('send-application-email', {
          body: { applicantId: result?.applicant?.id, opportunityId, status },
        })
        .catch(() => {});
    }
    return result;
  },
};

// ── notificationApi ───────────────────────────────────────────

export const notificationApi = {
  getAll: async () => {
    const id = await uid();
    const data = await q(
      supabase.from('notifications')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50)
    );
    const list = Array.isArray(data) ? deepCamelCase(data) : [];
    return {
      notifications: list,
      unreadCount: list.filter(n => !n.read).length,
    };
  },

  markRead: async (ids = []) => {
    const id = await uid();
    if (!ids.length) {
      // Mark all as read
      return q(supabase.from('notifications').update({ read: true }).eq('user_id', id));
    }
    return q(supabase.from('notifications').update({ read: true }).in('id', ids).eq('user_id', id));
  },

  delete: async (notifId) => {
    const id = await uid();
    const { error } = await supabase.from('notifications').delete().eq('id', notifId).eq('user_id', id);
    if (error) throw error;
  },
};

// ── uploadApi ─────────────────────────────────────────────────
// Uploads go directly to Supabase Storage — no server needed.

export const uploadApi = {
  image:    (file, folder = 'general')    => uploadFile(file, folder),
  document: (file, folder = 'documents') => uploadFile(file, folder),
};

// ── expenditureApi ────────────────────────────────────────────

export const expenditureApi = {
  getByCampaign: async (campaignId) => {
    const data = await q(
      supabase.from('expenditures')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('date', { ascending: false })
    );
    return Array.isArray(data) ? data : [];
  },

  create: async (campaignId, data) => {
    const id = await uid();
    return qOne(
      supabase.from('expenditures').insert({
        campaign_id:      campaignId,
        recorded_by:      id,
        amount:           data.amount,
        description:      data.description,
        category:         data.category      || 'supplies',
        date:             data.date,
        receipt_url:      data.receiptUrl    || '',
        delivery_note:    data.deliveryNote  || '',
        beneficiary_count: data.beneficiaryCount || 0,
      }).select().single()
    );
  },

  update: async (id, data) => {
    const map = {
      amount: 'amount', description: 'description', category: 'category',
      date: 'date', receiptUrl: 'receipt_url', deliveryNote: 'delivery_note',
      beneficiaryCount: 'beneficiary_count',
    };
    const snake = {};
    Object.entries(data).forEach(([k, v]) => { snake[map[k] ?? k] = v; });
    return qOne(
      supabase.from('expenditures')
        .update({ ...snake, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
    );
  },

  delete: async (id) => {
    const { error } = await supabase.from('expenditures').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── beneficiaryRegisterApi ────────────────────────────────────
// Anonymised register — no real names, public read, leader write

export const beneficiaryRegisterApi = {
  getByCampaign: async (campaignId) => {
    const data = await q(
      supabase.from('beneficiary_register')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('record_id')
    );
    return Array.isArray(data) ? data : [];
  },

  create: async (campaignId, data) => {
    const id = await uid();
    return qOne(
      supabase.from('beneficiary_register').insert({
        campaign_id:    campaignId,
        recorded_by:    id,
        record_id:      data.recordId,
        age_band:       data.ageBand       || '',
        grade:          data.grade         || '',
        kit_type:       data.kitType       || 'full',
        received_at:    data.receivedAt    || null,
        expenditure_id: data.expenditureId || null,
        notes:          data.notes         || '',
      }).select().single()
    );
  },

  update: async (id, data) => {
    const map = {
      ageBand: 'age_band', grade: 'grade', kitType: 'kit_type',
      receivedAt: 'received_at', expenditureId: 'expenditure_id',
      isVerified: 'is_verified', verifiedAt: 'verified_at',
      deliveryConfirmed: 'delivery_confirmed', confirmationNote: 'confirmation_note',
      notes: 'notes',
    };
    const snake = {};
    Object.entries(data).forEach(([k, v]) => { snake[map[k] ?? k] = v; });
    return qOne(
      supabase.from('beneficiary_register')
        .update({ ...snake, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
    );
  },

  verify: async (id) =>
    qOne(supabase.from('beneficiary_register').update({
      is_verified: true,
      verified_at: new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    }).eq('id', id).select().single()),

  confirmDelivery: async (id, note = '') =>
    qOne(supabase.from('beneficiary_register').update({
      delivery_confirmed: true,
      confirmation_note:  note,
      updated_at:         new Date().toISOString(),
    }).eq('id', id).select().single()),

  delete: async (id) => {
    const { error } = await supabase.from('beneficiary_register').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── disbursementApi ───────────────────────────────────────────

export const disbursementApi = {
  getByCampaign: async (campaignId) => {
    const data = await q(
      supabase.from('disbursement_milestones')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('order_index')
    );
    return Array.isArray(data) ? data : [];
  },

  create: async (campaignId, data) => {
    const id = await uid();
    return qOne(
      supabase.from('disbursement_milestones').insert({
        campaign_id:   campaignId,
        created_by:    id,
        title:         data.title,
        description:   data.description  || '',
        target_amount: data.targetAmount,
        order_index:   data.orderIndex   || 0,
        due_date:      data.dueDate      || null,
      }).select().single()
    );
  },

  submitProof: async (id, { proofUrl, proofNote }) =>
    qOne(supabase.from('disbursement_milestones').update({
      status:             'proof_submitted',
      proof_url:          proofUrl   || '',
      proof_note:         proofNote  || '',
      proof_submitted_at: new Date().toISOString(),
      updated_at:         new Date().toISOString(),
    }).eq('id', id).select().single()),

  release: async (id) => {
    const me = await uid();
    return qOne(supabase.from('disbursement_milestones').update({
      status:      'released',
      released_at: new Date().toISOString(),
      released_by: me,
      updated_at:  new Date().toISOString(),
    }).eq('id', id).select().single());
  },

  delete: async (id) => {
    const { error } = await supabase.from('disbursement_milestones').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── recurringGivingApi ────────────────────────────────────────

export const recurringGivingApi = {
  getMy: async () => {
    const id = await uid();
    const data = await q(
      supabase.from('recurring_donations')
        .select('*, campaign:campaign_id(id, title, cover_image, category, status)')
        .eq('sponsor_id', id)
        .order('created_at', { ascending: false })
    );
    if (!Array.isArray(data)) return [];
    return data.map(d => {
      if (d.campaign !== undefined) { d.campaignId = d.campaign; delete d.campaign; }
      return d;
    });
  },

  create: async (campaignId, data) => {
    const id = await uid();
    return qOne(
      supabase.from('recurring_donations').insert({
        sponsor_id:    id,
        campaign_id:   campaignId,
        amount:        data.amount,
        currency:      data.currency   || 'RWF',
        frequency:     data.frequency  || 'monthly',
        status:        'active',
        next_due_date: data.nextDueDate || null,
      }).select().single()
    );
  },

  pause: async (id) =>
    qOne(supabase.from('recurring_donations').update({ status: 'paused',    updated_at: new Date().toISOString() }).eq('id', id).select().single()),

  resume: async (id) =>
    qOne(supabase.from('recurring_donations').update({ status: 'active',    updated_at: new Date().toISOString() }).eq('id', id).select().single()),

  cancel: async (id) =>
    qOne(supabase.from('recurring_donations').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', id).select().single()),
};

// ── auditApi ──────────────────────────────────────────────────

export const auditApi = {
  getAll: async (params = {}) => {
    const { page = 1, limit = 50, action } = params;
    const { from, to } = range(page, limit);

    let query = supabase.from('audit_logs')
      .select('*, actor:actor_id(id, full_name, avatar)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (action) query = query.eq('action', action);
    const { data, count, error } = await query;
    if (error) throw error;
    return { logs: deepCamelCase(data), total: count ?? 0 };
  },

  log: async ({ action, targetType = '', targetId = null, targetLabel = '', metadata = {} }) => {
    const id = await uid();
    const { data: user } = await supabase.from('users').select('full_name').eq('id', id).single();
    const { error } = await supabase.from('audit_logs').insert({
      actor_id:     id,
      actor_name:   user?.full_name || '',
      action,
      target_type:  targetType,
      target_id:    targetId,
      target_label: targetLabel,
      metadata,
    });
    if (error) console.error('Audit log error:', error);
  },
};
