package com.campaignloyalty.scan.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "scan_history")
@Data
public class ScanHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "hotel_id")
    private Long hotelId;

    @Column(name = "qr_token")
    private String qrToken;

    @Column(name = "scanned_at")
    private LocalDateTime scannedAt;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    private boolean valid;

    @Column(name = "reject_reason")
    private String rejectReason;

    @PrePersist
    protected void onCreate() {
        scannedAt = LocalDateTime.now();
    }
    
}