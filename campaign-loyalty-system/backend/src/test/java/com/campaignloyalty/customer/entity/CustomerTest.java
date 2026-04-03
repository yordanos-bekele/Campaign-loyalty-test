package com.campaignloyalty.customer.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class CustomerTest {

    @Test
    void onCreateSetsCreatedAtWhenMissing() {
        Customer customer = new Customer();

        customer.onCreate();

        assertNotNull(customer.getCreatedAt());
    }

    @Test
    void onCreateKeepsExistingCreatedAt() {
        Customer customer = new Customer();
        LocalDateTime createdAt = LocalDateTime.of(2026, 4, 3, 12, 0);
        customer.setCreatedAt(createdAt);

        customer.onCreate();

        assertEquals(createdAt, customer.getCreatedAt());
    }
}
