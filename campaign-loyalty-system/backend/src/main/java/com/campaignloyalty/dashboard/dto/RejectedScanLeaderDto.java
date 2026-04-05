package com.campaignloyalty.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RejectedScanLeaderDto {

    private Integer id;
    private String label;
    private long rejectedScanCount;
}
