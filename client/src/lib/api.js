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
    const { status, category, community, search, page = 1, limit = 12 } = params;
    const { from, to } = range(page, limit);

    let query = supabase
      .from('campaigns')
      .select('*, leader:leader_id(id, full_name, avatar, community)')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status)    query = query.eq('status', status);
    if (category)  query = query.eq('category', category);
    if (community) query = query.ilike('community', `%${community}%`);
    if (search)    query = query.ilike('title', `%${search}%`);

    const data = await q(query);
    return Array.isArray(data) ? data.map(normalizeCampaign) : data;
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

  getMy: async () => {
    const id = await uid();
    const data = await q(
      supabase.from('campaigns')
        .select('*')
        .eq('leader_id', id)
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
};

// ── analyticsApi ──────────────────────────────────────────────

export const analyticsApi = {
  admin:  () => supabase.rpc('get_admin_stats').then(({ data, error }) => { if (error) throw error; return data; }),
  leader: () => supabase.rpc('get_leader_stats').then(({ data, error }) => { if (error) throw error; return data; }),
  sponsor:() => supabase.rpc('get_sponsor_stats').then(({ data, error }) => { if (error) throw error; return data; }),
};

// ── userApi ───────────────────────────────────────────────────

export const userApi = {
  getAll: async (params = {}) => {
    const { page = 1, limit = 20, role, search } = params;
    const { from, to } = range(page, limit);

    let query = supabase.from('users').select('*').order('created_at', { ascending: false }).range(from, to);
    if (role)   query = query.eq('role', role);
    if (search) query = query.ilike('full_name', `%${search}%`);

    return q(query);
  },

  verify: async (id, isVerified) =>
    qOne(
      supabase.from('users')
        .update({ is_verified: isVerified, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
    ),
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
    const { status, community, search, page = 1, limit = 20 } = params;
    const { from, to } = range(page, limit);

    let query = supabase
      .from('opportunities')
      .select('*, createdByUser:created_by(id, full_name, avatar)')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status)    query = query.eq('status', status);
    if (community) query = query.ilike('community', `%${community}%`);
    if (search)    query = query.ilike('title', `%${search}%`);

    const data = await q(query);
    return Array.isArray(data) ? data : [];
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
        slots:       data.slots       || 10,
        status:      data.status      || 'open',
      }).select().single()
    );
  },

  update: async (id, data) => {
    const snake = {};
    const map = {
      title: 'title', description: 'description', community: 'community',
      district: 'district', skills: 'skills', startDate: 'start_date',
      endDate: 'end_date', slots: 'slots', status: 'status', campaignId: 'campaign_id',
    };
    Object.entries(data).forEach(([k, v]) => { snake[map[k] ?? k] = v; });
    return qOne(
      supabase.from('opportunities')
        .update({ ...snake, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
    );
  },

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

  updateApplicationStatus: async (opportunityId, appId, status) =>
    qOne(
      supabase.from('volunteer_applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', appId).select().single()
    ),
};

// ── notificationApi ───────────────────────────────────────────

export const notificationApi = {
  getAll: async () => {
    const id = await uid();
    return q(
      supabase.from('notifications')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(50)
    );
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

// ── auditApi ──────────────────────────────────────────────────

export const auditApi = {
  getAll: async (params = {}) => {
    const { page = 1, limit = 50, action } = params;
    const { from, to } = range(page, limit);

    let query = supabase.from('audit_logs')
      .select('*, actor:actor_id(id, full_name, avatar)')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (action) query = query.eq('action', action);
    return q(query);
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
