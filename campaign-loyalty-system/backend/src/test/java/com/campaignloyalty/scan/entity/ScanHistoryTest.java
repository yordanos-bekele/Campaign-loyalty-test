package com.campaignloyalty.scan.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ScanHistoryTest {

    @Test
    void onCreateSetsScannedAtWhenMissing() {
        ScanHistory scanHistory = new ScanHistory();

        scanHistory.onCreate();

        assertNotNull(scanHistory.getScannedAt());
    }

    @Test
    void onCreateKeepsExistingScannedAt() {
        ScanHistory scanHistory = new ScanHistory();
        LocalDateTime scannedAt = LocalDateTime.of(2026, 4, 3, 12, 0);
        scanHistory.setScannedAt(scannedAt);

        scanHistory.onCreate();

        assertEquals(scannedAt, scanHistory.getScannedAt());
    }
}
