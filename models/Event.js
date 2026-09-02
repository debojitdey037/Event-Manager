const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide an event title'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please provide an event description']
    },
    category: {
      type: String,
      required: [true, 'Please specify an event category'],
      enum: [
        'technology',
        'business',
        'music',
        'sports',
        'education',
        'workshop',
        'conference',
        'networking',
        'cultural',
        'other'
      ]
    },
    location: {
      type: String,
      required: [true, 'Please specify event location']
    },
    eventDate: {
      type: Date,
      required: [true, 'Please specify event date']
    },
    startTime: {
      type: String,
      required: [true, 'Please specify start time']
    },
    endTime: {
      type: String,
      required: [true, 'Please specify end time']
    },
    capacity: {
      type: Number,
      required: [true, 'Please specify capacity'],
      min: [1, 'Capacity must be at least 1']
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: [0, 'Registered count cannot be negative']
    },
    price: {
      type: Number,
      required: [true, 'Please specify price'],
      min: [0, 'Price cannot be negative']
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'cancelled', 'completed'],
      default: 'pending'
    },
    rejectionReason: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Virtual field for checking if event is full
eventSchema.virtual('isSoldOut').get(function () {
  return this.registeredCount >= this.capacity;
});

// Index for search functionality
eventSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Event', eventSchema);
