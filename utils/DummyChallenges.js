const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/yourDatabaseName'; // Replace with your MongoDB URI

const StartupChallenges = require("../models/startupChallengesModel");

const generateChallengeData = (count) => {
  const postedById = "66b1e539635a571f9b197d5e"; // Replace with actual postedBy ID
  const categoryId = "668cfc81b6d1ebffc8a440f5"; // Replace with actual category ID
  const sampleUsers = ['66b1e539635a571f9b197d5e', '66d5513bafc93d3a67f6516e']; // Replace with actual user IDs
  const bannerImagePath = "CyberCover.jpeg";
  const thumbnailImagepath = "CyberThumbnail.jpeg";
  const challengeDetailsData = "There are many variations of passages of Lorem Ipsum available, All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet , but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text ";
  const guidelines = "There are many variations of passages of Lorem Ipsum available, All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet , but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text ";

  const attachmentsDummy = ["sample (1).pdf", "sample (2).pdf", "sample (3).pdf", "sample (4).pdf", "sample.pdf"];


  const wocanparticipate = ["Individual", "Company" , "Startup"];

  const challenges = [];
  const challengeNameDummy = [
    'Michelin AI Innovation Challenge',
    'PMI Harm Reduction Eco-Innovation Challenge 2024',
    'Environmental Monitoring Challenge: Innovative Solutions for Floating Offshore Wind Farms',
    'AI Start-Up Challenge: Mobility & Sustainability',
    'Water Innovation Challenge',
    'Quantum Computing Innovation Challenge',
    'Lufthansa Technik Philippines Startup Challenge',
    'Fi Europe Innovation Challenge',
    'AMAG Sustainability Challenge 2024',
    'ASECAP Challenge: Innovative Solutions for Detection and Removal of Motorway and Roadside Objects'
  ];

  for (let i = 0; i < count; i++) {

    const createdAt = new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString();
    const updatedAt = new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString();


    const challenge = {
      challengeName: challengeNameDummy[Math.floor(Math.random() * challengeNameDummy.length)],
      challengeDetails: challengeDetailsData,
      guidelines: guidelines,
      thumbnailImage: thumbnailImagepath,
      bannerImage: bannerImagePath,
      category: categoryId,
      location: "668cff16b6d1ebffc8a44176",
      challengeDate: new Date(`2024-07-${Math.floor(Math.random() * 31) + 1}`),
      postedBy: sampleUsers[Math.floor(Math.random() * sampleUsers.length)],
      slug: `challenge-${i + 1}`,
      registrationStartDate: new Date(`2024-07-${Math.floor(Math.random() * 31) + 1}`),
      registrationEndDate: new Date(`2024-07-${Math.floor(Math.random() * 31) + 1}`),
      resultDate: new Date(`2024-07-${Math.floor(Math.random() * 31) + 1}`),
      prizeAmount: (Math.floor(Math.random() * 5000) + 1000).toString(),
      eventMode: Math.random() > 0.5 ? 'online' : 'offline',
      type: Math.random() > 0.5 ? 'premium' : 'general',
      registrationFee: (Math.floor(Math.random() * 5000) + 1000).toString(),
      pincode: (Math.floor(Math.random() * 5000) + 1000).toString(),
      state: "66bb215c10d7b5602e444186",
      city: "66bb215c10d7b5602e4442b2",
      address: "North place",
      charges: Math.random() > 0.5 ? 'free' : 'paid',
      challengeId: 'USC826951',
      paymentStatus: Math.random() > 0.5 ? 1 : 0,
      status: Math.random() > 0.5 ? 1 : 0,
      whoCanParticipate: [...wocanparticipate],
      organizername: "John Doe",
      organizernumber: "8409624331",
      organizeremail: "invoidea@gmail.com",
      organizerwebsite: "www.invoidea.com",
      document1: "dummy-pdf_2.pdf",
      document2: "dummy-pdf_2.pdf",
      attachments: [...attachmentsDummy],
      video_url1: 'https://www.youtube.com/embed/QoqohmccTSc?si=5Vxre1lXnUHl1-fW',
      video_url2: 'https://www.youtube.com/embed/QoqohmccTSc?si=5Vxre1lXnUHl1-fW',
      __v: 0,
      createdAt: createdAt,
      updatedAt: updatedAt,
    };
    challenges.push(challenge);
  }

  return challenges;
};

const saveChallengesToDatabase = async (count) => {
  try {
    // await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    // console.log('Connected to MongoDB');

    const challengeRecords = generateChallengeData(count);

    const result = await StartupChallenges.insertMany(challengeRecords);
    console.log(`Inserted ${result.length} documents`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error saving challenges:', error);
  }
};

module.exports = { saveChallengesToDatabase };
