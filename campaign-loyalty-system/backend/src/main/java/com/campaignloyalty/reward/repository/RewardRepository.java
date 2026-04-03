package com.campaignloyalty.reward.repository;

import com.campaignloyalty.reward.entity.Reward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface RewardRepository extends JpaRepository<Reward, Long> {

    long countByHotelIdAndEarnedAtBetween(Long hotelId, LocalDateTime start, LocalDateTime end);

    long countByEarnedAtBetween(LocalDateTime start, LocalDateTime end);
}