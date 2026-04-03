package com.campaignloyalty.hotel.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class HotelTest {

    @Test
    void onCreateSetsCreatedAtWhenMissing() {
        Hotel hotel = new Hotel();

        hotel.onCreate();

        assertNotNull(hotel.getCreatedAt());
    }

    @Test
    void onCreateKeepsExistingCreatedAt() {
        Hotel hotel = new Hotel();
        LocalDateTime createdAt = LocalDateTime.of(2026, 4, 3, 12, 0);
        hotel.setCreatedAt(createdAt);

        hotel.onCreate();

        assertEquals(createdAt, hotel.getCreatedAt());
    }
}
