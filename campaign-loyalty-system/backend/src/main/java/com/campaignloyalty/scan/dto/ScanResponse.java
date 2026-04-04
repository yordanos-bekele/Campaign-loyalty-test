package com.campaignloyalty.scan.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ScanResponse {

    private boolean success;
    private String message;
    private boolean rewardEarned;
    private Integer currentCount;
    private Integer scansRemaining;
}
