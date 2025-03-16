const Investor = require('../models/InvestorTypes')
const InvestorUser = require('../models/InvestorDetails')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const InvestorPitch = require('../models/InvestorPitch');
const nodemailer = require('nodemailer');

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
        const { investorname,  investoremail, password , industerytype } = req.body;

        // Check if user with the same companyemail already exists
        const userAlreadyExist = await InvestorUser.findOne({ investoremail });

        if (userAlreadyExist) {
            return res.status(400).json({ message: "Company already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user document
        const newUser = new InvestorUser({
            investorname,
            investoremail,
            password: hashedPassword,
         
            since,
            industerytype

        });

        // Save the new user to the database
        const savedUser = await newUser.save();

        if (savedUser) {
            return res.status(200).json({ message: "Investor has been saved successfully" });
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
            netWorth
        } = req.body;

        // Parse JSON strings back to objects
        let companyDetails = {};
        let investorDetails = {};
        let aboutUs = [];

        try {
            if (req.body.companyDetails) {
                companyDetails = JSON.parse(req.body.companyDetails);
            }
            if (req.body.investorDetails) {
                investorDetails = JSON.parse(req.body.investorDetails);
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
        const investorImage = req.files?.investorImage ? req.files.investorImage[0].filename : undefined;
        const companyLogo = req.files?.companyLogo ? req.files.companyLogo[0].filename : undefined;

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
            companyDetails: {
                fullName: companyDetails.fullName,
                designation: companyDetails.designation,
                email: companyDetails.email,
                linkedIn: companyDetails.linkedIn,
                companyLogo: companyLogo || investor.companyDetails?.companyLogo
            },
            investorDetails: {
                name: investorDetails.name,
                type: investorDetails.type,
                stages: investorDetails.stages,
                fundingTypes: investorDetails.fundingTypes,
                expertise: investorDetails.expertise
            },
            aboutUs
        };

        // Only add image fields if new files were uploaded
        if (investorImage) {
            updateData.investorImage = investorImage;
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
    const investors = await InvestorUser.find({})
      .select({
        investorname: 1,
        investoremail: 1,
        investorImage: 1,
        netWorth: 1,
        companyDetails: 1,
        investorDetails: 1,
        aboutUs: 1,
        industerytype: 1,
        userType: 1
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
        const investor = await InvestorUser.findOne({ investoremail });
        
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
      fundraising_requirements
    } = req.body;

    // Validate required fields
    if (!investorId) {
      return res.status(400).json({
        success: false,
        message: "Investor ID is required"
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required"
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
    const supportingDocumentsFile = req.files?.['supporting_documents']?.[0]?.path;
    const useOfFundsFile = req.files?.['use_of_funds']?.[0]?.path;

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
      supporting_documents: supportingDocumentsFile,
      use_of_funds: useOfFundsFile,
      fundingAmount: parseFloat(fundingAmount),
      equity: parseFloat(equity),
      description,
      status: 'pending',
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

// New controller function to update pitch status
exports.updatePitchStatus = async (req, res) => {
  try {
    const { pitchId } = req.params;
    const { status } = req.body;

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

    // Update the pitch status
    pitch.status = status;
    await pitch.save();

    // Send email notification if the pitch is accepted
    if (status === 'accepted') {
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
        
        // Prepare email content
        const mailOptions = {
          from: 'info@unlockstartup.com',
          to: pitch.contact_email, // Send to the pitcher's email
          subject: 'Congratulations! Your Pitch Has Been Accepted',
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
              <h2 style="color: #333;">Great News from Unlock Startup!</h2>
              <p>Dear ${pitch.founder_name},</p>
              <p>Congratulations! We're excited to inform you that your pitch for <strong>${pitch.company_name}</strong> has been accepted by <strong>${investorName}</strong>.</p>
              <p>Here are the details of your accepted pitch:</p>
              <ul>
                <li><strong>Company:</strong> ${pitch.company_name}</li>
                <li><strong>Funding Amount:</strong> ₹${parseFloat(pitch.fundingAmount).toLocaleString()}</li>
                <li><strong>Equity Offered:</strong> ${pitch.equity}%</li>
              </ul>
              <p>The investor will contact you soon to discuss the next steps. Please ensure your contact details are up to date.</p>
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
          console.error('Error sending acceptance email:', emailError);
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