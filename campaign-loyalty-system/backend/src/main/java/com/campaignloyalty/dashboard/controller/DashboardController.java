package com.campaignloyalty.dashboard.controller;

import com.campaignloyalty.dashboard.dto.HotelStatsDto;
import com.campaignloyalty.dashboard.dto.OverallStatsDto;
import com.campaignloyalty.dashboard.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<HotelStatsDto> getHotelStats(@PathVariable Long hotelId) {
        return ResponseEntity.ok(dashboardService.getHotelStats(hotelId));
    }

    @GetMapping("/overall")
    public ResponseEntity<OverallStatsDto> getOverallStats() {
        return ResponseEntity.ok(dashboardService.getOverallStats());
    }
}