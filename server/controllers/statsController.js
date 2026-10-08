const Issue = require('../models/Issue');

// Authority Operations Telemetry & Stats (SRS SCR-06, FR-6.1 to FR-6.3)
exports.getAuthorityStats = async (req, res) => {
  try {
    const totalWorkload = await Issue.countDocuments();
    const pendingIntake = await Issue.countDocuments({ status: 'reported' });
    const activeSquads = await Issue.countDocuments({ status: { $in: ['assigned', 'in_progress'] } });
    const certifiedClosed = await Issue.countDocuments({ status: 'resolved' });

    // 7-day velocity breakdown
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const issuesLast7Days = await Issue.find({
      createdAt: { $gte: sevenDaysAgo },
    }).select('status createdAt updatedAt');

    // Aggregate by day of week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const velocityMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      velocityMap[dayName] = { day: dayName, reported: 0, resolved: 0 };
    }

    issuesLast7Days.forEach((iss) => {
      const dayName = days[new Date(iss.createdAt).getDay()];
      if (velocityMap[dayName]) {
        velocityMap[dayName].reported += 1;
        if (iss.status === 'resolved') {
          velocityMap[dayName].resolved += 1;
        }
      }
    });

    const velocityChart = Object.values(velocityMap);

    // Department SLA Breakdown
    const departmentStats = await Issue.aggregate([
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          department: '$_id',
          total: 1,
          resolved: 1,
          slaPercentage: {
            $cond: [
              { $gt: ['$total', 0] },
              { $round: [{ $multiply: [{ $divide: ['$resolved', '$total'] }, 100] }, 1] },
              100,
            ],
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalWorkload,
          pendingIntake,
          activeSquads,
          certifiedClosed,
          slaCompliance: totalWorkload > 0 ? Math.round((certifiedClosed / totalWorkload) * 100) : 98,
        },
        velocityChart,
        departmentStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
