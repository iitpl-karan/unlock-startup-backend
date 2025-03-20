const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const InvestorPitchSchema = new Schema({
    investor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InvestorUser',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startupName: {
        type: String,
        required: true
    },
    pitchDeck: {
        type: String,
        required: true
    },
    businessPlan: {
        type: String,
        required: false
    },
    fundingAmount: {
        type: Number,
        required: true
    },
    equity: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    acceptanceReason: {
        type: String,
        default: ''
    },
    founder_name: {
        type: String,
        required: true
    },
    contact_email: {
        type: String,
        required: true
    },
    phone_number: {
        type: String,
        required: true
    },
    linkedin_profile: {
        type: String,
        required: true
    },
    additional_founders: {
        type: String
    },
    company_name: {
        type: String,
        required: true
    },
    brand_name: String,
    cin_number: String,
    gst_number: String,
    website: String,
    incorporation_date: Date,
    incorporation_place: String,
    company_stage: {
        type: String,
        required: true
    },
    industry_type: {
        type: String,
        required: true
    },
    location: String,
    business_description: {
        type: String,
        required: true
    },
    mission_statement: String,
    problem_solving: {
        type: String,
        required: true
    },
    solution_overview: {
        type: String,
        required: true
    },
    product_description: {
        type: String,
        required: true
    },
    product_roadmap: String,
    product_demo: String,
    revenue_last_12: String,
    gross_margin: String,
    ebitda: String,
    operating_expenses: String,
    profit_loss: String,
    projected_revenue: String,
    fundraising_requirements: {
        type: String,
        required: true
    },
    monthly_burn: String,
    supporting_documents: String,
    additional_notes: String,
    use_of_funds: String
}, { timestamps: true });

module.exports = mongoose.model("InvestorPitch", InvestorPitchSchema); 