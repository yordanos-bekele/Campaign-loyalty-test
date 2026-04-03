package com.campaignloyalty.qrtoken.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "qr_token")
@Data
public class QrToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hotel_id")
    private Long hotelId;

    private String token;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        expiresAt = createdAt.plusMinutes(10); // Token valid for 10 minutes
    }
}