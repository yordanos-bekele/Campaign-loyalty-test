package com.campaignloyalty.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class HotelLoginRequest {

    @NotBlank(message = "hotel name is required")
    private String hotelName;

    @NotBlank(message = "password is required")
    private String password;
}
