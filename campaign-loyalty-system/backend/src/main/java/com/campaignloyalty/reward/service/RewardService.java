package com.campaignloyalty.reward.service;

import com.campaignloyalty.reward.entity.Reward;
import com.campaignloyalty.reward.repository.RewardRepository;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@AllArgsConstructor
@Slf4j
public class RewardService {

    private final RewardRepository rewardRepository;

    public Reward createPendingReward(Integer customerId, Integer hotelId) {
        log.info("Creating pending reward customerId={} hotelId={}", customerId, hotelId);
        Reward reward = new Reward();
        reward.setCustomerId(customerId);
        reward.setHotelId(hotelId);
        reward.setEarnedAt(null);
        reward.setConfirmedAt(null);
        reward.setRedeemed(false);
        Reward savedReward = rewardRepository.save(reward);
        log.info("Pending reward created rewardId={} customerId={} hotelId={}", savedReward.getId(), customerId, hotelId);
        return savedReward;
    }

    public Reward confirmReward(Reward reward) {
        if (reward.getConfirmedAt() != null) {
            return reward;
        }
        LocalDateTime now = LocalDateTime.now();
        reward.setConfirmedAt(now);
        reward.setEarnedAt(now);
        Reward savedReward = rewardRepository.save(reward);
        log.info("Reward confirmed rewardId={} customerId={} hotelId={}", savedReward.getId(), savedReward.getCustomerId(), savedReward.getHotelId());
        return savedReward;
    }

    public Reward confirmReward(Integer rewardId, Integer customerId, Integer hotelId) {
        if (rewardId == null) {
            throw new IllegalArgumentException("reward id is required");
        }
        Reward reward = rewardRepository.findById(rewardId).orElseThrow(() -> new IllegalArgumentException("reward not found"));
        if (reward.getCustomerId() == null || !reward.getCustomerId().equals(customerId)) {
            throw new IllegalArgumentException("reward does not belong to this customer");
        }
        if (reward.getHotelId() == null || !reward.getHotelId().equals(hotelId)) {
            throw new IllegalArgumentException("reward does not belong to this hotel");
        }
        return confirmReward(reward);
    }

    public Reward findReward(Integer rewardId) {
        if (rewardId == null) {
            return null;
        }
        return rewardRepository.findById(rewardId).orElse(null);
    }
}
