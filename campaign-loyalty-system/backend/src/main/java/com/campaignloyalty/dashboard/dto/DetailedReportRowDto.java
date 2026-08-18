package com.campaignloyalty.dashboard.dto;

public class DetailedReportRowDto {

    private String date;
    private Integer hotelId;
    private String hotelName;
    private long totalScans;
    private long validScans;
    private long suspiciousScans;

    public DetailedReportRowDto(String date, Integer hotelId, String hotelName, long totalScans, long validScans, long suspiciousScans) {
        this.date = date;
        this.hotelId = hotelId;
        this.hotelName = hotelName;
        this.totalScans = totalScans;
        this.validScans = validScans;
        this.suspiciousScans = suspiciousScans;
    }

    public String getDate() {
        return date;
    }

    public Integer getHotelId() {
        return hotelId;
    }

    public String getHotelName() {
        return hotelName;
    }

    public long getTotalScans() {
        return totalScans;
    }

    public long getValidScans() {
        return validScans;
    }

    public long getSuspiciousScans() {
        return suspiciousScans;
    }
}
