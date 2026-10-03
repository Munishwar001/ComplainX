import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { env } from './config/env';
import { User } from './models/User';
import { Authority } from './models/Authority';
import { Complaint } from './models/Complaint';

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('🌱 Connected. Seeding...');

  // ── Users ──────────────────────────────────────────────
  const hash = await bcrypt.hash('Demo@1234', 10);

  const demoUser = await User.findOneAndUpdate(
    { email: 'demo@complanx.app' },
    { email: 'demo@complanx.app', name: 'Demo User', password: hash, role: 'USER' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await User.findOneAndUpdate(
    { email: 'admin@complanx.app' },
    { email: 'admin@complanx.app', name: 'Admin User', password: hash, role: 'ADMIN' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('✅ Users done');

  // ── Authorities ────────────────────────────────────────
  const authorities = [
    {
      name: 'Municipal Corporation',
      department: 'Sanitation Department',
      city: 'Mohali', state: 'Punjab',
      email: 'demo-sanitation@example.com',
      phone: '+91-172-2220001',
      categories: ['waste_management', 'sewerage', 'public_infrastructure'],
    },
    {
      name: 'Punjab State Power Corporation',
      department: 'Power Distribution',
      city: 'Mohali', state: 'Punjab',
      email: 'demo-electricity@example.com',
      phone: '+91-172-2220002',
      categories: ['electricity'],
    },
    {
      name: 'Punjab Water Supply Department',
      department: 'Water Supply',
      city: 'Mohali', state: 'Punjab',
      email: 'demo-water@example.com',
      phone: '+91-172-2220003',
      categories: ['water_supply'],
    },
    {
      name: 'Public Works Department',
      department: 'Roads & Infrastructure',
      city: 'Mohali', state: 'Punjab',
      email: 'demo-roads@example.com',
      phone: '+91-172-2220004',
      categories: ['road_damage', 'street_lighting'],
    },
    {
      name: 'Traffic Management Department',
      department: 'Traffic Management',
      city: 'Mohali', state: 'Punjab',
      email: 'demo-traffic@example.com',
      phone: '+91-172-2220005',
      categories: ['traffic'],
    },
    {
      name: 'Chandigarh Municipal Corporation',
      department: 'Sanitation Department',
      city: 'Chandigarh', state: 'Chandigarh',
      email: 'demo-chd-sanitation@example.com',
      phone: '+91-172-2700001',
      categories: ['waste_management', 'sewerage'],
    },
    {
      name: 'Chandigarh Electricity Department',
      department: 'Power Distribution',
      city: 'Chandigarh', state: 'Chandigarh',
      email: 'demo-chd-electricity@example.com',
      phone: '+91-172-2700002',
      categories: ['electricity', 'street_lighting'],
    },
  ];

  for (const a of authorities) {
    await Authority.findOneAndUpdate(
      { email: a.email },
      a,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log('✅ Authorities done');

  // ── Sample Complaints ──────────────────────────────────
  const samples = [
    {
      subject: 'Garbage has not been collected',
      body: 'There is a huge amount of garbage near Sector 68, Mohali. Nobody has collected it for the last 5 days. This is creating a serious hygiene problem. Please take action.',
      senderEmail: 'citizen@example.com', senderName: 'Concerned Citizen',
      location: 'Sector 68', city: 'Mohali', state: 'Punjab', status: 'SENT',
    },
    {
      subject: 'Large pothole on main road causing accidents',
      body: 'There is a very large pothole near the main road in Sector 70, Mohali. Several vehicles have been damaged. Please fix it urgently.',
      senderEmail: 'resident@example.com', senderName: 'Local Resident',
      location: 'Sector 70', city: 'Mohali', state: 'Punjab', status: 'READY_TO_SEND',
    },
    {
      subject: 'Street lights not working near community park',
      body: 'The street lights near the community park in Sector 65 have not been working for the past week. This is a safety concern for residents at night.',
      senderEmail: 'user@example.com', senderName: 'Park Visitor',
      location: 'Sector 65', city: 'Mohali', state: 'Punjab', status: 'ANALYZING',
    },
    {
      subject: 'Water pipeline leakage near market',
      body: 'There is a water pipeline leakage near the main market in Phase 7, Mohali. Water is flowing on the road continuously for 3 days causing wastage.',
      senderEmail: 'shop@example.com', senderName: 'Shopkeeper',
      location: 'Phase 7', city: 'Mohali', state: 'Punjab', status: 'NEEDS_REVIEW',
    },
    {
      subject: 'Repeated electricity outages in Sector 71',
      body: 'We are experiencing repeated and prolonged power outages in Sector 71, Mohali. The electricity goes off for 4-5 hours daily without prior notice.',
      senderEmail: 'area@example.com', senderName: 'Area Resident',
      location: 'Sector 71', city: 'Mohali', state: 'Punjab', status: 'IN_PROGRESS',
    },
  ];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i] as any;
    const ref = `CMP-2026-${String(i + 1).padStart(6, '0')}`;
    const exists = await Complaint.findOne({ reference: ref });
    if (!exists) {
      await Complaint.create({
        reference: ref,
        subject: s.subject,
        body: s.body,
        senderEmail: s.senderEmail,
        senderName: s.senderName,
        location: s.location,
        city: s.city,
        state: s.state,
        status: s.status,
        userId: demoUser._id,
        statusHistory: [
          { status: 'RECEIVED', note: 'Complaint received', createdAt: new Date() },
        ],
      });
    }
  }
  console.log('✅ Sample complaints done');

  console.log('\n📋 Demo credentials:');
  console.log('   User:  demo@complanx.app  / Demo@1234');
  console.log('   Admin: admin@complanx.app / Demo@1234');
  console.log('\n🎉 Seed complete!\n');

  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
