const mongoose = require('mongoose');
const { Schema } = mongoose;
const Events = require("../models/eventsModel");

// const uri = 'mongodb://localhost:27017/yourDatabaseName'; // Replace with your MongoDB URI



const generateEventData = (count) => {
  const events = [];
  const sampleCategories = ['668cfc81b6d1ebffc8a440f5', '668cfd58b6d1ebffc8a4410e', '668cfd69b6d1ebffc8a44112'];
  const sampleUsers = ['66b1e539635a571f9b197d5e', '66d5513bafc93d3a67f6516e']; // Replace with actual user IDs
  video_urlDummy = "https://www.youtube.com/watch?v=c7kAfYuPTgA";
  reference_urlDummy = "https://www.youtube.com/watch?v=c7kAfYuPTgA";
  thumbnailImageDummy = "crypto.webp"
  coverImageDummy = "crypto.webp"
  eventDetailsData = "There are many variations of passages of Lorem Ipsum available...";
  whoCanParticipate = ['individual', 'Startup']
  const attachmentsDummy = ["dummy-pdf_2.pdf", "dummy-pdf_2.pdf", "dummy-pdf_2.pdf"];
  const sampleEventTypes = ['66d55cbecbc144023e62474a', '66d55cbecbc144023e62474b']; // Add more sample event types as needed

  const eventype = ['66d55cd4cbc144023e62474c', '66d55cbecbc144023e62474a' , '66d55cf4cbc144023e624752']
  const EventNameDummy = [
    'Michelin AI Innovation Event',
    'PMI Harm Reduction Eco-Innovation Event 2024',
    'Environmental Monitoring Event',
    'AI Start-Up Challenge: Mobility & Sustainability',
    'Water Innovation Event',
    'Quantum Computing Innovation Event',
    'Lufthansa Technik Philippines Event',
    'Fi Europe Innovation Event',
    'AMAG Sustainability Challenge 2024',
    'ASECAP Event: Innovative Solutions for Detection and Removal of Motorway and Roadside Objects'
  ];


  for (let i = 0; i < count; i++) {
    // Randomly generate start and end time
    
  const createdAt = new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString();
  const updatedAt = new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString();

    const randomStartHour = Math.floor(Math.random() * 12) + 8; // Between 8 AM and 8 PM
    const randomStartMinute = Math.floor(Math.random() * 60);
    const randomEndHour = randomStartHour + Math.floor(Math.random() * 4) + 1; // Ensure end time is after start
    const randomEndMinute = Math.floor(Math.random() * 60);

    const event = {
      eventName: EventNameDummy[Math.floor(Math.random() * EventNameDummy.length)],
      postedBy: sampleUsers[Math.floor(Math.random() * sampleUsers.length)],
      slug: `event-${i + 1}`,
      eventDetails: eventDetailsData,
      guidelines: eventDetailsData,

      video_url1: "https://www.youtube.com/embed/4ci_VgbCohc?si=Qvn4M6XYShn31qG4",
      video_url2: "https://www.youtube.com/embed/4ci_VgbCohc?si=Qvn4M6XYShn31qG4",

      reference_url: "https://www.youtube.com/embed/4ci_VgbCohc?si=Qvn4M6XYShn31qG4",
      thumbnailImage: thumbnailImageDummy,
      company: `Company ${i + 1}`,
      coverImage: coverImageDummy,
      category: sampleCategories[Math.floor(Math.random() * sampleCategories.length)],
      location: `Location ${i + 1}`,
      eventDate: new Date(2024, 6, Math.floor(Math.random() * 31) + 1).setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60)),
      eventMode: Math.random() > 0.5 ? 'online' : 'offline',
      eventAddress: `Address ${i + 1}`,
      address: `Address ${i + 1}`,

      whoCanParticipate: 'individual',
      charges: Math.random() > 0.5 ? 'free' : 'paid',
      eventId: 'USC826951',
      eventType: [...eventype],

      pincode: 80001,
      state: '66bb215c10d7b5602e444186',
      city: '66bb215c10d7b5602e4442bf',
      document1: 'dummy-pdf_2.pdf',
      document2: 'dummy-pdf_2.pdf',
      registrationEndDate: '2024-08-22',
      registrationStartDate: '2024-08-16',
      organizernumber: '8409624333',
      organizeremail: 'gauravkumarjha335@gmail.com',
      organizerwebsite: 'www.Organizer.com',
      organizername: 'Organizer ',
      address: 'MG Road',
      
      startime: `${randomStartHour}:${randomStartMinute < 10 ? '0' : ''}${randomStartMinute}`,
      endtime: `${randomEndHour}:${randomEndMinute < 10 ? '0' : ''}${randomEndMinute}`,

      attachments: attachmentsDummy.slice(0, Math.floor(Math.random() * attachmentsDummy.length) + 1),
      createdAt: createdAt,
      updatedAt: updatedAt,
    };
    events.push(event);
  }

  return events;
};


const saveEventsToDatabase = async (count) => {
  try {

    const eventRecords = generateEventData(count);

    const result = await Events.insertMany(eventRecords);
    console.log(`Inserted ${result.length} documents`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error saving events:', error);
  }
};

module.exports = { saveEventsToDatabase };
