const GeneralSettings = require("../models/generalSettingsModel");
const Pricemodel = require("../models/Pricemodel");

exports.getAllGeneralData = async (req, res) => {
    const { isAdmin } = req.query;

    console.log(req.query, "Data")


    try {
        if (isAdmin === true || isAdmin === 'true') {
            const result = await GeneralSettings.find().populate('priceId')
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
        const { timezone, currency, address, sitetitle, Tax, cin, pin , gst, slogan, EventPrize, StartupChallegeprize, PrimiumChallegeprize, adminemail, admincontactno, whatsappno, isAdmin, facebookurl, instagramurl, twitterurl, linkedinurl, currentDate } = req.body;

        if (isAdmin === true || isAdmin === 'true') {
            const updateFields = {
                sitetitle,
                slogan,
                adminemail,
                admincontactno,
                whatsappno,
                facebookurl,
                instagramurl,
                twitterurl,
                linkedinurl,
                timezone,
                currency,
                cin,
                gst,
                pin,
                address,
                updatedAt: currentDate
            };

            // Add logo and favicon to the update object if they are present in req.files
            if (req.files.logo) {
                const logo = req.files.logo[0];
                updateFields.logo = logo.filename;
            }
            if (req.files.favicon) {
                const favicon = req.files.favicon[0];
                updateFields.favicon = favicon.filename;
            }

            // Update Price model
            const priceFields = {
                EventPrize,
                StartupChallegeprize,
                PrimiumChallegeprize,
                Tax
            };

            let priceId;
            const priceDocument = await Pricemodel.find();

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
        console.log(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}
