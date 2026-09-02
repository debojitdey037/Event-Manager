const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    ticketId: {
      type: String,
      required: true,
      unique: true
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'attended'],
      default: 'active'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent same user from registering multiple times for the same event
registrationSchema.index({ user: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
