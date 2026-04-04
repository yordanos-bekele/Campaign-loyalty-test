package com.campaignloyalty.dashboard.controller;

import com.campaignloyalty.dashboard.dto.HotelStatsDto;
import com.campaignloyalty.dashboard.dto.OverallStatsDto;
import com.campaignloyalty.dashboard.service.DashboardService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@AllArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<HotelStatsDto> getHotelStats(@PathVariable Long hotelId) {
        return ResponseEntity.ok(dashboardService.getHotelStats(hotelId));
    }

    @GetMapping("/overall")
    public ResponseEntity<OverallStatsDto> getOverallStats() {
        return ResponseEntity.ok(dashboardService.getOverallStats());
    }
}
