const mongoose = require("mongoose");

const pacingTargetSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    clientSubgroupId: {
      type: Number,
      required: true,
    },
    tagName: {
      type: String,
      required: true,
      trim: true,
    },
    channel: {
      type: Number,
      required: true,
      default: 1,
    },
    tagType: {
      type: String,
      enum: ["Category", "Sub Category", "Account"],
      required: true,
    },
    tagId: {
      type: Number,
      required: true,
    },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/, // Format: YYYY-MM
    },
    spendsTarget: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
pacingTargetSchema.index({ clientSubgroupId: 1, month: 1, tagId: 1 });
pacingTargetSchema.index({ month: 1 });
pacingTargetSchema.index({ tagId: 1 });

module.exports = mongoose.model("PacingTarget", pacingTargetSchema);
