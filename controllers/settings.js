const GeneralSettings = require("../models/generalSettingsModel");
const Pricemodel = require("../models/Pricemodel");

exports.getAllGeneralData = async (req, res) => {
    const { isAdmin } = req.query;

    console.log(req.query, "Data")

    try {
        if (isAdmin === true || isAdmin === 'true') {
            const result = await GeneralSettings.find().populate({
                path: 'priceId',
                populate: {
                    path: 'investorSubscriptionPlans',
                    model: 'SubscriptionPlan'
                }
            });
            return res.status(200).json(result[0]);
        } else {
            res.status(403).json({
                message: "Unauthorized User",
            });
        }
    } catch (err) {
        console.log(err)
        res.status(500);
    }
};

exports.addorUpdateGeneralData = async (req, res) => {
    console.log('dfhjk');
    try {
        const { timezone, currency, address, sitetitle, Tax, cin, pin, gst, slogan, EventPrize, StartupChallegeprize, PrimiumChallegeprize, pitchSubmissionPrice, adminemail, admincontactno, whatsappno, isAdmin, facebookurl, instagramurl, twitterurl, linkedinurl, currentDate, investorSubscriptionPlans } = req.body;

        if (isAdmin === true || isAdmin === 'true') {
            // Prepare price fields
            let priceFields = {};
            if (PrimiumChallegeprize) priceFields.PrimiumChallegeprize = PrimiumChallegeprize;
            if (EventPrize) priceFields.EventPrize = EventPrize;
            if (StartupChallegeprize) priceFields.StartupChallegeprize = StartupChallegeprize;
            if (Tax) priceFields.Tax = Tax;
            if (pitchSubmissionPrice) priceFields.pitchSubmissionPrice = pitchSubmissionPrice;
            
            // Add investor subscription plans if provided
            if (investorSubscriptionPlans) {
                // Convert to array if it's a string (from FormData)
                let planIds = investorSubscriptionPlans;
                if (typeof investorSubscriptionPlans === 'string') {
                    try {
                        planIds = JSON.parse(investorSubscriptionPlans);
                    } catch (e) {
                        // If not valid JSON, split by comma
                        planIds = investorSubscriptionPlans.split(',').map(id => id.trim());
                    }
                }
                priceFields.investorSubscriptionPlans = planIds;
            }

            // Prepare general settings fields
            let updateFields = {};
            if (req.files?.logo) updateFields.logo = req.files.logo[0].filename;
            if (req.files?.favicon) updateFields.favicon = req.files.favicon[0].filename;
            if (sitetitle) updateFields.sitetitle = sitetitle;
            if (slogan) updateFields.slogan = slogan;
            if (adminemail) updateFields.adminemail = adminemail;
            if (admincontactno) updateFields.admincontactno = admincontactno;
            if (whatsappno) updateFields.whatsappno = whatsappno;
            if (currency) updateFields.currency = currency;
            if (timezone) updateFields.timezone = timezone;
            if (address) updateFields.address = address;
            if (currency) updateFields.currency = currency;
            if (cin) updateFields.cin = cin;
            if (gst) updateFields.gst = gst;
            if (pin) updateFields.pin = pin;
            if (facebookurl) updateFields.facebookurl = facebookurl;
            if (instagramurl) updateFields.instagramurl = instagramurl;
            if (twitterurl) updateFields.twitterurl = twitterurl;
            if (linkedinurl) updateFields.linkedinurl = linkedinurl;

            // Check if Pricemodel already exists
            const priceDocument = await Pricemodel.find();
            let priceId;

            if (priceDocument.length === 0) {
                // No document exists, create a new one
                const newPriceData = new Pricemodel(priceFields);
                const priceResult = await newPriceData.save();
                if (!priceResult) {
                    return res.status(404).json({ message: "Some database issue with Price" });
                }
                priceId = priceResult._id;
            } else {
                // Document exists, update the existing one
                const updatedPriceData = await Pricemodel.findOneAndUpdate({}, priceFields, { new: true });
                if (!updatedPriceData) {
                    return res.status(404).json({ message: "Price data not found in database" });
                }
                priceId = updatedPriceData._id;
            }
            // Add priceId to updateFields
            updateFields.priceId = priceId;

            // Update GeneralSettings
            const isDocumentPresent = await GeneralSettings.find();

            if (isDocumentPresent.length === 0) {
                // No document exists, create a new one
                const newData = new GeneralSettings(updateFields);
                const result = await newData.save();
                if (!result) {
                    return res.status(404).json({ message: "Some database issue" });
                }
            } else {
                // Document exists, update the existing one
                const updatedData = await GeneralSettings.findOneAndUpdate({}, updateFields, { new: true });
                if (!updatedData) {
                    return res.status(404).json({ message: "Data not found in database" });
                }
            }

            return res.status(200).json({ message: "Settings updated" });
        } else {
            res.status(403).json({ message: "Unauthorized User" });
        }

    } catch (err) {
        console.log("Error updating settings:", err);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

// Public endpoint for pricing data (no auth required)
exports.getPublicPricing = async (req, res) => {
    try {
        // Find the latest price settings
        const priceSettings = await Pricemodel.findOne().sort({ date: -1 });
        
        if (!priceSettings) {
            // Return default values if no settings found
            return res.status(200).json({
                success: true,
                priceId: {
                    pitchSubmissionPrice: 300,
                    Tax: 18,
                    pitchGST: 18
                }
            });
        }
        
        // Return the price data
        return res.status(200).json({
            success: true,
            priceId: {
                pitchSubmissionPrice: priceSettings.pitchSubmissionPrice || 300,
                Tax: priceSettings.Tax || 18,
                pitchGST: priceSettings.pitchGST || 18,
                // Only include other fields that should be publicly visible
                EventPrize: priceSettings.EventPrize,
                StartupChallegeprize: priceSettings.StartupChallegeprize
            }
        });
    } catch (error) {
        console.error("Error fetching public pricing data:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve pricing information"
        });
    }
};

// Get pricing data for settings page
exports.getPricingData = async (req, res) => {
    try {
        const priceSettings = await Pricemodel.findOne().sort({ date: -1 });
        
        if (!priceSettings) {
            return res.status(404).json({
                success: false,
                message: "Pricing data not found"
            });
        }
        
        return res.status(200).json({
            success: true,
            priceId: priceSettings
        });
    } catch (error) {
        console.error("Error fetching pricing data:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve pricing information"
        });
    }
};
