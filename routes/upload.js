const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");
const PacingTarget = require("../models/PacingTarget");
const auth = require("../middleware/auth");
const { pgPool } = require("../config/database");
const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Validate CSV file without importing
router.post("/validate", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];
    const errors = [];
    const filePath = req.file.path;

    // Valid channel IDs (hardcoded for now, can be made dynamic in future)
    const validChannelIds = [1, 2, 27, 65, 109];

    // Read and parse CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          // Process each row for validation only
          let validRows = 0;
          let emptyRows = 0;

          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            const rowNumber = i + 2; // +2 because CSV starts at row 2 and we start counting from 0

            try {
              // Check if the entire row is empty (skip empty rows)
              const isRowEmpty = Object.values(row).every(
                (value) =>
                  value === undefined ||
                  value === null ||
                  value.toString().trim() === ""
              );

              if (isRowEmpty) {
                emptyRows++;
                continue;
              }

              // Validate required fields
              if (
                !row.client_subgroup_id ||
                !row.tag_id ||
                !row.tag_name ||
                !row.tag_header ||
                !row.channel_id ||
                !row.month ||
                !row.year ||
                !row.spends_target
              ) {
                errors.push({
                  row: rowNumber,
                  error: "Missing required fields",
                  details:
                    "All fields are required: client_subgroup_id, tag_id, tag_name, tag_header, channel_id, month, year, spends_target",
                  data: row,
                });
                continue;
              }

              // Validate client_subgroup_id is numeric
              const clientSubgroupId = parseInt(row.client_subgroup_id);
              if (isNaN(clientSubgroupId)) {
                errors.push({
                  row: rowNumber,
                  error: "Invalid client_subgroup_id",
                  details: "client_subgroup_id must be a valid number",
                  data: row,
                });
                continue;
              }

              // Validate tag_id is numeric (skip for Account type)
              let tagId;

              if (row.tag_header === "Account") {
                // For Account type, tag_id can be "Account" or any value
                tagId = 0; // Set default ID for Account type
              } else {
                // For Category/Sub Category, tag_id must be numeric
                tagId = parseInt(row.tag_id);
                if (isNaN(tagId)) {
                  errors.push({
                    row: rowNumber,
                    error: "Invalid tag_id",
                    details: "tag_id must be a valid number",
                    data: row,
                  });
                  continue;
                }
              }

              // Validate channel_id is in allowed list
              const channelId = parseInt(row.channel_id);
              if (isNaN(channelId) || !validChannelIds.includes(channelId)) {
                errors.push({
                  row: rowNumber,
                  error: "Invalid channel_id",
                  details: `channel_id must be one of: ${validChannelIds.join(
                    ", "
                  )}`,
                  data: row,
                });
                continue;
              }

              // Validate spends_target is non-negative number
              const spendsTarget = parseFloat(row.spends_target);
              if (isNaN(spendsTarget) || spendsTarget < 0) {
                errors.push({
                  row: rowNumber,
                  error: "Invalid spends_target",
                  details: "spends_target must be a non-negative number (>= 0)",
                  data: row,
                });
                continue;
              }

              // Validate tag_header is valid
              if (
                !["Category", "Sub Category", "Account"].includes(
                  row.tag_header
                )
              ) {
                errors.push({
                  row: rowNumber,
                  error: "Invalid tag_header",
                  details:
                    "tag_header must be either 'Category', 'Sub Category', or 'Account'",
                  data: row,
                });
                continue;
              }

              // Check uniqueness for all tag types (not just Account)
              // Check uniqueness in CSV being uploaded
              const csvDuplicateCount = results.filter(
                (r, idx) =>
                  idx !== i &&
                  r.client_subgroup_id === row.client_subgroup_id &&
                  r.channel_id === row.channel_id &&
                  r.tag_header === row.tag_header &&
                  r.tag_id === row.tag_id &&
                  r.month === row.month &&
                  r.year === row.year
              ).length;

              if (csvDuplicateCount > 0) {
                errors.push({
                  row: rowNumber,
                  error: `Duplicate ${row.tag_header} in CSV`,
                  details: `${row.tag_header} entry already exists for client_subgroup_id=${row.client_subgroup_id}, channel_id=${row.channel_id}, tag_id=${row.tag_id}, month=${row.month}, and year=${row.year} in this upload`,
                  data: row,
                });
                continue;
              }

              // Check uniqueness in MongoDB existing entries for all tag types
              try {
                // Create month string in YYYY-MM format for duplicate checking
                const monthNum = parseInt(row.month.trim());
                const year = row.year.toString().trim();

                if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                  errors.push({
                    row: rowNumber,
                    error: "Invalid month format",
                    details: "Month must be a number between 1-12",
                    data: row,
                  });
                  continue;
                }

                const monthString = `${year}-${monthNum
                  .toString()
                  .padStart(2, "0")}`;

                const existingTargetResult = await PacingTarget.aggregate([
                  {
                    $match: {
                      clientSubgroupId: clientSubgroupId,
                      channel: channelId,
                      tagType: row.tag_header,
                      tagId: tagId,
                      month: monthString,
                    },
                  },
                  {
                    $count: "count",
                  },
                ]);

                const existingCount =
                  existingTargetResult.length > 0
                    ? existingTargetResult[0].count
                    : 0;

                if (existingCount > 0) {
                  errors.push({
                    row: rowNumber,
                    error: `${row.tag_header} already exists`,
                    details: `${row.tag_header} entry already exists in database for client_subgroup_id=${clientSubgroupId}, channel_id=${channelId}, tag_id=${tagId}, and month=${monthString}`,
                    data: row,
                  });
                  continue;
                }
              } catch (duplicateCheckError) {
                // Skip uniqueness check on error
              }

              // Special validation for Account type
              if (row.tag_header === "Account") {
                // Validate tag_name matches for Account
                if (row.tag_name.trim() !== "Account") {
                  errors.push({
                    row: rowNumber,
                    error: "Invalid Account tag name",
                    details:
                      "Tag name for Account type must be exactly 'Account'",
                    data: row,
                  });
                  continue;
                }
              } else {
                const tagQuery = `
                   SELECT client_subgroup_id, tag_id, tag_type_id, tag_name,
                       CASE
                        WHEN tag_type_id = 1 THEN 'Category'
                        WHEN tag_type_id = 2 THEN 'Sub Category'
                       END AS tag_header
                   FROM revinity.tag_master 
                   WHERE client_subgroup_id = $1 AND tag_type_id IN (1, 2) AND tag_id = $2 AND is_active = TRUE
                 `;

                const tagResult = await pgPool.query(tagQuery, [
                  clientSubgroupId,
                  tagId,
                ]);

                if (tagResult.rows.length === 0) {
                  errors.push({
                    row: rowNumber,
                    error: "Tag validation failed",
                    details: `No active tag found with client_subgroup_id=${clientSubgroupId} and tag_id=${tagId}`,
                    data: row,
                  });
                  continue;
                }

                const dbTag = tagResult.rows[0];

                // Validate tag_name matches database
                if (dbTag.tag_name !== row.tag_name.trim()) {
                  errors.push({
                    row: rowNumber,
                    error: "Tag name mismatch",
                    details: `Tag name '${row.tag_name}' doesn't match database value '${dbTag.tag_name}'`,
                    data: row,
                  });
                  continue;
                }

                // Validate tag_header matches database
                const expectedTagHeader =
                  dbTag.tag_type_id === 1 ? "Category" : "Sub Category";

                if (expectedTagHeader !== row.tag_header) {
                  errors.push({
                    row: rowNumber,
                    error: "Tag header mismatch",
                    details: `Tag header '${row.tag_header}' doesn't match database value '${expectedTagHeader}'`,
                    data: row,
                  });
                  continue;
                }
              }

              // Create month string in YYYY-MM format
              const monthNum = parseInt(row.month.trim());
              const year = row.year.toString().trim();

              if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                errors.push({
                  row: rowNumber,
                  error: "Invalid month format",
                  details: "Month must be a number between 1-12",
                  data: row,
                });
                continue;
              }

              const monthString = `${year}-${monthNum
                .toString()
                .padStart(2, "0")}`;

              // Fetch client name from PostgreSQL
              const clientQuery = `
                SELECT client_subgroup_name
                FROM client_resource.client_subgroup_master 
                WHERE id = $1
              `;

              let clientName = `Client ${clientSubgroupId}`; // Default fallback
              try {
                const clientResult = await pgPool.query(clientQuery, [
                  clientSubgroupId,
                ]);
                if (clientResult.rows.length > 0) {
                  clientName = clientResult.rows[0].client_subgroup_name;
                }
              } catch (clientError) {
                // Use default name on error
              }

              validRows++;
            } catch (error) {
              errors.push({
                row: rowNumber,
                error: "Data processing error",
                details: error.message,
                data: row,
              });
            }
          }

          // Clean up uploaded file
          fs.unlinkSync(filePath);

          // Return validation results
          if (errors.length > 0) {
            res.json({
              message:
                "CSV validation failed. Please fix the errors and try again.",
              totalRows: results.length,
              validRows: validRows,
              errorRows: errors.length,
              emptyRows: emptyRows,
              errors: errors,
              canImport: false,
            });
          } else {
            res.json({
              message:
                "CSV validation successful! You can now import the data.",
              totalRows: results.length,
              validRows: validRows,
              errorRows: 0,
              emptyRows: emptyRows,
              errors: [],
              canImport: true,
            });
          }
        } catch (error) {
          // Clean up uploaded file
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          console.error("Error validating CSV:", error);
          res.status(500).json({ message: "Error validating CSV file" });
        }
      })
      .on("error", (error) => {
        // Clean up uploaded file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        console.error("CSV parsing error:", error);
        res.status(500).json({ message: "Error parsing CSV file" });
      });
  } catch (error) {
    console.error("Validation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Upload and process CSV file
router.post("/csv", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];
    const errors = [];
    const filePath = req.file.path;

    // Valid channel IDs (hardcoded for now, can be made dynamic in future)
    const validChannelIds = [1, 2, 27, 65, 109];

    // Read and parse CSV file
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        try {
          // Process each row
          const processedTargets = [];

          for (let i = 0; i < results.length; i++) {
            const row = results[i];
            const rowNumber = i + 2; // +2 because CSV starts at row 2 and we start counting from 0

            try {
              // Check if the entire row is empty (skip empty rows)
              const isRowEmpty = Object.values(row).every(
                (value) =>
                  value === undefined ||
                  value === null ||
                  value.toString().trim() === ""
              );

              if (isRowEmpty) {
                continue;
              }

              // Validate required fields
              if (
                !row.client_subgroup_id ||
                !row.tag_id ||
                !row.tag_name ||
                !row.tag_header ||
                !row.channel_id ||
                !row.month ||
                !row.year ||
                !row.spends_target
              ) {
                errors.push({
                  row: rowNumber,
                  error: "Missing required fields",
                  details:
                    "All fields required: client_subgroup_id, tag_id, tag_name, tag_header, channel_id, month, year, spends_target",
                  data: row,
                });
                continue;
              }

              // Validate client_subgroup_id is numeric
              const clientSubgroupId = parseInt(row.client_subgroup_id);
              if (isNaN(clientSubgroupId)) {
                errors.push({
                  row: rowNumber,
                  error: "Invalid client_subgroup_id",
                  details: "client_subgroup_id must be a valid number",
                  data: row,
                });
                continue;
              }

              // Validate tag_id is numeric (skip for Account type)
              let tagId;

              if (row.tag_header === "Account") {
                // For Account type, tag_id can be "Account" or any value
                tagId = 0; // Set default ID for Account type
              } else {
                // For Category/Sub Category, tag_id must be numeric
                tagId = parseInt(row.tag_id);
                if (isNaN(tagId)) {
                  errors.push({
                    row: rowNumber,
                    error: "Invalid tag_id",
                    details: "tag_id must be a valid number",
                    data: row,
                  });
                  continue;
                }
              }

              // Validate channel_id is in allowed list
              const channelId = parseInt(row.channel_id);
              if (isNaN(channelId) || !validChannelIds.includes(channelId)) {
                errors.push({
                  row: rowNumber,
                  error: "Invalid channel_id",
                  details: `channel_id must be one of: ${validChannelIds.join(
                    ", "
                  )}`,
                  data: row,
                });
                continue;
              }

              // Validate spends_target is non-negative number
              const spendsTarget = parseFloat(row.spends_target);
              if (isNaN(spendsTarget) || spendsTarget < 0) {
                errors.push({
                  row: rowNumber,
                  error: "Invalid spends_target",
                  details: "spends_target must be a non-negative number (>= 0)",
                  data: row,
                });
                continue;
              }

              // Validate tag_header is valid
              if (
                !["Category", "Sub Category", "Account"].includes(
                  row.tag_header
                )
              ) {
                errors.push({
                  row: rowNumber,
                  error: "Invalid tag_header",
                  details:
                    "tag_header must be either 'Category', 'Sub Category', or 'Account'",
                  data: row,
                });
                continue;
              }

              // Check uniqueness for all tag types (not just Account)
              // Check uniqueness in CSV being uploaded
              const csvDuplicateCount = results.filter(
                (r, idx) =>
                  idx !== i &&
                  r.client_subgroup_id === row.client_subgroup_id &&
                  r.channel_id === row.channel_id &&
                  r.tag_header === row.tag_header &&
                  r.tag_id === row.tag_id
              ).length;

              if (csvDuplicateCount > 0) {
                errors.push({
                  row: rowNumber,
                  error: `Duplicate ${row.tag_header} in CSV`,
                  details: `${row.tag_header} entry already exists for client_subgroup_id=${row.client_subgroup_id}, channel_id=${row.channel_id}, and tag_id=${row.tag_id} in this upload`,
                  data: row,
                });
                continue;
              }

              // Check uniqueness in MongoDB existing entries for all tag types
              try {
                // Create month string in YYYY-MM format for duplicate checking
                const monthNum = parseInt(row.month.trim());
                const year = row.year.toString().trim();

                if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                  errors.push({
                    row: rowNumber,
                    error: "Invalid month format",
                    details: "Month must be a number between 1-12",
                    data: row,
                  });
                  continue;
                }

                const monthString = `${year}-${monthNum
                  .toString()
                  .padStart(2, "0")}`;

                const existingTargetResult = await PacingTarget.aggregate([
                  {
                    $match: {
                      clientSubgroupId: clientSubgroupId,
                      channel: channelId,
                      tagType: row.tag_header,
                      tagId: tagId,
                      month: monthString,
                    },
                  },
                  {
                    $count: "count",
                  },
                ]);

                const existingCount =
                  existingTargetResult.length > 0
                    ? existingTargetResult[0].count
                    : 0;

                if (existingCount > 0) {
                  errors.push({
                    row: rowNumber,
                    error: `${row.tag_header} already exists`,
                    details: `${row.tag_header} entry already exists in database for client_subgroup_id=${clientSubgroupId}, channel_id=${channelId}, tag_id=${tagId}, and month=${monthString}`,
                    data: row,
                  });
                  continue;
                }
              } catch (duplicateCheckError) {
                // Skip uniqueness check on error
              }

              // Special validation for Account type
              if (row.tag_header === "Account") {
                // Validate tag_name matches for Account
                if (row.tag_name.trim() !== "Account") {
                  errors.push({
                    row: rowNumber,
                    error: "Invalid Account tag name",
                    details:
                      "Tag name for Account type must be exactly 'Account'",
                    data: row,
                  });
                  continue;
                }
              } else {
                const tagQuery = `
                   SELECT client_subgroup_id, tag_id, tag_type_id, tag_name,
                       CASE
                        WHEN tag_type_id = 1 THEN 'Category'
                        WHEN tag_type_id = 2 THEN 'Sub Category'
                       END AS tag_header
                   FROM revinity.tag_master 
                   WHERE client_subgroup_id = $1 AND tag_type_id IN (1, 2) AND tag_id = $2 AND is_active = TRUE
                 `;

                const tagResult = await pgPool.query(tagQuery, [
                  clientSubgroupId,
                  tagId,
                ]);

                if (tagResult.rows.length === 0) {
                  errors.push({
                    row: rowNumber,
                    error: "Tag validation failed",
                    details: `No active tag found with client_subgroup_id=${clientSubgroupId} and tag_id=${tagId}`,
                    data: row,
                  });
                  continue;
                }

                const dbTag = tagResult.rows[0];

                // Validate tag_name matches database
                if (dbTag.tag_name !== row.tag_name.trim()) {
                  errors.push({
                    row: rowNumber,
                    error: "Tag name mismatch",
                    details: `Tag name '${row.tag_name}' doesn't match database value '${dbTag.tag_name}'`,
                    data: row,
                  });
                  continue;
                }

                // Validate tag_header matches database
                const expectedTagHeader =
                  dbTag.tag_type_id === 1 ? "Category" : "Sub Category";

                if (expectedTagHeader !== row.tag_header) {
                  errors.push({
                    row: rowNumber,
                    error: "Tag header mismatch",
                    details: `Tag header '${row.tag_header}' doesn't match database value '${expectedTagHeader}'`,
                    data: row,
                  });
                  continue;
                }
              }

              // Month validation already done during duplicate checking above
              // Create month string in YYYY-MM format for client name fetching
              const monthNum = parseInt(row.month.trim());
              const year = row.year.toString().trim();
              const monthString = `${year}-${monthNum
                .toString()
                .padStart(2, "0")}`;

              // Fetch client name from PostgreSQL
              const clientQuery = `
                SELECT client_subgroup_name
                FROM client_resource.client_subgroup_master 
                WHERE id = $1
              `;

              let clientName = `Client ${clientSubgroupId}`; // Default fallback
              try {
                const clientResult = await pgPool.query(clientQuery, [
                  clientSubgroupId,
                ]);
                if (clientResult.rows.length > 0) {
                  clientName = clientResult.rows[0].client_subgroup_name;
                }
              } catch (clientError) {
                // Use default name on error
              }

              // Create target object for MongoDB
              const targetData = {
                clientName: clientName,
                clientSubgroupId: clientSubgroupId,
                tagName: row.tag_name.trim(),
                channel: channelId,
                tagType: row.tag_header,
                tagId: tagId,
                month: monthString,
                spendsTarget: spendsTarget,
                createdBy: req.user._id,
                modifiedBy: req.user._id,
              };

              processedTargets.push(targetData);
            } catch (error) {
              errors.push({
                row: rowNumber,
                error: "Data processing error",
                details: error.message,
                data: row,
              });
            }
          }

          // If there are any validation errors, don't proceed with upload
          if (errors.length > 0) {
            // Clean up uploaded file
            fs.unlinkSync(filePath);

            res.status(400).json({
              message:
                "CSV validation failed. Please fix the errors and try again.",
              totalRows: results.length,
              validRows: 0,
              errorRows: errors.length,
              errors: errors,
              savedTargets: 0,
            });
            return;
          }

          // Save targets to MongoDB
          if (processedTargets.length > 0) {
            try {
              const savedTargets = await PacingTarget.insertMany(
                processedTargets
              );

              // Clean up uploaded file
              fs.unlinkSync(filePath);

              res.json({
                message: "CSV processed successfully",
                totalRows: results.length,
                validRows: processedTargets.length,
                errorRows: 0,
                errors: [],
                savedTargets: savedTargets.length,
              });
            } catch (mongoError) {
              // Clean up uploaded file
              fs.unlinkSync(filePath);

              res.status(500).json({
                message: "Error saving data to database",
                totalRows: results.length,
                validRows: processedTargets.length,
                errorRows: 0,
                errors: [],
                savedTargets: 0,
                mongoError: mongoError.message,
              });
            }
          } else {
            // Clean up uploaded file
            fs.unlinkSync(filePath);

            res.status(400).json({
              message: "No valid data found in CSV",
              totalRows: results.length,
              validRows: 0,
              errorRows: 0,
              errors: [],
              savedTargets: 0,
            });
          }
        } catch (error) {
          // Clean up uploaded file
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          console.error("Error processing CSV:", error);
          res.status(500).json({ message: "Error processing CSV file" });
        }
      })
      .on("error", (error) => {
        // Clean up uploaded file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        console.error("CSV parsing error:", error);
        res.status(500).json({ message: "Error parsing CSV file" });
      });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Download CSV template
router.get("/template", auth, (req, res) => {
  const templateData = [
    "client_subgroup_id,tag_id,tag_name,tag_header,channel_id,month,year,spends_target",
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="pacing-targets-template.csv"'
  );
  res.send(templateData);
});

module.exports = router;
