package com.campaignloyalty.reward.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class RewardTest {

    @Test
    void onCreateSetsCreatedAtWhenMissing() {
        Reward reward = new Reward();

        reward.onCreate();

        assertNotNull(reward.getCreatedAt());
    }

    @Test
    void onCreateKeepsExistingCreatedAt() {
        Reward reward = new Reward();
        LocalDateTime createdAt = LocalDateTime.of(2026, 4, 3, 12, 0);
        reward.setCreatedAt(createdAt);

        reward.onCreate();

        assertEquals(createdAt, reward.getCreatedAt());
    }
}
