package com.campaignloyalty.scan.repository;

import com.campaignloyalty.scan.entity.ScanHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface ScanHistoryRepository extends JpaRepository<ScanHistory, Long> {

    long countByHotelIdAndScannedAtBetweenAndValid(Long hotelId, LocalDateTime start, LocalDateTime end, boolean valid);

    long countByScannedAtBetweenAndValid(LocalDateTime start, LocalDateTime end, boolean valid);
}