const Investor = require('../models/InvestorTypes')
const InvestorUser = require('../models/InvestorDetails')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const InvestorPitch = require('../models/InvestorPitch');
const nodemailer = require('nodemailer');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Users = require("../models/usersModel");
const Payment = require("../models/Payment");
const Pricemodel = require("../models/Pricemodel");

exports.getAllInvestorType = async (req, res) => {
    try {
        const result = await Investor.find()
        res.status(200).json(result)
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

exports.newInvestorType = async (req, res) => {
    try {
        const {
            name,
            slug,
            currentDate,
            isAdmin } = req.body;

        // const categoryimage = req.files.categoryimage[0].filename;

        if (isAdmin === true || isAdmin === 'true') {
            const isCategoryExist = await Investor.findOne({ slug });
            if (isCategoryExist) {
                return res.status(409).json({
                    message: "Investor already exist"
                })
            }

            const newCategory = new Investor({
                name,
                slug,
                // categoryimage,
                createdAt: currentDate
            })
            const result = await newCategory.save()
            res.status(200).json({
                message: 'New Investor has been added',
                data: result
            })
        } else {
            res.status(403).json({
                message: "Unauthorized User",
            });
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

exports.updateInvestorTypeDetails = async (req, res) => {
    try {
        const { id, name, slug, isAdmin } = req.body;

        if (isAdmin === true || isAdmin === 'true') {
            const updateData = {};
            if (name) updateData.name = name;
            if (slug) updateData.slug = slug;
            // if (req.files.categoryimage) updateData.categoryimage = req.files.categoryimage[0].filename;


            const updatedChallenge = await Investor.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            );

            if (updatedChallenge) {
                res.status(200).json({
                    message: "Investor details have been updated",
                    data: updatedChallenge,
                });
            } else {
                res.status(404).json({
                    message: "Investor not found",
                });
            }
        } else {
            res.status(403).json({
                message: "Unauthorized User",
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}

exports.toggleStatus = async (req, res) => {
    const { id, status, isAdmin } = req.body

    console.log("req.body", req.body); // Debugging log

    try {
        if (isAdmin === true || isAdmin === 'true') {
            const result = await Investor.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            )
            res.status(200).json({
                message: 'Status has been updated',
                data: result
            })
        } else {
            res.status(403).json({
                message: "Unauthorized User",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}

exports.deleteInvestorType = async (req, res) => {
    const { id } = req.body;
    console.log("Received ID:", id); // Debugging log

    if (!id) {
        return res.status(400).json({ success: false, message: "Investor ID is required" });
    }

    try {
        const result = await Investor.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ success: false, message: "Investor not found" });
        }

        res.status(200).json({
            success: true,
            message: "Investor has been deleted",
            result
        });
    } catch (error) {
        console.error("Delete Error:", error); // Log the error
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

exports.createNewInvestorUser = async (req, res) => {
    try {
        const { 
            investorname,  
            investoremail, 
            password, 
            industerytype,
            company,
            website,
            phoneNumber,
            companyDetails,
            investorDetails
        } = req.body;

        // Check if user with the same companyemail already exists
        const userAlreadyExist = await InvestorUser.findOne({ investoremail });

        if (userAlreadyExist) {
            return res.status(400).json({ message: "Company already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Parse company and investor details if provided
        let parsedCompanyDetails = {};
        let parsedInvestorDetails = {};

        try {
            if (companyDetails) {
                parsedCompanyDetails = typeof companyDetails === 'string' 
                    ? JSON.parse(companyDetails) 
                    : companyDetails;
            }
            if (investorDetails) {
                parsedInvestorDetails = typeof investorDetails === 'string' 
                    ? JSON.parse(investorDetails) 
                    : investorDetails;
            }
        } catch (parseError) {
            console.error("Error parsing details:", parseError);
            return res.status(400).json({ 
                message: "Invalid details format" 
            });
        }

        // Create new user document with all details
        const newUser = new InvestorUser({
            investorname,
            investoremail,
            password: hashedPassword,
            industerytype,
            company,
            website,
            phoneNumber,
            companyDetails: {
                fullName: parsedCompanyDetails.fullName || '',
                designation: parsedCompanyDetails.designation || '',
                email: parsedCompanyDetails.email || '',
                linkedIn: parsedCompanyDetails.linkedIn || '',
                companyLogo: parsedCompanyDetails.companyLogo || '/assets/images/company-logo-default.png'
            },
            investorDetails: {
                name: parsedInvestorDetails.name || '',
                type: parsedInvestorDetails.type || '',
                stages: parsedInvestorDetails.stages || '',
                fundingTypes: parsedInvestorDetails.fundingTypes || '',
                expertise: parsedInvestorDetails.expertise || ''
            }
        });

        // Save the new user to the database
        const savedUser = await newUser.save();

        if (savedUser) {
            return res.status(200).json({ 
                message: "Investor has been saved successfully",
                data: {
                    id: savedUser._id,
                    email: savedUser.investoremail,
                    name: savedUser.investorname
                }
            });
        } else {
            return res.status(500).json({ message: "Unable to add new Investor in users collection" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Some server error occurred" });
    }
};

exports.InvestoruserLogin = async (req, res) => {
    try {
        console.log(req.body)
        const { investoremail, password , userType} = req.body;
        console.log(investoremail, password , userType,  "investor" )
        const user = await InvestorUser.findOne({ investoremail });

        if (!user) {
            return res.status(400).json({
                message: "Investor does not exist",
            });
        }

        
        if (user.userType !== 'Investor') {
            return res.status(400).json({
              message: "Incorrect user type",
            }); 
          }
    
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Incorrect password",
            });
        }
        const payload = {
            user: {
                id: user.id,
                companyemail: user.companyemail,
            }
        };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.status(200).json({ 
                token, 
                message: "Login Successfull" ,
                user
            });
          }
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: "Server error occurred",
        });
    }
};

exports.updateInvestorProfile = async (req, res) => {
    console.log("Raw request body:", req.body);
    try {
        const {
            investoremail,
            investorName,
            netWorth,
            phoneNumber,
            isPhonePublic,
            isEmailPublic,
            website,
            responseTime,
            fundingAmount,
            portfolio
        } = req.body;

        console.log("Extracted data:", {
            investoremail,
            investorName,
            netWorth,
            phoneNumber,
            isPhonePublic,
            isEmailPublic,
            website,
            responseTime,
            fundingAmount,
            portfolio
        });

        // Parse JSON strings back to objects
        let companyDetails = {};
        let investorDetails = {};
        let aboutUs = [];

        try {
            if (req.body.companyDetails) {
                companyDetails = JSON.parse(req.body.companyDetails);
                console.log("Parsed companyDetails:", companyDetails);
            }
            if (req.body.investorDetails) {
                investorDetails = JSON.parse(req.body.investorDetails);
                console.log("Parsed investorDetails:", investorDetails);
                console.log("Investor type:", investorDetails.type);
                console.log("Investor stages:", investorDetails.stages);
                console.log("Investor state:", investorDetails.state);
            }
            if (req.body.aboutUs) {
                aboutUs = JSON.parse(req.body.aboutUs);
            }
        } catch (parseError) {
            console.error("Error parsing JSON data:", parseError);
            return res.status(400).json({
                success: false,
                message: "Invalid JSON data in request"
            });
        }

        if (!investoremail) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Get file paths if files were uploaded
        let investorImage = undefined;
        let companyLogo = undefined;

        if (req.files?.investorImage && req.files.investorImage[0]) {
            const file = req.files.investorImage[0];
            investorImage = `/uploads/${file.filename}`;
            console.log("New investor image path:", investorImage);
        }

        if (req.files?.companyLogo && req.files.companyLogo[0]) {
            const file = req.files.companyLogo[0];
            companyLogo = `/uploads/${file.filename}`;
            console.log("New company logo path:", companyLogo);
        }

        // Find investor by email
        const investor = await InvestorUser.findOne({ investoremail });
        
        if (!investor) {
            return res.status(404).json({
                success: false,
                message: "Investor not found"
            });
        }

        // Log investor details for debugging
        console.log("Investor details from request:", investorDetails);

        // Update the profile data
        const updateData = {
            investorname: investorName,
            netWorth,
            phoneNumber: phoneNumber || investor.phoneNumber,
            isPhonePublic: isPhonePublic !== undefined ? isPhonePublic : investor.isPhonePublic,
            isEmailPublic: isEmailPublic !== undefined ? isEmailPublic : investor.isEmailPublic,
            website: website || investor.website,
            responseTime: responseTime || investor.responseTime,
            fundingAmount: fundingAmount || investor.fundingAmount,
            portfolio: portfolio || investor.portfolio,
            // Also update the company field with the company name from companyDetails
            company: companyDetails.fullName || investor.company,
            // Also update the investorType field with the type from investorDetails  
            investorType: investorDetails.type || investor.investorType,
            // Also update the stage field with the stages from investorDetails
            stage: investorDetails.stages || investor.stage,
            companyDetails: {
                fullName: companyDetails.fullName,
                designation: companyDetails.designation,
                email: companyDetails.email,
                linkedIn: companyDetails.linkedIn
            },
            investorDetails: {
                name: investorDetails.name,
                type: investorDetails.type,
                stages: investorDetails.stages,
                fundingTypes: investorDetails.fundingTypes,
                expertise: investorDetails.expertise,
                state: investorDetails.state || (investor.investorDetails && investor.investorDetails.state)
            },
            aboutUs,
            isProfilePublished: true // Set to true when investor publishes their profile
        };

        // Only add image fields if new files were uploaded
        if (investorImage) {
            updateData.investorImage = investorImage;
        }

        // Only update companyLogo if a new one was uploaded
        if (companyLogo) {
            updateData.companyDetails.companyLogo = companyLogo;
        } else if (investor.companyDetails && investor.companyDetails.companyLogo) {
            // Keep the existing logo if we have one
            updateData.companyDetails.companyLogo = investor.companyDetails.companyLogo;
        }

        console.log("Processed update data:", updateData);

        // Update the investor profile
        const updatedInvestor = await InvestorUser.findOneAndUpdate(
            { investoremail },
            { $set: updateData },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: updatedInvestor
        });

    } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

exports.getAllInvestors = async (req, res) => {
  try {
    // First get all active users of type Investor
    const activeInvestorUsers = await Users.find({
      userType: "Investor",
      status: 1 // Only active users
    }).select('_id');

    // Get the list of active investor IDs
    const activeInvestorIds = activeInvestorUsers.map(user => user._id);

    // Find all investors that have their userId linked to active users
    // or don't have a userId (standalone investor records)
    // and have published their profile
    const investors = await InvestorUser.find({
      $and: [
        {
          $or: [
            { userId: { $in: activeInvestorIds } },
            { userId: null } // Include standalone investors that don't have a linked user
          ]
        },
        { isProfilePublished: true } // Only include published profiles
      ]
    }).select({
      investorname: 1,
      investoremail: 1,
      investorImage: 1,
      netWorth: 1,
      companyDetails: 1,
      investorDetails: 1,
      aboutUs: 1,
      industerytype: 1,
      userType: 1,
      responseTime: 1,
      fundingAmount: 1,
      portfolio: 1,
      isPhonePublic: 1,
      isEmailPublic: 1,
      phoneNumber: 1,
      userId: 1 // Include userId to check if it's linked
    });

    return res.status(200).json({
      success: true,
      message: "Investors fetched successfully",
      data: investors
    });
  } catch (error) {
    console.error('Error fetching investors:', error);
    return res.status(500).json({
      success: false,
      message: "Error fetching investors",
      error: error.message
    });
  }
};

exports.getInvestorDetail = async (req, res) => {
    try {
        const { investoremail } = req.query;

        if (!investoremail) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Find investor by email
        const investor = await InvestorUser.findOne({ investoremail }).select({
            investorname: 1,
            investoremail: 1,
            investorImage: 1,
            netWorth: 1,
            companyDetails: 1,
            investorDetails: 1,
            aboutUs: 1,
            industerytype: 1,
            userType: 1,
            responseTime: 1,
            fundingAmount: 1,
            portfolio: 1,
            isPhonePublic: 1,
            isEmailPublic: 1,
            phoneNumber: 1,
            website: 1,
            isProfilePublished: 1 // Include publication status
        });
        
        if (!investor) {
            return res.status(404).json({
                success: false,
                message: "Investor not found"
            });
        }

        res.status(200).json({
            success: true,
            data: investor
        });

    } catch (error) {
        console.error("Error fetching investor details:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

exports.submitPitch = async (req, res) => {
  try { 
    const {
      investorId,
      userId,
      startupName,
      fundingAmount,
      equity,
      description,
      founder_name,
      contact_email,
      phone_number,
      linkedin_profile,
      company_name,
      company_stage,
      industry_type,
      business_description,
      problem_solving,
      solution_overview,
      product_description,
      fundraising_requirements,
      use_of_funds,
      supporting_documents,
      paymentId,
      orderId,
      paymentStatus
    } = req.body;
    
    // Validate required fields
    if (!investorId) {
      return res.status(400).json({
        success: false,
        message: "Investor ID is required"
      });
    }
    
    if (!userId) {
      console.error("Missing userId in request body:", req.body);
      return res.status(400).json({
        success: false,
        message: "User ID is required"
      });
    }
    
    if (!paymentId || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Payment information is required"
      });
    }
    
    if (!startupName) {
      return res.status(400).json({
        success: false,
        message: "Startup name is required"
      });
    }
    
    if (!fundingAmount) {
      return res.status(400).json({
        success: false,
        message: "Funding amount is required"
      });
    }
    
    if (!equity) {
      return res.status(400).json({
        success: false,
        message: "Equity percentage is required"
      });
    }
    
    if (!description) {
      return res.status(400).json({
        success: false,
        message: "Business description is required"
      });
    }

    // Get file paths from multer
    const pitchDeckFile = req.files?.['pitch_deck']?.[0]?.path;
    const productDemoFile = req.files?.['product_demo']?.[0]?.path;
    
    // Validate required files
    if (!pitchDeckFile) {
      return res.status(400).json({
        success: false,
        message: "Pitch deck file is required"
      });
    }
    
    // Find the investor
    const investor = await InvestorUser.findById(investorId);
    if (!investor) {
      return res.status(404).json({
        success: false,
        message: "Investor not found"
      });
    }

    // Create new pitch document
    const newPitch = new InvestorPitch({
      investor: investorId,
      user: userId,
      startupName,
      pitchDeck: pitchDeckFile,
      product_demo: productDemoFile,
      supporting_documents,  // Text field from req.body
      use_of_funds,
      fundingAmount: parseFloat(fundingAmount),
      equity: parseFloat(equity),
      description,
      status: 'pending',
      // Payment information
      payment: {
        paymentId,
        orderId,
        status: paymentStatus || 'paid'
      },
      // Additional fields
      founder_name,
      contact_email,
      phone_number,
      linkedin_profile,
      company_name,
      company_stage,
      industry_type,
      business_description,
      problem_solving,
      solution_overview,
      product_description,
      fundraising_requirements
    });

    // Save the pitch
    const savedPitch = await newPitch.save();

    // Update investor's pitches array
    await InvestorUser.findByIdAndUpdate(
      investorId,
      {
        $push: { pitches: savedPitch._id }
      },
      { new: true }
    );

    // Send email notification to the user
    try {
      // Create nodemailer transporter
      let transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com",
        port: 587,
        secure: false,
        auth: {
          user: 'info@unlockstartup.com',
          pass: 'Z2q^Hoj>K4',
        },
      });

      // Get today's date formatted as DD/MM/YYYY
      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
      
      // Format currency with commas
      const formattedAmount = parseFloat(fundingAmount).toLocaleString('en-IN', {
        maximumFractionDigits: 0,
        style: 'currency',
        currency: 'INR'
      });

      const user = await Users.findById(userId);
      if (!user) {
        console.error('User not found for invoice email, userId:', userId);
      } 
      // Prepare email content
      const mailOptions = {
        from: 'info@unlockstartup.com',
        to: user.email,
        subject: 'Your Pitch Has Been Submitted Successfully',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://unlockstartup.com/unlock/uploads/Logo.png" alt="Unlock Startup Logo" style="max-width: 180px;">
            </div>
            
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Pitch Submission Confirmation</h2>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">Dear ${founder_name},</p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">Thank you for submitting your pitch through Unlock Startup. We're pleased to confirm that your pitch has been successfully received and sent to <strong>${investor.investorname}</strong>.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Pitch Summary</h3>
              <ul style="color: #555; padding-left: 20px;">
                <li><strong>Date Submitted:</strong> ${formattedDate}</li>
                <li><strong>Company Name:</strong> ${company_name}</li>
                <li><strong>Funding Amount:</strong> ${formattedAmount}</li>
                <li><strong>Equity Offered:</strong> ${equity}%</li>
                <li><strong>Status:</strong> Pending Review</li>
              </ul>
            </div>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">The investor will review your pitch and may contact you if they're interested in learning more about your business. You will receive another notification when the investor takes action on your pitch.</p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">In the meantime, you can log in to your account to check the status of your pitch and other investment opportunities.</p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">Best regards,<br>The Unlock Startup Team</p>
            
            <div style="text-align: center; border-top: 1px solid #e6e6e6; padding-top: 20px; font-size: 14px; color: #777;">
              <p>© 2024 Unlock Startup. All rights reserved.</p>
              <p>
                <a href="mailto:contact@unlockstartup.com" style="color: #555; text-decoration: none;">contact@unlockstartup.com</a> | 
                <a href="tel:+919266733959" style="color: #555; text-decoration: none;">+91 9266733959</a>
              </p>
            </div>
          </div>
        `,
      };

      // Send the email (don't await this to avoid delaying the response)
      transporter.sendMail(mailOptions).catch(emailError => {
        console.error('Error sending pitch submission email:', emailError);
      });

      // Also send notification to the investor
      const investorMailOptions = {
        from: 'info@unlockstartup.com',
        to: investor.investoremail,
        subject: 'New Pitch Submission - Action Required',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e6e6e6; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://unlockstartup.com/unlock/uploads/Logo.png" alt="Unlock Startup Logo" style="max-width: 180px;">
            </div>
            
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">New Pitch Submission</h2>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">Dear ${investor.investorname},</p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">You have received a new pitch submission from <strong>${founder_name}</strong> of <strong>${company_name}</strong>.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">Pitch Details</h3>
              <ul style="color: #555; padding-left: 20px;">
                <li><strong>Date Submitted:</strong> ${formattedDate}</li>
                <li><strong>Company Name:</strong> ${company_name}</li>
                <li><strong>Industry:</strong> ${industry_type}</li>
                <li><strong>Funding Amount:</strong> ${formattedAmount}</li>
                <li><strong>Equity Offered:</strong> ${equity}%</li>
                <li><strong>Company Stage:</strong> ${company_stage}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://unlockstartup.com/panel/investorpanel/query" style="background-color: #4C84FF; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Review Pitch</a>
            </div>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5;">Please log in to your account to review this pitch in detail and take appropriate action. Your prompt response will be appreciated by the entrepreneur.</p>
            
            <p style="color: #555; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">Best regards,<br>The Unlock Startup Team</p>
            
            <div style="text-align: center; border-top: 1px solid #e6e6e6; padding-top: 20px; font-size: 14px; color: #777;">
              <p>© 2024 Unlock Startup. All rights reserved.</p>
              <p>
                <a href="mailto:contact@unlockstartup.com" style="color: #555; text-decoration: none;">contact@unlockstartup.com</a> | 
                <a href="tel:+919266733959" style="color: #555; text-decoration: none;">+91 9266733959</a>
              </p>
            </div>
          </div>
        `,
      };

      // Send the email to investor (don't await this to avoid delaying the response)
      transporter.sendMail(investorMailOptions).catch(emailError => {
        console.error('Error sending investor notification email:', emailError);
      });
      
    } catch (emailError) {
      console.error('Error setting up email notification:', emailError);
      // Don't return an error response here, as the pitch was successfully saved
    }

    // Return success response
    res.status(201).json({
      success: true,
      message: "Pitch submitted successfully",
      data: {
        pitch: savedPitch,
        investor: {
          name: investor.investorname,
          email: investor.investoremail
        }
      }
    });

  } catch (error) {
    console.error('Error submitting pitch:', error);
    res.status(500).json({
      success: false,
      message: "Error submitting pitch: " + (error.message || "Unknown error"),
      error: error.message
    });
  }
}

// New controller function to get all pitches for an investor
exports.getInvestorPitches = async (req, res) => {
  try {
    const { investorId } = req.params;

    if (!investorId) {
      return res.status(400).json({
        success: false,
        message: "Investor ID is required"
      });
    }

    // Find the investor
    const investor = await InvestorUser.findById(investorId);
    if (!investor) {
      return res.status(404).json({
        success: false,
        message: "Investor not found"
      });
    }

    // Find all pitches for this investor with populated user data
    const pitches = await InvestorPitch.find({ investor: investorId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: pitches.length,
      data: pitches
    });

  } catch (error) {
    console.error('Error fetching investor pitches:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching investor pitches: " + (error.message || "Unknown error"),
      error: error.message
    });
  }
}

// New controller function to get all pitches for an investor with pagination
exports.getInvestorPitchesPagination = async (req, res) => {
  try {
    const { investorId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Optional filters
    const { status } = req.query;
    
    if (!investorId) {
      return res.status(400).json({
        success: false,
        message: "Investor ID is required"
      });
    }

    // Find the investor
    const investor = await InvestorUser.findById(investorId);
    if (!investor) {
      return res.status(404).json({
        success: false,
        message: "Investor not found"
      });
    }
    
    // Build the query
    let query = { 
      investor: investorId,
      isInHistory: false // Filter out pitches that are in history
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Find all pitches for this investor with populated user data, applying pagination
    const pitches = await InvestorPitch.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const totalItems = await InvestorPitch.countDocuments(query);

    res.status(200).json({
      success: true,
      data: pitches,
      meta_data: {
        total_data: totalItems,
        current_page: page,
        data_limit: limit,
        total_pages: Math.ceil(totalItems / limit),
      }
    });

  } catch (error) {
    console.error('Error fetching investor pitches with pagination:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching investor pitches: " + (error.message || "Unknown error"),
      error: error.message
    });
  }
}

// New controller function to update pitch status
exports.updatePitchStatus = async (req, res) => {
  try {
    const { pitchId } = req.params;
    const { status, reason } = req.body;

    if (!pitchId) {
      return res.status(400).json({
        success: false,
        message: "Pitch ID is required"
      });
    }

    if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required (pending, accepted, or rejected)"
      });
    }

    // Find the pitch
    const pitch = await InvestorPitch.findById(pitchId).populate('investor');
    if (!pitch) {
      return res.status(404).json({
        success: false,
        message: "Pitch not found"
      });
    }

    // Check if a message has already been sent
    if (pitch.hasMessageSent) {
      return res.status(400).json({
        success: false,
        message: "You can only send a message once for a particular pitch report."
      });
    }

    // Update the pitch status and set hasMessageSent to true
    pitch.status = status;
    pitch.hasMessageSent = true;
    
    // Save the reason if provided
    if (reason) {
      pitch.acceptanceReason = reason;
    }
    
    await pitch.save();

    // Send email notification for both acceptance and rejection
    if (status === 'accepted' || status === 'rejected') {
      try {
        // Create nodemailer transporter
        let transporter = nodemailer.createTransport({
          host: "smtp.hostinger.com",
          port: 587,
          secure: false,
          auth: {
            user: 'info@unlockstartup.com',
            pass: 'Z2q^Hoj>K4',
          },
        });

        // Get investor name
        const investorName = pitch.investor.investorname || 'Investor';
        
        // Add reason section to email if provided
        const reasonSection = reason ? `
          <div style="background-color: ${status === 'accepted' ? '#f9f9f9' : '#fff5f5'}; padding: 15px; border-left: 4px solid ${status === 'accepted' ? '#4caf50' : '#f44336'}; margin: 20px 0;">
            <h3 style="margin-top: 0; color: ${status === 'accepted' ? '#4caf50' : '#f44336'};">
              ${status === 'accepted' ? 'Feedback' : 'Reason for Rejection'} from ${investorName}:
            </h3>
            <p style="margin-bottom: 0;">${reason}</p>
          </div>
        ` : '';
        
        // Prepare email content
        const mailOptions = {
          from: 'info@unlockstartup.com',
          to: pitch.contact_email,
          subject: status === 'accepted' 
            ? 'Congratulations! Your Pitch Has Been Accepted'
            : 'Update on Your Pitch Submission',
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
              <h2 style="color: #333;">${status === 'accepted' ? 'Great News' : 'Update'} from Unlock Startup!</h2>
              <p>Dear ${pitch.founder_name},</p>
              <p>${status === 'accepted' 
                ? `Congratulations! We're excited to inform you that your pitch for <strong>${pitch.company_name}</strong> has been accepted by <strong>${investorName}</strong>.`
                : `We regret to inform you that your pitch for <strong>${pitch.company_name}</strong> has not been accepted by <strong>${investorName}</strong> at this time.`}</p>
              
              ${reasonSection}
              
              <p>Here are the details of your pitch:</p>
              <ul>
                <li><strong>Company:</strong> ${pitch.company_name}</li>
                <li><strong>Funding Amount:</strong> ₹${parseFloat(pitch.fundingAmount).toLocaleString()}</li>
                <li><strong>Equity Offered:</strong> ${pitch.equity}%</li>
              </ul>
              ${status === 'accepted' 
                ? '<p>The investor will contact you soon to discuss the next steps. Please ensure your contact details are up to date.</p>'
                : '<p>We encourage you to continue developing your business and consider submitting an updated pitch in the future.</p>'}
              <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
              <p>Thank you for choosing Unlock Startup for your fundraising journey!</p>
              <img src="https://unlockstartup.com/unlock/uploads/Logo.png" alt="Unlock Startup Logo" />
              <p style="margin-top: 20px;">Best Regards,<br>
              Unlock Startup Team<br>
              Email: <a href="mailto:contact@unlockstartup.com">contact@unlockstartup.com</a><br>
              Mobile: +919266733959</p>
            </div>
          `,
        };

        // Send the email asynchronously (don't wait for it to complete)
        transporter.sendMail(mailOptions).catch(emailError => {
          console.error('Error sending status update email:', emailError);
        });
      } catch (emailError) {
        console.error('Error setting up email notification:', emailError);
        // Don't return an error response here, as the status update was successful
      }
    }

    res.status(200).json({
      success: true,
      message: "Pitch status updated successfully",
      data: pitch
    });

  } catch (error) {
    console.error('Error updating pitch status:', error);
    res.status(500).json({
      success: false,
      message: "Error updating pitch status: " + (error.message || "Unknown error"),
      error: error.message
    });
  }
}

// New controller function to get pitch statistics for an investor
exports.getInvestorPitchStatistics = async (req, res) => {
  try {
    const { investorId } = req.params;

    if (!investorId) {
      return res.status(400).json({
        success: false,
        message: "Investor ID is required"
      });
    }

    // Find the investor
    const investor = await InvestorUser.findById(investorId);
    if (!investor) {
      return res.status(404).json({
        success: false,
        message: "Investor not found"
      });
    }

    // Get counts for each status
    const pendingCount = await InvestorPitch.countDocuments({ 
      investor: investorId,
      status: 'pending'
    });
    
    const acceptedCount = await InvestorPitch.countDocuments({ 
      investor: investorId,
      status: 'accepted'
    });
    
    const rejectedCount = await InvestorPitch.countDocuments({ 
      investor: investorId,
      status: 'rejected'
    });

    // Get total count
    const totalCount = pendingCount + acceptedCount + rejectedCount;

    // Get monthly statistics for the last 6 months
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    
    // Initialize monthly data
    const monthlyData = [];
    for (let i = 0; i < 6; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = month.toLocaleString('default', { month: 'short' });
      monthlyData.unshift({
        month: monthName,
        pending: 0,
        accepted: 0,
        rejected: 0
      });
    }

    // Get all pitches from the last 6 months
    const recentPitches = await InvestorPitch.find({
      investor: investorId,
      createdAt: { $gte: sixMonthsAgo }
    });

    // Populate monthly data
    recentPitches.forEach(pitch => {
      const pitchMonth = pitch.createdAt.toLocaleString('default', { month: 'short' });
      const monthData = monthlyData.find(m => m.month === pitchMonth);
      if (monthData) {
        if (pitch.status === 'pending') monthData.pending += 1;
        else if (pitch.status === 'accepted') monthData.accepted += 1;
        else if (pitch.status === 'rejected') monthData.rejected += 1;
      }
    });

    // Get recent pitches (last 5)
    const recentPitchList = await InvestorPitch.find({ investor: investorId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('company_name founder_name status fundingAmount equity createdAt');

    res.status(200).json({
      success: true,
      data: {
        totalPitches: totalCount,
        pendingPitches: pendingCount,
        acceptedPitches: acceptedCount,
        rejectedPitches: rejectedCount,
        monthlyData,
        recentPitches: recentPitchList
      }
    });
  } catch (error) {
    console.error('Error fetching investor pitch statistics:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching investor pitch statistics: " + (error.message || "Unknown error"),
      error: error.message
    });
  }
}

exports.createPitchOrder = async (req, res) => {
  try {
    const { investorId, userId, amount } = req.body;
    
    // Validate inputs
    if (!investorId || !userId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: investorId, userId, amount"
      });
    }
    
    // Create a new Razorpay instance
    const razorpay = new Razorpay({
      key_id: 'rzp_live_g1FdyUyG50U2Rq' || 'rzp_live_g1FdyUyG50U2Rq',
      key_secret: 'R51PWtCFLwq2exPJ85QaCKSK' || process.env.key_secret
    });
    
    // Create a shorter timestamp to keep receipt string length under 40 characters
    const timestamp = Date.now().toString().slice(-8);
    
    // Create an order with a shorter receipt string (under 40 chars)
    const options = {
      amount: Math.round(amount * 100), // Convert to paise/cents
      currency: 'INR',
      receipt: `pitch_${timestamp}`, // Shortened receipt format
      payment_capture: 1, // Auto-capture payment
      notes: {
        investorId: investorId,
        userId: userId,
        purpose: 'Pitch Submission',
      }
    };
    
    console.log('Creating Razorpay order with options:', options);
    
    // Create Razorpay order
    const order = await razorpay.orders.create(options);
    
    res.status(200).json({
      success: true,
      message: "Order created successfully",
      order: order
    });
    
  } catch (error) {
    console.error('Error creating pitch order:', error);
    res.status(500).json({
      success: false,
      message: "Error creating order: " + (error.message || "Unknown error"),
      error: error.message
    });
  }
};

exports.verifyPitchPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      investorId,
      userId
    } = req.body;
    
    if (!userId) {
      console.error('Missing userId in verify pitch payment request');
      return res.status(400).json({
        success: false,
        message: "User ID is required for payment verification"
      });
    }
    
    if (!investorId) {
      console.error('Missing investorId in verify pitch payment request');
      return res.status(400).json({
        success: false,
        message: "Investor ID is required for payment verification"
      });
    }
    
    // Validate signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto.createHmac("sha256", 'R51PWtCFLwq2exPJ85QaCKSK')
      .update(sign.toString())
      .digest("hex");
    
    const isAuthentic = expectedSign === razorpay_signature;
    
    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed. Invalid signature."
      });
    }
    
    // Create payment record
    const payment = new Payment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentfor: 'PitchSubmission',
      amount: 300, // Fixed pitch submission amount
      status: 'paid',
      user: userId
    });
    
    // Save payment record
    await payment.save();

    // Get user details for the invoice
    const user = await Users.findById(userId);
    if (!user) {
      console.error('User not found for invoice email, userId:', userId);
    } else {
      console.log('User found for invoice email:', user.email);
      
      try {
        // Get price data for the correct amount
        const priceData = await Pricemodel.findOne();
        const pitchSubmissionPrice = priceData?.pitchSubmissionPrice || 300;
        
        // Create nodemailer transporter with robust error handling
        let transporter = nodemailer.createTransport({
          host: "smtp.hostinger.com",
          port: 587,
          secure: false, // true for 465, false for other ports
          auth: {
            user: 'info@unlockstartup.com',
            pass: 'Z2q^Hoj>K4',
          },
          tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false
          },
          debug: true,
          logger: true // log information to console
        });
        
        // Verify SMTP connection configuration
        transporter.verify(function(error, success) {
          if (error) {
            console.error('SMTP server connection error:', error);
          } else {
            console.log('SMTP server connection successful, server ready to take messages');
          }
        });

        // Get today's date formatted as DD/MM/YYYY
        const today = new Date();
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        
        // Format amount with commas and currency symbol
        const formattedAmount = pitchSubmissionPrice.toLocaleString('en-IN', {
          maximumFractionDigits: 0,
          style: 'currency',
          currency: 'INR'
        });

        // Generate invoice number
        const invoiceNumber = `INV-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}-${payment._id.toString().slice(-6)}`;
        const mailOptions = {
          from: '"Unlock Startup" <info@unlockstartup.com>',
          to: user.email,
          subject: 'Payment Invoice - Pitch Submission',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://unlockstartup.com/unlock/uploads/Logo.png" alt="Unlock Startup Logo" style="max-width: 180px;">
              </div>
              
              <div style="border: 1px solid #e6e6e6; padding: 20px; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                  <div>
                    <h2 style="color: #333; margin: 0;">INVOICE</h2>
                    <p style="color: #666; margin: 5px 0;">Invoice Number: ${invoiceNumber}</p>
                    <p style="color: #666; margin: 5px 0;">Date: ${formattedDate}</p>
                  </div>
                  <div style="text-align: right;">
                    <p style="margin: 5px 0;"><strong>Unlock Startup</strong></p>
                    <p style="color: #666; margin: 5px 0;">contact@unlockstartup.com</p>
                    <p style="color: #666; margin: 5px 0;">+91 9266733959</p>
                  </div>
                </div>

                <div style="margin: 20px 0; padding: 10px 0; border-top: 1px solid #e6e6e6; border-bottom: 1px solid #e6e6e6;">
                  <h3 style="color: #333; margin: 0 0 10px 0;">Bill To:</h3>
                  <p style="margin: 5px 0;"><strong>${user.name || 'Valued Customer'}</strong></p>
                  <p style="color: #666; margin: 5px 0;">${user.email}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Description</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Amount</th>
                  </tr>
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">Pitch Submission Fee</td>
                    <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6;">${formattedAmount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px; text-align: right;"><strong>Total Amount</strong></td>
                    <td style="padding: 12px; text-align: right;"><strong>${formattedAmount}</strong></td>
                  </tr>
                </table>

                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e6e6e6;">
                  <p style="color: #666; margin: 5px 0;"><strong>Payment Information:</strong></p>
                  <p style="color: #666; margin: 5px 0;">Payment ID: ${razorpay_payment_id}</p>
                  <p style="color: #666; margin: 5px 0;">Order ID: ${razorpay_order_id}</p>
                  <p style="color: #666; margin: 5px 0;">Payment Status: Paid</p>
                </div>

                <div style="margin-top: 30px; text-align: center; color: #666;">
                  <p style="margin: 5px 0;">Thank you for your business!</p>
                  <p style="margin: 5px 0;">This is a computer-generated invoice and does not require a signature.</p>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
                <p>© 2024 Unlock Startup. All rights reserved.</p>
              </div>
            </div>
          `,
        };
        
        // Send the invoice email
        try {
          const info = await transporter.sendMail(mailOptions);
        } catch (emailSendError) {
          console.error('Error sending invoice email:', emailSendError);
        }
        
      } catch (emailError) {
        console.error('Error setting up invoice email:', emailError);
      }
    }
    
    // Return success response
    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      }
    });
    
  } catch (error) {
    console.error('Error verifying pitch payment:', error);
    res.status(500).json({
      success: false,
      message: "Error verifying payment: " + (error.message || "Unknown error"),
      error: error.message
    });
  }
};

// Controller function to move a pitch to history
exports.moveToHistory = async (req, res) => {
  try {
    const { pitchId } = req.params;

    if (!pitchId) {
      return res.status(400).json({
        success: false,
        message: "Pitch ID is required"
      });
    }

    // Find the pitch
    const pitch = await InvestorPitch.findById(pitchId);
    if (!pitch) {
      return res.status(404).json({
        success: false,
        message: "Pitch not found"
      });
    }

    // Check if pitch is either accepted or rejected
    if (pitch.status !== 'accepted' && pitch.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        message: "Only accepted or rejected pitches can be moved to history"
      });
    }

    // Update the pitch to mark it as moved to history
    pitch.isInHistory = true;
    await pitch.save();

    res.status(200).json({
      success: true,
      message: "Pitch moved to history successfully",
      data: pitch
    });

  } catch (error) {
    console.error('Error moving pitch to history:', error);
    res.status(500).json({
      success: false,
      message: "Error moving pitch to history: " + (error.message || "Unknown error"),
      error: error.message
    });
  }
};

// Send email verification OTP
exports.sendEmailVerification = async (req, res) => {
    try {
        const { email, fullname } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: 'Email is required for verification'
            });
        }

        // Check if investor with this email already exists
        const existingInvestor = await InvestorUser.findOne({ investoremail: email });
        if (existingInvestor) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // Generate OTP (moved outside the if block to make it accessible throughout the function)
        const otp = crypto.randomInt(100000, 999999);
        const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

        // Check if there's an existing user record or create one
        let user = await Users.findOne({ email: email });
        if (!user) {
            // Create a temporary user entry to store the OTP
            user = new Users({
                name: fullname || 'Investor User',
                email: email,
                userType: 'Investor',
                otp: otp,
                otpExpiry: otpExpiry,
                isVerified: false,
                isTemporary: true // Flag to indicate this is a temporary record pending completion
            });
        } else {
            // Update existing user with new OTP
            user.otp = otp;
            user.otpExpiry = otpExpiry;
        }

        await user.save({ validateModifiedOnly: true });

        // Configure nodemailer
        let transporter = nodemailer.createTransport({
            host: "smtp.hostinger.com",
            port: 587,
            secure: false,
            auth: {
                user: 'info@unlockstartup.com',
                pass: 'Z2q^Hoj>K4',
            },
        });

        // Send OTP email
        const mailOptions = {
            from: 'info@unlockstartup.com',
            to: email,
            subject: 'Email Verification Code - Unlock Startup',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://unlockstartup.com/unlock/uploads/Logo.png" alt="Unlock Startup Logo" style="max-width: 200px;">
                    </div>
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                        <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
                        <p style="font-size: 16px; line-height: 1.5; color: #555;">Dear ${fullname || 'Investor'},</p>
                        <p style="font-size: 16px; line-height: 1.5; color: #555;">Thank you for registering with Unlock Startup. Please use the following verification code to complete your registration:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 10px 20px; background-color: #f0f0f0; border-radius: 5px; display: inline-block; color: #333;">${otp}</div>
                        </div>
                        <p style="font-size: 16px; line-height: 1.5; color: #555;">The code is valid for 10 minutes. If you didn't request this code, please ignore this email.</p>
                    </div>
                    <div style="margin-top: 20px; text-align: center; color: #888; font-size: 14px;">
                        <p>© ${new Date().getFullYear()} Unlock Startup. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email verification message sent: %s', info.messageId);

        res.status(200).json({ 
            success: true,
            message: 'Verification code sent to your email' 
        });
    } catch (err) {
        console.error('Error sending email verification:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to send verification code. Please try again.' 
        });
    }
};

// Verify email OTP
exports.verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and verification code are required' 
            });
        }

        // Find the user with this email
        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found. Please try registering again.' 
            });
        }

        // Check if OTP is valid and not expired
        if (user.otp.toString() !== otp.toString()) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid verification code' 
            });
        }

        // Check if OTP is expired
        if (user.otpExpiry && user.otpExpiry < Date.now()) {
            return res.status(400).json({ 
                success: false,
                message: 'Verification code has expired. Please request a new one.' 
            });
        }

        // OTP is valid, mark as verified
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.isVerified = true; // Mark as verified but still temporary
        await user.save();

        return res.status(200).json({ 
            success: true,
            message: 'Email verified successfully',
            userId: user._id
        });
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error during verification. Please try again.' 
        });
    }
};

// Resend email verification OTP
exports.resendEmailVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: 'Email is required' 
            });
        }

        // Find the user with this email
        let user = await Users.findOne({ email });
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found. Please try registering again.' 
            });
        }

        // Generate new OTP
        const otp = crypto.randomInt(100000, 999999);
        const otpExpiry = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

        user.otp = otp;
        user.otpExpiry = otpExpiry;

        await user.save();

        // Configure nodemailer
        let transporter = nodemailer.createTransport({
            host: "smtp.hostinger.com",
            port: 587,
            secure: false,
            auth: {
                user: 'info@unlockstartup.com',
                pass: 'Z2q^Hoj>K4',
            },
        });

        // Send OTP email
        const mailOptions = {
            from: 'info@unlockstartup.com',
            to: email,
            subject: 'New Email Verification Code - Unlock Startup',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="https://unlockstartup.com/unlock/uploads/Logo.png" alt="Unlock Startup Logo" style="max-width: 200px;">
                    </div>
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                        <h2 style="color: #333; margin-bottom: 20px;">Your New Verification Code</h2>
                        <p style="font-size: 16px; line-height: 1.5; color: #555;">Per your request, here is a new verification code to complete your registration:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; padding: 10px 20px; background-color: #f0f0f0; border-radius: 5px; display: inline-block; color: #333;">${otp}</div>
                        </div>
                        <p style="font-size: 16px; line-height: 1.5; color: #555;">The code is valid for 10 minutes. If you didn't request this code, please ignore this email.</p>
                    </div>
                    <div style="margin-top: 20px; text-align: center; color: #888; font-size: 14px;">
                        <p>© ${new Date().getFullYear()} Unlock Startup. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('New email verification message sent: %s', info.messageId);

        res.status(200).json({ 
            success: true,
            message: 'New verification code sent to your email' 
        });
    } catch (err) {
        console.error('Error resending verification code:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to send new verification code. Please try again.' 
        });
    }
};

// Controller function to get all history pitches for an investor with pagination
exports.getInvestorHistoryPitchesPagination = async (req, res) => {
  try {
    const { investorId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Optional filters
    const { status } = req.query;
    
    if (!investorId) {
      return res.status(400).json({
        success: false,
        message: "Investor ID is required"
      });
    }

    // Find the investor
    const investor = await InvestorUser.findById(investorId);
    if (!investor) {
      return res.status(404).json({
        success: false,
        message: "Investor not found"
      });
    }
    
    // Build the query
    let query = { 
      investor: investorId,
      isInHistory: true // Only get pitches that are in history
    };
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Find all pitches for this investor with populated user data, applying pagination
    const pitches = await InvestorPitch.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const totalItems = await InvestorPitch.countDocuments(query);

    res.status(200).json({
      success: true,
      data: pitches,
      meta_data: {
        total_data: totalItems,
        current_page: page,
        data_limit: limit,
        total_pages: Math.ceil(totalItems / limit),
      }
    });

  } catch (error) {
    console.error('Error fetching investor history pitches with pagination:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching investor history pitches: " + (error.message || "Unknown error"),
      error: error.message
    });
  }
};

// New function to update investor details
exports.updateInvestorDetails = async (req, res) => {
    try {
        const { 
            id,
            investorname, 
            investoremail,
            phoneNumber,
            netWorth,
            responseTime,
            investorType,
            stage,
            fundingAmount,
            portfolio,
            companyDetails,
            investorDetails,
            isAdmin 
        } = req.body;

        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: "Investor ID is required" 
            });
        }

        // Verify admin access
        if (isAdmin !== true && isAdmin !== 'true') {
            return res.status(403).json({
                success: false,
                message: "Unauthorized User"
            });
        }

        // Check if email is being changed and if it's already in use
        if (investoremail) {
            const existingInvestor = await InvestorUser.findOne({ 
                investoremail, 
                _id: { $ne: id } // exclude the current investor
            });

            if (existingInvestor) {
                return res.status(409).json({
                    success: false,
                    message: "Email is already in use by another investor"
                });
            }
        }

        // Create update object with only the fields that are provided
        const updateData = {};
        if (investorname) updateData.investorname = investorname;
        if (investoremail) updateData.investoremail = investoremail;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (netWorth) updateData.netWorth = netWorth;
        if (responseTime) updateData.responseTime = responseTime;
        if (investorType) updateData.investorType = investorType;
        if (stage) updateData.stage = stage;
        if (fundingAmount) updateData.fundingAmount = fundingAmount;
        if (portfolio) updateData.portfolio = portfolio;
        
        // Handle company details update if provided
        if (companyDetails) {
            updateData['companyDetails.fullName'] = companyDetails.fullName;
            updateData['companyDetails.designation'] = companyDetails.designation;
            updateData['companyDetails.email'] = companyDetails.email;
            updateData['companyDetails.linkedIn'] = companyDetails.linkedIn;
        }
        
        // Handle investor details update if provided
        if (investorDetails) {
            if (investorDetails.expertise) updateData['investorDetails.expertise'] = investorDetails.expertise;
            if (investorDetails.state) updateData['investorDetails.state'] = investorDetails.state;
        }

        // Update the investor
        const updatedInvestor = await InvestorUser.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedInvestor) {
            return res.status(404).json({
                success: false,
                message: "Investor not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Investor details updated successfully",
            data: updatedInvestor
        });
    } catch (error) {
        console.error("Error updating investor details:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

// New function to publish or unpublish investor profile
exports.publishInvestorProfile = async (req, res) => {
    try {
        const { investoremail, isPublished } = req.body;

        if (!investoremail) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Find investor by email
        const investor = await InvestorUser.findOne({ investoremail });
        
        if (!investor) {
            return res.status(404).json({
                success: false,
                message: "Investor not found"
            });
        }

        // Update the profile publication status
        const updatedInvestor = await InvestorUser.findOneAndUpdate(
            { investoremail },
            { $set: { isProfilePublished: isPublished !== undefined ? isPublished : true } },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: isPublished !== false ? "Profile published successfully" : "Profile unpublished successfully",
            data: updatedInvestor
        });

    } catch (error) {
        console.error("Profile publication error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

// Get investor's profile publication status
exports.getProfilePublicationStatus = async (req, res) => {
    try {
        const { investoremail } = req.query;

        if (!investoremail) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            });
        }

        // Find investor by email and only return the isProfilePublished field
        const investor = await InvestorUser.findOne({ investoremail }).select('isProfilePublished');
        
        if (!investor) {
            return res.status(404).json({
                success: false,
                message: "Investor not found"
            });
        }

        res.status(200).json({
            success: true,
            isProfilePublished: investor.isProfilePublished || false
        });

    } catch (error) {
        console.error("Error fetching profile publication status:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
