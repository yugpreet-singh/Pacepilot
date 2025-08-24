const express = require("express");
const { pgPool } = require("../config/database");
const auth = require("../middleware/auth");
const router = express.Router();

// Get tags for a specific client subgroup
router.get("/client/:clientSubgroupId", auth, async (req, res) => {
  try {
    const { clientSubgroupId } = req.params;

    const query = `
            SELECT 
                client_subgroup_id,
                tag_id,
                tag_type_id,
                tag_name,
                CASE 
                    WHEN tag_type_id = 1 THEN 'Category'
                    WHEN tag_type_id = 2 THEN 'Sub Category'
                END AS tag_header
            FROM 
                revinity.tag_master tm
            WHERE
                client_subgroup_id = $1
                AND tag_type_id IN (1, 2)
                AND is_active = TRUE
            ORDER BY tag_type_id, tag_name
        `;

    const result = await pgPool.query(query, [parseInt(clientSubgroupId)]);

    res.json({
      clientSubgroupId: parseInt(clientSubgroupId),
      tags: result.rows,
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all available client subgroups
router.get("/clients", auth, async (req, res) => {
  try {
    const query = `
            SELECT 
                id,
                client_subgroup_name
            FROM 
                client_resource.client_subgroup_master
            ORDER BY client_subgroup_name
        `;

    const result = await pgPool.query(query);

    res.json({
      clients: result.rows,
    });
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Search tags by name
router.get("/search/:clientSubgroupId", auth, async (req, res) => {
  try {
    const { clientSubgroupId } = req.params;
    const { q } = req.query; // search query

    if (!q || q.length < 2) {
      return res
        .status(400)
        .json({ message: "Search query must be at least 2 characters long" });
    }

    const query = `
            SELECT 
                client_subgroup_id,
                tag_id,
                tag_type_id,
                tag_name,
                CASE 
                    WHEN tag_type_id = 1 THEN 'Category'
                    WHEN tag_type_id = 2 THEN 'Sub Category'
                END AS tag_header
            FROM 
                revinity.tag_master tm
            WHERE
                client_subgroup_id = $1
                AND tag_type_id IN (1, 2)
                AND is_active = TRUE
                AND tag_name ILIKE $2
            ORDER BY tag_type_id, tag_name
            LIMIT 20
        `;

    const result = await pgPool.query(query, [
      parseInt(clientSubgroupId),
      `%${q}%`,
    ]);

    res.json({
      clientSubgroupId: parseInt(clientSubgroupId),
      searchQuery: q,
      tags: result.rows,
    });
  } catch (error) {
    console.error("Error searching tags:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get tags for a specific client subgroup with optional tag type filter
router.get("/filtered/:clientSubgroupId", auth, async (req, res) => {
  try {
    const { clientSubgroupId } = req.params;
    const { tagType } = req.query; // Optional query parameter for tag type filter

    let query, params;

    if (tagType === "Account") {
      // For Account type, return a special response
      res.json([
        {
          client_subgroup_id: parseInt(clientSubgroupId),
          tag_id: 0,
          tag_type_id: 0,
          tag_name: "Account",
          tag_header: "Account",
        },
      ]);
      return;
    } else if (tagType === "Category") {
      // Filter for Category only
      query = `
        SELECT client_subgroup_id, tag_id, tag_type_id, tag_name,
          CASE
            WHEN tag_type_id = 1 THEN 'Category'
            WHEN tag_type_id = 2 THEN 'Sub Category'
          END AS tag_header
        FROM revinity.tag_master 
        WHERE client_subgroup_id = $1 
          AND tag_type_id = 1
          AND is_active = TRUE
        ORDER BY tag_name
      `;
      params = [parseInt(clientSubgroupId)];
    } else if (tagType === "Sub Category") {
      // Filter for Sub Category only
      query = `
        SELECT client_subgroup_id, tag_id, tag_type_id, tag_name,
          CASE
            WHEN tag_type_id = 1 THEN 'Category'
            WHEN tag_type_id = 2 THEN 'Sub Category'
          END AS tag_header
        FROM revinity.tag_master 
        WHERE client_subgroup_id = $1 
          AND tag_type_id = 2
          AND is_active = TRUE
        ORDER BY tag_name
        `;
      params = [parseInt(clientSubgroupId)];
    } else {
      // Default: return all tag types (Category and Sub Category)
      query = `
        SELECT client_subgroup_id, tag_id, tag_type_id, tag_name,
          CASE
            WHEN tag_type_id = 1 THEN 'Category'
            WHEN tag_type_id = 2 THEN 'Sub Category'
          END AS tag_header
        FROM revinity.tag_master 
        WHERE client_subgroup_id = $1 
          AND tag_type_id IN (1, 2)
          AND is_active = TRUE
        ORDER BY tag_name
      `;
      params = [parseInt(clientSubgroupId)];
    }

    const result = await pgPool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error getting filtered tags:", error);
    res.status(500).json({ message: "Error getting filtered tags" });
  }
});

// Get tag details by tag ID
router.get("/tag/:tagId", auth, async (req, res) => {
  try {
    const { tagId } = req.params;

    const query = `
            SELECT 
                client_subgroup_id,
                tag_id,
                tag_type_id,
                tag_name,
                CASE 
                    WHEN tag_type_id = 1 THEN 'Category'
                    WHEN tag_type_id = 2 THEN 'Sub Category'
                END AS tag_header
            FROM 
                revinity.tag_master tm
            WHERE
                tag_id = $1
                AND is_active = TRUE
        `;

    const result = await pgPool.query(query, [parseInt(tagId)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Tag not found" });
    }

    res.json({
      tag: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching tag details:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
