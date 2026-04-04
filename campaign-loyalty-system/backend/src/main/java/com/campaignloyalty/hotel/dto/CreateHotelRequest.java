package com.campaignloyalty.hotel.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateHotelRequest {

    @NotBlank(message = "name is required")
    private String name;

    private String location;

    @NotBlank(message = "password is required")
    private String password;
}
