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

import com.campaignloyalty.reward.repository.RewardRepository;
import com.campaignloyalty.common.util.DateUtil;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@AllArgsConstructor
public class DashboardService {

    private final ScanHistoryRepository scanHistoryRepository;

    private final RewardRepository rewardRepository;

    private final HotelService hotelService;

    public HotelStatsDto getHotelStats(Integer hotelId) {
        LocalDateTime start = DateUtil.getStartOfDay();
        LocalDateTime end = DateUtil.getEndOfDay();
        long scansToday = scanHistoryRepository.countByHotelIdAndScannedAtBetweenAndValid(hotelId, start, end, true);
        long rewardsGiven = rewardRepository.countByHotelIdAndEarnedAtBetween(hotelId, start, end);
        long suspiciousScans = scanHistoryRepository.countByHotelIdAndScannedAtBetweenAndSuspiciousTrue(hotelId, start, end);
        return new HotelStatsDto(scansToday, rewardsGiven, suspiciousScans);
    }

    public OverallStatsDto getOverallStats() {
        LocalDateTime start = DateUtil.getStartOfDay();
        LocalDateTime end = DateUtil.getEndOfDay();
        long totalScansToday = scanHistoryRepository.countByScannedAtBetweenAndValid(start, end, true);
        long totalRewardsGiven = rewardRepository.countByEarnedAtBetween(start, end);
        long totalSuspiciousScans = scanHistoryRepository.countByScannedAtBetweenAndSuspiciousTrue(start, end);
        return new OverallStatsDto(totalScansToday, totalRewardsGiven, totalSuspiciousScans);
    }

    public List<HotelListItemDto> getRegisteredHotels() {
        return hotelService.findAll().stream()
                .sorted(Comparator.comparing(Hotel::getName, String.CASE_INSENSITIVE_ORDER))
                .map(hotel -> new HotelListItemDto(
                        hotel.getId(),
                        hotel.getName(),
                        hotel.getLocation(),
                        hotel.getCreatedAt()))
                .toList();
    }

    public AdminDashboardDto getAdminDashboard() {
        return new AdminDashboardDto(getOverallStats(), getRegisteredHotels());
    }

    public List<SuspiciousScanLogDto> getSuspiciousScansForHotel(Integer hotelId) {
        return scanHistoryRepository.findTop50ByHotelIdAndSuspiciousTrueOrderByScannedAtDesc(hotelId).stream()
                .map(this::toSuspiciousScanLogDto)
                .toList();
    }

    public FraudSummaryDto getFraudSummary() {
        return new FraudSummaryDto(
                scanHistoryRepository.countByValidFalse(),
                scanHistoryRepository.countBySuspiciousTrue(),
                scanHistoryRepository.findTopCustomersByRejectedScans(PageRequest.of(0, 5)),
                scanHistoryRepository.findTopHotelsByRejectedScans(PageRequest.of(0, 5)));
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
