package com.campaignloyalty.dashboard.service;

import com.campaignloyalty.customer.entity.Customer;
import com.campaignloyalty.customer.repository.CustomerRepository;
import com.campaignloyalty.dashboard.dto.AdminCustomerSummaryDto;
import com.campaignloyalty.dashboard.dto.AdminDashboardDto;
import com.campaignloyalty.dashboard.dto.CustomerMetricCountDto;
import com.campaignloyalty.dashboard.dto.FraudSummaryDto;
import com.campaignloyalty.dashboard.dto.HotelListItemDto;
import com.campaignloyalty.dashboard.dto.HotelStatsDto;
import com.campaignloyalty.dashboard.dto.OverallStatsDto;
import com.campaignloyalty.dashboard.dto.SuspiciousScanLogDto;
import com.campaignloyalty.hotel.entity.Hotel;
import com.campaignloyalty.hotel.service.HotelService;
import com.campaignloyalty.scan.entity.ScanHistory;
import com.campaignloyalty.scan.repository.ScanHistoryRepository;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import com.campaignloyalty.reward.repository.RewardRepository;
import com.campaignloyalty.common.util.DateUtil;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
@Slf4j
public class DashboardService {

    private final ScanHistoryRepository scanHistoryRepository;

    private final RewardRepository rewardRepository;

    private final HotelService hotelService;

    private final CustomerRepository customerRepository;

    public HotelStatsDto getHotelStats(Integer hotelId) {
        log.info("Loading hotel dashboard stats hotelId={}", hotelId);
        LocalDateTime start = DateUtil.getStartOfDay();
        LocalDateTime end = DateUtil.getEndOfDay();
        long scansToday = scanHistoryRepository.countByHotelIdAndScannedAtBetweenAndValid(hotelId, start, end, true);
        long rewardsGiven = rewardRepository.countConfirmedByHotelIdAndEarnedAtBetween(hotelId, start, end);
        long suspiciousScans = scanHistoryRepository.countByHotelIdAndScannedAtBetweenAndSuspiciousTrue(hotelId, start, end);
        
        List<Object[]> maxScansResult = scanHistoryRepository.findMaxScansPerDayForHotel(hotelId);
        long maxScanCount = 0;
        String maxScanDate = null;
        if (!maxScansResult.isEmpty() && maxScansResult.get(0) != null) {
            Object[] row = maxScansResult.get(0);
            if (row.length >= 2 && row[0] != null && row[1] != null) {
                // row[0] is Date, row[1] is count
                maxScanDate = row[0].toString();
                maxScanCount = ((Number) row[1]).longValue();
            }
        }
        
        log.info("Hotel dashboard stats loaded hotelId={} scansToday={} rewardsGiven={} suspiciousScans={} maxScanCount={} maxScanDate={}",
                hotelId, scansToday, rewardsGiven, suspiciousScans, maxScanCount, maxScanDate);
        return new HotelStatsDto(scansToday, rewardsGiven, suspiciousScans, maxScanCount, maxScanDate);
    }

    public OverallStatsDto getOverallStats() {
        log.info("Loading overall dashboard stats");
        LocalDateTime start = DateUtil.getStartOfDay();
        LocalDateTime end = DateUtil.getEndOfDay();
        long totalScansToday = scanHistoryRepository.countByScannedAtBetweenAndValid(start, end, true);
        long totalRewardsGiven = rewardRepository.countConfirmedByEarnedAtBetween(start, end);
        long totalSuspiciousScans = scanHistoryRepository.countByScannedAtBetweenAndSuspiciousTrue(start, end);
        log.info("Overall dashboard stats loaded totalScansToday={} totalRewardsGiven={} totalSuspiciousScans={}",
                totalScansToday, totalRewardsGiven, totalSuspiciousScans);
        return new OverallStatsDto(totalScansToday, totalRewardsGiven, totalSuspiciousScans);
    }

    public List<HotelListItemDto> getRegisteredHotels() {
        log.info("Loading registered hotel list");
        List<HotelListItemDto> hotels = hotelService.findAll().stream()
                .sorted(Comparator.comparing(Hotel::getName, String.CASE_INSENSITIVE_ORDER))
                .map(hotel -> new HotelListItemDto(
                        hotel.getId(),
                        hotel.getName(),
                        hotel.getLocation(),
                        hotel.getCreatedAt()))
                .toList();
        log.info("Loaded {} registered hotels", hotels.size());
        return hotels;
    }

    public AdminDashboardDto getAdminDashboard() {
        log.info("Loading admin dashboard");
        return new AdminDashboardDto(
                getOverallStats(),
                customerRepository.countByRegisteredAtIsNotNull(),
                getRegisteredHotels());
    }

    public List<AdminCustomerSummaryDto> getRegisteredCustomerSummaries() {
        log.info("Loading admin customer summaries");
        List<Customer> customers = customerRepository.findAllByRegisteredAtIsNotNullOrderByRegisteredAtDesc();
        if (customers.isEmpty()) {
            log.info("No registered loyal customers found for admin summary");
            return List.of();
        }

        List<Integer> customerIds = customers.stream()
                .map(Customer::getId)
                .toList();

        Map<Integer, Long> rewardCounts = toMetricMap(rewardRepository.countRewardsByCustomerIds(customerIds));
        Map<Integer, Long> validScanCounts = toMetricMap(scanHistoryRepository.countValidScansByCustomerIds(customerIds));

        List<AdminCustomerSummaryDto> summaries = customers.stream()
                .map(customer -> new AdminCustomerSummaryDto(
                        customer.getId(),
                        customer.getFullName(),
                        customer.getPhoneNumber(),
                        customer.getEmail(),
                        rewardCounts.getOrDefault(customer.getId(), 0L),
                        validScanCounts.getOrDefault(customer.getId(), 0L),
                        customer.getRegisteredAt()))
                .toList();

        log.info("Loaded {} admin customer summaries", summaries.size());
        return summaries;
    }

    public List<SuspiciousScanLogDto> getSuspiciousScansForHotel(Integer hotelId) {
        log.info("Loading suspicious scan logs hotelId={}", hotelId);
        List<SuspiciousScanLogDto> suspiciousScans = scanHistoryRepository.findTop50ByHotelIdAndSuspiciousTrueOrderByScannedAtDesc(hotelId).stream()
                .map(this::toSuspiciousScanLogDto)
                .toList();
        log.info("Loaded {} suspicious scan logs hotelId={}", suspiciousScans.size(), hotelId);
        return suspiciousScans;
    }

    public List<com.campaignloyalty.dashboard.dto.DetailedReportRowDto> getDetailedReport() {
        log.info("Loading detailed report for admin");
        List<Object[]> rawData = scanHistoryRepository.getDetailedReport();
        return rawData.stream().map(row -> {
            String date = row[0] != null ? row[0].toString() : "";
            Integer id = row[1] != null ? ((Number) row[1]).intValue() : 0;
            String name = row[2] != null ? row[2].toString() : "";
            long total = row[3] != null ? ((Number) row[3]).longValue() : 0;
            long valid = row[4] != null ? ((Number) row[4]).longValue() : 0;
            long suspicious = row[5] != null ? ((Number) row[5]).longValue() : 0;
            return new com.campaignloyalty.dashboard.dto.DetailedReportRowDto(date, id, name, total, valid, suspicious);
        }).toList();
    }

    public FraudSummaryDto getFraudSummary() {
        log.info("Loading fraud summary");
        FraudSummaryDto summary = new FraudSummaryDto(
                scanHistoryRepository.countByValidFalse(),
                scanHistoryRepository.countBySuspiciousTrue(),
                scanHistoryRepository.findTopCustomersByRejectedScans(PageRequest.of(0, 5)),
                scanHistoryRepository.findTopHotelsByRejectedScans(PageRequest.of(0, 5)));
        log.info("Fraud summary loaded totalRejectedScans={} totalSuspiciousFlags={}",
                summary.getTotalRejectedScans(), summary.getTotalSuspiciousFlags());
        return summary;
    }

    private SuspiciousScanLogDto toSuspiciousScanLogDto(ScanHistory scanHistory) {
        return new SuspiciousScanLogDto(
                scanHistory.getId(),
                scanHistory.getCustomerId(),
                scanHistory.getHotelId(),
                scanHistory.getQrToken(),
                scanHistory.getRejectionReason() == null ? null : scanHistory.getRejectionReason().name(),
                scanHistory.getIpAddress(),
                scanHistory.getUserAgent(),
                scanHistory.getScannedAt());
    }

    private Map<Integer, Long> toMetricMap(List<CustomerMetricCountDto> metrics) {
        return metrics.stream()
                .collect(Collectors.toMap(
                        CustomerMetricCountDto::getCustomerId,
                        CustomerMetricCountDto::getCount,
                        Long::max));
    }
}
