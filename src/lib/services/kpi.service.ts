import { connectDB } from "@/lib/db/connection";
import { Student, Driver, Route, Trip, Payment, RouteCandidate } from "@/lib/db/models";
import type { IKpiService } from "./interfaces";

export class KpiService implements IKpiService {
  async getDashboardKpi(city?: string): Promise<{
    totalStudents: number;
    activeRoutes: number;
    todayTrips: number;
    pendingPayments: number;
    revenue: number;
  }> {
    await connectDB();

    const studentFilter: Record<string, unknown> = city ? { city } : {};
    const routeFilter: Record<string, unknown> = city ? { city, status: "active" } : { status: "active" };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalStudents,
      activeRoutes,
      _todayTrips,
      _pendingPayments,
      _revenueResult,
    ] = await Promise.all([
      Student.countDocuments(studentFilter).exec(),
      Route.countDocuments(routeFilter).exec(),
      // Today trips — need route IDs for the city
      ...(city
        ? [
            Route.find({ city }).select("_id").lean().then((routes) => {
              const routeIds = routes.map((r) => r._id);
              return Trip.countDocuments({
                routeId: { $in: routeIds },
                date: { $gte: todayStart, $lt: tomorrowStart },
              }).exec();
            }),
          ]
        : [
            Trip.countDocuments({
              date: { $gte: todayStart, $lt: tomorrowStart },
            }).exec(),
          ]),
      Payment.countDocuments({ status: { $in: ["pending", "submitted", "overdue"] } }).exec(),
      Payment.aggregate([
        {
          $match: {
            status: "verified",
            verifiedAt: { $gte: monthStart },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).exec(),
    ]);

    const todayTrips = typeof _todayTrips === "number" ? _todayTrips : 0;
    const pendingPayments = _pendingPayments as number;
    const revenueResult = _revenueResult as Array<{ total: number }>;

    return {
      totalStudents: totalStudents as number,
      activeRoutes: activeRoutes as number,
      todayTrips,
      pendingPayments,
      revenue: revenueResult[0]?.total || 0,
    };
  }

  async getRevenueReport(
    start: Date,
    end: Date,
    city?: string,
  ): Promise<{
    total: number;
    byRoute: Array<{ routeId: string; routeName: string; amount: number }>;
  }> {
    await connectDB();

    const matchFilter: Record<string, unknown> = {
      status: "verified",
      verifiedAt: { $gte: start, $lte: end },
    };

    const aggResult = await Payment.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$routeId",
          total: { $sum: "$amount" },
        },
      },
    ]).exec();

    // Populate route names
    const routeIds = aggResult.map((r) => r._id);
    const routeFilter: Record<string, unknown> = { _id: { $in: routeIds } };
    if (city) routeFilter.city = city;

    const routes = await Route.find(routeFilter).select("name").lean().exec();
    const routeMap = new Map(routes.map((r) => [String(r._id), r.name]));

    const byRoute = aggResult
      .filter((r) => routeMap.has(String(r._id)))
      .map((r) => ({
        routeId: String(r._id),
        routeName: routeMap.get(String(r._id)) || "Unknown",
        amount: r.total,
      }));

    const total = byRoute.reduce((sum, r) => sum + r.amount, 0);

    return { total, byRoute };
  }

  // ── Extended KPI methods for admin dashboard ──────────────────────────────

  async getDetailedDashboard(city?: string): Promise<{
    growth: {
      totalStudents: number;
      newStudentsThisMonth: number;
      studentGrowthPercent: number;
      totalDrivers: number;
      newDriversThisMonth: number;
    };
    routes: {
      totalActive: number;
      totalCandidates: number;
      avgStudentsPerRoute: number;
      atRiskRoutes: number;
    };
    revenue: {
      totalThisMonth: number;
      platformFeesCollected: number;
      avgRevenuePerRoute: number;
      overduePayments: number;
    };
    operational: {
      avgDelayMinutes: number;
      onTimePercent: number;
      tripsToday: number;
      tripsThisMonth: number;
    };
    retention: {
      studentRetentionPercent: number;
      driverRetentionPercent: number;
    };
  }> {
    await connectDB();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const studentFilter: Record<string, unknown> = city ? { city } : {};
    const routeFilter: Record<string, unknown> = city ? { city } : {};
    const activeRouteFilter = { ...routeFilter, status: "active" };

    // Parallel queries
    const [
      totalStudents,
      newStudentsThisMonth,
      lastMonthStudents,
      totalDrivers,
      newDriversThisMonth,
      totalActiveRoutes,
      totalCandidates,
      atRiskRoutes,
      activeRoutesData,
      overduePayments,
      monthRevenue,
      platformFees,
      _tripsToday,
      _monthTrips,
      _avgDelay,
      _onTimeTrips,
      _totalTripsForPercent,
      activeStudents,
      approvedDrivers,
      totalDriverCount,
    ] = await Promise.all([
      Student.countDocuments(studentFilter).exec(),
      Student.countDocuments({ ...studentFilter, createdAt: { $gte: monthStart } }).exec(),
      Student.countDocuments({ ...studentFilter, createdAt: { $gte: lastMonthStart, $lt: monthStart } }).exec(),
      Driver.countDocuments(city ? { city } : {}).exec(),
      Driver.countDocuments({ ...(city ? { city } : {}), createdAt: { $gte: monthStart } }).exec(),
      Route.countDocuments(activeRouteFilter).exec(),
      RouteCandidate.countDocuments({ ...(city ? { city } : {}), status: "pending" }).exec(),
      Route.countDocuments({ ...activeRouteFilter, $expr: { $lt: ["$totalStudents", "$minStudents"] } }).exec(),
      Route.find(activeRouteFilter).select("totalStudents").lean().exec(),
      Payment.countDocuments({ status: { $in: ["pending", "overdue"] }, billingPeriodEnd: { $lt: now } }).exec(),
      Payment.aggregate([
        { $match: { status: "verified", verifiedAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" }, fees: { $sum: "$platformFee" } } },
      ]).exec(),
      Payment.aggregate([
        { $match: { status: "verified", verifiedAt: { $gte: monthStart } } },
        { $group: { _id: null, fees: { $sum: "$platformFee" } } },
      ]).exec(),
      ...(city
        ? [
            Route.find({ city }).select("_id").lean().then((routes) =>
              Trip.countDocuments({
                routeId: { $in: routes.map((r) => r._id) },
                date: { $gte: todayStart, $lt: tomorrowStart },
              }).exec(),
            ),
          ]
        : [Trip.countDocuments({ date: { $gte: todayStart, $lt: tomorrowStart } }).exec()]),
      ...(city
        ? [
            Route.find({ city }).select("_id").lean().then((routes) =>
              Trip.countDocuments({
                routeId: { $in: routes.map((r) => r._id) },
                date: { $gte: monthStart },
              }).exec(),
            ),
          ]
        : [Trip.countDocuments({ date: { $gte: monthStart } }).exec()]),
      Trip.aggregate([
        ...(city
          ? [
              {
                $lookup: {
                  from: "routes",
                  localField: "routeId",
                  foreignField: "_id",
                  as: "route",
                },
              },
              { $unwind: "$route" },
              { $match: { "route.city": city } },
            ]
          : []),
        { $match: { date: { $gte: monthStart } } },
        { $group: { _id: null, avgDelay: { $avg: "$delayMinutes" } } },
      ]).exec(),
      ...(city
        ? [
            Route.find({ city }).select("_id").lean().then((routes) =>
              Trip.countDocuments({
                routeId: { $in: routes.map((r) => r._id) },
                date: { $gte: monthStart },
                delayMinutes: { $lte: 10 },
              }).exec(),
            ),
          ]
        : [Trip.countDocuments({ date: { $gte: monthStart }, delayMinutes: { $lte: 10 } }).exec()]),
      Trip.countDocuments({ date: { $gte: monthStart } }).exec(),
      Student.countDocuments({ ...studentFilter, status: "active" }).exec(),
      Driver.countDocuments({ ...(city ? { city } : {}), isApproved: true }).exec(),
      Driver.countDocuments(city ? { city } : {}).exec(),
    ]);

    const avgStudentsPerRoute =
      activeRoutesData.length > 0
        ? Math.round(
            activeRoutesData.reduce((sum: number, r: { totalStudents: number }) => sum + r.totalStudents, 0) /
              activeRoutesData.length,
          )
        : 0;

    // Cast conditional spread results to their expected types
    const tripsToday = _tripsToday as number;
    const monthTrips = _monthTrips as number;
    const avgDelay = _avgDelay as Array<{ avgDelay: number }>;
    const onTimeTrips = _onTimeTrips as number;
    const totalTripsForPercent = _totalTripsForPercent as number;
    const monthRevenueArr = monthRevenue as Array<{ total: number; fees: number }>;
    const platformFeesArr = platformFees as Array<{ fees: number }>;
    const totalRevenue = monthRevenueArr[0]?.total || 0;
    const totalPlatformFees = platformFeesArr[0]?.fees || 0;
    const avgRevenuePerRoute = (totalActiveRoutes as number) > 0 ? Math.round(totalRevenue / (totalActiveRoutes as number)) : 0;
    const avgDelayMinutes = Math.round((avgDelay[0]?.avgDelay || 0) * 10) / 10;
    const onTimePercent = totalTripsForPercent > 0 ? Math.round((onTimeTrips / totalTripsForPercent) * 100) : 0;
    const studentGrowthPercent = (lastMonthStudents as number) > 0 ? Math.round((((newStudentsThisMonth as number) - (lastMonthStudents as number)) / (lastMonthStudents as number)) * 100) : 0;
    const studentRetentionPercent = (totalStudents as number) > 0 ? Math.round(((activeStudents as number) / (totalStudents as number)) * 100) : 0;
    const driverRetentionPercent = (totalDriverCount as number) > 0 ? Math.round(((approvedDrivers as number) / (totalDriverCount as number)) * 100) : 0;

    return {
      growth: {
        totalStudents: totalStudents as number,
        newStudentsThisMonth: newStudentsThisMonth as number,
        studentGrowthPercent,
        totalDrivers: totalDrivers as number,
        newDriversThisMonth: newDriversThisMonth as number,
      },
      routes: {
        totalActive: totalActiveRoutes as number,
        totalCandidates: totalCandidates as number,
        avgStudentsPerRoute,
        atRiskRoutes: atRiskRoutes as number,
      },
      revenue: {
        totalThisMonth: totalRevenue,
        platformFeesCollected: totalPlatformFees,
        avgRevenuePerRoute,
        overduePayments: overduePayments as number,
      },
      operational: {
        avgDelayMinutes,
        onTimePercent,
        tripsToday,
        tripsThisMonth: monthTrips,
      },
      retention: {
        studentRetentionPercent,
        driverRetentionPercent,
      },
    };
  }
}

export const kpiService = new KpiService();
