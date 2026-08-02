package com.campaignloyalty.scan.controller;

import com.campaignloyalty.scan.dto.ScanRequest;
import com.campaignloyalty.scan.dto.ScanResponse;
import com.campaignloyalty.scan.service.ScanService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/scan")
@AllArgsConstructor
@Slf4j
@Tag(name = "Scan", description = "QR scan and loyalty progress endpoints")
public class ScanController {

        private final ScanService scanService;

        @PostMapping
        @Operation(summary = "Submit a QR scan", description = "Validates a QR token, applies scan limits, updates customer progress, and awards a reward on the 10th valid scan.", responses = {
                        @ApiResponse(responseCode = "200", description = "Scan processed successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request or missing device identifier", content = @Content(schema = @Schema(implementation = String.class)))
        })
        public ResponseEntity<ScanResponse> scan(
                        @Parameter(description = "Unique device identifier stored as a cookie", example = "device-1") @CookieValue(value = "device_id", required = false) String cookieDeviceId,
                        @RequestHeader(value = "X-Device-Id", required = false) String headerDeviceId,
                        @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "QR token payload", required = true, content = @Content(schema = @Schema(implementation = ScanRequest.class), examples = {
                                        @ExampleObject(name = "Valid request", value = "{\"token\":\"7e8f6a18-3c35-4a69-b5e5-970ca8e19e66\"}")
                        })) @Valid @RequestBody ScanRequest request,
                        HttpServletRequest httpRequest) {
                String deviceId = resolveDeviceId(cookieDeviceId, headerDeviceId);
                String ip = httpRequest.getRemoteAddr();
                String userAgent = httpRequest.getHeader("User-Agent");
                ScanResponse response = scanService.scan(deviceId, request.getToken(), ip, userAgent);
                return ResponseEntity.ok(response);
        }

        @PostMapping("/confirm/{rewardId}")
        @Operation(summary = "Confirm a pending reward", description = "Finalizes a pending reward after the 10th valid scan. Requires the same device_id cookie or X-Device-Id header.", responses = {
                        @ApiResponse(responseCode = "200", description = "Reward confirmed successfully"),
                        @ApiResponse(responseCode = "400", description = "Invalid request or missing device identifier", content = @Content(schema = @Schema(implementation = String.class)))
        })
        public ResponseEntity<ScanResponse> confirmReward(
                        @Parameter(description = "Unique device identifier stored as a cookie", example = "device-1") @CookieValue(value = "device_id", required = false) String cookieDeviceId,
                        @RequestHeader(value = "X-Device-Id", required = false) String headerDeviceId,
                        @PathVariable Integer rewardId,
                        HttpServletRequest httpRequest) {
                String deviceId = resolveDeviceId(cookieDeviceId, headerDeviceId);
                String ip = httpRequest.getRemoteAddr();
                String userAgent = httpRequest.getHeader("User-Agent");
                ScanResponse response = scanService.confirmReward(deviceId, rewardId, ip, userAgent);
                return ResponseEntity.ok(response);
        }

        private String resolveDeviceId(String cookieDeviceId, String headerDeviceId) {
                log.info("Cookie deviceId: {}, Header deviceId: {}", cookieDeviceId, headerDeviceId);
                if (StringUtils.hasText(cookieDeviceId)) {
                        return cookieDeviceId;
                }
                if (StringUtils.hasText(headerDeviceId)) {
                        return headerDeviceId;
                }
                log.warn("Cookie deviceId is null or empty, header deviceId is null or empty");
                throw new IllegalArgumentException("device_id cookie or X-Device-Id header is required");
        }
}
