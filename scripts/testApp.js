const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Sponsorship = require('../models/Sponsorship');
const Report = require('../models/Report');

const testAndSeedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventsphere';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    console.log('Clearing old test data...');
    await User.deleteMany({ email: { $ne: process.env.ADMIN_EMAIL || 'admin@eventsphere.com' } });
    await Event.deleteMany({});
    await Registration.deleteMany({});
    await Sponsorship.deleteMany({});
    await Report.deleteMany({});

    console.log('Creating role-specific test users...');
    const organizer = await User.create({
      name: 'Sarah Organizer',
      email: 'organizer@eventsphere.com',
      password: 'Password123!',
      role: 'organizer',
      isActive: true
    });

    const attendee = await User.create({
      name: 'Alex Attendee',
      email: 'attendee@eventsphere.com',
      password: 'Password123!',
      role: 'attendee',
      isActive: true
    });

    const moderator = await User.create({
      name: 'Michael Moderator',
      email: 'moderator@eventsphere.com',
      password: 'Password123!',
      role: 'moderator',
      isActive: true
    });

    const sponsor = await User.create({
      name: 'TechCorp Sponsor',
      email: 'sponsor@eventsphere.com',
      password: 'Password123!',
      role: 'sponsor',
      isActive: true
    });

    console.log('Users created successfully for all roles.');

    console.log('Creating sample events...');
    const event1 = await Event.create({
      title: 'Global AI & Cloud Summit 2026',
      description: 'Join industry pioneers for three days of keynotes, workshops, and networking on Artificial Intelligence, LLMs, and Cloud Infrastructure.',
      category: 'technology',
      location: 'Silicon Valley Convention Center, CA',
      eventDate: new Date('2026-10-15'),
      startTime: '09:00',
      endTime: '17:00',
      capacity: 500,
      price: 199,
      organizer: organizer._id,
      status: 'approved'
    });

    const event2 = await Event.create({
      title: 'Full-Stack JavaScript Masterclass',
      description: 'Hands-on intensive workshop building real-world microservices with Node.js, Express, MongoDB, and Next.js.',
      category: 'workshop',
      location: 'TechHub Auditorium, New York, NY',
      eventDate: new Date('2026-11-05'),
      startTime: '10:00',
      endTime: '16:00',
      capacity: 50,
      price: 49,
      organizer: organizer._id,
      status: 'approved'
    });

    const event3 = await Event.create({
      title: 'Startup Pitch & Venture Capital Networking',
      description: 'Pitch your startup to leading VC investors and angel groups. Direct Q&A and private networking lounge.',
      category: 'business',
      location: 'Financial District Plaza, Chicago, IL',
      eventDate: new Date('2026-12-01'),
      startTime: '13:00',
      endTime: '18:00',
      capacity: 100,
      price: 0,
      organizer: organizer._id,
      status: 'pending' // Pending moderation
    });

    console.log('Events created successfully.');

    console.log('Registering attendee for Global AI Summit...');
    const reg1 = await Registration.create({
      user: attendee._id,
      event: event1._id,
      ticketId: 'EVT-2026-A8F92K',
      status: 'active'
    });

    event1.registeredCount += 1;
    await event1.save();

    console.log('Submitting sponsorship offer from TechCorp...');
    await Sponsorship.create({
      sponsor: sponsor._id,
      event: event1._id,
      amount: 5000,
      message: 'Exclusive Platinum Keynote Sponsorship package for AI Summit 2026',
      status: 'approved'
    });

    console.log('Submitting test report...');
    await Report.create({
      reportedBy: attendee._id,
      event: event3._id,
      reason: 'misleading',
      description: 'Missing speaker list verification for VC event.',
      status: 'pending'
    });

    console.log('\n--- VERIFICATION SUCCESSFUL ---');
    console.log(`Organizers: ${organizer.name} (${organizer.email})`);
    console.log(`Attendees: ${attendee.name} (${attendee.email})`);
    console.log(`Moderators: ${moderator.name} (${moderator.email})`);
    console.log(`Sponsors: ${sponsor.name} (${sponsor.email})`);
    console.log(`Tickets Issued: ${reg1.ticketId}`);
    console.log(`Event Approved Count: ${await Event.countDocuments({ status: 'approved' })}`);

    await mongoose.disconnect();
    console.log('Database disconnected.');
    process.exit(0);
  } catch (error) {
    console.error('Test & Seed Script Failed:', error);
    process.exit(1);
  }
};

testAndSeedDatabase();
