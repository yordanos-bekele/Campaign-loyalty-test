package com.campaignloyalty.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class AdminCustomerSummaryDto {

    private Integer id;
    private String fullName;
    private String phoneNumber;
    private String email;
    private long rewardCount;
    private long validScanCount;
    private LocalDateTime registeredAt;
}
