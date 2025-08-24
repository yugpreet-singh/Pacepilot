const express = require("express");
const { body, validationResult } = require("express-validator");
const PacingTarget = require("../models/PacingTarget");
const auth = require("../middleware/auth");
const router = express.Router();

// Get all pacing targets with filters
router.get("/", auth, async (req, res) => {
  try {
    const { month, clientSubgroupId, search } = req.query;

    let query = {};

    if (month) {
      query.month = month;
    }

    if (clientSubgroupId && clientSubgroupId !== "all") {
      query.clientSubgroupId = parseInt(clientSubgroupId);
    }

    if (search) {
      query.tagName = { $regex: search, $options: "i" };
    }

    const targets = await PacingTarget.find(query)
      .populate("createdBy", "username")
      .populate("modifiedBy", "username")
      .sort({ createdAt: -1 });

    res.json(targets);
  } catch (error) {
    console.error("Error fetching targets:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single pacing target
router.get("/:id", auth, async (req, res) => {
  try {
    const target = await PacingTarget.findById(req.params.id)
      .populate("createdBy", "username")
      .populate("modifiedBy", "username");

    if (!target) {
      return res.status(404).json({ message: "Target not found" });
    }

    res.json(target);
  } catch (error) {
    console.error("Error fetching target:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create new pacing target
router.post(
  "/",
  auth,
  [
    body("clientName").notEmpty().withMessage("Client name is required"),
    body("clientSubgroupId")
      .isNumeric()
      .withMessage("Client subgroup ID must be a number"),
    body("tagName").notEmpty().withMessage("Tag name is required"),
    body("channel").isNumeric().withMessage("Channel must be a number"),
    body("tagType")
      .isIn(["Category", "Sub Category", "Account"])
      .withMessage("Tag type must be Category, Sub Category, or Account"),
    body("tagId")
      .custom((value, { req }) => {
        // For Account type, tagId can be 0 or any value
        if (req.body.tagType === "Account") {
          return true;
        }
        // For other types, tagId must be numeric
        return !isNaN(value) && value > 0;
      })
      .withMessage(
        "Tag ID must be a valid number for Category/Sub Category types"
      ),
    body("month")
      .matches(/^\d{4}-\d{2}$/)
      .withMessage("Month must be in YYYY-MM format"),
    body("spendsTarget")
      .isNumeric()
      .withMessage("Spends target must be a number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const targetData = {
        ...req.body,
        createdBy: req.user._id,
        modifiedBy: req.user._id,
      };

      const target = new PacingTarget(targetData);
      await target.save();

      const populatedTarget = await PacingTarget.findById(target._id)
        .populate("createdBy", "username")
        .populate("modifiedBy", "username");

      res.status(201).json(populatedTarget);
    } catch (error) {
      console.error("Error creating target:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update pacing target
router.put(
  "/:id",
  auth,
  [
    body("spendsTarget")
      .isNumeric()
      .withMessage("Spends target must be a number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const target = await PacingTarget.findById(req.params.id);
      if (!target) {
        return res.status(404).json({ message: "Target not found" });
      }

      target.spendsTarget = req.body.spendsTarget;
      target.modifiedBy = req.user._id;
      target.lastModified = new Date();

      await target.save();

      const updatedTarget = await PacingTarget.findById(target._id)
        .populate("createdBy", "username")
        .populate("modifiedBy", "username");

      res.json(updatedTarget);
    } catch (error) {
      console.error("Error updating target:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Toggle target status
router.patch("/:id/toggle-status", auth, async (req, res) => {
  try {
    const target = await PacingTarget.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: "Target not found" });
    }

    target.status = !target.status;
    target.modifiedBy = req.user._id;
    target.lastModified = new Date();

    await target.save();

    res.json({ message: "Status updated successfully", status: target.status });
  } catch (error) {
    console.error("Error toggling status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete pacing target
router.delete("/:id", auth, async (req, res) => {
  try {
    const target = await PacingTarget.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ message: "Target not found" });
    }

    await PacingTarget.findByIdAndDelete(req.params.id);
    res.json({ message: "Target deleted successfully" });
  } catch (error) {
    console.error("Error deleting target:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
