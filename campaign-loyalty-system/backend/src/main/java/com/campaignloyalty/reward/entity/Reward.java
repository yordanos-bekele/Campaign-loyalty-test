package com.campaignloyalty.reward.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "reward")
@Data
public class Reward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "hotel_id")
    private Long hotelId;

    @Column(name = "earned_at")
    private LocalDateTime earnedAt;

    private boolean redeemed;

    @PrePersist
    protected void onCreate() {
        earnedAt = LocalDateTime.now();
    }
}