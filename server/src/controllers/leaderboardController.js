const User = require('../models/User');
const Resource = require('../models/Resource');
const asyncHandler = require('express-async-handler');

// Leaderboard scoring:
//  +5 per approved resource uploaded
//  +2 per peer connection
//  +1 per bookmarked job (engagement signal)
//  Base: roll number uniqueness (prevents ties)

// @desc  Get leaderboard (top 50 students by activity score)
// @route GET /api/leaderboard?branch=CSE&year=2
const getLeaderboard = asyncHandler(async (req, res) => {
  const userFilter = { role: 'student', isActive: true };
  if (req.query.branch && req.query.branch !== 'All') userFilter.branch = req.query.branch;
  if (req.query.year) userFilter.year = Number(req.query.year);

  const students = await User.find(userFilter)
    .select('name avatar rollNumber branch year skills connections bookmarkedJobs')
    .lean();

  // Get approved resource counts per user in one query
  const resourceCounts = await Resource.aggregate([
    { $match: { approved: true } },
    { $group: { _id: '$uploadedBy', count: { $sum: 1 } } },
  ]);
  const resourceMap = Object.fromEntries(resourceCounts.map((r) => [String(r._id), r.count]));

  const scored = students
    .map((s) => {
      const resources = resourceMap[String(s._id)] || 0;
      const connections = (s.connections || []).length;
      const bookmarks = (s.bookmarkedJobs || []).length;
      const score = resources * 5 + connections * 2 + bookmarks * 1;
      return {
        _id: s._id,
        name: s.name,
        avatar: s.avatar,
        rollNumber: s.rollNumber,
        branch: s.branch,
        year: s.year,
        skills: s.skills || [],
        score,
        breakdown: { resources, connections, bookmarks },
      };
    })
    .sort((a, b) => b.score - a.score || a.rollNumber.localeCompare(b.rollNumber))
    .slice(0, 50);

  // Attach rank
  scored.forEach((s, i) => { s.rank = i + 1; });

  // Find current user's rank
  const myEntry = scored.find((s) => String(s._id) === String(req.user._id));

  res.json({ success: true, leaderboard: scored, myRank: myEntry?.rank || null });
});

module.exports = { getLeaderboard };
