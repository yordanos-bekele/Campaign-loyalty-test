package com.campaignloyalty.reward.service;

import com.campaignloyalty.reward.entity.Reward;
import com.campaignloyalty.reward.repository.RewardRepository;

import lombok.AllArgsConstructor;

import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class RewardService {

    private final RewardRepository rewardRepository;

    public Reward createReward(Long customerId, Long hotelId) {
        Reward reward = new Reward();
        reward.setCustomerId(customerId);
        reward.setHotelId(hotelId);
        reward.setRedeemed(false);
        return rewardRepository.save(reward);
    }
}
