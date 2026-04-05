package com.campaignloyalty.dashboard.controller;

import com.campaignloyalty.auth.service.AuthService;
import com.campaignloyalty.dashboard.dto.AdminDashboardDto;
import com.campaignloyalty.dashboard.dto.FraudSummaryDto;
import com.campaignloyalty.dashboard.dto.HotelStatsDto;
import com.campaignloyalty.dashboard.dto.OverallStatsDto;
import com.campaignloyalty.dashboard.dto.SuspiciousScanLogDto;
import com.campaignloyalty.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@AllArgsConstructor
@Tag(name = "Dashboard", description = "Reporting and analytics endpoints")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuthService authService;

    @GetMapping("/hotel/{hotelId}")
    @Operation(
            summary = "Get daily hotel statistics",
            description = "Returns today’s valid scans, rewards, and suspicious scans for a hotel.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Statistics returned")
            }
    )
    public ResponseEntity<HotelStatsDto> getHotelStats(@PathVariable Integer hotelId, HttpSession session) {
        authService.assertCanViewHotel(session, hotelId);
        return ResponseEntity.ok(dashboardService.getHotelStats(hotelId));
    }

    @GetMapping("/hotel/me")
    @Operation(
            summary = "Get logged-in hotel statistics",
            description = "Returns today's dashboard data for the logged-in hotel account.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Statistics returned")
            }
    )
    public ResponseEntity<HotelStatsDto> getCurrentHotelStats(HttpSession session) {
        Integer hotelId = authService.requireHotel(session).hotelId();
        return ResponseEntity.ok(dashboardService.getHotelStats(hotelId));
    }

    @GetMapping("/hotel/{hotelId}/suspicious-scans")
    @Operation(
            summary = "Get recent suspicious scan logs for a hotel",
            description = "Returns the latest 50 suspicious scan history entries for the requested hotel.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Suspicious scan logs returned")
            }
    )
    public ResponseEntity<List<SuspiciousScanLogDto>> getSuspiciousScans(
            @PathVariable Integer hotelId,
            HttpSession session) {
        authService.assertCanViewHotel(session, hotelId);
        return ResponseEntity.ok(dashboardService.getSuspiciousScansForHotel(hotelId));
    }

    @GetMapping("/overall")
    @Operation(
            summary = "Get overall daily statistics",
            description = "Returns today’s total scans, rewards, and suspicious scans across all hotels.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Statistics returned")
            }
    )
    public ResponseEntity<OverallStatsDto> getOverallStats(HttpSession session) {
        authService.requireAdmin(session);
        return ResponseEntity.ok(dashboardService.getOverallStats());
    }

    @GetMapping("/admin")
    @Operation(
            summary = "Get admin dashboard overview",
            description = "Returns overall campaign stats plus all registered hotels for the admin dashboard.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Admin dashboard returned")
            }
    )
    public ResponseEntity<AdminDashboardDto> getAdminDashboard(HttpSession session) {
        authService.requireAdmin(session);
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }

    @GetMapping("/admin/fraud-summary")
    @Operation(
            summary = "Get admin fraud summary",
            description = "Returns rejected-scan totals, suspicious flag totals, and the top customers and hotels by rejected scans.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Fraud summary returned")
            }
    )
    public ResponseEntity<FraudSummaryDto> getFraudSummary(HttpSession session) {
        authService.requireAdmin(session);
        return ResponseEntity.ok(dashboardService.getFraudSummary());
    }
}
