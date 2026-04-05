package com.campaignloyalty.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class LoyalCustomerDto {

    private Integer id;
    private String deviceId;
    private String fullName;
    private String phoneNumber;
    private String email;
    private LocalDateTime registeredAt;
    private LocalDateTime createdAt;
}
