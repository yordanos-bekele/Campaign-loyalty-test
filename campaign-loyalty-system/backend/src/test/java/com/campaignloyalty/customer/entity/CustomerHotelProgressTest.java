package com.campaignloyalty.customer.entity;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class CustomerHotelProgressTest {

    @Test
    void onCreateSetsUpdatedAtWhenMissing() {
        CustomerHotelProgress progress = new CustomerHotelProgress();

        progress.onCreate();

        assertNotNull(progress.getUpdatedAt());
    }
}
