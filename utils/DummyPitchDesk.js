const mongoose = require('mongoose');


const PitchDecks = require("../models/pitchDeckModel");





const generateChallengeData = (count) => {

    const categoryId = "668cfc81b6d1ebffc8a440f5"; // Replace with actual category ID
    attachments = "detail-page-bg.52bf8649.png";
    pitchDeckDetails = "There are many variations of passages of Lorem Ipsum available, All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet , but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text ";
    const challenges = [];


    // TypeData = ['premium' , 'not_premium']

    for (let i = 0; i < count; i++) {
        const challenge = {


            pitchDeckName: `Pitch-Desk ${i + 1}`,
            slug: challengeDetailsData,
            category: categoryId,
            attachments: attachments,
            pitchDeckDate: new Date(`2024-07-${Math.floor(Math.random() * 31) + 1}`),
            postedBy: postedById,
            slug: `challenge-${i + 1}`,
         

            status: Math.random() > 0.5 ? 1 : 0,
       
            __v: 0
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

        const result = await PitchDecks.insertMany(challengeRecords);
        console.log(`Inserted ${result.length} documents`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error saving challenges:', error);
    }
};

module.exports = { saveChallengesToDatabase };
