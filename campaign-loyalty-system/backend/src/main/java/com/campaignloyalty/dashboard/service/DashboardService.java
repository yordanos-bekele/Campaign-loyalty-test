package com.campaignloyalty.dashboard.service;

import com.campaignloyalty.dashboard.dto.HotelStatsDto;
import com.campaignloyalty.dashboard.dto.OverallStatsDto;
import com.campaignloyalty.scan.repository.ScanHistoryRepository;

import lombok.AllArgsConstructor;

import com.campaignloyalty.reward.repository.RewardRepository;
import com.campaignloyalty.common.util.DateUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@AllArgsConstructor
public class DashboardService {

    private final ScanHistoryRepository scanHistoryRepository;

    private final RewardRepository rewardRepository;

    public HotelStatsDto getHotelStats(Long hotelId) {
        LocalDateTime start = DateUtil.getStartOfDay();
        LocalDateTime end = DateUtil.getEndOfDay();
        long scansToday = scanHistoryRepository.countByHotelIdAndScannedAtBetweenAndValid(hotelId, start, end, true);
        long rewardsGiven = rewardRepository.countByHotelIdAndEarnedAtBetween(hotelId, start, end);
        long suspiciousScans = scanHistoryRepository.countByHotelIdAndScannedAtBetweenAndValid(hotelId, start, end, false);
        return new HotelStatsDto(scansToday, rewardsGiven, suspiciousScans);
    }

    public OverallStatsDto getOverallStats() {
        LocalDateTime start = DateUtil.getStartOfDay();
        LocalDateTime end = DateUtil.getEndOfDay();
        long totalScansToday = scanHistoryRepository.countByScannedAtBetweenAndValid(start, end, true);
        long totalRewardsGiven = rewardRepository.countByEarnedAtBetween(start, end);
        long totalSuspiciousScans = scanHistoryRepository.countByScannedAtBetweenAndValid(start, end, false);
        return new OverallStatsDto(totalScansToday, totalRewardsGiven, totalSuspiciousScans);
    }
}
