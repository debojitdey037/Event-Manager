const mongoose = require('mongoose');

const sponsorshipSchema = new mongoose.Schema(
  {
    sponsor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    amount: {
      type: Number,
      required: [true, 'Please specify sponsorship amount'],
      min: [1, 'Amount must be at least 1']
    },
    message: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Sponsorship', sponsorshipSchema);
