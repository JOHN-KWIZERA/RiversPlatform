import { useState, useEffect } from 'react';
import {
  FileText, Download, Globe, Megaphone, Loader2, CheckCircle2,
  BarChart3, Calendar, Search, ChevronDown, Eye, Table2, Users,
  Heart, ShieldCheck, ClipboardList, Layers, AlignLeft, X, Filter,
  TrendingUp, MapPin,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Spinner from '../components/ui/Spinner';
import RiversMark from '../components/ui/RiversMark';
import { campaignApi, analyticsApi, donationApi, expenditureApi, beneficiaryRegisterApi, disbursementApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, progressPercent, cn } from '../lib/utils';

// ─── Constants ─────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  {
    id: 'campaign', label: 'Campaign Report',
    Icon: Megaphone, desc: 'Impact & financials per campaign',
    roles: ['admin', 'community_leader'],
  },
  {
    id: 'platform', label: 'Platform Summary',
    Icon: Globe, desc: 'Platform-wide metrics & activity',
    roles: ['admin'],
  },
  {
    id: 'donor', label: 'Donation Summary',
    Icon: Heart, desc: 'Personal giving history & impact',
    roles: ['sponsor'],
  },
];

const ALL_SECTIONS = {
  overview:      { label: 'Overview & Metrics',    Icon: BarChart3,     types: ['campaign', 'platform', 'donor'] },
  description:   { label: 'Campaign Description',  Icon: AlignLeft,     types: ['campaign'] },
  moneyTrail:    { label: 'Money Trail',           Icon: ShieldCheck,   types: ['campaign'] },
  beneficiaries: { label: 'Beneficiary Register',  Icon: ClipboardList, types: ['campaign'] },
  milestones:    { label: 'Fund Milestones',       Icon: Layers,        types: ['campaign'] },
  donations:     { label: 'Donation History',      Icon: Heart,         types: ['campaign', 'donor'] },
};

const DEFAULT_SECTIONS = {
  overview: true, description: false, moneyTrail: true,
  beneficiaries: true, milestones: true, donations: true,
};

// ─── PDF Utilities (unchanged) ──────────────────────────────────────────────────

const PW = 210; const PH = 297; const MG = 16; const CW = PW - MG * 2;

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<\/p>/gi, '\n').replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/li>/gi, '\n').replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n').trim();
}

function drawCover(doc, { typeLine1, typeLine2, name, meta, date }) {
  // Left column — near-black
  doc.setFillColor(22, 22, 22); doc.rect(0, 0, 28, PH, 'F');
  // Wave logo box
  doc.setFillColor(0, 30, 43); doc.roundedRect(7, 14, 14, 14, 2, 2, 'F');
  doc.setDrawColor(0, 237, 100); doc.setLineWidth(0.65); doc.setLineCap('round');
  // Upper wave (S-curve approximated with 4 segments)
  [[8.5,19.5],[11.25,17],[14,19.5],[16.75,22],[19.5,19.5]].reduce((prev, cur) => { doc.line(prev[0], prev[1], cur[0], cur[1]); return cur; });
  // Lower wave
  [[8.5,23],[11.25,20.5],[14,23],[16.75,25.5],[19.5,23]].reduce((prev, cur) => { doc.line(prev[0], prev[1], cur[0], cur[1]); return cur; });
  doc.setFontSize(7); doc.setTextColor(140, 140, 140);
  doc.text('RIVERS PLATFORM', 14, 235, { angle: 90, align: 'center' });
  const cx = 38;
  // RIVERS label + thin accent line
  doc.setTextColor(120, 120, 120); doc.setFontSize(8.5); doc.text('RIVERS', cx, 25);
  doc.setFillColor(210, 213, 218); doc.rect(cx, 27, 20, 1.2, 'F');
  // Big title
  doc.setFontSize(38); doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 24, 39); doc.text(typeLine1, cx, 75);
  doc.setFontSize(28); doc.setTextColor(75, 85, 99); doc.text(typeLine2, cx, 92);
  doc.setFontSize(12); doc.setFont('helvetica', 'normal'); doc.setTextColor(107, 114, 128);
  const nameLines = doc.splitTextToSize(name, PW - cx - 16);
  doc.text(nameLines, cx, 110);
  let ty = 110 + nameLines.length * 7 + 6;
  // Divider line
  doc.setFillColor(210, 213, 218); doc.rect(cx, ty, 24, 1.2, 'F'); ty += 10;
  // Meta box
  const boxH = meta.length * 13 + 14;
  doc.setFillColor(249, 250, 251); doc.roundedRect(cx, ty, PW - cx - 16, boxH, 3, 3, 'F');
  doc.setDrawColor(220, 222, 226); doc.setLineWidth(0.3); doc.roundedRect(cx, ty, PW - cx - 16, boxH, 3, 3, 'S');
  doc.setFillColor(180, 184, 190); doc.roundedRect(cx, ty, 3, boxH, 1.5, 1.5, 'F');
  meta.forEach((item, i) => {
    const ry = ty + 10 + i * 13;
    doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(120, 125, 135);
    doc.text(item.label, cx + 8, ry);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(55, 65, 81);
    doc.text(String(item.value), cx + 58, ry);
  });
  // Dot grid — subtle gray
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const alpha = 80 + (r + c) * 20;
    doc.setFillColor(alpha + 100, alpha + 105, alpha + 115);
    doc.circle(PW-12-c*7, 14+r*7, 1.5, 'F');
  }
  // Footer band
  doc.setFillColor(22, 22, 22); doc.rect(0, PH-50, PW, 50, 'F');
  doc.setFillColor(55, 55, 55); doc.rect(0, PH-50, PW, 1.5, 'F');
  doc.setFontSize(9.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text('RIVERS Impact Platform', cx, PH-30);
  doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(140, 140, 140);
  doc.text(`Generated: ${date}  ·  Confidential`, cx, PH-19);
}

function addSection(doc, num, title) {
  doc.addPage();
  doc.setFillColor(244, 245, 247); doc.rect(0, 0, PW, 34, 'F');
  doc.setFillColor(220, 222, 226); doc.rect(0, 34, PW, 0.5, 'F');
  // Number badge
  doc.setFillColor(255, 255, 255); doc.roundedRect(MG, 9, 15, 15, 2, 2, 'F');
  doc.setDrawColor(210, 213, 218); doc.setLineWidth(0.4); doc.roundedRect(MG, 9, 15, 15, 2, 2, 'S');
  doc.setTextColor(100, 110, 125); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text(String(num).padStart(2, '0'), MG+7.5, 18.5, { align: 'center' });
  doc.setFontSize(14); doc.setTextColor(17, 24, 39); doc.text(title, MG+19, 19.5);
  return 44;
}

function addFooters(doc, label) {
  const total = doc.internal.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(220, 222, 226); doc.setLineWidth(0.4); doc.line(MG, 284, PW-MG, 284);
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 155, 165);
    doc.text(`RIVERS Platform  ·  ${label}  ·  Confidential`, MG, 291);
    doc.text(`Page ${i-1} of ${total-1}`, PW-MG, 291, { align: 'right' });
  }
}

function drawMetricBoxes(doc, boxes, startY) {
  const boxW = (CW - (boxes.length-1)*2) / boxes.length;
  boxes.forEach((m, i) => {
    const bx = MG + i*(boxW+2);
    doc.setFillColor(249, 250, 251); doc.roundedRect(bx, startY, boxW, 22, 2, 2, 'F');
    doc.setDrawColor(220, 222, 226); doc.setLineWidth(0.3); doc.roundedRect(bx, startY, boxW, 22, 2, 2, 'S');
    doc.setFontSize(10.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 24, 39);
    const val = doc.splitTextToSize(String(m.value), boxW-4);
    doc.text(val[0], bx+boxW/2, startY+13, { align: 'center' });
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 155, 165);
    doc.text(m.label.toUpperCase(), bx+boxW/2, startY+19, { align: 'center' });
  });
  return startY + 28;
}

function drawProgress(doc, pct, status, startY) {
  doc.setFillColor(228, 230, 234); doc.roundedRect(MG, startY, CW, 5, 2.5, 2.5, 'F');
  if (pct > 0) { doc.setFillColor(55, 65, 81); doc.roundedRect(MG, startY, Math.max(5, CW*pct/100), 5, 2.5, 2.5, 'F'); }
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(55, 65, 81);
  doc.text(`${pct}% funded`, MG, startY+12);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 155, 165);
  doc.text((status||'').replace(/_/g,' ').toUpperCase(), PW-MG, startY+12, { align: 'right' });
  return startY + 19;
}

function drawDescriptionBox(doc, text, startY) {
  const lines = doc.splitTextToSize(text, CW-10);
  const maxLines = Math.floor((270-startY)/4.5);
  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines) visible.push('…');
  const boxH = visible.length*4.5 + 12;
  doc.setFillColor(249, 250, 251); doc.roundedRect(MG, startY, CW, boxH, 2, 2, 'F');
  doc.setDrawColor(220, 222, 226); doc.setLineWidth(0.3); doc.roundedRect(MG, startY, CW, boxH, 2, 2, 'S');
  doc.setFillColor(180, 184, 190); doc.rect(MG, startY, 2.5, boxH, 'F');
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(75, 85, 99);
  doc.text(visible, MG+7, startY+8);
  return startY + boxH + 10;
}

function drawInlineSection(doc, title, startY) {
  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(17, 24, 39);
  doc.text(title, MG, startY);
  doc.setFillColor(210, 213, 218); doc.rect(MG, startY+2.5, CW, 0.4, 'F');
  return startY + 9;
}

// ─── PDF Generators ─────────────────────────────────────────────────────────────

async function generateSingleCampaignPdf(campaign, donations, expenditures, beneficiaries, milestones, config) {
  const { jsPDF } = await import('jspdf');
  const autoTableMod = await import('jspdf-autotable');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.__autoTable = autoTableMod;
  const now = new Date().toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' });
  const pct = progressPercent(campaign.raisedAmount, campaign.targetAmount);

  drawCover(doc, {
    typeLine1: 'CAMPAIGN', typeLine2: 'IMPACT REPORT',
    name: config.title || campaign.title,
    meta: [
      { label: 'Community', value: campaign.community || '—' },
      { label: 'District',  value: campaign.district  || '—' },
      { label: 'Category',  value: (campaign.category || '—').replace(/_/g,' ') },
      { label: 'Status',    value: (campaign.status   || '—').replace(/_/g,' ') },
      { label: 'Generated', value: now },
    ],
    date: now,
  });

  let sectionNum = 1;

  if (config.sections.overview) {
    let curY = addSection(doc, sectionNum++, 'Campaign Overview');
    curY = drawMetricBoxes(doc, [
      { label: 'Target',        value: formatCurrency(campaign.targetAmount) },
      { label: 'Raised',        value: formatCurrency(campaign.raisedAmount) },
      { label: 'Donors',        value: String(campaign.donorCount || 0) },
      { label: 'Beneficiaries', value: String(campaign.beneficiaryCount || 0) },
    ], curY);
    curY += 2;
    curY = drawProgress(doc, pct, campaign.status, curY);
    doc.setDrawColor(220,235,228); doc.setLineWidth(0.4); doc.line(MG, curY+4, PW-MG, curY+4); curY += 12;
    curY = drawInlineSection(doc, 'Key Metrics', curY);
    const { default: at } = autoTableMod;
    at(doc, {
      startY: curY,
      head: [['Metric', 'Value']],
      body: [
        ['Target Amount', formatCurrency(campaign.targetAmount)],
        ['Raised Amount', formatCurrency(campaign.raisedAmount)],
        ['Number of Donors', String(campaign.donorCount||0)],
        ['Beneficiaries', String(campaign.beneficiaryCount||0)],
        ['Status', (campaign.status||'—').replace(/_/g,' ')],
        ['Start Date', campaign.startDate ? formatDate(campaign.startDate) : '—'],
        ['End Date', campaign.endDate ? formatDate(campaign.endDate) : '—'],
      ],
      headStyles: { fillColor:[243,244,246], textColor:[55,65,81], fontStyle:'bold', fontSize:8.5 },
      alternateRowStyles: { fillColor:[249,250,251] },
      styles: { fontSize:9, cellPadding:3.5 },
      columnStyles: { 0: { textColor:[100,110,125] }, 1: { halign:'right', fontStyle:'bold', textColor:[17,24,39] } },
      margin: { left:MG, right:MG }, tableWidth: CW,
    });
  }

  if (config.sections.description && campaign.description) {
    const cleanDesc = stripHtml(campaign.description);
    if (cleanDesc) {
      let curY = addSection(doc, sectionNum++, 'Campaign Description');
      curY = drawDescriptionBox(doc, cleanDesc, curY);
    }
  }

  if (config.sections.donations && donations.length > 0) {
    let filteredDonations = donations;
    if (config.dateFrom) filteredDonations = filteredDonations.filter(d => (d.donatedAt||'').slice(0,10) >= config.dateFrom);
    if (config.dateTo)   filteredDonations = filteredDonations.filter(d => (d.donatedAt||'').slice(0,10) <= config.dateTo);
    if (filteredDonations.length > 0) {
      let curY = addSection(doc, sectionNum++, `Donation History (${filteredDonations.length})`);
      const { default: at } = autoTableMod;
      at(doc, {
        startY: curY,
        head: [['Date', 'Amount (RWF)', 'Method', 'Status']],
        body: filteredDonations.slice(0,40).map(d => [
          d.donatedAt ? formatDate(d.donatedAt) : '—',
          formatCurrency(d.amount),
          (d.paymentMethod||'—').replace(/_/g,' '),
          d.status||'—',
        ]),
        headStyles: { fillColor:[243,244,246], textColor:[55,65,81], fontStyle:'bold', fontSize:8.5 },
        alternateRowStyles: { fillColor:[249,250,251] },
        styles: { fontSize:8.5, cellPadding:3 },
        columnStyles: { 1: { halign:'right', fontStyle:'bold' } },
        margin: { left:MG, right:MG }, tableWidth: CW,
      });
    }
  }

  if (config.sections.moneyTrail && expenditures.length > 0) {
    let curY = addSection(doc, sectionNum++, `Money Trail (${expenditures.length} expenditures)`);
    const { default: at } = autoTableMod;
    const totalSpent = expenditures.reduce((s, e) => s + (e.amount || 0), 0);
    curY = drawMetricBoxes(doc, [
      { label: 'Total Logged', value: formatCurrency(totalSpent) },
      { label: 'Total Raised', value: formatCurrency(campaign.raisedAmount) },
      { label: 'Untraced',     value: formatCurrency(Math.max(0, campaign.raisedAmount - totalSpent)) },
    ], curY);
    curY += 4;
    at(doc, {
      startY: curY,
      head: [['Date', 'Description', 'Category', 'Amount (RWF)', 'Receipt']],
      body: expenditures.map(e => [
        e.date ? formatDate(e.date) : '—',
        e.description || '—',
        (e.category || '—').replace(/_/g, ' '),
        formatCurrency(e.amount),
        e.receiptUrl ? 'Yes' : 'No',
      ]),
      headStyles: { fillColor:[243,244,246], textColor:[55,65,81], fontStyle:'bold', fontSize:8.5 },
      alternateRowStyles: { fillColor:[249,250,251] },
      styles: { fontSize:8.5, cellPadding:3 },
      columnStyles: { 3: { halign:'right', fontStyle:'bold' }, 4: { halign:'center' } },
      margin: { left:MG, right:MG }, tableWidth: CW,
    });
  }

  if (config.sections.beneficiaries && beneficiaries.length > 0) {
    let curY = addSection(doc, sectionNum++, `Beneficiary Register (${beneficiaries.length} records)`);
    const { default: at } = autoTableMod;
    const verified  = beneficiaries.filter(b => b.isVerified).length;
    const delivered = beneficiaries.filter(b => b.deliveryConfirmed).length;
    curY = drawMetricBoxes(doc, [
      { label: 'Registered', value: String(beneficiaries.length) },
      { label: 'Verified',   value: String(verified) },
      { label: 'Delivered',  value: String(delivered) },
    ], curY);
    curY += 4;
    at(doc, {
      startY: curY,
      head: [['Record ID', 'Grade', 'Age Band', 'Kit Type', 'Received', 'Verified', 'Delivered']],
      body: beneficiaries.map(b => [
        b.recordId || '—',
        b.grade || '—',
        b.ageBand || '—',
        (b.kitType || '—'),
        b.receivedAt ? formatDate(b.receivedAt) : '—',
        b.isVerified ? 'Yes' : 'No',
        b.deliveryConfirmed ? 'Yes' : 'No',
      ]),
      headStyles: { fillColor:[243,244,246], textColor:[55,65,81], fontStyle:'bold', fontSize:8.5 },
      alternateRowStyles: { fillColor:[249,250,251] },
      styles: { fontSize:8, cellPadding:3 },
      columnStyles: { 5: { halign:'center' }, 6: { halign:'center' } },
      margin: { left:MG, right:MG }, tableWidth: CW,
    });
  }

  if (config.sections.milestones && milestones.length > 0) {
    let curY = addSection(doc, sectionNum++, `Fund Release Milestones (${milestones.length})`);
    const { default: at } = autoTableMod;
    const released = milestones.filter(m => m.status === 'released').length;
    curY = drawMetricBoxes(doc, [
      { label: 'Total',    value: String(milestones.length) },
      { label: 'Released', value: String(released) },
      { label: 'Pending',  value: String(milestones.length - released) },
    ], curY);
    curY += 4;
    at(doc, {
      startY: curY,
      head: [['Milestone', 'Amount (RWF)', 'Due Date', 'Status']],
      body: milestones.map(m => [
        m.title || '—',
        formatCurrency(m.targetAmount),
        m.dueDate ? formatDate(m.dueDate) : '—',
        (m.status || '—').replace(/_/g, ' '),
      ]),
      headStyles: { fillColor:[243,244,246], textColor:[55,65,81], fontStyle:'bold', fontSize:8.5 },
      alternateRowStyles: { fillColor:[249,250,251] },
      styles: { fontSize:8.5, cellPadding:3 },
      columnStyles: { 1: { halign:'right', fontStyle:'bold' }, 2: { halign:'center' }, 3: { halign:'center' } },
      margin: { left:MG, right:MG }, tableWidth: CW,
    });
  }

  addFooters(doc, 'Campaign Impact Report');
  doc.save(`RIVERS_Campaign_${(config.title||campaign.title).replace(/[^a-z0-9]/gi,'_').slice(0,40)}_${now.replace(/\s/g,'_')}.pdf`);
}

async function generateMultiCampaignPdf(campaigns, config) {
  const { jsPDF } = await import('jspdf');
  const autoTableMod = await import('jspdf-autotable');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const now = new Date().toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' });

  const totalRaised = campaigns.reduce((s,c) => s+(c.raisedAmount||0), 0);
  const totalTarget = campaigns.reduce((s,c) => s+(c.targetAmount||0), 0);
  const totalDonors = campaigns.reduce((s,c) => s+(c.donorCount||0), 0);
  const totalBenef  = campaigns.reduce((s,c) => s+(c.beneficiaryCount||0), 0);
  const pct = totalTarget > 0 ? Math.round(totalRaised/totalTarget*100) : 0;

  drawCover(doc, {
    typeLine1: 'CAMPAIGN', typeLine2: 'IMPACT REPORT',
    name: config.title || `${campaigns.length} Campaigns — Combined Impact`,
    meta: [
      { label: 'Campaigns',     value: String(campaigns.length) },
      { label: 'Total Raised',  value: formatCurrency(totalRaised) },
      { label: 'Donors',        value: String(totalDonors) },
      { label: 'Beneficiaries', value: String(totalBenef) },
      { label: 'Generated',     value: now },
    ],
    date: now,
  });

  if (config.sections.overview) {
    let curY = addSection(doc, 1, 'Combined Overview');
    curY = drawMetricBoxes(doc, [
      { label: 'Campaigns', value: String(campaigns.length) },
      { label: 'Total Raised', value: formatCurrency(totalRaised) },
      { label: 'Donors', value: String(totalDonors) },
      { label: 'Beneficiaries', value: String(totalBenef) },
    ], curY);
    curY += 2;
    curY = drawProgress(doc, pct, 'combined', curY);
    curY += 6;
    curY = drawInlineSection(doc, 'Campaign Breakdown', curY);
    const { default: at } = autoTableMod;
    at(doc, {
      startY: curY,
      head: [['Campaign', 'Status', 'Target (RWF)', 'Raised (RWF)', '%', 'Donors']],
      body: campaigns.map(c => [
        (c.title||'').slice(0,32) + ((c.title||'').length>32?'…':''),
        (c.status||'').replace(/_/g,' '),
        formatCurrency(c.targetAmount),
        formatCurrency(c.raisedAmount),
        `${progressPercent(c.raisedAmount,c.targetAmount)}%`,
        String(c.donorCount||0),
      ]),
      headStyles: { fillColor:[243,244,246], textColor:[55,65,81], fontStyle:'bold', fontSize:8 },
      alternateRowStyles: { fillColor:[249,250,251] },
      styles: { fontSize:8, cellPadding:3 },
      columnStyles: {
        0: { cellWidth:52 }, 2: { halign:'right' },
        3: { halign:'right', fontStyle:'bold', textColor:[17,24,39] },
        4: { halign:'center', fontStyle:'bold', textColor:[55,65,81] },
        5: { halign:'right' },
      },
      margin: { left:MG, right:MG }, tableWidth: CW,
    });
  }

  addFooters(doc, 'Campaign Impact Report');
  doc.save(`RIVERS_Campaigns_${now.replace(/\s/g,'_')}.pdf`);
}

async function generatePlatformPdf(analytics, config) {
  const { jsPDF } = await import('jspdf');
  const autoTableMod = await import('jspdf-autotable');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const now = new Date().toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' });

  drawCover(doc, {
    typeLine1: 'PLATFORM', typeLine2: 'IMPACT REPORT',
    name: config.title || 'Full overview of campaigns, donations, users and impact.',
    meta: [
      { label: 'Total Campaigns',  value: String(analytics?.campaigns?.total ?? '—') },
      { label: 'Active Campaigns', value: String(analytics?.campaigns?.active ?? '—') },
      { label: 'Total Raised',     value: formatCurrency(analytics?.donations?.totalAmount ?? 0) },
      { label: 'Registered Users', value: String(analytics?.users?.total ?? '—') },
      { label: 'Generated',        value: now },
    ],
    date: now,
  });

  if (config.sections.overview) {
    let curY = addSection(doc, 1, 'Platform Summary');
    curY = drawMetricBoxes(doc, [
      { label: 'Total Campaigns', value: String(analytics?.campaigns?.total??0) },
      { label: 'Active',          value: String(analytics?.campaigns?.active??0) },
      { label: 'Total Raised',    value: formatCurrency(analytics?.donations?.totalAmount??0) },
      { label: 'Total Users',     value: String(analytics?.users?.total??0) },
    ], curY);
    curY += 4;
    curY = drawInlineSection(doc, 'Platform Metrics', curY);
    const { default: at } = autoTableMod;
    at(doc, {
      startY: curY,
      head: [['Metric', 'Value']],
      body: [
        ['Total Campaigns',       String(analytics?.campaigns?.total??'—')],
        ['Active Campaigns',      String(analytics?.campaigns?.active??'—')],
        ['Total Raised (RWF)',    formatCurrency(analytics?.donations?.totalAmount??0)],
        ['Total Donations',       String(analytics?.donations?.totalCount??'—')],
        ['Registered Users',      String(analytics?.users?.total??'—')],
        ['Families Supported',    String(analytics?.familiesSupported??'—')],
        ['Campaign Success Rate', analytics?.campaigns?.successRate!=null ? `${analytics.campaigns.successRate}%` : '—'],
      ],
      headStyles: { fillColor:[243,244,246], textColor:[55,65,81], fontStyle:'bold', fontSize:8.5 },
      alternateRowStyles: { fillColor:[249,250,251] },
      styles: { fontSize:9, cellPadding:3.5 },
      columnStyles: { 0:{textColor:[100,110,125]}, 1:{halign:'right',fontStyle:'bold',textColor:[17,24,39]} },
      margin: { left:MG, right:MG }, tableWidth: CW,
    });
    const statData = (analytics?.charts?.campaignsByStatus||[]).map(s => [(s._id||'—').replace(/_/g,' ').toUpperCase(), String(s.count)]);
    if (statData.length > 0) {
      curY = doc.lastAutoTable.finalY + 14;
      curY = drawInlineSection(doc, 'Campaign Status Breakdown', curY);
      const { default: at2 } = autoTableMod;
      at2(doc, {
        startY: curY, head: [['Status','Count']], body: statData,
        headStyles: { fillColor:[243,244,246], textColor:[55,65,81], fontStyle:'bold', fontSize:8.5 },
        alternateRowStyles: { fillColor:[249,250,251] },
        styles: { fontSize:9, cellPadding:3.5 },
        columnStyles: { 1:{halign:'right',fontStyle:'bold',textColor:[17,24,39]} },
        margin: { left:MG, right:MG }, tableWidth: CW,
      });
    }
  }

  addFooters(doc, 'Platform-Wide Impact Report');
  doc.save(`RIVERS_Platform_Report_${now.replace(/\s/g,'_')}.pdf`);
}

async function generateDonorPdf(donations, config) {
  const { jsPDF } = await import('jspdf');
  const autoTableMod = await import('jspdf-autotable');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const now = new Date().toLocaleDateString('en-RW', { year: 'numeric', month: 'long', day: 'numeric' });
  const totalGiven = donations.reduce((s,d) => s+(d.amount||0), 0);
  const completed  = donations.filter(d => d.status==='completed').length;
  const campaigns  = new Set(donations.map(d => d.campaignId?._id).filter(Boolean)).size;

  drawCover(doc, {
    typeLine1: 'DONATION', typeLine2: 'SUMMARY',
    name: config.title || 'Personal giving history and campaign contributions.',
    meta: [
      { label: 'Total Given',      value: formatCurrency(totalGiven) },
      { label: 'Total Donations',  value: String(donations.length) },
      { label: 'Completed',        value: String(completed) },
      { label: 'Campaigns Backed', value: String(campaigns) },
      { label: 'Generated',        value: now },
    ],
    date: now,
  });

  if (config.sections.overview || config.sections.donations) {
    let curY = addSection(doc, 1, 'Giving Summary');
    curY = drawMetricBoxes(doc, [
      { label: 'Total Given',      value: formatCurrency(totalGiven) },
      { label: 'Total Donations',  value: String(donations.length) },
      { label: 'Completed',        value: String(completed) },
      { label: 'Campaigns Backed', value: String(campaigns) },
    ], curY);
    curY += 4;
    curY = drawInlineSection(doc, 'Donation History', curY);
    const { default: at } = autoTableMod;
    at(doc, {
      startY: curY,
      head: [['Date', 'Campaign', 'Amount (RWF)', 'Method', 'Status']],
      body: donations.map(d => [
        d.donatedAt ? formatDate(d.donatedAt) : '—',
        d.campaignId?.title || '—',
        formatCurrency(d.amount),
        (d.paymentMethod||'—').replace(/_/g,' '),
        d.status||'—',
      ]),
      headStyles: { fillColor:[243,244,246], textColor:[55,65,81], fontStyle:'bold', fontSize:8.5 },
      alternateRowStyles: { fillColor:[249,250,251] },
      styles: { fontSize:8.5, cellPadding:3 },
      columnStyles: { 2:{halign:'right',fontStyle:'bold'} },
      margin: { left:MG, right:MG }, tableWidth: CW,
    });
    const totalY = doc.lastAutoTable.finalY + 6;
    doc.setFontSize(10.5); doc.setFont('helvetica','bold'); doc.setTextColor(0,30,43);
    doc.text(`Total Contributed: ${formatCurrency(totalGiven)}`, PW-MG, totalY, { align:'right' });
  }

  addFooters(doc, 'Donation Summary');
  doc.save(`RIVERS_My_Donations_${now.replace(/\s/g,'_')}.pdf`);
}

// ─── Excel Generator ───────────────────────────────────────────────────────────

async function generateExcel(config, { campaigns, analytics, donations }) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  const now = new Date().toLocaleDateString('en-RW');

  if (config.type === 'campaign') {
    const rows = [
      ['RIVERS Platform — Campaign Impact Report', '', `Generated: ${now}`],
      ...(config.dateFrom ? [[`Date range: ${config.dateFrom} → ${config.dateTo || 'present'}`]] : []),
      [],
      ['Campaign', 'Status', 'Community', 'District', 'Category', 'Target (RWF)', 'Raised (RWF)', '% Funded', 'Donors', 'Beneficiaries', 'Start Date', 'End Date'],
      ...campaigns.map(c => [
        c.title, (c.status||'').replace(/_/g,' '), c.community||'', c.district||'',
        (c.category||'').replace(/_/g,' '), c.targetAmount||0, c.raisedAmount||0,
        progressPercent(c.raisedAmount, c.targetAmount),
        c.donorCount||0, c.beneficiaryCount||0,
        c.startDate ? formatDate(c.startDate) : '',
        c.endDate   ? formatDate(c.endDate)   : '',
      ]),
      [],
      ['', '', '', '', 'TOTALS',
        campaigns.reduce((s,c)=>s+(c.targetAmount||0),0),
        campaigns.reduce((s,c)=>s+(c.raisedAmount||0),0),
        '',
        campaigns.reduce((s,c)=>s+(c.donorCount||0),0),
        campaigns.reduce((s,c)=>s+(c.beneficiaryCount||0),0),
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{wch:42},{wch:15},{wch:20},{wch:14},{wch:15},{wch:15},{wch:15},{wch:10},{wch:10},{wch:15},{wch:12},{wch:12}];
    XLSX.utils.book_append_sheet(wb, ws, 'Campaigns');
  }

  if (config.type === 'platform' && analytics) {
    const rows = [
      ['RIVERS Platform — Platform Summary', `Generated: ${now}`],
      [],
      ['Metric', 'Value'],
      ['Total Campaigns',       analytics?.campaigns?.total ?? ''],
      ['Active Campaigns',      analytics?.campaigns?.active ?? ''],
      ['Total Raised (RWF)',    analytics?.donations?.totalAmount ?? 0],
      ['Total Donations',       analytics?.donations?.totalCount ?? ''],
      ['Registered Users',      analytics?.users?.total ?? ''],
      ['Families Supported',    analytics?.familiesSupported ?? ''],
      ['Campaign Success Rate', analytics?.campaigns?.successRate != null ? `${analytics.campaigns.successRate}%` : ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{wch:28},{wch:20}];
    XLSX.utils.book_append_sheet(wb, ws, 'Platform Metrics');

    const statData = analytics?.charts?.campaignsByStatus || [];
    if (statData.length > 0) {
      const ws2 = XLSX.utils.aoa_to_sheet([
        ['Status', 'Count'],
        ...statData.map(s => [(s._id||'').replace(/_/g,' '), s.count]),
      ]);
      ws2['!cols'] = [{wch:20},{wch:10}];
      XLSX.utils.book_append_sheet(wb, ws2, 'Status Breakdown');
    }
  }

  if (config.type === 'donor') {
    const filteredDonations = donations.filter(d => {
      const date = (d.donatedAt||'').slice(0,10);
      if (config.dateFrom && date < config.dateFrom) return false;
      if (config.dateTo   && date > config.dateTo)   return false;
      return true;
    });
    const total = filteredDonations.filter(d=>d.status==='completed').reduce((s,d)=>s+(d.amount||0),0);
    const rows = [
      ['RIVERS Platform — Donation Summary', `Generated: ${now}`],
      ...(config.dateFrom ? [[`Date range: ${config.dateFrom} → ${config.dateTo || 'present'}`]] : []),
      [],
      ['Date', 'Campaign', 'Amount (RWF)', 'Payment Method', 'Status'],
      ...filteredDonations.map(d => [
        d.donatedAt ? formatDate(d.donatedAt) : '',
        d.campaignId?.title || '',
        d.amount||0,
        (d.paymentMethod||'').replace(/_/g,' '),
        d.status||'',
      ]),
      [],
      ['', 'TOTAL CONTRIBUTED:', total, '', ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{wch:12},{wch:42},{wch:16},{wch:18},{wch:12}];
    XLSX.utils.book_append_sheet(wb, ws, 'Donations');
  }

  const label = config.type.charAt(0).toUpperCase() + config.type.slice(1);
  XLSX.writeFile(wb, `RIVERS_${label}_Report_${now.replace(/[/]/g,'-')}.xlsx`);
}

// ─── Campaign Picker ───────────────────────────────────────────────────────────

function CampaignPicker({ campaigns, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const allSelected = selected.length === 0;
  const filtered = campaigns.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()));

  const toggleAll = () => onChange([]);
  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm hover:border-gray-300 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Filter size={13} className="text-gray-400 flex-shrink-0" />
          {allSelected ? (
            <span className="text-gray-600">All campaigns ({campaigns.length})</span>
          ) : (
            <span className="text-gray-700 font-semibold">{selected.length} selected</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!allSelected && (
            <button
              onClick={e => { e.stopPropagation(); onChange([]); }}
              className="p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <X size={12} />
            </button>
          )}
          <ChevronDown size={14} className={cn('text-gray-400 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-2.5 py-2 bg-gray-50 rounded-lg">
              <Search size={13} className="text-gray-400 flex-shrink-0" />
              <input
                autoFocus
                placeholder="Search campaigns…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              {search && <button onClick={() => setSearch('')}><X size={12} className="text-gray-400" /></button>}
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            <button
              onClick={toggleAll}
              className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm border-b border-gray-50', allSelected && 'bg-gray-50')}
            >
              <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0', allSelected ? 'bg-gray-800 border-gray-800' : 'border-gray-300')}>
                {allSelected && <CheckCircle2 size={10} className="text-white" />}
              </div>
              <span className={cn('font-semibold', allSelected ? 'text-gray-800' : 'text-gray-600')}>All campaigns</span>
            </button>

            {filtered.map(c => {
              const isSelected = selected.includes(c._id);
              return (
                <button
                  key={c._id}
                  onClick={() => toggle(c._id)}
                  className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors', isSelected && 'bg-gray-50')}
                >
                  <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0', isSelected ? 'bg-gray-800 border-gray-800' : 'border-gray-300')}>
                    {isSelected && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#001E2B] truncate">{c.title}</p>
                    <p className="text-[10px] text-gray-400">{c.community} · {progressPercent(c.raisedAmount, c.targetAmount)}% funded</p>
                  </div>
                </button>
              );
            })}

            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-gray-400">No campaigns match "{search}"</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Preview Components ────────────────────────────────────────────────────────

function PreviewPage({ label, children }) {
  return (
    <div className="w-full max-w-[460px] mx-auto">
      {label && <p className="text-[10px] text-gray-400 text-center mb-2 tracking-widest font-medium uppercase">{label}</p>}
      <div className="bg-white rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5">
        {children}
      </div>
    </div>
  );
}

function CoverPagePreview({ config, campaigns, analytics, donations }) {
  const typeInfo = REPORT_TYPES.find(r => r.id === config.type) || REPORT_TYPES[0];
  const typeLine1 = config.type === 'campaign' ? 'CAMPAIGN' : config.type === 'platform' ? 'PLATFORM' : 'DONATION';
  const typeLine2 = config.type === 'campaign' ? 'IMPACT REPORT' : config.type === 'platform' ? 'IMPACT REPORT' : 'SUMMARY';
  const selC = config.campaigns.length > 0 ? campaigns.filter(c=>config.campaigns.includes(c._id)) : campaigns;
  const name = config.title || (
    config.type === 'campaign'
      ? (selC.length === 1 ? selC[0]?.title : `${selC.length} Campaign${selC.length!==1?'s':''}`)
      : config.type === 'platform' ? 'Platform-wide impact & metrics'
      : 'Personal giving history'
  );
  const totalRaised = selC.reduce((s,c)=>s+(c.raisedAmount||0),0);
  const totalDonors = selC.reduce((s,c)=>s+(c.donorCount||0),0);
  const donTotal = donations.reduce((s,d)=>s+(d.amount||0),0);

  return (
    <PreviewPage label="Cover Page">
      <div className="bg-[#00ED64] h-0.5" />
      <div className="flex">
        {/* Left column */}
        <div className="w-14 bg-[#001E2B] flex flex-col items-center py-4 gap-3 flex-shrink-0 min-h-[320px]">
          <RiversMark size={32} />
          <div className="w-0.5 flex-1 bg-[#00ED64]/25 rounded-full" />
          <p className="text-[6px] text-white/30 font-bold tracking-[0.25em]"
             style={{ writingMode:'vertical-rl', transform:'rotate(180deg)' }}>
            RIVERS PLATFORM
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col justify-between min-h-[320px]">
          <div>
            <p className="text-[9px] font-black text-[#00684A] tracking-widest">RIVERS</p>
            <div className="bg-[#00ED64] h-0.5 w-5 mt-0.5 mb-5" />
            <h2 className="text-2xl font-black text-[#00684A] leading-none">{typeLine1}</h2>
            <h3 className="text-base font-black text-[#001E2B] leading-none mt-1 mb-3">{typeLine2}</h3>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed line-clamp-2">{name}</p>
            <div className="bg-[#00ED64] h-0.5 w-8 mb-4" />
            <div className="bg-gray-50 rounded-lg p-3 border-l-[3px] border-[#00684A] space-y-1.5">
              {config.type === 'campaign' && (<>
                <Row label="Campaigns" value={selC.length} />
                <Row label="Total Raised" value={formatCurrency(totalRaised)} />
                <Row label="Donors" value={totalDonors} />
              </>)}
              {config.type === 'platform' && analytics && (<>
                <Row label="Total Campaigns" value={analytics?.campaigns?.total ?? '—'} />
                <Row label="Total Raised" value={formatCurrency(analytics?.donations?.totalAmount ?? 0)} />
                <Row label="Users" value={analytics?.users?.total ?? '—'} />
              </>)}
              {config.type === 'donor' && (<>
                <Row label="Donations" value={donations.length} />
                <Row label="Total Given" value={formatCurrency(donTotal)} />
              </>)}
              {config.dateFrom && <Row label="Period" value={`${config.dateFrom} → ${config.dateTo||'now'}`} />}
            </div>
          </div>

          {/* Dot grid */}
          <div className="flex gap-1.5 flex-wrap w-10 self-end mb-2">
            {Array.from({length:9}).map((_,i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#00ED64] opacity-50" />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom band */}
      <div className="bg-[#001E2B] px-5 py-3 flex items-center justify-between">
        <span className="text-[11px] text-white font-bold">RIVERS Impact Platform</span>
        <span className="text-[10px] text-white/30">{new Date().toLocaleDateString()}</span>
      </div>
    </PreviewPage>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#00684A] font-bold w-24 flex-shrink-0">{label}</span>
      <span className="text-[10px] text-gray-600">{value}</span>
    </div>
  );
}

function SectionPreviewCard({ sectionKey, section, index, campaigns, analytics, donations, expenditures, beneficiaries, milestones, config }) {
  const selC = config.campaigns.length > 0 ? campaigns.filter(c=>config.campaigns.includes(c._id)) : campaigns;
  const totalRaised = selC.reduce((s,c)=>s+(c.raisedAmount||0),0);
  const totalTarget = selC.reduce((s,c)=>s+(c.targetAmount||0),0);
  const totalDonors = selC.reduce((s,c)=>s+(c.donorCount||0),0);
  const totalBenef  = selC.reduce((s,c)=>s+(c.beneficiaryCount||0),0);
  const pct = totalTarget > 0 ? Math.round(totalRaised/totalTarget*100) : 0;
  const donTotal = donations.reduce((s,d)=>s+(d.amount||0),0);

  return (
    <PreviewPage label={`Section ${index}`}>
      {/* Section banner */}
      <div className="bg-gray-50 border-b border-gray-100 px-5 py-3 flex items-center gap-3">
        <div className="w-6 h-6 bg-white border border-gray-200 rounded-md flex items-center justify-center flex-shrink-0">
          <span className="text-gray-500 font-bold text-[10px]">{String(index).padStart(2,'0')}</span>
        </div>
        <h3 className="text-gray-700 font-semibold text-sm">{section.label}</h3>
      </div>

      <div className="p-5">
        {sectionKey === 'overview' && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-2">
              {(config.type === 'campaign' ? [
                { label:'Target', value:formatCurrency(totalTarget) },
                { label:'Raised', value:formatCurrency(totalRaised) },
                { label:'Donors', value:totalDonors },
                { label:'Beneficiaries', value:totalBenef },
              ] : config.type === 'platform' ? [
                { label:'Campaigns', value:analytics?.campaigns?.total??0 },
                { label:'Active', value:analytics?.campaigns?.active??0 },
                { label:'Raised', value:formatCurrency(analytics?.donations?.totalAmount??0) },
                { label:'Users', value:analytics?.users?.total??0 },
              ] : [
                { label:'Donations', value:donations.length },
                { label:'Total Given', value:formatCurrency(donTotal) },
                { label:'Completed', value:donations.filter(d=>d.status==='completed').length },
                { label:'Campaigns', value:new Set(donations.map(d=>d.campaignId?._id).filter(Boolean)).size },
              ]).map(m => (
                <div key={m.label} className="bg-white rounded-lg p-2 border border-gray-100 text-center">
                  <p className="text-[11px] font-black text-gray-800 leading-tight">{m.value}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wide">{m.label}</p>
                </div>
              ))}
            </div>
            {config.type === 'campaign' && (
              <div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                  <div className="h-full bg-gray-700 rounded-full" style={{width:`${pct}%`}} />
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-600 font-bold">{pct}% funded</span>
                  <span className="text-gray-400">{selC.length} campaign{selC.length!==1?'s':''}</span>
                </div>
              </div>
            )}
            {selC.length > 0 && config.type === 'campaign' && (
              <div className="rounded-lg overflow-hidden border border-gray-100">
                <div className="grid grid-cols-3 bg-gray-50 px-3 py-1.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <span>Campaign</span><span className="text-right">Raised</span><span className="text-right">Donors</span>
                </div>
                {selC.slice(0,4).map(c => (
                  <div key={c._id} className="grid grid-cols-3 px-3 py-2 text-[10px] border-b border-gray-50 last:border-0 even:bg-gray-50/50">
                    <span className="text-gray-700 truncate">{c.title?.slice(0,22)}</span>
                    <span className="text-right font-semibold text-gray-800">{formatCurrency(c.raisedAmount||0)}</span>
                    <span className="text-right text-gray-500">{c.donorCount||0}</span>
                  </div>
                ))}
                {selC.length > 4 && <div className="px-3 py-1.5 text-[10px] text-gray-400 text-center bg-gray-50">+{selC.length-4} more</div>}
              </div>
            )}
          </div>
        )}

        {sectionKey === 'description' && (
          <div className="flex flex-col gap-3">
            {selC.slice(0,2).map(c => (
              <div key={c._id} className="border-l-2 border-gray-200 pl-3 bg-gray-50 rounded-r-lg p-3">
                <p className="text-[11px] font-bold text-gray-800 mb-1">{c.title?.slice(0,40)}</p>
                <p className="text-[10px] text-gray-500 line-clamp-3">{stripHtml(c.description)?.slice(0,180) || 'No description available.'}</p>
              </div>
            ))}
            {selC.length > 2 && <p className="text-[10px] text-gray-400 text-center">+{selC.length-2} more campaigns</p>}
          </div>
        )}

        {sectionKey === 'moneyTrail' && (
          <div className="flex flex-col gap-2">
            {expenditures.length > 0 ? (
              <>
                <div className="rounded-lg overflow-hidden border border-gray-100">
                  <div className="grid grid-cols-3 bg-gray-50 px-3 py-1.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <span className="col-span-2">Description</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {expenditures.slice(0, 5).map((e, i) => (
                    <div key={e.id||i} className={`grid grid-cols-3 px-3 py-2 text-[10px] border-b border-gray-50 last:border-0 ${i%2===0?'bg-white':'bg-gray-50/50'}`}>
                      <span className="col-span-2 text-gray-700 truncate">{e.description}</span>
                      <span className="text-right font-bold text-gray-800">{formatCurrency(e.amount)}</span>
                    </div>
                  ))}
                  {expenditures.length > 5 && <div className="px-3 py-1.5 text-[10px] text-gray-400 text-center bg-gray-50">+{expenditures.length-5} more</div>}
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-400">{expenditures.length} record{expenditures.length!==1?'s':''}</span>
                  <span className="font-bold text-[#001E2B]">Total: {formatCurrency(expenditures.reduce((s,e)=>s+(e.amount||0),0))}</span>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <ShieldCheck size={20} className="mx-auto mb-1.5 text-gray-200" />
                <p className="text-[11px] text-gray-400 font-medium">No expenditures recorded</p>
              </div>
            )}
          </div>
        )}

        {sectionKey === 'beneficiaries' && (
          <div className="flex flex-col gap-2">
            {beneficiaries.length > 0 ? (
              <>
                <div className="rounded-lg overflow-hidden border border-gray-100">
                  <div className="grid grid-cols-4 bg-gray-50 px-3 py-1.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <span>ID</span><span>Grade</span><span>Kit</span><span>Status</span>
                  </div>
                  {beneficiaries.slice(0, 5).map((b, i) => (
                    <div key={b.id||i} className={`grid grid-cols-4 px-3 py-2 text-[10px] border-b border-gray-50 last:border-0 ${i%2===0?'bg-white':'bg-gray-50/50'}`}>
                      <span className="font-mono text-gray-500 truncate text-[9px]">{b.recordId}</span>
                      <span className="text-gray-600">{b.grade||'—'}</span>
                      <span className="text-gray-600 capitalize truncate">{b.kitType}</span>
                      <span className={b.deliveryConfirmed ? 'text-gray-700 font-semibold' : 'text-gray-400'}>
                        {b.deliveryConfirmed ? 'Done' : 'Pending'}
                      </span>
                    </div>
                  ))}
                  {beneficiaries.length > 5 && <div className="px-3 py-1.5 text-[10px] text-gray-400 text-center bg-gray-50">+{beneficiaries.length-5} more</div>}
                </div>
                <p className="text-[10px] text-gray-400">{beneficiaries.length} record{beneficiaries.length!==1?'s':''} · {beneficiaries.filter(b=>b.deliveryConfirmed).length} confirmed</p>
              </>
            ) : (
              <div className="text-center py-6">
                <ClipboardList size={20} className="mx-auto mb-1.5 text-gray-200" />
                <p className="text-[11px] text-gray-400 font-medium">No beneficiary records</p>
              </div>
            )}
          </div>
        )}

        {sectionKey === 'milestones' && (
          <div className="flex flex-col gap-2">
            {milestones.length > 0 ? (
              <>
                {milestones.slice(0, 4).map((m, i) => {
                  const isReleased = m.status === 'released';
                  const statusLabel = m.status === 'released' ? 'Released' : m.status === 'proof_submitted' ? 'Review' : 'Pending';
                  return (
                    <div key={m.id||i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-100 bg-white text-[10px]">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 ${isReleased?'bg-gray-800 text-white':'bg-gray-100 text-gray-500'}`}>{i+1}</div>
                      <span className="flex-1 text-gray-700 truncate font-medium">{m.title}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${isReleased?'bg-gray-100 text-gray-700':'bg-gray-100 text-gray-400'}`}>{statusLabel}</span>
                      <span className="font-bold text-gray-800 flex-shrink-0">{formatCurrency(m.targetAmount)}</span>
                    </div>
                  );
                })}
                {milestones.length > 4 && <p className="text-[10px] text-gray-400 text-center">+{milestones.length-4} more milestones</p>}
              </>
            ) : (
              <div className="text-center py-6">
                <Layers size={20} className="mx-auto mb-1.5 text-gray-200" />
                <p className="text-[11px] text-gray-400 font-medium">No milestones defined</p>
              </div>
            )}
          </div>
        )}

        {sectionKey === 'donations' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-lg overflow-hidden border border-gray-100">
              <div className="grid grid-cols-4 bg-gray-50 px-3 py-1.5 text-[9px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <span>Date</span><span className="col-span-2">Campaign</span><span className="text-right">Amount</span>
              </div>
              {donations.length > 0 ? (
                <>
                  {donations.slice(0, 5).map((d, i) => (
                    <div key={d._id || i} className={`grid grid-cols-4 px-3 py-2 text-[10px] border-b border-gray-50 last:border-0 ${i%2===0?'bg-white':'bg-gray-50/50'}`}>
                      <span className="text-gray-400">{d.donatedAt ? formatDate(d.donatedAt) : '—'}</span>
                      <span className="col-span-2 text-gray-700 truncate">{d.campaignId?.title?.slice(0,22) || '—'}</span>
                      <span className="text-right font-bold text-gray-800">{formatCurrency(d.amount)}</span>
                    </div>
                  ))}
                  {donations.length > 5 && (
                    <div className="px-3 py-1.5 text-[10px] text-gray-400 text-center bg-gray-50">
                      +{donations.length - 5} more records
                    </div>
                  )}
                </>
              ) : (
                <div className="px-4 py-6 flex flex-col items-center gap-1.5 text-center">
                  <Heart size={18} className="text-gray-200" />
                  <p className="text-[11px] font-semibold text-gray-400">Donation records included in PDF</p>
                  <p className="text-[10px] text-gray-300">Fetched from campaigns at download time</p>
                </div>
              )}
            </div>
            {donations.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">{donations.length} donation{donations.length!==1?'s':''}</span>
                <span className="text-[11px] font-bold text-gray-800">
                  Total: {formatCurrency(donations.reduce((s,d) => s+(d.amount||0), 0))}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </PreviewPage>
  );
}

function ReportPreview({ config, data, previewDetail, loading }) {
  const { campaigns, analytics, donations } = data;
  const { expenditures, beneficiaries, milestones, donations: detailDonations } = previewDetail;
  const effectiveDonations = donations.length > 0 ? donations : detailDonations;

  const filteredDonations = (() => {
    if (!config.dateFrom && !config.dateTo) return effectiveDonations;
    return effectiveDonations.filter(d => {
      const date = (d.donatedAt || d.createdAt || '').slice(0, 10);
      if (config.dateFrom && date < config.dateFrom) return false;
      if (config.dateTo   && date > config.dateTo)   return false;
      return true;
    });
  })();

  const activeSections = Object.entries(ALL_SECTIONS)
    .filter(([key, s]) => s.types.includes(config.type) && config.sections[key])
    .map(([key, s]) => ({ key, ...s }));

  const selCount = config.campaigns.length || campaigns.length;
  const estimatedPages = 1 + activeSections.length;

  return (
    <div className="card overflow-hidden flex flex-col" style={{ minHeight: 600 }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Eye size={13} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Live Preview</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium">
          <span>~{estimatedPages} page{estimatedPages!==1?'s':''}</span>
          <span className="w-1 h-1 rounded-full bg-gray-200" />
          <span>{selCount} campaign{selCount!==1?'s':''}</span>
          <span className="w-1 h-1 rounded-full bg-gray-200" />
          <span>A4 PDF</span>
        </div>
      </div>

      {/* Viewer */}
      <div className="bg-gray-100 flex-1 p-7 overflow-y-auto flex flex-col items-center gap-6" style={{ minHeight: 560 }}>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Spinner size={28} className="text-gray-400" />
          </div>
        ) : (
          <>
            <CoverPagePreview config={config} campaigns={campaigns} analytics={analytics} donations={donations} />
            {activeSections.map((s, i) => (
              <SectionPreviewCard
                key={s.key}
                sectionKey={s.key}
                section={s}
                index={i + 1}
                campaigns={campaigns}
                analytics={analytics}
                donations={filteredDonations}
                expenditures={expenditures}
                beneficiaries={beneficiaries}
                milestones={milestones}
                config={config}
              />
            ))}
            {activeSections.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select at least one section to preview</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { user, effectiveRole } = useAuth();
  const role = effectiveRole ?? user?.role;

  const [config, setConfig] = useState({
    type: role === 'sponsor' ? 'donor' : 'campaign',
    campaigns: [],
    dateFrom: '',
    dateTo: '',
    sections: { ...DEFAULT_SECTIONS },
    title: '',
  });

  const [data, setData]         = useState({ campaigns: [], analytics: null, donations: [] });
  const [loading, setLoading]   = useState(true);
  const [generating, setGenerating] = useState(null);
  const [previewDetail, setPreviewDetail] = useState({ expenditures: [], beneficiaries: [], milestones: [], donations: [] });

  useEffect(() => {
    const fetch = async () => {
      try {
        if (role === 'admin') {
          const [c, a] = await Promise.all([campaignApi.getAll({ limit: 100 }), analyticsApi.admin()]);
          setData(d => ({ ...d, campaigns: c.campaigns || [], analytics: a }));
        } else if (role === 'community_leader') {
          const c = await campaignApi.getMy();
          setData(d => ({ ...d, campaigns: Array.isArray(c) ? c : c.campaigns || [] }));
        } else if (role === 'sponsor') {
          const don = await donationApi.getMy().catch(() => []);
          setData(d => ({ ...d, donations: Array.isArray(don) ? don : [] }));
        }
      } catch { toast.error('Failed to load report data.'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [role]);

  const updateConfig = (key, val) => setConfig(c => ({ ...c, [key]: val }));
  const toggleSection = (key) =>
    setConfig(c => ({ ...c, sections: { ...c.sections, [key]: !c.sections[key] } }));

  const selectedCampaigns = config.campaigns.length > 0
    ? data.campaigns.filter(c => config.campaigns.includes(c._id))
    : data.campaigns;

  // Fetch per-campaign detail data for the live preview
  useEffect(() => {
    if (config.type !== 'campaign' || loading) return;
    const toFetch = selectedCampaigns.slice(0, 3);
    if (toFetch.length === 0) {
      setPreviewDetail({ expenditures: [], beneficiaries: [], milestones: [], donations: [] });
      return;
    }
    Promise.all(toFetch.map(c => Promise.all([
      expenditureApi.getByCampaign(c._id).catch(() => []),
      beneficiaryRegisterApi.getByCampaign(c._id).catch(() => []),
      disbursementApi.getByCampaign(c._id).catch(() => []),
      donationApi.getCampaignDonations(c._id).catch(() => []),
    ]))).then(results => {
      setPreviewDetail({
        expenditures: results.flatMap(r => Array.isArray(r[0]) ? r[0] : []),
        beneficiaries: results.flatMap(r => Array.isArray(r[1]) ? r[1] : []),
        milestones:    results.flatMap(r => Array.isArray(r[2]) ? r[2] : []),
        donations:     results.flatMap(r => Array.isArray(r[3]) ? r[3] : []),
      });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.type, config.campaigns.join(','), loading]);

  const filterDonationsByDate = (items) => items.filter(d => {
    const date = (d.donatedAt || '').slice(0, 10);
    if (config.dateFrom && date < config.dateFrom) return false;
    if (config.dateTo   && date > config.dateTo)   return false;
    return true;
  });

  const handleDownloadPdf = async () => {
    setGenerating('pdf');
    try {
      if (config.type === 'campaign') {
        if (selectedCampaigns.length === 0) { toast.error('No campaigns found.'); return; }
        if (selectedCampaigns.length === 1) {
          const cid = selectedCampaigns[0]._id;
          const [donations, expenditures, beneficiaries, milestones] = await Promise.all([
            donationApi.getCampaignDonations(cid).catch(() => []),
            expenditureApi.getByCampaign(cid).catch(() => []),
            beneficiaryRegisterApi.getByCampaign(cid).catch(() => []),
            disbursementApi.getByCampaign(cid).catch(() => []),
          ]);
          await generateSingleCampaignPdf(
            selectedCampaigns[0],
            Array.isArray(donations) ? donations : [],
            Array.isArray(expenditures) ? expenditures : [],
            Array.isArray(beneficiaries) ? beneficiaries : [],
            Array.isArray(milestones) ? milestones : [],
            config
          );
        } else {
          await generateMultiCampaignPdf(selectedCampaigns, config);
        }
      } else if (config.type === 'platform') {
        if (!data.analytics) { toast.error('Platform analytics not available.'); return; }
        await generatePlatformPdf(data.analytics, config);
      } else {
        const donations = filterDonationsByDate(data.donations);
        await generateDonorPdf(donations, config);
      }
      toast.success('Report downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate report.');
    } finally { setGenerating(null); }
  };

  const handleDownloadExcel = async () => {
    setGenerating('excel');
    try {
      const donations = filterDonationsByDate(data.donations);
      await generateExcel(config, { campaigns: selectedCampaigns, analytics: data.analytics, donations });
      toast.success('Excel sheet downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Excel file.');
    } finally { setGenerating(null); }
  };

  const availableTypes = REPORT_TYPES.filter(t => t.roles.includes(role));
  const availableSections = Object.entries(ALL_SECTIONS)
    .filter(([, s]) => s.types.includes(config.type));

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="page-header">Report Builder</h1>
          <p className="text-sm text-gray-500 mt-1">Configure, preview, and export customised reports in PDF or Excel.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
          <Eye size={13} className="text-gray-400" />
          Live preview updates as you configure
        </div>
      </div>

      {/* Builder */}
      <div className="grid lg:grid-cols-[360px_1fr] gap-5 items-start">

        {/* ── Config panel ──────────────────────────────────── */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">

          {/* Report Type */}
          <div className="card p-4 flex flex-col gap-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Report Type</p>
            {availableTypes.map(rt => {
              const active = config.type === rt.id;
              return (
                <button
                  key={rt.id}
                  onClick={() => updateConfig('type', rt.id)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all text-left w-full',
                    active ? 'border-gray-300 bg-gray-50' : 'border-gray-100 hover:border-gray-200 bg-white'
                  )}
                >
                  <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', active ? 'bg-white border border-gray-200' : 'bg-gray-50')}>
                    <rt.Icon size={17} className={active ? 'text-gray-700' : 'text-gray-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold', active ? 'text-gray-900' : 'text-gray-500')}>{rt.label}</p>
                    <p className="text-[11px] text-gray-400">{rt.desc}</p>
                  </div>
                  {active && <CheckCircle2 size={16} className="text-gray-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Campaigns filter */}
          {config.type === 'campaign' && data.campaigns.length > 0 && (
            <div className="card p-4 flex flex-col gap-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Campaigns</p>
              <CampaignPicker
                campaigns={data.campaigns}
                selected={config.campaigns}
                onChange={val => updateConfig('campaigns', val)}
              />
              {config.campaigns.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {selectedCampaigns.slice(0, 6).map(c => (
                    <span key={c._id} className="text-[10px] bg-gray-100 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full font-medium truncate max-w-[160px]">
                      {c.title}
                    </span>
                  ))}
                  {selectedCampaigns.length > 6 && (
                    <span className="text-[10px] text-gray-400">+{selectedCampaigns.length - 6} more</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Date range */}
          <div className="card p-4 flex flex-col gap-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Date Range</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-gray-500 font-medium mb-1.5 block flex items-center gap-1">
                  <Calendar size={11} /> From
                </label>
                <input
                  type="date"
                  value={config.dateFrom}
                  onChange={e => updateConfig('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] text-gray-500 font-medium mb-1.5 block flex items-center gap-1">
                  <Calendar size={11} /> To
                </label>
                <input
                  type="date"
                  value={config.dateTo}
                  onChange={e => updateConfig('dateTo', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 bg-white"
                />
              </div>
            </div>
            {(config.dateFrom || config.dateTo) && (
              <button
                onClick={() => { updateConfig('dateFrom', ''); updateConfig('dateTo', ''); }}
                className="text-[11px] text-gray-400 hover:text-red-400 flex items-center gap-1 self-start transition-colors"
              >
                <X size={11} /> Clear date filter
              </button>
            )}
          </div>

          {/* Sections */}
          <div className="card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Include Sections</p>
              <span className="text-[10px] text-gray-400">
                {availableSections.filter(([k]) => config.sections[k]).length}/{availableSections.length} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableSections.map(([key, section]) => {
                const active = config.sections[key];
                return (
                  <button
                    key={key}
                    onClick={() => toggleSection(key)}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all',
                      active
                        ? 'border-gray-900 text-gray-900 bg-white font-semibold'
                        : 'border-gray-200 text-gray-400 bg-white hover:border-gray-300 hover:text-gray-600'
                    )}
                  >
                    <section.Icon size={11} />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Title */}
          <div className="card p-4 flex flex-col gap-3">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Custom Title <span className="normal-case font-normal">(optional)</span></p>
            <input
              type="text"
              placeholder="Leave blank to use default title…"
              value={config.title}
              onChange={e => updateConfig('title', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 bg-white placeholder:text-gray-300"
            />
          </div>

          {/* Download buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={!!generating || (config.type === 'campaign' && selectedCampaigns.length === 0)}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#001E2B] hover:bg-[#002d42] text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-warm"
            >
              {generating === 'pdf'
                ? <Loader2 size={16} className="animate-spin" />
                : <Download size={16} />
              }
              Download PDF Report
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={!!generating || (config.type === 'campaign' && selectedCampaigns.length === 0)}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating === 'excel'
                ? <Loader2 size={16} className="animate-spin" />
                : <Table2 size={16} />
              }
              Export as Excel (.xlsx)
            </button>
            {config.type === 'campaign' && selectedCampaigns.length === 0 && !loading && (
              <p className="text-[11px] text-amber-500 text-center">No campaigns available to report on</p>
            )}
          </div>
        </div>

        {/* ── Preview panel ─────────────────────────────────── */}
        <ReportPreview config={config} data={{ ...data, campaigns: selectedCampaigns }} previewDetail={previewDetail} loading={loading} />
      </div>
    </div>
  );
}
