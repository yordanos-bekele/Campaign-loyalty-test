package com.campaignloyalty.customer.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "customer_hotel_progress",
        uniqueConstraints = @UniqueConstraint(name = "uk_customer_hotel_progress_customer_hotel", columnNames = {"customer_id", "hotel_id"})
)
@Data
public class CustomerHotelProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "customer_id")
    private Integer customerId;

    @Column(name = "hotel_id")
    private Integer hotelId;

    @Column(name = "scan_count")
    private int scanCount;

    @Column(name = "daily_scan_count")
    private int dailyScanCount;

    @Column(name = "last_scan_at")
    private LocalDateTime lastScanAt;

    @Column(name = "pending_reward_id")
    private Integer pendingRewardId;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PostUpdate
    public void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
