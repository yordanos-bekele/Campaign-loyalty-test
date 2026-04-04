package com.campaignloyalty.reward.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class RewardTest {

    @Test
    void onCreateSetsEarnedAtWhenMissing() {
        Reward reward = new Reward();

        reward.onCreate();

        assertNotNull(reward.getEarnedAt());
    }

    @Test
    void onCreateKeepsExistingEarnedAt() {
        Reward reward = new Reward();
        LocalDateTime earnedAt = LocalDateTime.of(2026, 4, 3, 12, 0);
        reward.setEarnedAt(earnedAt);

        reward.onCreate();

        assertEquals(earnedAt, reward.getEarnedAt());
    }
}
