package com.campaignloyalty.dashboard.dto;

public class HotelStatsDto {

    private long scansToday;
    private long rewardsGiven;
    private long suspiciousScans;

    public HotelStatsDto(long scansToday, long rewardsGiven, long suspiciousScans) {
        this.scansToday = scansToday;
        this.rewardsGiven = rewardsGiven;
        this.suspiciousScans = suspiciousScans;
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
}