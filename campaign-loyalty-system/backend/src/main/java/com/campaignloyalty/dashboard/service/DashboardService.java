package com.campaignloyalty.dashboard.service;

import com.campaignloyalty.dashboard.dto.AdminDashboardDto;
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

@Service
@AllArgsConstructor
@Slf4j
public class DashboardService {

    private final ScanHistoryRepository scanHistoryRepository;

    private final RewardRepository rewardRepository;

    private final HotelService hotelService;

    public HotelStatsDto getHotelStats(Integer hotelId) {
        log.info("Loading hotel dashboard stats hotelId={}", hotelId);
        LocalDateTime start = DateUtil.getStartOfDay();
        LocalDateTime end = DateUtil.getEndOfDay();
        long scansToday = scanHistoryRepository.countByHotelIdAndScannedAtBetweenAndValid(hotelId, start, end, true);
        long rewardsGiven = rewardRepository.countByHotelIdAndEarnedAtBetween(hotelId, start, end);
        long suspiciousScans = scanHistoryRepository.countByHotelIdAndScannedAtBetweenAndSuspiciousTrue(hotelId, start, end);
        log.info("Hotel dashboard stats loaded hotelId={} scansToday={} rewardsGiven={} suspiciousScans={}",
                hotelId, scansToday, rewardsGiven, suspiciousScans);
        return new HotelStatsDto(scansToday, rewardsGiven, suspiciousScans);
    }

    public OverallStatsDto getOverallStats() {
        log.info("Loading overall dashboard stats");
        LocalDateTime start = DateUtil.getStartOfDay();
        LocalDateTime end = DateUtil.getEndOfDay();
        long totalScansToday = scanHistoryRepository.countByScannedAtBetweenAndValid(start, end, true);
        long totalRewardsGiven = rewardRepository.countByEarnedAtBetween(start, end);
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
        return new AdminDashboardDto(getOverallStats(), getRegisteredHotels());
    }

    public List<SuspiciousScanLogDto> getSuspiciousScansForHotel(Integer hotelId) {
        log.info("Loading suspicious scan logs hotelId={}", hotelId);
        List<SuspiciousScanLogDto> suspiciousScans = scanHistoryRepository.findTop50ByHotelIdAndSuspiciousTrueOrderByScannedAtDesc(hotelId).stream()
                .map(this::toSuspiciousScanLogDto)
                .toList();
        log.info("Loaded {} suspicious scan logs hotelId={}", suspiciousScans.size(), hotelId);
        return suspiciousScans;
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
}
