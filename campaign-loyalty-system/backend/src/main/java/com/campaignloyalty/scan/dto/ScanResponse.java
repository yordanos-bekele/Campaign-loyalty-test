package com.campaignloyalty.scan.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ScanResponse {

    private String status;
    private Integer currentCount;
    private Integer remainingToReward;
    private String reason;
    private Integer rewardId;
    private LocalDateTime nextAllowedScanAt;
    private String message;
}
