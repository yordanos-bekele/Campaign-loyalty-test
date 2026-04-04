package com.campaignloyalty.scan.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ScanRequest {

    @NotBlank(message = "token is required")
    private String token;
}
