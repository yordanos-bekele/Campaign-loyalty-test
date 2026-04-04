package com.campaignloyalty.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class AdminDashboardDto {

    private OverallStatsDto overallStats;
    private List<HotelListItemDto> hotels;
}
