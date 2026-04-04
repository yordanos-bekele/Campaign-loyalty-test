package com.campaignloyalty.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AuthResponse {

    private String role;
    private Integer hotelId;
    private String displayName;
}
