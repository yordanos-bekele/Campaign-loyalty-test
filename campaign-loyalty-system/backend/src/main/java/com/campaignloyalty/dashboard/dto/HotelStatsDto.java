package com.campaignloyalty.dashboard.dto;

public class HotelStatsDto {

    private long scansToday;
    private long rewardsGiven;
    private long suspiciousScans;

    private long maxScanCount;
    private String maxScanDate;

    public HotelStatsDto(long scansToday, long rewardsGiven, long suspiciousScans, long maxScanCount, String maxScanDate) {
        this.scansToday = scansToday;
        this.rewardsGiven = rewardsGiven;
        this.suspiciousScans = suspiciousScans;
        this.maxScanCount = maxScanCount;
        this.maxScanDate = maxScanDate;
    }

    // Getters
    public long getScansToday() {
        return scansToday;
    }

    public long getRewardsGiven() {
        return rewardsGiven;
    }

    public long getSuspiciousScans() {
        return suspiciousScans;
    }

    public long getMaxScanCount() {
        return maxScanCount;
    }

    public String getMaxScanDate() {
        return maxScanDate;
    }
}