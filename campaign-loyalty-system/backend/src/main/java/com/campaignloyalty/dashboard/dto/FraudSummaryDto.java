package com.campaignloyalty.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class FraudSummaryDto {

    private long totalRejectedScans;
    private long totalSuspiciousFlags;
    private List<RejectedScanLeaderDto> top5CustomersByRejectedScans;
    private List<RejectedScanLeaderDto> top5HotelsByRejectedScans;
}
