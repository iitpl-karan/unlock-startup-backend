/**
 * Migration script to move state field from root level to investorDetails.state
 * 
 * This script should be run once to ensure all investors have their state
 * data properly stored in the investorDetails object.
 * 
 * To run this script:
 * 1. Navigate to your project root
 * 2. Run: node migration-state-field.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const InvestorUser = require('./models/InvestorDetails');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    migrateStateField();
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

async function migrateStateField() {
  try {
    console.log('Starting state field migration...');
    
    // Get all investors
    const investors = await InvestorUser.find({});
    
    console.log(`Found ${investors.length} investors to process`);
    
    let migratedCount = 0;
    let noChangeCount = 0;
    let emptyStateCount = 0;
    
    // Process each investor
    for (const investor of investors) {
      // Check if state field exists at root level and not in investorDetails
      if (investor.state && (!investor.investorDetails || !investor.investorDetails.state)) {
        console.log(`Migrating state for investor: ${investor.investorname} (${investor.investoremail})`);
        
        // Ensure investorDetails exists
        if (!investor.investorDetails) {
          investor.investorDetails = {};
        }
        
        // Move state to investorDetails
        investor.investorDetails.state = investor.state;
        
        // Save the updated investor
        await investor.save();
        
        migratedCount++;
      } else if (investor.investorDetails && investor.investorDetails.state) {
        // Already has state in investorDetails
        noChangeCount++;
      } else {
        // No state field found
        emptyStateCount++;
      }
    }
    
    console.log('\nMigration Summary:');
    console.log(`Total investors: ${investors.length}`);
    console.log(`Investors migrated: ${migratedCount}`);
    console.log(`Investors already in correct format: ${noChangeCount}`);
    console.log(`Investors with no state data: ${emptyStateCount}`);
    console.log('\nMigration completed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }
} 