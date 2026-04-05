package com.campaignloyalty.dashboard.service;

import com.campaignloyalty.dashboard.dto.HotelStatsDto;
import com.campaignloyalty.dashboard.dto.OverallStatsDto;
import com.campaignloyalty.hotel.service.HotelService;
import com.campaignloyalty.reward.repository.RewardRepository;
import com.campaignloyalty.scan.repository.ScanHistoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private ScanHistoryRepository scanHistoryRepository;

    @Mock
    private RewardRepository rewardRepository;

    @Mock
    private HotelService hotelService;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    void returnsHotelStatsForToday() {
        when(scanHistoryRepository.countByHotelIdAndScannedAtBetweenAndValid(eq(7), any(LocalDateTime.class), any(LocalDateTime.class), eq(true)))
                .thenReturn(12L);
        when(rewardRepository.countByHotelIdAndEarnedAtBetween(eq(7), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(3L);
        when(scanHistoryRepository.countByHotelIdAndScannedAtBetweenAndSuspiciousTrue(eq(7), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(2L);

        HotelStatsDto stats = dashboardService.getHotelStats(7);

        assertEquals(12L, stats.getScansToday());
        assertEquals(3L, stats.getRewardsGiven());
        assertEquals(2L, stats.getSuspiciousScans());
        verify(scanHistoryRepository).countByHotelIdAndScannedAtBetweenAndValid(eq(7), eq(todayStart()), eq(todayEnd()), eq(true));
        verify(rewardRepository).countByHotelIdAndEarnedAtBetween(eq(7), eq(todayStart()), eq(todayEnd()));
        verify(scanHistoryRepository).countByHotelIdAndScannedAtBetweenAndSuspiciousTrue(eq(7), eq(todayStart()), eq(todayEnd()));
    }

    @Test
    void returnsOverallStatsForToday() {
        when(scanHistoryRepository.countByScannedAtBetweenAndValid(any(LocalDateTime.class), any(LocalDateTime.class), eq(true)))
                .thenReturn(40L);
        when(rewardRepository.countByEarnedAtBetween(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(9L);
        when(scanHistoryRepository.countByScannedAtBetweenAndSuspiciousTrue(any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(4L);

        OverallStatsDto stats = dashboardService.getOverallStats();

        assertEquals(40L, stats.getTotalScansToday());
        assertEquals(9L, stats.getTotalRewardsGiven());
        assertEquals(4L, stats.getTotalSuspiciousScans());
        verify(scanHistoryRepository).countByScannedAtBetweenAndValid(eq(todayStart()), eq(todayEnd()), eq(true));
        verify(rewardRepository).countByEarnedAtBetween(eq(todayStart()), eq(todayEnd()));
        verify(scanHistoryRepository).countByScannedAtBetweenAndSuspiciousTrue(eq(todayStart()), eq(todayEnd()));
    }

    private LocalDateTime todayStart() {
        return LocalDate.now().atStartOfDay();
    }

    private LocalDateTime todayEnd() {
        return LocalDate.now().atTime(23, 59, 59, 999_999_999);
    }
}
