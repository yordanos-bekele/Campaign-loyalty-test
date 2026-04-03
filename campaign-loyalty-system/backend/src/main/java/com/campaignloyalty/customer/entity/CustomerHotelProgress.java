package com.campaignloyalty.customer.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "customer_hotel_progress")
@Data
public class CustomerHotelProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "hotel_id")
    private Long hotelId;

    @Column(name = "scan_count")
    private int scanCount;

    @Column(name = "daily_scan_count")
    private int dailyScanCount;

    @Column(name = "last_scan_at")
    private LocalDateTime lastScanAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PostUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}