package com.campaignloyalty.scan.repository;

import com.campaignloyalty.dashboard.dto.CustomerMetricCountDto;
import com.campaignloyalty.dashboard.dto.RejectedScanLeaderDto;
import com.campaignloyalty.scan.entity.RejectionReason;
import com.campaignloyalty.scan.entity.ScanHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface ScanHistoryRepository extends JpaRepository<ScanHistory, Integer> {

    long countByHotelIdAndScannedAtBetweenAndValid(Integer hotelId, LocalDateTime start, LocalDateTime end, boolean valid);

    long countByScannedAtBetweenAndValid(LocalDateTime start, LocalDateTime end, boolean valid);

    long countByValidFalse();

    long countBySuspiciousTrue();

    long countByScannedAtBetweenAndValidFalse(LocalDateTime start, LocalDateTime end);

    long countByScannedAtBetweenAndSuspiciousTrue(LocalDateTime start, LocalDateTime end);

    long countByHotelIdAndScannedAtBetweenAndSuspiciousTrue(Integer hotelId, LocalDateTime start, LocalDateTime end);

    long countByCustomerIdAndHotelIdAndValidFalseAndScannedAtAfter(Integer customerId, Integer hotelId, LocalDateTime scannedAtAfter);

    long countByCustomerIdAndHotelIdAndValidFalseAndRejectionReasonAndScannedAtAfter(
            Integer customerId,
            Integer hotelId,
            RejectionReason rejectionReason,
            LocalDateTime scannedAtAfter);

    List<ScanHistory> findTop50ByHotelIdAndSuspiciousTrueOrderByScannedAtDesc(Integer hotelId);

    @Query(value = """
            SELECT CAST(scanned_at AS DATE) as scan_date, count(*) as scan_count
            FROM scan_history
            WHERE hotel_id = :hotelId AND valid = true
            GROUP BY CAST(scanned_at AS DATE)
            ORDER BY scan_count DESC
            LIMIT 1
            """, nativeQuery = true)
    List<Object[]> findMaxScansPerDayForHotel(Integer hotelId);

    @Query(value = """
            SELECT CAST(sh.scanned_at AS DATE) as reportDate, 
                   h.id as hotelId, 
                   h.name as hotelName,
                   COUNT(sh.id) as totalScans,
                   SUM(CASE WHEN sh.valid = true THEN 1 ELSE 0 END) as validScans,
                   SUM(CASE WHEN sh.suspicious = true THEN 1 ELSE 0 END) as suspiciousScans
            FROM scan_history sh
            JOIN hotel h ON h.id = sh.hotel_id
            GROUP BY CAST(sh.scanned_at AS DATE), h.id, h.name
            ORDER BY reportDate DESC, h.name ASC
            """, nativeQuery = true)
    List<Object[]> getDetailedReport();

    @Query("""
            select new com.campaignloyalty.dashboard.dto.CustomerMetricCountDto(
                sh.customerId,
                count(sh.id)
            )
            from ScanHistory sh
            where sh.customerId in :customerIds and sh.valid = true
            group by sh.customerId
            """)
    List<CustomerMetricCountDto> countValidScansByCustomerIds(List<Integer> customerIds);

    @Query("""
            select new com.campaignloyalty.dashboard.dto.RejectedScanLeaderDto(
                c.id,
                c.deviceId,
                count(sh.id)
            )
            from ScanHistory sh
            join Customer c on c.id = sh.customerId
            where sh.valid = false and sh.customerId is not null
            group by c.id, c.deviceId
            order by count(sh.id) desc, c.id asc
            """)
    List<RejectedScanLeaderDto> findTopCustomersByRejectedScans(org.springframework.data.domain.Pageable pageable);

    @Query("""
            select new com.campaignloyalty.dashboard.dto.RejectedScanLeaderDto(
                h.id,
                h.name,
                count(sh.id)
            )
            from ScanHistory sh
            join Hotel h on h.id = sh.hotelId
            where sh.valid = false and sh.hotelId is not null
            group by h.id, h.name
            order by count(sh.id) desc, h.id asc
            """)
    List<RejectedScanLeaderDto> findTopHotelsByRejectedScans(org.springframework.data.domain.Pageable pageable);
}
