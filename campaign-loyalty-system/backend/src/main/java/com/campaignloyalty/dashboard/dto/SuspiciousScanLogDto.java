package com.campaignloyalty.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class SuspiciousScanLogDto {

    private Integer id;
    private Integer customerId;
    private Integer hotelId;
    private String qrToken;
    private String rejectionReason;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime scannedAt;
}
