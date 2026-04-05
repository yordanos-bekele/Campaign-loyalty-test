package com.campaignloyalty.customer.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterCustomerRequest {

    @NotBlank(message = "full name is required")
    private String fullName;

    @NotBlank(message = "phone number is required")
    private String phoneNumber;

    private String email;
}
