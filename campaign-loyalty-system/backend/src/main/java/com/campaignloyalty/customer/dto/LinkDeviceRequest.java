package com.campaignloyalty.customer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LinkDeviceRequest {

    @NotBlank(message = "phone number is required")
    private String phoneNumber;
}
