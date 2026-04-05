package com.campaignloyalty.reward.service;

import com.campaignloyalty.reward.entity.Reward;
import com.campaignloyalty.reward.repository.RewardRepository;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
@Slf4j
public class RewardService {

    private final RewardRepository rewardRepository;

    public Reward createReward(Integer customerId, Integer hotelId) {
        log.info("Creating reward customerId={} hotelId={}", customerId, hotelId);
        Reward reward = new Reward();
        reward.setCustomerId(customerId);
        reward.setHotelId(hotelId);
        reward.setRedeemed(false);
        Reward savedReward = rewardRepository.save(reward);
        log.info("Reward created rewardId={} customerId={} hotelId={}", savedReward.getId(), customerId, hotelId);
        return savedReward;
    }
}
