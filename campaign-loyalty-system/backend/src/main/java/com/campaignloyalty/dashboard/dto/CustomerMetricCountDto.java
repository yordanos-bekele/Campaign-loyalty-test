package com.campaignloyalty.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CustomerMetricCountDto {

    private Integer customerId;
    private long count;
}
