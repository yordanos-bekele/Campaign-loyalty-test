package com.campaignloyalty.dashboard.dto;

public class OverallStatsDto {

    private long totalScansToday;
    private long totalRewardsGiven;
    private long totalSuspiciousScans;

    public OverallStatsDto(long totalScansToday, long totalRewardsGiven, long totalSuspiciousScans) {
        this.totalScansToday = totalScansToday;
        this.totalRewardsGiven = totalRewardsGiven;
        this.totalSuspiciousScans = totalSuspiciousScans;
    }

    // Getters
    public long getTotalScansToday() {
        return totalScansToday;
    }

    public long getTotalRewardsGiven() {
        return totalRewardsGiven;
    }

    public long getTotalSuspiciousScans() {
        return totalSuspiciousScans;
    }
}